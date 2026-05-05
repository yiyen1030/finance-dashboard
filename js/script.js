/**
 * 股市儀表板主程式
 * 功能：讀取心願清單、每日股價與歷史趨勢圖
 */

document.addEventListener('DOMContentLoaded', initDashboard);

let myChart = null;
let wishlist = [];

async function initDashboard() {
    // 1. 先讀取心願清單 (你的清單來源)
    await loadWishlist();
    
    // 2. 執行儀表板更新
    updateDashboard();

    // 3. 綁定「新增股票」按鈕事件 (前端邏輯)
    const addBtn = document.getElementById('addStock');
    const stockInput = document.querySelector('input.form-control');

    if (addBtn && stockInput) {
        addBtn.addEventListener('click', () => {
            const symbol = stockInput.value.trim().toUpperCase();
            if (symbol && !wishlist.includes(symbol)) {
                // 提示：前端無法直接寫入 GitHub 上的 JSON 檔案
                // 這裡的 push 僅供前端暫時顯示，真正的持久化需靠 Python 更新 wishlist.json
                wishlist.push(symbol);
                updateDashboard();
                stockInput.value = '';
                alert(`已嘗試搜尋 ${symbol}。請確保 data.json 與 history.json 包含此代號數據。`);
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
            // 如果讀取失敗，設定預設清單
            wishlist = ["2330.TW", "0050.TW"];
        }
    } catch (e) {
        console.error("無法讀取 wishlist.json，使用預設值", e);
        wishlist = ["2330.TW", "0050.TW"];
    }
}

async function updateDashboard() {
    try {
        // --- 1. 處理每日股價 (data.json) ---
        const stockResponse = await fetch('./data/data.json');
        if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            // 根據 wishlist 過濾要顯示的股票
            const filteredStocks = stockData.stocks.filter(s => wishlist.includes(s.symbol));
            renderStockInfo({ ...stockData, stocks: filteredStocks });
        }

        // --- 2. 處理歷史趨勢圖 (history.json) ---
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
                    <span class="fw-bold">${stock.name} (${stock.symbol})</span>
                    <span class="h5 mb-0 fw-bold text-primary">
                        <span class="small"><i class="bi bi-currency-dollar"></i></span>
                        ${stock.price.toLocaleString()}
                    </span>
                </div>
            </div>
        `;
    });
    htmlContent += `
        <div class="text-end mt-2">
            <small class="text-muted">最後更新：${data.time || '---'}</small>
        </div>
    `;
    stockDiv.innerHTML = htmlContent;
}

function renderChart(historyData) {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;

    if (myChart) {
        myChart.destroy();
    }

    const formattedLabels = historyData.labels.map(ts => {
        const date = new Date(ts * 1000);
        return `${date.getFullYear()}/${date.getMonth() + 1}`;
    });

    // 動態根據 wishlist 建立 datasets
    // 這裡假設 history.json 裡面的 key (如 tsm, etf) 
    // 與你的 wishlist 代號有對應關係。
    // 如果 key 是固定的小寫代號，可以做個對應表。
    const datasets = [];
    
    // 範例：手動對應你 history.json 裡現有的欄位
    if (wishlist.includes("2330.TW") || wishlist.includes("TSM")) {
        datasets.push({
            label: '台積電 (TSM)',
            data: historyData.tsm,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: 'y',
        });
    }
    
    if (wishlist.includes("0050.TW") || wishlist.includes("ETF")) {
        datasets.push({
            label: '元大台灣50 (0050)',
            data: historyData.etf,
            borderColor: '#36a2eb',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: 'y1',
        });
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { ticks: { maxTicksLimit: 12 } },
                y: { type: 'linear', position: 'left', title: { display: true, text: 'TSM 價格' } },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '0050 價格' } }
            }
        }
    });
}
