# Market Data Analysis

Generated on 2026-03-16.

## Goal

Populate and maintain stock items so that SimStock can show:

- current price
- current volume
- `1D`
- `1M`
- `12M`
- `YTD`

with consistent period logic and persisted local history.

## Chosen approach

Primary runtime source: Yahoo Finance via `yfinance` on the local machine.

Why:

- covers the registered stock items and the configured commodities
- exposes daily and intraday history
- gives close and volume in a single source
- works locally without requiring paid infrastructure for this laptop-first phase

Persistence model:

- `asset_history_daily`
- `asset_history_intraday`
- `fx_history`

This allows the UI to stop depending on synthetic series and derive each chart period from persisted market history.

## Period logic

- `1D`: latest available intraday session, using time labels
- `1W`: last 7 trading observations with date labels
- `1M`: last 30 calendar days, using available daily observations and concrete dates
- `12M`: month-end close for the last 12 months
- `YTD`: month-end close from January of the current year to the current month

## FX logic

- FX is refreshed independently every `fxRefreshMinutes`
- the default was set to `60`
- `currencySpots` now comes from persisted Yahoo FX history
- EUR remains the wallet base currency

## Provider comparison

Comparison output is stored in:

- `data/provider-comparison/provider-comparison-*.json`
- `data/provider-comparison/provider-comparison-*.md`

Current practical conclusion for the registered stock items:

- `yfinance`: best coverage and usable immediately
- `Stooq`: not reliable for the current registered symbol set
- `Alpha Vantage`: viable, but key required
- `Market Data`: viable, but token required
- `Financial Modeling Prep`: viable, but key required
- `IEX Cloud`: key/availability dependent and less attractive for the current setup

## Implementation result

The app now:

- refreshes stock items with persisted daily and intraday history
- refreshes FX every hour
- rebuilds `1D`, `1M`, `12M` and `YTD` from stored history
- exports and imports the new history tables
- keeps the dashboard and charts aligned with persisted local data
