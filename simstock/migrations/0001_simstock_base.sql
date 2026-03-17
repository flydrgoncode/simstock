CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS indices (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  side TEXT NOT NULL,
  indexId TEXT NOT NULL,
  etfTicker TEXT NOT NULL,
  indexName TEXT NOT NULL,
  units REAL NOT NULL,
  unitPriceUsd REAL NOT NULL,
  grossEur REAL NOT NULL,
  feeEur REAL NOT NULL,
  totalEur REAL NOT NULL,
  fxRateEurUsd REAL NOT NULL,
  fxRateUsdEur REAL NOT NULL,
  timestamp TEXT NOT NULL,
  source TEXT NOT NULL,
  strategyName TEXT,
  unitLimitUsd REAL,
  validUntil TEXT
);

CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  budgetEur REAL NOT NULL,
  riskLevel TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'manual',
  buyCriteria TEXT NOT NULL,
  sellCriteria TEXT NOT NULL,
  strategyBrief TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  strategyId TEXT NOT NULL,
  budgetEur REAL NOT NULL DEFAULT 0,
  executionMode TEXT NOT NULL DEFAULT 'market_open',
  executionHours REAL NOT NULL DEFAULT 6,
  status TEXT NOT NULL,
  tradesToday INTEGER NOT NULL DEFAULT 0,
  loopCount INTEGER NOT NULL DEFAULT 0,
  currentStep TEXT NOT NULL DEFAULT 'idle'
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  strategyName TEXT NOT NULL,
  action TEXT NOT NULL,
  etfTicker TEXT,
  explanation TEXT NOT NULL,
  confidence REAL NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  entityType TEXT NOT NULL,
  entityId TEXT,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_history_daily (
  assetId TEXT NOT NULL,
  tradeDate TEXT NOT NULL,
  open REAL,
  high REAL,
  low REAL,
  close REAL NOT NULL,
  volume REAL,
  source TEXT NOT NULL,
  PRIMARY KEY (assetId, tradeDate)
);

CREATE TABLE IF NOT EXISTS asset_history_intraday (
  assetId TEXT NOT NULL,
  ts TEXT NOT NULL,
  open REAL,
  high REAL,
  low REAL,
  close REAL NOT NULL,
  volume REAL,
  source TEXT NOT NULL,
  PRIMARY KEY (assetId, ts)
);

CREATE TABLE IF NOT EXISTS fx_history (
  currency TEXT NOT NULL,
  ts TEXT NOT NULL,
  spot REAL NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (currency, ts)
);

CREATE TABLE IF NOT EXISTS auth_codes (
  email TEXT NOT NULL,
  codeHash TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  PRIMARY KEY (email, codeHash)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tokenHash TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  userAgent TEXT,
  ipAddress TEXT
);

CREATE TABLE IF NOT EXISTS auth_magic_links (
  email TEXT NOT NULL,
  tokenHash TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  consumedAt TEXT,
  PRIMARY KEY (email, tokenHash)
);
