#!/usr/bin/env python3
import json
import sys

import yfinance as yf


def frame_to_rows(frame):
    rows = []
    if frame.empty:
        return rows
    for ts, row in frame.iterrows():
        close = row.get("Close")
        if close is None:
            continue
        try:
            close_value = float(close)
        except Exception:
            continue
        rows.append(
            {
                "ts": ts.to_pydatetime().astimezone().isoformat(),
                "open": None if row.get("Open") is None else float(row.get("Open")),
                "high": None if row.get("High") is None else float(row.get("High")),
                "low": None if row.get("Low") is None else float(row.get("Low")),
                "close": close_value,
                "volume": None if row.get("Volume") is None else float(row.get("Volume")),
                "source": "Yahoo Finance",
            }
        )
    return rows


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: fetch_yahoo_chart.py <symbol> [daily_period] [daily_interval] [intraday_period] [intraday_interval]")
    symbol = sys.argv[1]
    daily_period = sys.argv[2] if len(sys.argv) > 2 else "18mo"
    daily_interval = sys.argv[3] if len(sys.argv) > 3 else "1d"
    intraday_period = sys.argv[4] if len(sys.argv) > 4 else "5d"
    intraday_interval = sys.argv[5] if len(sys.argv) > 5 else "60m"

    ticker = yf.Ticker(symbol)
    daily = ticker.history(period=daily_period, interval=daily_interval, auto_adjust=False)
    intraday = ticker.history(period=intraday_period, interval=intraday_interval, auto_adjust=False)
    payload = {
      "symbol": symbol,
      "daily": frame_to_rows(daily),
      "intraday": frame_to_rows(intraday),
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    main()
