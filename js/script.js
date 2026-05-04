/**
 * 股市儀表板主程式
 * 修正版：支援多支股票列表顯示
 */

document.addEventListener('DOMContentLoaded', updateDashboard);

async function updateDashboard() {
    try {
        // 1. 讀取每日股價 (data.json)
        const stockResponse = await fetch('./data/data.json');
        if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            renderStockInfo(stockData);
        }

        // 2. 讀取歷史趨勢 (history.json)
        const historyResponse = await fetch('./data/history.json');
        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            renderChart(historyData);
        }

    } catch (error) {
        console.error('更新失敗:', error);
    }
}

function renderStockInfo(data) {
    const stockDiv = document.getElementById('stock');
    if (!stockDiv || !data.stocks) return;

    // 清空舊內容並根據 stocks 列表產生 HTML
    let htmlContent = '';
    
    data.stocks.forEach(stock => {
        htmlContent += `
            <div class="stock-item mb-3 pb-2 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold">${stock.name} (${stock.symbol})</span>
                    <span class="h5 mb-0 fw-bold">${stock.price.toLocaleString()}</span>
                </div>
                </div>
        `;
    });

    // 加入更新時間
    htmlContent += `
        <div class="text-end mt-2">
            <small class="text-muted">資料時間：${data.time || '---'}</small>
        </div>
    `;

    stockDiv.innerHTML = htmlContent;
}

// 保留你原本的圖表邏輯
function renderChart(historyData) {
    console.log("歷史數據已載入", historyData);
    // 這裡放入你原本畫 Chart.js 的程式碼
}
