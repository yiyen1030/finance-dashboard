/**
 * 股市儀表板主程式
 * 完整版：整合每日股價與雙線歷史趨勢圖 (TSM & ETF)
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

let myChart = null; 
function renderChart(historyData) {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;

    if (myChart) {
        myChart.destroy();
    }

    // 將 Unix Timestamp (秒) 轉換為日期格式 (YYYY/MM)
    const formattedLabels = historyData.labels.map(ts => {
        const date = new Date(ts * 1000);
        return `${date.getFullYear()}/${date.getMonth() + 1}`;
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: '台積電 (TSM)',
                    data: historyData.tsm,
                    borderColor: '#ff6384',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y', // 使用左側 Y 軸
                },
                {
                    label: '0050 ETF',
                    data: historyData.etf,
                    borderColor: '#36a2eb',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y1', // 使用右側 Y 軸 (因為股價落差大，分開看比較清楚)
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 12 }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: '台積電股價' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false }, // 避免兩組網格線重疊太亂
                    title: { display: true, text: '0050 股價' }
                }
            }
        }
    });
}
