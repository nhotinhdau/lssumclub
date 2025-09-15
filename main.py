import json
import threading
import time
import logging
import ssl
from urllib.request import urlopen, Request
from flask import Flask, jsonify
import os

# ===== Logging =====
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# ===== Config =====
POLL_INTERVAL = 5
RETRY_DELAY = 5
API_URL = "https://taixiu1.gsum01.com/api/luckydice1/GetSoiCau"  # Thay bằng URL API thật

# ===== Biến lưu phiên mới nhất =====
lock = threading.Lock()
phien_moi_nhat = None  # Chỉ lưu 1 phiên duy nhất

ssl._create_default_https_context = ssl._create_unverified_context

# ===== Poll API =====
def lay_du_lieu():
    global phien_moi_nhat
    last_sid = None
    while True:
        try:
            req = Request(API_URL, headers={"User-Agent": "Python-Client/1.0"})
            with urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if isinstance(data, list) and len(data) > 0:
                game = data[0]  # chỉ lấy phiên mới nhất
                sid = game.get("SessionId")
                if sid and sid != last_sid:
                    last_sid = sid
                    kq = {
                        "Phien": sid,
                        "Xuc_xac_1": game.get("FirstDice"),
                        "Xuc_xac_2": game.get("SecondDice"),
                        "Xuc_xac_3": game.get("ThirdDice"),
                        "Tong": game.get("DiceSum"),
                        "Ket_qua": "Tài" if game.get("DiceSum", 0) > 10 else "Xỉu"
                    }
                    with lock:
                        phien_moi_nhat = kq
                    logger.info(f"[TÀI XỈU] Phiên {sid} - Tổng: {kq['Tong']} - KQ: {kq['Ket_qua']}")
        except Exception as e:
            logger.error(f"Lỗi khi lấy dữ liệu API: {e}")
            time.sleep(RETRY_DELAY)

        time.sleep(POLL_INTERVAL)

# ===== Flask API =====
app = Flask(__name__)

@app.route("/api/taixiu", methods=["GET"])
def api_taixiu():
    with lock:
        if phien_moi_nhat is None:
            return jsonify({"error": "Chưa có phiên mới"})
        return jsonify(phien_moi_nhat)

# ===== Main =====
if __name__ == "__main__":
    threading.Thread(target=lay_du_lieu, daemon=True).start()
    port = int(os.environ.get("PORT", 8000))  # Render cung cấp PORT
    logger.info(f"Server đang chạy trên port {port}")
    app.run(host="0.0.0.0", port=port)