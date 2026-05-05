import pandas as pd
import requests
import json
from datetime import datetime
import os

def get_hist(symbol):
    start_ts = 1388534400 # 2014-01-01
    end_ts = int(datetime.now().timestamp())
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={start_ts}&period2={end_ts}&interval=1mo"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        r = requests.get(url, headers=headers).json()
        result = r['chart']['result'][0]
        dates = result['timestamp']
        prices = result['indicators']['quote'][0]['close']
        df = pd.DataFrame({'timestamp': dates, symbol: prices})
        df[symbol] = pd.to_numeric(df[symbol], errors='coerce')
        return df
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return pd.DataFrame(columns=['timestamp'])

# --- 新增：讀取心願清單 ---
wishlist_path = 'data/wishlist.json'
if os.path.exists(wishlist_path):
    with open(wishlist_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
        symbols = config.get('symbols', ['2330.TW', '0050.TW'])
else:
    symbols = ['2330.TW', '0050.TW'] # 檔案不存在時的預設值

# --- 修改：動態抓取多支股票 ---
dfs = []
for sym in symbols:
    df = get_hist(sym)
    if not df.empty:
        dfs.append(df)

# 合併所有資料
if dfs:
    df_final = dfs[0]
    for i in range(1, len(dfs)):
        df_final = pd.merge(df_final, dfs[i], on='timestamp', how='outer')
    df_final = df_final.sort_values('timestamp')

    # 製作 history.json 輸出格式
    # 注意：這裡我們把所有 symbol 都放入資料中
    output_history = {
        "labels": df_final['timestamp'].tolist(),
        "data": {sym: [None if pd.isna(x) else x for x in df_final[sym].tolist()] for sym in symbols if sym in df_final.columns}
    }

    # 製作 data.json (每日股價)
    stocks_current = []
    for sym in symbols:
        if sym in df_final.columns:
            last_price = df_final[sym].dropna().iloc[-1] if not df_final[sym].dropna().empty else 0
            stocks_current.append({
                "name": sym, # 暫時用代號當名稱，或可串接 API 抓名稱
                "symbol": sym,
                "price": round(float(last_price), 2)
            })
    
    output_data = {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "stocks": stocks_current
    }

    # 寫入檔案
    os.makedirs('data', exist_ok=True)
    with open('data/history.json', 'w') as f:
        json.dump(output_history, f)
    with open('data/data.json', 'w') as f:
        json.dump(output_data, f)
    
    print(f"成功更新 {len(symbols)} 支股票數據。")
