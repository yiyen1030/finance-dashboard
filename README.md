# 📈 股市資訊儀表板 (Finance Dashboard)

這是一個自動化的股市監測工具，結合了 **Python 數據爬蟲**、**GitHub Actions 自動化** 與 **前端視覺化圖表**。

## 🚀 專案現況
- **線上網址**：已部署至 Netlify → https://finance-dashboard-twstock.netlify.app/
- **自動化更新**：透過 GitHub Actions 定期執行 `process_data.py`，並 push 回 repo；Netlify 偵測到 `main` 分支有新 commit 後會自動重新部署。
- **動態清單**：支援透過 `data/wishlist.json` 動態管理追蹤代號（字典格式，含中文名稱）。
- **視覺化**：使用 Chart.js 繪製雙 Y 軸折線圖，支援多支股票同時顯示；0050 專用右側 Y 軸固定從 0 開始。
- **區間切換**：走勢圖上方提供「週線 / 月線 / 年線」切換按鈕，週線與月線讀取近期日線資料，年線讀取完整月線歷史資料。

## 📂 資料夾結構
- `/data`:
  - `wishlist.json`: 追蹤代號清單（字典格式：`{代號: 中文名稱}`）。
  - `data.json`: 每日最新股價資料。
  - `history.json`: 歷史價格趨勢數據（月線，供「年線」圖使用）。
  - `history_daily.json`: 近 35 天每日股價（供「週線」/「月線」切換圖使用）。
- `/js`:
  - `script.js`: 核心渲染邏輯，負責處理資料與繪製圖表，以及區間切換按鈕邏輯。
- `process_data.py`: 資料抓取腳本，讀取 wishlist 並產出 JSON 檔案（月線 + 近期日線）。
- `netlify.toml`: Netlify 部署設定（publish directory、JSON 資料快取策略）。

## 🛠️ 開發規範 (重要)
為確保樣式與數據流穩定，修改時請遵循：
1. **渲染格式固定**：每日股價 HTML 必須維持 `${stock.name} (${stock.symbol})` 加上 `$` 符號。
2. **圖表 ID**：畫布 ID 固定為 `stockChart`；區間切換按鈕群組 ID 固定為 `rangeButtons`，按鈕以 `data-range="week"/"month"/"year"` 標記。
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