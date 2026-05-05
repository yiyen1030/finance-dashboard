/**
 * 股市儀表板 - 高相容性版本
 */

document.addEventListener('DOMContentLoaded', () => {
    // 不要用 await 擋住後面的執行，確保 updateDashboard 一定會跑
    loadWishlist();
    updateDashboard();

    const addBtn = document.getElementById('addStock');
    const stockInput = document.querySelector('input.form-control');
    if (addBtn && stockInput) {
        addBtn.addEventListener('click', () => {
            const symbol = stockInput.value.trim().toUpperCase();
            if (symbol) {
                alert(`已接收代號 ${symbol}。請確認 Python 腳本已將其加入數據中。`);
                stockInput.value = '';
            }
        });
    }
});

let wishlist = ["2330.TW", "0050.TW"];
let myChart = null;

async function loadWishlist() {
    try {
        const response = await fetch('./data/wishlist.json');
        if (response.ok) {
            const data = await response.json();
            if (data.symbols) wishlist = data.symbols;
        }
    } catch (e) {
        console.warn("Wishlist 載入跳過，使用預設值");
    }
}

async function updateDashboard() {
    const stockDiv = document.getElementById('stock');
    
    // 1. 抓取每日股價
    try {
        const res = await fetch('./data/data.json');
        if (res.ok) {
            const data = await res.json();
            let html = '';
            data.stocks.forEach(s => {
                html += `
                    <div class="stock-item mb-2 pb-2 border-bottom">
                        <div class="d-flex justify-content-between">
                            <span class="fw-bold">${s.name} (${s.symbol})</span>
                            <span class="h5 mb-0 fw-bold text-primary"><span class="small"><i class="bi bi-currency-dollar"></i></span>${s.price.toLocaleString()}</span>
                        </div>
                    </div>`;
            });
            if (stockDiv) stockDiv.innerHTML = html + `<small class="text-muted">更新：${data.time}</small>`;
        }
    } catch (e) {
        if (stockDiv) stockDiv.innerHTML = "股價資料讀取失敗";
    }

    // 2. 抓取圖表
    try {
        const res = await fetch('./data/history.json');
        if (res.ok) {
            const historyData = await res.json();
            renderChart(historyData);
        }
    } catch (e) {
        console.error("圖表資料讀取失敗");
    }
}

function renderChart(historyData) {
    const ctx = document.getElementById('stockChart');
    if (!ctx || !historyData.labels) return;
    if (myChart) myChart.destroy();

    const labels = historyData.labels.map(ts => {
        const d = new Date(ts * 1000);
        return `${d.getFullYear()}/${d.getMonth() + 1}`;
    });

    // 自動抓取數據 (相容有無 .data 殼的情況)
    const source = historyData.data || historyData;
    const datasets = Object.keys(source)
        .filter(k => k !== 'labels' && k !== 'data')
        .map((sym, i) => ({
            label: sym,
            data: source[sym],
            borderColor: ['#ff6384', '#36a2eb', '#4bc0c2'][i % 3],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: i === 0 ? 'y' : 'y1'
        }));

    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', position: 'left' },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });
}
