/**
 * 股市儀表板主程式
 * 完整版：整合每日股價與歷年走勢圖 (Chart.js)
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
    htmlContent += `
        <div class="text-end mt-2">
            <small class="text-muted">資料時間：${data.time || '---'}</small>
        </div>
    `;
    stockDiv.innerHTML = htmlContent;
}

/**
 * 畫圖表的函式
 */
let myChart = null; // 用來存放圖表實例
function renderChart(historyData) {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;

    // 如果已經有圖表，先銷毀才能畫新的
    if (myChart) {
        myChart.destroy();
    }

    // 這裡假設 history.json 的結構包含 date 和 price 陣列
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historyData.date, // X 軸標籤
            datasets: [{
                label: '歷史股價',
                data: historyData.price, // Y 軸數值
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                pointRadius: 0, // 隱藏點點，線條會比較乾淨
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 10 // 限制 X 軸標籤數量，避免太擠
                    }
                },
                y: {
                    beginAtZero: false // 股價圖表不從 0 開始比較好觀察波動
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}
