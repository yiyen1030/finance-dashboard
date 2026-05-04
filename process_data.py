import pandas as pd
import requests
import json
from datetime import datetime

def get_hist(symbol):
    # 修改：從 2014 年 1 月 1 日開始抓取數據，避開早期的數據錯誤區間
    # Yahoo API 的 period1 使用 Unix Timestamp，2014-01-01 約為 1388534400
    start_ts = 1388534400
    end_ts = int(datetime.now().timestamp())
    
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={start_ts}&period2={end_ts}&interval=1mo"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        r = requests.get(url, headers=headers).json()
        result = r['chart']['result'][0]
        dates = result['timestamp']
        
        # 抓取原始收盤價 (Close)
        prices = result['indicators']['quote'][0]['close']
        
        df = pd.DataFrame({'timestamp': dates, symbol: prices})
        
        # 強制轉換數值，處理可能的 NaN
        df[symbol] = pd.to_numeric(df[symbol], errors='coerce')
        
        return df
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return pd.DataFrame(columns=['timestamp', symbol])

# 1. 抓取 2014 年以後的台積電與 0050 原始價格
df_tsm = get_hist('2330.TW')
df_etf = get_hist('0050.TW')

# 2. 以時間戳記為基準精準對齊
df_final = pd.merge(df_tsm, df_etf, on='timestamp', how='outer').sort_values('timestamp')

# 3. 轉換為前端 JSON 格式
output = {
    "labels": df_final['timestamp'].tolist(),
    "tsm": [None if pd.isna(x) else x for x in df_final['2330.TW'].tolist()],
    "etf": [None if pd.isna(x) else x for x in df_final['0050.TW'].tolist()]
}

# 4. 寫入 history.json
with open('data/history.json', 'w') as f:
    json.dump(output, f)

print("history.json 已更新，數據起點已修正為 2014 年。")
