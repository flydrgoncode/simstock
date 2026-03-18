import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  initialIndices,
  initialSettings,
  initialTrades,
  type BackofficeSettings,
  type IndexAsset,
} from "@/lib/simstock";

const defaultAlternativeAssets = [
  { id: "brent", name: "Brent Crude", symbol: "BNO.US", currency: "USD/EUR", price: 49.04, changePct: 1.64, ytd: 6.1, volumeLabel: "Stooq", market: "Commodities" },
  { id: "gold", name: "Gold", symbol: "GLD.US", currency: "USD/EUR", price: 218.22, changePct: 0.84, ytd: 8.9, volumeLabel: "Stooq", market: "Commodities" },
  { id: "silver", name: "Silver", symbol: "SLV.US", currency: "USD/EUR", price: 24.18, changePct: -0.21, ytd: 5.4, volumeLabel: "Stooq", market: "Commodities" },
  { id: "copper", name: "Copper", symbol: "CPER.US", currency: "USD/EUR", price: 28.74, changePct: 0.56, ytd: 4.1, volumeLabel: "Stooq", market: "Commodities" },
  { id: "corn", name: "Corn", symbol: "CORN.US", currency: "USD/EUR", price: 18.63, changePct: -0.37, ytd: 2.3, volumeLabel: "Stooq", market: "Commodities" },
] as const;

const defaultMarketDataSources = [
  { assetId: "stoxx600", label: "STOXX Europe 600", provider: "Yahoo Finance", symbol: "vgk.us", yahooSymbol: "VGK", mode: "ETF proxy", display: "DASH", group: "Europe" },
  { assetId: "eurostoxx50", label: "EURO STOXX 50", provider: "Yahoo Finance", symbol: "fez.us", yahooSymbol: "FEZ", mode: "ETF proxy", display: "DASH", group: "Europe" },
  { assetId: "sp500", label: "S&P 500", provider: "Yahoo Finance", symbol: "^spx", yahooSymbol: "^GSPC", mode: "Direct index", display: "DASH", group: "US" },
  { assetId: "nasdaq100", label: "Nasdaq-100", provider: "Yahoo Finance", symbol: "^ndq", yahooSymbol: "^NDX", mode: "Direct index", display: "DASH", group: "US" },
  { assetId: "dowjones", label: "Dow Jones", provider: "Yahoo Finance", symbol: "^dji", yahooSymbol: "^DJI", mode: "Direct index", display: "DASH", group: "US" },
  { assetId: "msci-asia", label: "MSCI Asia Pacific", provider: "Yahoo Finance", symbol: "aaxj.us", yahooSymbol: "AAXJ", mode: "ETF proxy", display: "DASH", group: "Asia" },
  { assetId: "csi300", label: "CSI 300", provider: "Yahoo Finance", symbol: "ashr.us", yahooSymbol: "ASHR", mode: "ETF proxy", display: "DASH", group: "China" },
  { assetId: "hangseng", label: "Hang Seng", provider: "Yahoo Finance", symbol: "^hsi", yahooSymbol: "^HSI", mode: "Direct index", display: "DASH", group: "China" },
  { assetId: "bovespa", label: "Bovespa", provider: "Yahoo Finance", symbol: "ewz.us", yahooSymbol: "EWZ", mode: "ETF proxy", display: "DASH", group: "Brazil" },
  { assetId: "nifty50", label: "Nifty 50", provider: "Yahoo Finance", symbol: "inda.us", yahooSymbol: "INDA", mode: "ETF proxy", display: "DASH", group: "India" },
  { assetId: "brent", label: "Brent Crude", provider: "Yahoo Finance", symbol: "bno.us", yahooSymbol: "BZ=F", url: "https://pt.tradingeconomics.com/commodity/brent-crude-oil", mode: "Commodity future", display: "ALTER", group: "Commodities" },
  { assetId: "gold", label: "Gold", provider: "Yahoo Finance", symbol: "gld.us", yahooSymbol: "GC=F", mode: "Commodity future", display: "ALTER", group: "Commodities" },
  { assetId: "silver", label: "Silver", provider: "Yahoo Finance", symbol: "slv.us", yahooSymbol: "SI=F", mode: "Commodity future", display: "ALTER", group: "Commodities" },
  { assetId: "copper", label: "Copper", provider: "Yahoo Finance", symbol: "cper.us", yahooSymbol: "HG=F", mode: "Commodity future", display: "ALTER", group: "Commodities" },
  { assetId: "corn", label: "Corn", provider: "Yahoo Finance", symbol: "corn.us", yahooSymbol: "ZC=F", mode: "Commodity future", display: "ALTER", group: "Commodities" },
] as const;

type DbAssetHistoryDailyRow = {
  assetId: string;
  tradeDate: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  source: string;
};

type DbAssetHistoryIntradayRow = {
  assetId: string;
  ts: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  source: string;
};

type DbFxHistoryRow = {
  currency: string;
  ts: string;
  spot: number;
  source: string;
};

type DbTradeRow = {
  id: string;
  side: "BUY" | "SELL";
  indexId: string;
  etfTicker: string;
  indexName: string;
  units: number;
  unitPriceUsd: number;
  grossEur: number;
  feeEur: number;
  totalEur: number;
  fxRateEurUsd: number;
  fxRateUsdEur: number;
  timestamp: string;
  source: "manual" | "rule" | "agent";
  strategyName: string | null;
  unitLimitUsd: number | null;
  validUntil: string | null;
};

type DbStrategyRow = {
  id: string;
  name: string;
  budgetEur: number;
  riskLevel: string;
  active?: number;
  source?: "manual" | "generated";
  buyCriteria: string;
  sellCriteria: string;
  strategyBrief: string;
};

type DbAgentRow = {
  id: string;
  name: string;
  strategyId: string;
  budgetEur?: number;
  executionMode?: string;
  executionHours?: number;
  status: "running" | "paused" | "cancelled";
  tradesToday: number;
  loopCount?: number;
  currentStep?: string;
};

type DbAgentLogRow = {
  id: string;
  agentId: string;
  strategyName: string;
  action: "buy" | "sell" | "hold" | "start" | "pause" | "cancel";
  etfTicker: string | null;
  explanation: string;
  confidence: number;
  timestamp: string;
};

type DbActivityLogRow = {
  id: string;
  category: string;
  action: string;
  entityType: string;
  entityId: string | null;
  status: "success" | "error" | "started";
  message: string;
  details: string | null;
  timestamp: string;
};

export type SimstockUser = {
  id: string;
  name: string;
  email: string;
  role: "view_only" | "superuser";
  createdAt: string;
};

function getLlmSecretEnvVar(profileId?: string, provider?: string) {
  const normalizedProvider = (provider ?? "").toLowerCase();
  if (profileId === "llm-openai" || normalizedProvider.includes("openai")) {
    return "OPENAI_API_KEY";
  }
  if (profileId === "llm-claude" || normalizedProvider.includes("claude") || normalizedProvider.includes("anthropic")) {
    return "ANTHROPIC_API_KEY";
  }
  if (profileId === "llm-ollama-local" || normalizedProvider.includes("ollama")) {
    return "OLLAMA_API_KEY";
  }
  return "LLM_API_KEY";
}

function buildLlmProfile(profile: {
  id: string;
  name: string;
  provider: string;
  model: string;
  endpoint: string;
  local: boolean;
  temperature: number;
  maxTokens: number;
}) {
  const secretEnvVar = getLlmSecretEnvVar(profile.id, profile.provider);
  const secretConfigured = Boolean(process.env[secretEnvVar]?.trim()) || profile.local;
  return {
    ...profile,
    apiKey: "",
    secretConfigured,
    secretEnvVar,
    secretLocationHint: "Editar manualmente no ficheiro .env da app ou nos secrets do servidor.",
  };
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "simstock.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const globalForDb = globalThis as typeof globalThis & {
  simstockDb?: Database.Database;
};

const db =
  globalForDb.simstockDb ??
  new Database(dbPath);

if (process.env.NODE_ENV !== "production") {
  globalForDb.simstockDb = db;
}

db.pragma("journal_mode = WAL");

export function initDb() {
  db.exec(`
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
  `);
  const strategyColumns = db.prepare("PRAGMA table_info(strategies)").all() as Array<{ name: string }>;
  if (!strategyColumns.some((column) => column.name === "active")) {
    db.prepare("ALTER TABLE strategies ADD COLUMN active INTEGER NOT NULL DEFAULT 1").run();
  }
  if (!strategyColumns.some((column) => column.name === "source")) {
    db.prepare("ALTER TABLE strategies ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'").run();
  }
  const agentColumns = db.prepare("PRAGMA table_info(agents)").all() as Array<{ name: string }>;
  if (!agentColumns.some((column) => column.name === "budgetEur")) {
    db.prepare("ALTER TABLE agents ADD COLUMN budgetEur REAL NOT NULL DEFAULT 0").run();
  }
  if (!agentColumns.some((column) => column.name === "executionMode")) {
    db.prepare("ALTER TABLE agents ADD COLUMN executionMode TEXT NOT NULL DEFAULT 'market_open'").run();
  }
  if (!agentColumns.some((column) => column.name === "executionHours")) {
    db.prepare("ALTER TABLE agents ADD COLUMN executionHours REAL NOT NULL DEFAULT 6").run();
  }
  if (!agentColumns.some((column) => column.name === "loopCount")) {
    db.prepare("ALTER TABLE agents ADD COLUMN loopCount INTEGER NOT NULL DEFAULT 0").run();
  }
  if (!agentColumns.some((column) => column.name === "currentStep")) {
    db.prepare("ALTER TABLE agents ADD COLUMN currentStep TEXT NOT NULL DEFAULT 'idle'").run();
  }

  if (!db.prepare("SELECT 1 FROM app_state WHERE key = ?").get("settings")) {
    db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run(
      "settings",
      JSON.stringify({
        ...initialSettings,
        fxRates: {
          eurUsd: 1.09,
          usdEur: 0.92,
        },
        currencySpots: initialSettings.currencySpots,
        signalSources: [
          "Market momentum",
          "Volume trend",
          "Regional market status",
          "Portfolio exposure",
          "Manual analyst notes",
        ],
        signalOutput: "Devolve insights curtos e propostas objetivas de buy, sell ou hold para os stock items definidos.",
        manualSignals: initialSettings.manualSignals,
        marketDataSources: defaultMarketDataSources,
        marketMode: "LIVE",
      }),
    );
  }

  const settingsRow = db.prepare("SELECT value FROM app_state WHERE key = ?").get("settings") as
    | { value: string }
    | undefined;
  if (settingsRow) {
    const parsed = JSON.parse(settingsRow.value) as BackofficeSettings & {
      fxRefreshMinutes?: number;
      fxRates?: { eurUsd: number; usdEur: number };
      currencySpots?: Record<string, number>;
      signalSources?: string[];
      signalRelations?: string[];
      signalOutput?: string;
      manualSignals?: Array<{
        id: string;
        assetId: string;
        title: string;
        summary: string;
        output?: string;
        actionBias: "buy" | "sell" | "hold";
        confidence: number;
        source: string;
      }>;
      marketMode?: "LIVE" | "DEBUG";
      marketDataSources?: Array<{
        assetId: string;
        label: string;
        provider: string;
        symbol: string;
        yahooSymbol?: string;
        url?: string;
        mode: string;
        display?: string;
        group?: string;
      }>;
    };
    const existingProfiles = parsed.llmProfiles ?? [];
    const byId = new Map(existingProfiles.map((profile) => [profile.id, profile]));
    const ollamaModel = byId.get("llm-ollama-local")?.model;
    const claudeModel = byId.get("llm-claude")?.model;
    const normalizedOllamaModel = ollamaModel && ollamaModel !== "gpt-4.1-mini" ? ollamaModel : "qwen2.5:7b";
    const normalizedClaudeModel =
      claudeModel && claudeModel !== "claude-3-5-sonnet-latest" ? claudeModel : "claude-sonnet-4-6";
    const llmProfiles = [
      buildLlmProfile({
        id: "llm-openai",
        name: "OpenAI",
        provider: "OpenAI",
        model: byId.get("llm-openai")?.model ?? "gpt-4.1",
        endpoint: byId.get("llm-openai")?.endpoint ?? "https://api.openai.com/v1",
        local: false,
        temperature: byId.get("llm-openai")?.temperature ?? 0.2,
        maxTokens: byId.get("llm-openai")?.maxTokens ?? 1200,
      }),
      buildLlmProfile({
        id: "llm-claude",
        name: "Claude",
        provider: "Claude",
        model: normalizedClaudeModel,
        endpoint: byId.get("llm-claude")?.endpoint ?? "https://api.anthropic.com/v1",
        local: false,
        temperature: byId.get("llm-claude")?.temperature ?? 0.2,
        maxTokens: byId.get("llm-claude")?.maxTokens ?? 1200,
      }),
      buildLlmProfile({
        id: "llm-ollama-local",
        name: "Ollama Local",
        provider: "Ollama",
        model: normalizedOllamaModel,
        endpoint: byId.get("llm-ollama-local")?.endpoint ?? parsed.llm?.endpoint ?? "http://localhost:11434/v1",
        local: true,
        temperature: byId.get("llm-ollama-local")?.temperature ?? parsed.llm?.temperature ?? 0.35,
        maxTokens: byId.get("llm-ollama-local")?.maxTokens ?? parsed.llm?.maxTokens ?? 900,
      }),
    ];
    const activeLlmId = parsed.activeLlmId ?? llmProfiles[0]?.id ?? "llm-openai";
    const activeLlm = llmProfiles.find((profile) => profile.id === activeLlmId) ?? llmProfiles[0];
    const next = {
      ...parsed,
      llmProfiles,
      activeLlmId,
      llm: activeLlm,
      agent: {
        ...initialSettings.agent,
        ...(parsed.agent ?? {}),
      },
      fxRates: parsed.fxRates ?? { eurUsd: 1.09, usdEur: 0.92 },
      fxRefreshMinutes: parsed.fxRefreshMinutes ?? initialSettings.fxRefreshMinutes,
      currencySpots: {
        ...initialSettings.currencySpots,
        ...(parsed.currencySpots ?? {}),
      },
      signalSources:
        parsed.signalSources ?? [
          "Market momentum",
          "Volume trend",
          "Regional market status",
          "Portfolio exposure",
          "Manual analyst notes",
        ],
      manualSignals:
        parsed.manualSignals ?? initialSettings.manualSignals,
      signalRelations:
        parsed.signalRelations ?? [
          "Momentum positivo em US indices reforca compra de ETF core US.",
          "Brent em alta com USD forte reduz apetite por risco em mercados importadores.",
          "Queda forte num indice com volume elevado pode originar venda ou hedge.",
        ],
      signalOutput:
        parsed.signalOutput ?? "Devolve insights curtos e propostas objetivas de buy, sell ou hold para os stock items definidos.",
      marketMode: parsed.marketMode ?? "LIVE",
      marketDataSources:
        [...(parsed.marketDataSources ?? defaultMarketDataSources)],
    };
    for (const source of defaultMarketDataSources) {
      if (!next.marketDataSources.some((item) => item.assetId === source.assetId)) {
        next.marketDataSources.push({ ...source });
      }
    }
    next.marketDataSources = next.marketDataSources.map((source: {
      assetId: string;
      label: string;
      provider: string;
      symbol: string;
      url?: string;
      mode: string;
      display?: string;
      group?: string;
    }) => ({
      ...source,
      display: source.display ?? (defaultAlternativeAssets.some((asset) => asset.id === source.assetId) ? "ALTER" : "DASH"),
      group: source.group ?? "General",
      provider: source.assetId === "brent" && (!source.url || source.provider === "Stooq") ? "TradingEconomics URL" : source.provider,
      url: source.assetId === "brent" && !source.url ? "https://pt.tradingeconomics.com/commodity/brent-crude-oil" : source.url,
      mode: source.assetId === "brent" && source.mode === "ETF proxy" ? "URL + LLM" : source.mode,
      yahooSymbol:
        "yahooSymbol" in source && typeof source.yahooSymbol === "string" && source.yahooSymbol.trim().length > 0
          ? source.yahooSymbol
          : defaultMarketDataSources.find((item) => item.assetId === source.assetId)?.yahooSymbol,
    }));
    db.prepare("UPDATE app_state SET value = ? WHERE key = ?").run(JSON.stringify(next), "settings");
  }

  if (!db.prepare("SELECT 1 FROM app_state WHERE key = ?").get("wallet")) {
    db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run(
      "wallet",
      JSON.stringify({
        baseCurrency: "EUR",
        currentBudget: 2601.8,
      }),
    );
  }

  if (!db.prepare("SELECT 1 FROM app_state WHERE key = ?").get("alternative_assets")) {
    db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run(
      "alternative_assets",
      JSON.stringify(defaultAlternativeAssets),
    );
  }
  const alternativeAssetsRow = db.prepare("SELECT value FROM app_state WHERE key = ?").get("alternative_assets") as
    | { value: string }
    | undefined;
  if (alternativeAssetsRow) {
    const alternativeAssets = JSON.parse(alternativeAssetsRow.value) as Array<{
      id: string;
      name: string;
      symbol: string;
      currency?: string;
      price: number;
      changePct: number;
      ytd: number;
      volumeLabel: string;
      market: string;
    }>;
    db.prepare("UPDATE app_state SET value = ? WHERE key = ?").run(
      JSON.stringify(
        [
          ...alternativeAssets.map((asset) => ({
            ...asset,
            currency: asset.currency ?? "USD/EUR",
          })),
          ...defaultAlternativeAssets.filter((asset) => !alternativeAssets.some((current) => current.id === asset.id)),
        ],
      ),
      "alternative_assets",
    );
  }

  if (!db.prepare("SELECT 1 FROM indices LIMIT 1").get()) {
    const insert = db.prepare("INSERT INTO indices (id, payload) VALUES (?, ?)");
    const tx = db.transaction((items: IndexAsset[]) => {
      for (const item of items) {
        insert.run(item.id, JSON.stringify(item));
      }
    });
    tx(initialIndices);
  }
  const indexCurrencyMap = new Map(initialIndices.map((item) => [item.id, item.currency]));
  const persistedIndices = db.prepare("SELECT id, payload FROM indices").all() as Array<{ id: string; payload: string }>;
  const updateIndex = db.prepare("UPDATE indices SET payload = ? WHERE id = ?");
  for (const row of persistedIndices) {
    const parsed = JSON.parse(row.payload) as IndexAsset & { currency?: string };
    if (!parsed.currency) {
      updateIndex.run(
        JSON.stringify({
          ...parsed,
          currency: indexCurrencyMap.get(row.id) ?? "USD",
        }),
        row.id,
      );
    }
  }

  if (!db.prepare("SELECT 1 FROM trades LIMIT 1").get()) {
    const insert = db.prepare(`
      INSERT INTO trades (
        id, side, indexId, etfTicker, indexName, units, unitPriceUsd, grossEur, feeEur, totalEur,
        fxRateEurUsd, fxRateUsdEur, timestamp, source, strategyName, unitLimitUsd, validUntil
      ) VALUES (
        @id, @side, @indexId, @etfTicker, @indexName, @units, @unitPriceUsd, @grossEur, @feeEur, @totalEur,
        @fxRateEurUsd, @fxRateUsdEur, @timestamp, @source, @strategyName, @unitLimitUsd, @validUntil
      )
    `);
    const seeded = initialTrades.map((trade) => ({
      id: trade.id,
      side: trade.side,
      indexId: trade.etfTicker === "CSPX" ? "sp500" : "stoxx600",
      etfTicker: trade.etfTicker,
      indexName: trade.indexName,
      units: trade.units,
      unitPriceUsd: trade.unitPrice,
      grossEur: trade.side === "BUY" ? trade.total - trade.fee : trade.total + trade.fee,
      feeEur: trade.fee,
      totalEur: trade.total,
      fxRateEurUsd: 1.09,
      fxRateUsdEur: 0.92,
      timestamp: trade.timestamp,
      source: trade.source,
      strategyName: trade.source === "agent" ? "US Momentum Core" : "Manual entry",
      unitLimitUsd: null,
      validUntil: null,
    }));
    const tx = db.transaction((items: typeof seeded) => {
      for (const item of items) {
        insert.run(item);
      }
    });
    tx(seeded);
  }

  db.prepare(
    "UPDATE trades SET strategyName = 'Manual entry' WHERE source = 'manual' AND (strategyName IS NULL OR strategyName = '')",
  ).run();
  db.prepare(
    "UPDATE trades SET strategyName = 'Rule engine' WHERE source = 'rule' AND (strategyName IS NULL OR strategyName = '')",
  ).run();

  if (!db.prepare("SELECT 1 FROM strategies LIMIT 1").get()) {
    const insert = db.prepare(`
      INSERT INTO strategies (id, name, budgetEur, riskLevel, active, source, buyCriteria, sellCriteria, strategyBrief)
      VALUES (@id, @name, @budgetEur, @riskLevel, @active, @source, @buyCriteria, @sellCriteria, @strategyBrief)
    `);
    const seeds = [
      {
        id: "strategy-us-momentum",
        name: "US Momentum Core",
        budgetEur: 3200,
        riskLevel: "Balanced",
        active: 1,
        source: "manual",
        buyCriteria: "Comprar em aceleração positiva com fee controlado e mercado aberto.",
        sellCriteria: "Reduzir posição em perda de força ou take-profit parcial.",
        strategyBrief: "Momentum disciplinado sobre índices US.",
      },
      {
        id: "strategy-asia-rebound",
        name: "Asia Rebound",
        budgetEur: 1800,
        riskLevel: "Moderate",
        active: 1,
        source: "manual",
        buyCriteria: "Entrar em reversões de curto prazo com confirmação de volume.",
        sellCriteria: "Sair em quebra de suporte ou stress intraday.",
        strategyBrief: "Estratégia de rebound asiático.",
      },
      {
        id: "strategy-europe-defensive",
        name: "Europe Defensive Rotation",
        budgetEur: 1400,
        riskLevel: "Conservative",
        active: 1,
        source: "manual",
        buyCriteria: "Aumentar exposição em índices defensivos com baixa volatilidade.",
        sellCriteria: "Cortar quando o drawdown regional excede o limiar.",
        strategyBrief: "Rotação defensiva europeia.",
      },
    ];
    const tx = db.transaction((items: typeof seeds) => {
      for (const item of items) {
        insert.run(item);
      }
    });
    tx(seeds);
  }

  if (!db.prepare("SELECT 1 FROM agents LIMIT 1").get()) {
    const insert = db.prepare(`
      INSERT INTO agents (id, name, strategyId, budgetEur, executionMode, executionHours, status, tradesToday)
      VALUES (@id, @name, @strategyId, @budgetEur, @executionMode, @executionHours, @status, @tradesToday)
    `);
    const seeds = [
      {
        id: "agent-a",
        name: "Agent-A",
        strategyId: "strategy-us-momentum",
        budgetEur: 1200,
        executionMode: "market_open",
        executionHours: 6,
        status: "running",
        tradesToday: 2,
        loopCount: 0,
        currentStep: "idle",
      },
      {
        id: "agent-b",
        name: "Agent-B",
        strategyId: "strategy-asia-rebound",
        budgetEur: 900,
        executionMode: "hours",
        executionHours: 4,
        status: "paused",
        tradesToday: 1,
        loopCount: 0,
        currentStep: "idle",
      },
    ];
    const tx = db.transaction((items: typeof seeds) => {
      for (const item of items) {
        insert.run(item);
      }
    });
    tx(seeds);
  }

  if (!db.prepare("SELECT 1 FROM agent_logs LIMIT 1").get()) {
    const insert = db.prepare(`
      INSERT INTO agent_logs (id, agentId, strategyName, action, etfTicker, explanation, confidence, timestamp)
      VALUES (@id, @agentId, @strategyName, @action, @etfTicker, @explanation, @confidence, @timestamp)
    `);
    const seeds = [
      {
        id: "log-a-1",
        agentId: "agent-a",
        strategyName: "US Momentum Core",
        action: "buy",
        etfTicker: "CSPX",
        explanation: "Momentum positivo no S&P 500 com fee controlado e abertura do mercado US.",
        confidence: 78,
        timestamp: "15/03/2026 15:20",
      },
      {
        id: "log-b-1",
        agentId: "agent-b",
        strategyName: "Asia Rebound",
        action: "hold",
        etfTicker: "CPXJ",
        explanation: "Sem confirmação suficiente de rebound; o agente aguardou novo sinal de volume.",
        confidence: 61,
        timestamp: "15/03/2026 15:32",
      },
    ];
    const tx = db.transaction((items: typeof seeds) => {
      for (const item of items) {
        insert.run(item);
      }
    });
    tx(seeds);
  }

  if (!db.prepare("SELECT 1 FROM app_state WHERE key = ?").get("signal_snapshot")) {
    db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run(
      "signal_snapshot",
      JSON.stringify({
        lastRunAt: null,
        status: "idle",
        signals: [],
        signalStates: [],
        relations: [],
      }),
    );
  }

  if (!db.prepare("SELECT 1 FROM app_state WHERE key = ?").get("users")) {
    db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run(
      "users",
      JSON.stringify([
        {
          id: "user-default",
          name: "Default User",
          email: "default@simstock.local",
          role: "superuser",
          createdAt: new Date().toISOString(),
        },
      ] satisfies SimstockUser[]),
    );
  }

  if (!db.prepare("SELECT 1 FROM app_state WHERE key = ?").get("active_user_id")) {
    db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("active_user_id", JSON.stringify("user-default"));
  }
}

initDb();

export function getDb() {
  return db;
}

export function getSettings<T extends BackofficeSettings & { fxRates: { eurUsd: number; usdEur: number } }>() {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("settings") as { value: string };
  return JSON.parse(row.value) as T;
}

export function getAppStateValue<T>(key: string, fallback: T) {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get(key) as { value: string } | undefined;
  if (!row) {
    return fallback;
  }
  return JSON.parse(row.value) as T;
}

export function setAppStateValue(key: string, value: unknown) {
  db.prepare(`
    INSERT INTO app_state (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, JSON.stringify(value));
}

export function getUsers() {
  return getAppStateValue<SimstockUser[]>("users", []).map((user) => ({
    ...user,
    email: user.email ?? `${user.name.toLowerCase().replace(/\s+/g, ".")}@simstock.local`,
    role: user.role ?? "superuser",
  }));
}

export function getActiveUserId() {
  return getAppStateValue<string>("active_user_id", "user-default");
}

export function setActiveUserId(userId: string) {
  setAppStateValue("active_user_id", userId);
}

export function getWallet() {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("wallet") as { value: string };
  return JSON.parse(row.value) as { baseCurrency: string; currentBudget: number };
}

export function getAlternativeAssets() {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("alternative_assets") as { value: string };
  return JSON.parse(row.value) as Array<{
    id: string;
    name: string;
    symbol: string;
    currency: string;
    price: number;
    changePct: number;
    ytd: number;
    volumeLabel: string;
    market: string;
  }>;
}

export function listIndices() {
  const rows = db.prepare("SELECT payload FROM indices ORDER BY id").all() as { payload: string }[];
  return rows.map((row) => JSON.parse(row.payload) as IndexAsset);
}

export function listTrades() {
  return db
    .prepare("SELECT * FROM trades ORDER BY timestamp DESC")
    .all() as DbTradeRow[];
}

export function listStrategies() {
  return db
    .prepare("SELECT * FROM strategies ORDER BY name")
    .all() as DbStrategyRow[];
}

export function listAgents() {
  return db
    .prepare("SELECT * FROM agents ORDER BY name")
    .all() as DbAgentRow[];
}

export function listAgentLogs() {
  return db
    .prepare("SELECT * FROM agent_logs ORDER BY timestamp DESC")
    .all() as DbAgentLogRow[];
}

export function listActivityLogs() {
  return db
    .prepare("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 300")
    .all() as DbActivityLogRow[];
}

export function getSignalSnapshot<T>() {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("signal_snapshot") as { value: string };
  return JSON.parse(row.value) as T;
}

export function replaceAssetDailyHistory(assetId: string, rows: DbAssetHistoryDailyRow[]) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM asset_history_daily WHERE assetId = ?").run(assetId);
    if (rows.length === 0) {
      return;
    }
    const insert = db.prepare(`
      INSERT INTO asset_history_daily (assetId, tradeDate, open, high, low, close, volume, source)
      VALUES (@assetId, @tradeDate, @open, @high, @low, @close, @volume, @source)
    `);
    for (const row of rows) {
      insert.run(row);
    }
  });
  tx();
}

export function replaceAssetIntradayHistory(assetId: string, rows: DbAssetHistoryIntradayRow[]) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM asset_history_intraday WHERE assetId = ?").run(assetId);
    if (rows.length === 0) {
      return;
    }
    const insert = db.prepare(`
      INSERT INTO asset_history_intraday (assetId, ts, open, high, low, close, volume, source)
      VALUES (@assetId, @ts, @open, @high, @low, @close, @volume, @source)
    `);
    for (const row of rows) {
      insert.run(row);
    }
  });
  tx();
}

export function listAssetDailyHistory(assetId?: string) {
  if (assetId) {
    return db
      .prepare("SELECT * FROM asset_history_daily WHERE assetId = ? ORDER BY tradeDate ASC")
      .all(assetId) as DbAssetHistoryDailyRow[];
  }
  return db
    .prepare("SELECT * FROM asset_history_daily ORDER BY assetId ASC, tradeDate ASC")
    .all() as DbAssetHistoryDailyRow[];
}

export function listAssetIntradayHistory(assetId?: string) {
  if (assetId) {
    return db
      .prepare("SELECT * FROM asset_history_intraday WHERE assetId = ? ORDER BY ts ASC")
      .all(assetId) as DbAssetHistoryIntradayRow[];
  }
  return db
    .prepare("SELECT * FROM asset_history_intraday ORDER BY assetId ASC, ts ASC")
    .all() as DbAssetHistoryIntradayRow[];
}

export function replaceFxHistory(currency: string, rows: DbFxHistoryRow[]) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM fx_history WHERE currency = ?").run(currency);
    if (rows.length === 0) {
      return;
    }
    const insert = db.prepare(`
      INSERT INTO fx_history (currency, ts, spot, source)
      VALUES (@currency, @ts, @spot, @source)
    `);
    for (const row of rows) {
      insert.run(row);
    }
  });
  tx();
}

export function listFxHistory(currency?: string) {
  if (currency) {
    return db
      .prepare("SELECT * FROM fx_history WHERE currency = ? ORDER BY ts ASC")
      .all(currency) as DbFxHistoryRow[];
  }
  return db
    .prepare("SELECT * FROM fx_history ORDER BY currency ASC, ts ASC")
    .all() as DbFxHistoryRow[];
}
