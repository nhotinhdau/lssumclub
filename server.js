const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// URL API gốc (thay link thật vào đây)
const API_URL = "https://taixiu1.gsum01.com/api/luckydice1/GetSoiCau?";

// Biến lưu phiên mới nhất
let latestResult = null;

// Hàm fetch API định kỳ
async function fetchResult() {
    try {
        const response = await axios.get(API_URL);
        const json = response.data;

        if (json.SessionId && json.FirstDice !== undefined) {
            const tong = json.DiceSum || (json.FirstDice + json.SecondDice + json.ThirdDice);
            const ketQua = (tong >= 11) ? "Tài" : "Xỉu";

            latestResult = {
                Phien: json.SessionId,
                Xuc_xac_1: json.FirstDice,
                Xuc_xac_2: json.SecondDice,
                Xuc_xac_3: json.ThirdDice,
                Tong: tong,
                Ket_qua: ketQua
            };

            console.log("🎲 Phiên mới nhất:", latestResult);
        }

    } catch (err) {
        console.error("❌ Lỗi fetch API:", err.message);
    }
}

// Gọi fetchResult mỗi 3 giây
setInterval(fetchResult, 3000);

// REST API lấy phiên mới nhất
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

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
