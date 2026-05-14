import pandas as pd
import requests
import json
from datetime import datetime
import os

def get_hist(symbol):
    """
    從 Yahoo Finance 抓取歷史股價
    """
    start_ts = 1388534400  # 2014-01-01
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
        print(f"抓取 {symbol} 失敗: {e}")
        return pd.DataFrame(columns=['timestamp'])

# --- 1. 讀取心願清單 (支援字典格式) ---
wishlist_path = 'data/wishlist.json'
default_map = {
    "2330.TW": "台積電",
    "0050.TW": "元大台灣50"
}

if os.path.exists(wishlist_path):
    with open(wishlist_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
        # 取得 symbols 內容，並確保它是字典
        raw_symbols = config.get('symbols', default_map)
        
        if isinstance(raw_symbols, dict):
            symbol_map = raw_symbols
        else:
            # 如果還是舊的列表格式，自動轉換，避免程式崩潰
            symbol_map = {s: s for s in raw_symbols}
else:
    symbol_map = default_map

# 取得所有代號清單
symbols = list(symbol_map.keys())

# --- 2. 抓取多支股票數據 ---
dfs = []
for sym in symbols:
    print(f"正在處理: {sym} ({symbol_map.get(sym)})")
    df = get_hist(sym)
    if not df.empty:
        dfs.append(df)

# --- 3. 合併與處理資料 ---
if dfs:
    df_final = dfs[0]
    for i in range(1, len(dfs)):
        df_final = pd.merge(df_final, dfs[i], on='timestamp', how='outer')
    
    df_final = df_final.sort_values('timestamp')

    # 製作 history.json
    output_history = {
        "labels": df_final['timestamp'].tolist(),
        "data": {
            sym: [None if pd.isna(x) else x for x in df_final[sym].tolist()] 
            for sym in symbols if sym in df_final.columns
        }
    }

    # 製作 data.json (每日股價，包含中文名稱)
    stocks_current = []
    for sym in symbols:
        if sym in df_final.columns:
            # 取得最後一筆非空的股價
            valid_prices = df_final[sym].dropna()
            last_price = valid_prices.iloc[-1] if not valid_prices.empty else 0
            
            stocks_current.append({
                "name": symbol_map.get(sym, sym), # 優先使用 JSON 裡的中文名稱
                "symbol": sym,
                "price": round(float(last_price), 2)
            })

    output_data = {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), # 紀錄 UTC 時間，由前端轉換
        "stocks": stocks_current
    }

    # --- 4. 寫入檔案 ---
    os.makedirs('data', exist_ok=True)
    
    with open('data/history.json', 'w', encoding='utf-8') as f:
        json.dump(output_history, f, ensure_ascii=False)
        
    with open('data/data.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False)

    print(f"更新成功！共處理 {len(stocks_current)} 支股票。")
else:
    print("沒有抓取到任何資料。")