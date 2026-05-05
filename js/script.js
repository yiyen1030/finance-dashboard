/**
 * 股市儀表板主程式 - 穩定支援動態格式版
 */

document.addEventListener('DOMContentLoaded', initDashboard);

let myChart = null;
let wishlist = [];

async function initDashboard() {
    await loadWishlist();
    await updateDashboard();

    const addBtn = document.getElementById('addStock');
    const stockInput = document.querySelector('input.form-control');

    if (addBtn && stockInput) {
        addBtn.addEventListener('click', () => {
            const symbol = stockInput.value.trim().toUpperCase();
            if (symbol && !wishlist.includes(symbol)) {
                wishlist.push(symbol);
                updateDashboard();
                stockInput.value = '';
                alert(`已暫時新增 ${symbol}，請確保 Python 腳本已完成數據抓取並更新。`);
            }
        });
    }
}

async function loadWishlist() {
    try {
        const response = await fetch('./data/wishlist.json');
        if (response.ok) {
            const data = await response.json();
            wishlist = data.symbols || [];
        } else {
            wishlist = ["2330.TW", "0050.TW"];
        }
    } catch (e) {
        console.error("讀取 wishlist 失敗，使用預設值");
        wishlist = ["2330.TW", "0050.TW"];
    }
}

async function updateDashboard() {
    try {
        // 1. 處理每日股價 (data.json)
        const stockResponse = await fetch('./data/data.json');
        if (!stockResponse.ok) throw new Error('data.json 讀取失敗');
        const stockData = await stockResponse.json();
        renderStockInfo(stockData);

        // 2. 處理歷史趨勢圖 (history.json)
        const historyResponse = await fetch('./data/history.json');
        if (!historyResponse.ok) throw new Error('history.json 讀取失敗');
        const historyData = await historyResponse.json();
        
        // 確保 historyData.data 存在再畫圖
        if (historyData.data && historyData.labels) {
            renderChart(historyData);
        } else {
            throw new Error('history.json 資料格式不完整');
        }

    } catch (error) {
        console.error('數據加載失敗:', error);
        // 在畫面顯示錯誤訊息，方便除錯
        const stockDiv = document.getElementById('stock');
        if (stockDiv) stockDiv.innerHTML = `<p class="text-danger">數據加載失敗: ${error.message}</p>`;
    }
}

function renderStockInfo(data) {
    const stockDiv = document.getElementById('stock');
    if (!stockDiv || !data.stocks) return;

    let htmlContent = '';
    data.stocks.forEach(stock => {
        htmlContent += `
            <div class="stock-item mb-3 pb-2 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold">${stock.name} (${stock.symbol})</span>
                    <span class="h5 mb-0 fw-bold text-primary">${stock.price.toLocaleString()}</span>
                </div>
            </div>
        `;
    });
    htmlContent += `<div class="text-end mt-2"><small class="text-muted">最後更新：${data.time || '---'}</small></div>`;
    stockDiv.innerHTML = htmlContent;
}

function renderChart(historyData) {
    const ctx = document.getElementById('stockChart'); // 確保 ID 是 stockChart
    if (!ctx) return;
    if (myChart) myChart.destroy();

    const formattedLabels = historyData.labels.map(ts => {
        const date = new Date(ts * 1000);
        return `${date.getFullYear()}/${date.getMonth() + 1}`;
    });

    const colors = ['#ff6384', '#36a2eb', '#4bc0c2', '#ff9f40', '#9966ff'];
    const datasets = Object.keys(historyData.data).map((symbol, index) => {
        return {
            label: symbol,
            data: historyData.data[symbol],
            borderColor: colors[index % colors.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: index === 0 ? 'y' : 'y1'
        };
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels: formattedLabels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { ticks: { maxTicksLimit: 12 } },
                y: { type: 'linear', position: 'left', title: { display: true, text: '股價 (左)' } },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '股價 (右)' } }
            }
        }
    });
}
