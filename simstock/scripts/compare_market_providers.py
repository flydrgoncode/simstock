#!/usr/bin/env python3
import json
import os
import sqlite3
import ssl
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "simstock.db"
OUTPUT_DIR = ROOT / "data" / "provider-comparison"
SSL_CONTEXT = ssl._create_unverified_context()


def http_json(url: str, headers: dict[str, str] | None = None):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=15, context=SSL_CONTEXT) as response:
        return json.loads(response.read().decode("utf-8"))


def http_text(url: str, headers: dict[str, str] | None = None):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=15, context=SSL_CONTEXT) as response:
        return response.read().decode("utf-8")


def load_assets():
    connection = sqlite3.connect(DB_PATH)
    row = connection.execute("SELECT value FROM app_state WHERE key = 'settings'").fetchone()
    if not row:
        raise RuntimeError("settings not found in database")
    settings = json.loads(row[0])
    sources = settings.get("marketDataSources", [])
    return sorted(sources, key=lambda item: item["assetId"])


def query_yfinance(symbol: str):
    ticker = yf.Ticker(symbol)
    history = ticker.history(period="5d", interval="1d", auto_adjust=False)
    if history.empty:
        return {"status": "no_data"}
    last = history.iloc[-1]
    prev = history.iloc[-2] if len(history) > 1 else last
    close = float(last["Close"])
    volume = float(last.get("Volume", 0) or 0)
    daily_change = ((close - float(prev["Close"])) / float(prev["Close"])) * 100 if float(prev["Close"]) else 0
    return {
        "status": "ok",
        "price": round(close, 4),
        "volume": volume,
        "dailyChangePct": round(daily_change, 4),
    }


def query_stooq(symbol: str):
    normalized = symbol.lower()
    text = http_text(f"https://stooq.com/q/l/?s={urllib.parse.quote(normalized)}&i=d")
    line = text.strip().splitlines()[0]
    if "N/D" in line or "No data" in line:
        return {"status": "no_data"}
    parts = line.split(",")
    if len(parts) < 8:
        return {"status": "invalid"}
    return {
        "status": "ok",
        "price": float(parts[6]),
        "volume": float(parts[7]) if parts[7] else 0,
    }


def query_alpha_vantage(symbol: str):
    api_key = os.getenv("ALPHAVANTAGE_API_KEY")
    if not api_key:
        return {"status": "missing_key"}
    url = (
        "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&outputsize=compact"
        f"&symbol={urllib.parse.quote(symbol)}&apikey={urllib.parse.quote(api_key)}"
    )
    payload = http_json(url)
    series = payload.get("Time Series (Daily)", {})
    if not series:
        return {"status": "no_data", "message": payload.get("Note") or payload.get("Error Message")}
    latest_key = sorted(series.keys())[-1]
    latest = series[latest_key]
    return {
        "status": "ok",
        "price": float(latest["4. close"]),
        "volume": float(latest["5. volume"]),
    }


def query_marketdata(symbol: str):
    api_key = os.getenv("MARKETDATA_API_TOKEN")
    if not api_key:
        return {"status": "missing_key"}
    url = f"https://api.marketdata.app/v1/stocks/candles/1D/{urllib.parse.quote(symbol)}/?countback=2"
    payload = http_json(url, headers={"Authorization": f"Bearer {api_key}"})
    closes = payload.get("c", [])
    volumes = payload.get("v", [])
    if not closes:
        return {"status": "no_data"}
    return {
        "status": "ok",
        "price": float(closes[-1]),
        "volume": float(volumes[-1]) if volumes else 0,
    }


def query_fmp(symbol: str):
    api_key = os.getenv("FMP_API_KEY")
    if not api_key:
        return {"status": "missing_key"}
    url = f"https://financialmodelingprep.com/stable/quote?symbol={urllib.parse.quote(symbol)}&apikey={urllib.parse.quote(api_key)}"
    payload = http_json(url)
    if not payload:
        return {"status": "no_data"}
    quote = payload[0]
    return {
        "status": "ok",
        "price": float(quote.get("price", 0) or 0),
        "volume": float(quote.get("volume", 0) or 0),
    }


def query_iex(symbol: str):
    api_key = os.getenv("IEX_CLOUD_API_KEY")
    if not api_key:
        return {"status": "missing_key"}
    url = f"https://cloud.iexapis.com/stable/stock/{urllib.parse.quote(symbol)}/quote?token={urllib.parse.quote(api_key)}"
    payload = http_json(url)
    if not payload:
        return {"status": "no_data"}
    return {
        "status": "ok",
        "price": float(payload.get("latestPrice", 0) or 0),
        "volume": float(payload.get("latestVolume", 0) or 0),
    }


def safe_query(label, fn, symbol):
    try:
        return fn(symbol)
    except Exception as error:
        return {"status": "error", "message": f"{label}: {error}"}


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    assets = load_assets()
    results = []
    for asset in assets:
        yahoo_symbol = asset.get("yahooSymbol") or asset.get("symbol")
        stooq_symbol = asset.get("symbol")
        row = {
            "assetId": asset["assetId"],
            "label": asset["label"],
            "providerConfigured": asset.get("provider"),
            "yahooSymbol": yahoo_symbol,
            "symbol": stooq_symbol,
            "comparisons": {
                "yfinance": safe_query("yfinance", query_yfinance, yahoo_symbol) if yahoo_symbol else {"status": "missing_symbol"},
                "stooq": safe_query("stooq", query_stooq, stooq_symbol) if stooq_symbol else {"status": "missing_symbol"},
                "alphaVantage": safe_query("alphaVantage", query_alpha_vantage, yahoo_symbol) if yahoo_symbol else {"status": "missing_symbol"},
                "marketData": safe_query("marketData", query_marketdata, yahoo_symbol) if yahoo_symbol else {"status": "missing_symbol"},
                "fmp": safe_query("fmp", query_fmp, yahoo_symbol) if yahoo_symbol else {"status": "missing_symbol"},
                "iexCloud": safe_query("iexCloud", query_iex, yahoo_symbol) if yahoo_symbol else {"status": "missing_symbol"},
            },
        }
        results.append(row)

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "count": len(results),
        "results": results,
    }
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    json_path = OUTPUT_DIR / f"provider-comparison-{stamp}.json"
    md_path = OUTPUT_DIR / f"provider-comparison-{stamp}.md"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = [
        "# Provider comparison",
        "",
        f"Generated at: {payload['generatedAt']}",
        "",
        "| Asset | Yahoo Finance | Stooq | Alpha Vantage | Market Data | FMP | IEX Cloud |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for item in results:
        def fmt(entry):
            status = entry.get("status", "unknown")
            if status != "ok":
                return status
            price = entry.get("price")
            volume = entry.get("volume")
            return f"{price} / {volume}"

        lines.append(
            f"| {item['label']} | {fmt(item['comparisons']['yfinance'])} | {fmt(item['comparisons']['stooq'])} | "
            f"{fmt(item['comparisons']['alphaVantage'])} | {fmt(item['comparisons']['marketData'])} | "
            f"{fmt(item['comparisons']['fmp'])} | {fmt(item['comparisons']['iexCloud'])} |"
        )
    md_path.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"json": str(json_path), "markdown": str(md_path)}, indent=2))


if __name__ == "__main__":
    main()
