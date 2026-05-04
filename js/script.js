/**
 * 數據精準對齊邏輯
 * 確保歷史數據的 timestamp (時間戳) 能精確對應到 X 軸的標籤索引
 */
function getAlignedData(labels, rawTimestamp, rawArray) {
    const aligned = new Array(labels.length).fill(null);
    const labelMap = {};
    
    // 建立時間戳索引表
    labels.forEach((label, index) => {
        labelMap[label] = index;
    });

    rawTimestamp.forEach((ts, i) => {
        if (labelMap[ts] !== undefined) {
            const val = rawArray[i];
            // 只要數值大於 0 且不為空，即視為有效
            aligned[labelMap[ts]] = (val !== null && val > 0) ? val : null;
        }
    });
    return aligned;
}

async function initChart() {
    // 對照 index.html 的 ID: "stockChart"
    const canvas = document.getElementById('stockChart');
    
    if (!canvas) {
        console.error('找不到 ID 為 stockChart 的 canvas 元素，請檢查 index.html。');
        return;
    }

    try {
        // 抓取 history.json
        const response = await fetch('../data/history.json');
        if (!response.ok) throw new Error('無法讀取 history.json');
        
        const data = await response.json();
        const ctx = canvas.getContext('2d');
        
        // 格式化 X 軸時間標籤為 YYYY/MM
        const chartLabels = data.labels.map(ts => {
            const date = new Date(ts * 1000);
            return `${date.getFullYear()}/${date.getMonth() + 1}`;
        });

        // 進行精準的時間對齊，確保 2330 與 0050 的點位在同一時間軸上
        const tsmData = getAlignedData(data.labels, data.labels, data.tsm);
        const etfData = getAlignedData(data.labels, data.labels, data.etf);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: '台積電 (2330)',
                        data: tsmData,
                        borderColor: '#007bff', // 藍色
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        yAxisID: 'y-tsm',
                        spanGaps: false, // 真實呈現：沒數據時斷開，不畫連線
                        tension: 0.1
                    },
                    {
                        label: '0050 (元大台灣50)',
                        data: etfData,
                        borderColor: '#ffc107', // 黃色
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        yAxisID: 'y-etf',
                        spanGaps: false, // 真實呈現：呈現原始數據的缺失狀態
                        tension: 0.1
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
                        grid: { display: false },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 12 // 讓 X 軸一年顯示一個標籤
                        }
                    },
                    'y-tsm': {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: '台積電', color: '#007bff' },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    'y-etf': {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: '0050', color: '#ffc107' },
                        grid: { drawOnChartArea: false } // 避免雙 Y 軸網格線重疊
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('圖表初始化失敗:', error);
    }
}

// 確保 DOM 載入後再執行
document.addEventListener('DOMContentLoaded', initChart);
