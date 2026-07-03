/**
 * 股市儀表板 - 字典格式相容版本
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 先確保載入最新的 wishlist
    await loadWishlist();

    // 2. 載入完成後再更新儀表板與圖表
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

    document.querySelectorAll('#rangeButtons button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#rangeButtons button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderChart(btn.dataset.range);
        });
    });
});

// 預設值
let wishlist = ["2330.TW", "0050.TW"];
let myChart = null;
let currentRange = 'year';
let historyMonthly = null;
let historyDaily = null;
let wishlistData = null;

async function loadWishlist() {
    try {
        const response = await fetch('./data/wishlist.json');
        if (response.ok) {
            const data = await response.json();
            
            // --- 關鍵修改：相容字典與列表格式 ---
            if (data.symbols) {
                if (Array.isArray(data.symbols)) {
                    // 如果是舊的列表格式 ["2330.TW", ...]
                    wishlist = data.symbols;
                } else if (typeof data.symbols === 'object') {
                    // 如果是新的字典格式 {"2330.TW": "台積電", ...}
                    wishlist = Object.keys(data.symbols);
                }
                console.log("已更新追蹤清單:", wishlist);
            }
        }
    } catch (e) {
        console.warn("Wishlist 載入失敗，使用預設值");
    }
}

async function updateDashboard() {
    const stockDiv = document.getElementById('stock');
    
    try {
        const res = await fetch('./data/data.json');
        if (res.ok) {
            const data = await res.json();
            let html = '';
            
            // 這裡顯示名稱 (s.name)，Python 已經幫我們處理成中文了
            data.stocks.forEach(s => {
                html += `
                <div class="stock-item mb-2 pb-2 border-bottom">
                    <div class="d-flex justify-content-between">
                        <span class="fw-bold">${s.name} (${s.symbol})</span>
                        <span class="h5 mb-0 fw-bold text-primary"><span class="small"><i class="bi bi-currency-dollar"></i></span>${s.price.toLocaleString()}</span>
                    </div>
                </div>`;
            });

            const date = new Date(data.time + " Z");
            const twTime = date.toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });

            if (stockDiv) stockDiv.innerHTML = html + `<small class="text-muted">最後更新 (台灣)：${twTime}</small>`;
        }
    } catch (e) {
        if (stockDiv) stockDiv.innerHTML = "股價資料讀取失敗";
    }

    try {
        // 年線 (月線) + 近期日線 (供近1週/近1個月切換) + wishlist 名稱對照
        const [resHistory, resDaily, resWishlist] = await Promise.all([
            fetch('./data/history.json'),
            fetch('./data/history_daily.json'),
            fetch('./data/wishlist.json')
        ]);
        if (resHistory.ok && resWishlist.ok) {
            historyMonthly = await resHistory.json();
            wishlistData = await resWishlist.json();
            historyDaily = resDaily.ok ? await resDaily.json() : null;
            renderChart(currentRange);
        }
    } catch (e) {
        console.error("圖表資料讀取失敗");
    }
}

// 依切換區間 (week/month/year) 取出對應的 labels/data
function getRangeData(range) {
    if (range === 'week' || range === 'month') {
        if (!historyDaily || !historyDaily.labels || historyDaily.labels.length === 0) return null;

        const lastTs = historyDaily.labels[historyDaily.labels.length - 1];
        const cutoff = lastTs - (range === 'week' ? 7 : 30) * 86400;

        const indices = historyDaily.labels
            .map((ts, i) => i)
            .filter(i => historyDaily.labels[i] >= cutoff);

        const data = {};
        Object.keys(historyDaily.data || {}).forEach(sym => {
            data[sym] = indices.map(i => historyDaily.data[sym][i]);
        });

        return { labels: indices.map(i => historyDaily.labels[i]), data, isDaily: true };
    }

    if (!historyMonthly || !historyMonthly.labels) return null;
    return { labels: historyMonthly.labels, data: historyMonthly.data || historyMonthly, isDaily: false };
}

function renderChart(range) {
    currentRange = range;
    const ctx = document.getElementById('stockChart');
    const rangeData = getRangeData(range);
    if (!ctx || !rangeData) return;

    if (myChart) myChart.destroy();

    const labels = rangeData.labels.map(ts => {
        const d = new Date(ts * 1000);
        return rangeData.isDaily ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getFullYear()}/${d.getMonth() + 1}`;
    });

    const source = rangeData.data;
    const colors = ['#ff6384', '#4bc0c2', '#ff9f40', '#9966ff', '#ffcd56', '#c9cbcf'];

    // 這裡的邏輯不需要改，因為 history.json 的 Key 永遠是股票代號 (Symbol)
    const datasets = Object.keys(source)
        .filter(k => k !== 'labels' && k !== 'data')
        .map((sym, i) => {
            const is0050 = sym === '0050.TW';
            const stockName = wishlistData && wishlistData.symbols && wishlistData.symbols[sym] ? wishlistData.symbols[sym] : sym;
            return {
                label: stockName,
                data: source[sym],
                borderColor: is0050 ? '#36a2eb' : colors[i % colors.length],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1,
                yAxisID: is0050 ? 'y1' : 'y'
            };
        });

    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    type: 'linear', display: true, position: 'left',
                    title: { display: true, text: '股價 (左側)' }
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    title: { display: true, text: '0050 專用 (右側)' },
                    grid: { drawOnChartArea: false },
                    beginAtZero: true
                }
            }
        }
    });
}