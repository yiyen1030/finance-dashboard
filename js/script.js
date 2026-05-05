/**
 * 股市儀表板主程式 - 動態清單支援版
 */

document.addEventListener('DOMContentLoaded', initDashboard);

let myChart = null;
let wishlist = [];

async function initDashboard() {
    await loadWishlist();
    updateDashboard();

    const addBtn = document.getElementById('addStock');
    const stockInput = document.querySelector('input.form-control');

    if (addBtn && stockInput) {
        addBtn.addEventListener('click', () => {
            const symbol = stockInput.value.trim().toUpperCase();
            if (symbol && !wishlist.includes(symbol)) {
                // 注意：這裡的新增是暫時的，真正的變更需透過 Python 修改 wishlist.json 並推送
                wishlist.push(symbol);
                updateDashboard();
                stockInput.value = '';
                alert(`已嘗試搜尋 ${symbol}。請確保雲端數據已更新。`);
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
        wishlist = ["2330.TW", "0050.TW"];
    }
}

async function updateDashboard() {
    try {
        const stockResponse = await fetch('./data/data.json');
        if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            renderStockInfo(stockData);
        }

        const historyResponse = await fetch('./data/history.json');
        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            renderChart(historyData);
        }
    } catch (error) {
        console.error('數據加載失敗:', error);
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
                    <span class="fw-bold">${stock.name}</span>
                    <span class="h5 mb-0 fw-bold text-primary">${stock.price.toLocaleString()}</span>
                </div>
            </div>
        `;
    });
    htmlContent += `<div class="text-end mt-2"><small class="text-muted">最後更新：${data.time}</small></div>`;
    stockDiv.innerHTML = htmlContent;
}

function renderChart(historyData) {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;
    if (myChart) myChart.destroy();

    const formattedLabels = historyData.labels.map(ts => {
        const date = new Date(ts * 1000);
        return `${date.getFullYear()}/${date.getMonth() + 1}`;
    });

    // --- 動態產生線條邏輯 ---
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
            yAxisID: index === 0 ? 'y' : 'y1' // 前兩支股票分左右軸，其餘共用
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
                y: { type: 'linear', position: 'left', title: { display: true, text: '左軸價格' } },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '右軸價格' } }
            }
        }
    });
}
