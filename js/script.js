async function updateDashboard() {
    try {
        const stockResponse = await fetch('./data/data.json');
        if (!stockResponse.ok) throw new Error('data.json 讀取失敗');
        const stockData = await stockResponse.json();
        renderStockInfo(stockData);

        const historyResponse = await fetch('./data/history.json');
        if (!historyResponse.ok) throw new Error('history.json 讀取失敗');
        const historyData = await historyResponse.json();
        
        // --- 強化版格式檢查 ---
        if (!historyData.labels) throw new Error('history.json 缺少 labels 欄位');

        // 如果資料被包在 .data 裡就用 .data，否則就視為扁平結構並排除 labels
        let finalData = {};
        if (historyData.data) {
            finalData = historyData.data;
        } else {
            // 自動過濾掉 labels 剩下的就是股票數據
            const { labels, ...rest } = historyData;
            finalData = rest;
        }

        if (Object.keys(finalData).length === 0) throw new Error('history.json 內無有效的股票數據');

        // 重新封裝成 renderChart 需要的格式
        renderChart({
            labels: historyData.labels,
            data: finalData
        });

    } catch (error) {
        console.error('數據加載失敗:', error);
        const stockDiv = document.getElementById('stock');
        if (stockDiv) stockDiv.innerHTML = `<p class="text-danger">數據加載失敗: ${error.message}</p>`;
    }
}
