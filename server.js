// server.js
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// API gốc (HTTP, có dấu ? ở cuối)
const API_URL = "http://taixiu1.gsum01.com/api/luckydice1/GetSoiCau";

let latestResult = null;

// Hàm fetch API
async function fetchResult() {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            timeout: 5000
        });

        const data = response.data;

        // Nếu trả về mảng thì lấy phần tử đầu tiên (phiên mới nhất)
        const item = Array.isArray(data) ? data[0] : data;

        if (item && item.SessionId) {
            const tong = Number(item.FirstDice) + Number(item.SecondDice) + Number(item.ThirdDice);
            const ketQua = tong >= 11 ? "Tài" : "Xỉu";

            latestResult = {
                Phien: item.SessionId,
                Xuc_xac_1: item.FirstDice,
                Xuc_xac_2: item.SecondDice,
                Xuc_xac_3: item.ThirdDice,
                Tong: tong,
                Ket_qua: ketQua
            };

            console.log("🎲 Phiên mới:", latestResult);
        }
    } catch (err) {
        console.error("❌ Lỗi fetch API:", err.message || err);
    }
}

// Gọi API ngay + lặp mỗi 3s
fetchResult();
setInterval(fetchResult, 3000);

// Endpoint cho frontend
app.get('/api/taixiu/ws', (req, res) => {
    if (!latestResult) {
        return res.status(503).json({ error: "Chưa có dữ liệu" });
    }
    res.json(latestResult);
});

// Default
app.get('/', (req, res) => {
    res.send('Proxy API Tài Xỉu. Gọi /api/taixiu/ws để lấy kết quả.');
});

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
