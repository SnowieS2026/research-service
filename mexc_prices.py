import json, urllib.request, time

symbols = ['BTCUSDT','ETHUSDT','SOLUSDT','MXUSDT','DOGEUSDT','XRPUSDT',
           'ADAUSDT','BNBUSDT','DOTUSDT','AVAXUSDT','LINKUSDT','SHIBUSDT',
           'LTCUSDT','ATOMUSDT','UNIUSDT','MATICUSDT','APTUSDT','ARBUSDT',
           'FILUSDT','NEARUSDT','ICPUSDT','VETUSDT','ALGOUSDT','SANDUSDT']

base = 'https://api.mexc.com/api/v3/ticker/24hr?symbol='
results = []

print(f"{'Pair':<12} {'Price (USD)':>16}  {'24h Change':>10}  {'24h Volume':>14}")
print("-" * 58)

for s in symbols:
    try:
        r = json.loads(urllib.request.urlopen(base + s, timeout=5).read())
        price = float(r['lastPrice'])
        chg = float(r['priceChangePercent'])
        vol = float(r['quoteVolume'])
        pair = s.replace('USDT','')
        arrow = '+' if chg >= 0 else ''
        if price < 0.001:
            price_str = f"${price:.8f}"
        elif price < 1:
            price_str = f"${price:.6f}"
        elif price < 1000:
            price_str = f"${price:.4f}"
        else:
            price_str = f"${price:,.2f}"
        print(f"{pair:<12} {price_str:>16}  {arrow}{chg:.3f}%  vol ${vol/1e6:,.1f}M")
        results.append({'pair': pair, 'price': price, 'change_24h': chg, 'volume_24h_usd': vol})
    except Exception as e:
        print(f"{s.replace('USDT',''):<12} {'ERROR':>16}  {str(e):>10}")
    time.sleep(0.08)

print(f"\nData from MEXC API | {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
