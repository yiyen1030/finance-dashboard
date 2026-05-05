# 📈 股市資訊儀表板 (Finance Dashboard)

這是一個自動化的股市監測工具，結合了 **Python 數據爬蟲**、**GitHub Actions 自動化** 與 **前端視覺化圖表**。

## 🚀 專案現況
- **自動化更新**：透過 GitHub Actions 定期執行 `process_data.py`。
- **動態清單**：支援透過 `data/wishlist.json` 動態管理追蹤代號。
- **視覺化**：使用 Chart.js 繪製雙 Y 軸折線圖，支援多支股票同時顯示。

## 📂 資料夾結構
- `/data`:
  - `wishlist.json`: 追蹤代號清單。
  - `data.json`: 每日最新股價資料。
  - `history.json`: 歷史價格趨勢數據。
- `/js`:
  - `script.js`: 核心渲染邏輯，負責處理資料與繪製圖表。
- `process_data.py`: 資料抓取腳本，讀取 wishlist 並產出 JSON 檔案。

## 🛠️ 開發規範 (重要)
為確保樣式與數據流穩定，修改時請遵循：
1. **渲染格式固定**：每日股價 HTML 必須維持 `${stock.name} (${stock.symbol})` 加上 `$` 符號。
2. **圖表 ID**：畫布 ID 固定為 `stockChart`。
3. **資料來源**：前端不直接修改 JSON，所有數據變更須由 Python 腳本更新。

---

## 🤖 AI 協作指令 (新對話開始前必讀)
> **請在開啟新對話時，將以下一段話貼給 AI：**
> 
> 「你好，我們要繼續開發 finance-dashboard。在開始討論下個功能前，請你先讀取以下檔案以同步專案邏輯：
> 1. **index.html**：確認 HTML 結構與 ID 命名。
> 2. **js/script.js**：確認目前數據渲染與 Chart.js 繪圖邏輯。
> 3. **process_data.py**：了解 Python 輸出 JSON 的格式。
> 4. **README.md**：查看開發規範，確保修改時不變動現有視覺渲染結構。
> 
> 讀取完後請確認，我們再開始討論。」