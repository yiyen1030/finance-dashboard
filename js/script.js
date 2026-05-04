/**
 * 股市儀表板主程式
 * 整合：每日股價 (data.json) 與 歷史趨勢圖表 (history.json)
 */

// 當網頁載入完成後執行
document.addEventListener('DOMContentLoaded', updateDashboard);

async function updateDashboard() {
    try {
        // --- 1. 讀取每日股價資料 (data.json) ---
        const stockResponse = await fetch('./data/data.json');
        if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            renderStockInfo(stockData);
        } else {
            console.error('無法讀取 data/data.json');
        }

        // --- 2. 讀取歷史趨勢資料 (history.json) ---
        const historyResponse = await fetch('./data/history.json');
        if (!historyResponse.ok) throw new Error('無法讀取 history.json');
        const historyData = await historyResponse.json();
        
        // 執行畫圖 (假設你使用的是 Chart.js)
        renderChart(historyData);

    } catch (error) {
        console.error('儀表板更新失敗:', error);
        const stockDiv = document.getElementById('stock');
        if (stockDiv) stockDiv.innerHTML = '<p class="text-danger">資料載入失敗</p>';
    }
}

/**
 * 更新每日股價區塊 (id="stock")
 */
function renderStockInfo(data) {
    const stockDiv = document.getElementById('stock');
    if (!stockDiv) return;

    // 處理漲跌顏色
    const changeValue = parseFloat(data.change);
    const colorClass = changeValue >= 0 ? 'text-danger' : 'text-success'; // 台灣習慣：紅漲綠跌
    const prefix = changeValue >= 0 ? '+' : '';

    stockDiv.innerHTML = `
        <div class="stock-item">
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">最新股價</span>
                <span class="h4 mb-0 fw-bold">${data.close || '---'}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
                <span class="text-muted">昨日漲跌</span>
                <span class="${colorClass} fw-bold">${prefix}${data.change || '0'} (${data.change_percent || '0'}%)</span>
            </div>
            <div class="text-end mt-2">
                <small class="text-muted">更新日期：${data.date || '---'}</small>
            </div>
        </div>
    `;
}

/**
 * 數據對齊轉換函式 (保留你原本的邏輯)
 * 確保從數據庫獲得的 timestamp 能精確對應到 X 軸的標籤索引
 */
function getAlignedData(labels, rawTimestamp, rawArray) {
    const aligned = new Array(labels.length).fill(null);
    const labelMap = {};

    // 建立時間軸索引
    labels.forEach((label, index) => {
        labelMap[label] = index;
    });

    rawTimestamp.forEach((ts, i) => {
        if (labelMap[ts] !== undefined) {
            const val = rawArray[i];
            // 只顯示大於 0 且非空的值
            aligned[labelMap[ts]] = (val !== null && val > 0) ? val : null;
        }
    });
    return aligned;
}

/**
 * 畫圖表的函式 (範例結構，請確保與你原本的 Chart.js 設定一致)
 */
function renderChart(historyData) {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;

    // 這裡通常會使用 historyData.date 作為 X 軸 labels
    // 並呼叫 getAlignedData 處理你的各項指標
    // 範例：
    // const priceData = getAlignedData(historyData.date, historyData.date, historyData.price);
    
    // ... 你的 Chart.js 實作代碼 ...
    console.log('圖表數據已載入', historyData);
}
