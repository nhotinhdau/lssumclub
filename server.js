// server.js
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Thay bằng URL API thật của bạn
const API_URL = "https://taixiu.gsum01.com/api/luckydice/GetSoiCau?";

// Lưu phiên mới nhất
let latestResult = null;

// Hàm fetch API định kỳ
async function fetchResult() {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                // giả User-Agent trình duyệt (giúp tránh blocked basic)
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            timeout: 5000
        });

        const json = response.data;

        // Kiểm tra format kiểu: SessionId, FirstDice, SecondDice, ThirdDice, DiceSum, CreatedDate...
        if (json && json.SessionId && json.FirstDice !== undefined && json.SecondDice !== undefined && json.ThirdDice !== undefined) {
            // Tính tổng: dùng DiceSum nếu có, còn không thì cộng tay
            const tong = (typeof json.DiceSum === 'number' && !Number.isNaN(json.DiceSum))
                ? json.DiceSum
                : (Number(json.FirstDice) + Number(json.SecondDice) + Number(json.ThirdDice));

            const ketQua = (tong >= 11) ? "Tài" : "Xỉu";

            // Chỉ cập nhật khi phiên thay đổi
            if (!latestResult || String(latestResult.Phien) !== String(json.SessionId)) {
                latestResult = {
                    Phien: json.SessionId,
                    Xuc_xac_1: Number(json.FirstDice),
                    Xuc_xac_2: Number(json.SecondDice),
                    Xuc_xac_3: Number(json.ThirdDice),
                    Tong: tong,
                    Ket_qua: ketQua,
                    // nếu bạn muốn có created time để debug, giữ dòng dưới, nếu không cần thì bỏ
                    CreatedDate: json.CreatedDate || null
                };

                console.log("🎲 Phiên mới:", latestResult);
            }
        } else {
            // Nếu API trả format khác hoặc chưa có dữ liệu phù hợp
            // bạn có thể log (nhưng hạn chế log quá nhiều)
            // console.log("API trả format lạ hoặc chưa có SessionId/FirstDice...");
        }

    } catch (err) {
        // Hiện lỗi fetch (403/timeout/...)
        console.error("❌ Lỗi fetch API:", err.message || err);
    }
}

// Bắt đầu fetch ngay và lặp mỗi 3s (tùy chỉnh nếu cần)
fetchResult();
setInterval(fetchResult, 3000);

// Endpoint trả phiên mới nhất
app.get('/api/taixiu/ws', (req, res) => {
    if (!latestResult) {
        return res.status(503).json({
            error: "Chưa có dữ liệu API",
            details: "Vui lòng thử lại sau vài giây."
        });
    }
    res.json(latestResult);
});

// Endpoint mặc định
app.get('/', (req, res) => {
    res.send('API HTTP Tài Xỉu. Truy cập /api/taixiu/ws để xem phiên mới nhất.');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
