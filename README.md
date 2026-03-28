# 📊 投資組合儀表板 v5

React + Tailwind CSS + Vite + Recharts + PWA

## 功能

- **6 張摘要卡片** — 投入成本、市值、未實現損益、已實現損益、股利、總報酬
- **4 個分頁** — 未實現損益表、已實現損益表、股利記錄表、圖表分析
- **3 種圖表** — 持股比重圓餅圖、各股損益長條圖、年度股利柱狀圖
- **9 個操作按鈕** — 新增持股、重新計算、更新股價、賣出、股利、抓取除權息、明細、API測試、每日自動
- **PWA 支援** — 可安裝到手機桌面，離線快取 API 資料
- **漲跌顏色** — 正值綠色、負值紅色、TW/US 標籤自動判斷
- **SaaS 級 UI** — 圓角卡片、毛玻璃效果、動畫過渡

## 快速開始

```bash
npm install
# 編輯 src/App.jsx 第 7 行填入 GAS URL
npm run dev
```

## 部署到 Vercel

```bash
npm i -g vercel
vercel --prod
```

## 後端

搭配 Stock Portfolio v5.gs 部署在 Google Apps Script
