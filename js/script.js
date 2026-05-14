/**
 * 股市儀表板 - 動態 Wishlist 與 Y 軸優化版本
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
});

// 預設值（當 JSON 讀取失敗時使用）
let wishlist = ["2330.TW", "0050.TW"];
let myChart = null;

async function loadWishlist() {
    try {
        // 從 data 資料夾取得最新的清單
        const response = await fetch('./data/wishlist.json');
        if (response.ok) {
            const data = await response.json();
            // 如果 JSON 格式是 { "symbols": ["...", "..."] }
            if (data.symbols && Array.isArray(data.symbols)) {
                wishlist = data.symbols;
                console.log("已成功更新 Wishlist:", wishlist);
            }
        }
    } catch (e) {
        console.warn("Wishlist 載入失敗，將使用預設清單", e);
    }
}

async function updateDashboard() {
    const stockDiv = document.getElementById('stock');
    
    // 1. 抓取每日股價與更新時間
    try {
        const res = await fetch('./data/data.json');
        if (res.ok) {
            const data = await res.json();
            let html = '';
            
            // 根據抓回來的資料動態生成 HTML
            data.stocks.forEach(s => {
                html += `
                <div class="stock-item mb-2 pb-2 border-bottom">
                    <div class="d-flex justify-content-between">
                        <span class="fw-bold">${s.name}</span>
                        <span class="h5 mb-0 fw-bold text-primary"><span class="small"><i class="bi bi-currency-dollar"></i></span>${s.price.toLocaleString()}</span>
                    </div>
                </div>`;
            });

            // 將 UTC 時間轉換為台灣時間
            const utcDateString = data.time;
            const date = new Date(utcDateString + " Z");
            const twTime = date.toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            if (stockDiv) stockDiv.innerHTML = html + `<small class="text-muted">最後更新（台灣）：${twTime}</small>`;
        }
    } catch (e) {
        if (stockDiv) stockDiv.innerHTML = "股價資料讀取失敗";
    }

    // 2. 抓取歷史數據並繪製圖表
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

    const source = historyData.data || historyData;
    const colors = ['#ff6384', '#4bc0c2', '#ff9f40', '#9966ff', '#ffcd56', '#c9cbcf'];

    const datasets = Object.keys(source)
        .filter(k => k !== 'labels' && k !== 'data')
        .map((sym, i) => {
            // 判斷邏輯：僅 0050.TW 放在右軸 (y1)
            const is0050 = sym === '0050.TW';
            return {
                label: sym,
                data: source[sym],
                borderColor: is0050 ? '#36a2eb' : colors[i % colors.length],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1,
                yAxisID: is0050 ? 'y1' : 'y' // 只有 0050 在右側
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
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: '股價 (左側)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: '0050 專用 (右側)' },
                    grid: { drawOnChartArea: false } // 保持畫面簡潔
                }
            }
        }
    });
}