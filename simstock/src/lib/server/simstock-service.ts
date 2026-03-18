import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  buildAgentDecision,
  getRegionStatus,
  initialHistory,
  type IndexAsset,
  type PricePoint,
  type RangeKey,
} from "@/lib/simstock";
import {
  getAlternativeAssets,
  getActiveUserId,
  getAppStateValue,
  listAssetDailyHistory,
  listAssetIntradayHistory,
  listFxHistory,
  getDb,
  getSettings,
  getSignalSnapshot,
  replaceAssetDailyHistory,
  replaceAssetIntradayHistory,
  replaceFxHistory,
  getUsers,
  getWallet,
  listActivityLogs,
  listAgents,
  listAgentLogs,
  listIndices,
  listStrategies,
  listTrades,
  setAppStateValue,
  type SimstockUser,
} from "./db";

const execFileAsync = promisify(execFile);

type StrategyRecord = ReturnType<typeof listStrategies>[number];
type TradeRecord = ReturnType<typeof listTrades>[number];

export type AppSettings = ReturnType<typeof getSettings<{
  feePerTrade: number;
  autoRefreshMinutes: number;
  fxRefreshMinutes: number;
  defaultBudget: number;
  slippagePct: number;
  llm: {
    id?: string;
    name?: string;
    provider: string;
    model: string;
    endpoint: string;
    apiKey?: string;
    secretConfigured?: boolean;
    secretEnvVar?: string;
    secretLocationHint?: string;
    local: boolean;
    temperature: number;
    maxTokens: number;
  };
  llmProfiles: Array<{
    id?: string;
    name?: string;
    provider: string;
    model: string;
    endpoint: string;
    apiKey?: string;
    secretConfigured?: boolean;
    secretEnvVar?: string;
    secretLocationHint?: string;
    local: boolean;
    temperature: number;
    maxTokens: number;
  }>;
  activeLlmId: string;
  marketMode?: "LIVE" | "DEBUG";
  agent: {
    autoExecute: boolean;
    cadenceMinutes: number;
    riskProfile: "conservative" | "balanced" | "aggressive";
    maxTradeEur: number;
    maxOpenPositions: number;
    mission: string;
    objective: string;
    freeFormInfluence: string;
    preferredRegions: string[];
    avoidRegions: string[];
    preferredStockItems: string[];
    avoidStockItems: string[];
    prioritizeSignals: string[];
    downweightSignals: string[];
    minConvictionPct: number;
    maxShortlist: number;
    requireMarketOpen: boolean;
    requirePortfolioImprovement: boolean;
    askIfMomentIsNow: boolean;
  };
  fxRates: { eurUsd: number; usdEur: number };
  currencySpots: Record<string, number>;
  signalSources: string[];
  signalRelations: string[];
  signalOutput?: string;
  manualSignals: Array<{
    id: string;
    assetId: string;
    title: string;
    summary: string;
    output?: string;
    actionBias: "buy" | "sell" | "hold";
    confidence: number;
    source: string;
  }>;
  marketDataSources: Array<{
    assetId: string;
    label: string;
    provider: string;
    symbol: string;
    yahooSymbol?: string;
    url?: string;
    mode: string;
    display: string;
    group: string;
  }>;
}>>;

type SignalInsight = {
  id: string;
  assetId: string;
  title: string;
  summary: string;
  actionBias: "buy" | "sell" | "hold";
  confidence: number;
  driver: string;
  source: string;
};

type SignalState = {
  assetId: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  reason: string;
  source?: string;
};

type SignalSnapshot = {
  lastRunAt: string | null;
  status: "idle" | "success" | "error";
  signals: SignalInsight[];
  signalStates: SignalState[];
  relations: string[];
  promptPreview?: string;
};

type AgentTradeProposal = {
  id: string;
  agentId: string;
  strategyId: string;
  strategyName: string;
  indexId: string;
  indexName: string;
  etfTicker: string;
  action: "buy" | "sell";
  conviction: number;
  amountEur: number;
  rationale: string;
  whyNow: string;
  expectedPortfolioImpact: string;
  risks: string[];
  news: string[];
  status: "pending" | "approved" | "rejected";
};

type AgentTradeShortlist = {
  generatedAt: string | null;
  promptPreview?: string;
  proposals: AgentTradeProposal[];
};

type HistoryBar = {
  ts: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  source: string;
};

type GeneratedStrategySuggestion = {
  name: string;
  buyCriteria: string;
  sellCriteria: string;
  strategyBrief: string;
  source: "generated";
};

type GeneratedSignalFields = {
  signalSources: string[];
  signalRelations: string[];
  signalOutput: string;
  logs: string[];
};

type LlmProfile = AppSettings["llmProfiles"][number];

type LlmInvocationTarget = "signals" | "strategy_generation" | "market_extraction";

type ResolvedLlmProfile = {
  profile: LlmProfile;
  fallbackUsed: boolean;
  reason: string;
};

type UserBusinessDataset = {
  settings: Partial<AppSettings>;
  wallet: ReturnType<typeof getWallet>;
  alternativeAssets: ReturnType<typeof getAlternativeAssets>;
  indices: ReturnType<typeof listIndices>;
  trades: ReturnType<typeof listTrades>;
  strategies: ReturnType<typeof listStrategies>;
  agents: ReturnType<typeof listAgents>;
  agentLogs: ReturnType<typeof listAgentLogs>;
  activityLogs: ReturnType<typeof listActivityLogs>;
  signalSnapshot: SignalSnapshot;
};

export function getDashboardState() {
  const indices = listIndices();
  const trades = listTrades();
  const strategies = listStrategies();
  const agents = listAgents();
  const settings = redactLlmSecrets(getSettings<AppSettings>());
  const users = getUsers();
  const activeUserId = getActiveUserId();
  const activeUser = users.find((user) => user.id === activeUserId) ?? users[0] ?? null;
  const isSuperuser = activeUser?.role === "superuser";
  const wallet = getWallet();
  const alternativeAssets = getAlternativeAssets();
  const agentLogs = listAgentLogs();
  const activityLogs = listActivityLogs();
  const signalSnapshot = getSignalSnapshot<SignalSnapshot>();
  const agentTradeShortlist = getAppStateValue<AgentTradeShortlist>("agent_trade_shortlist", {
    generatedAt: null,
    promptPreview: "",
    proposals: [],
  });
  const fallbackSignals = buildFallbackSignalInsights(indices, alternativeAssets, settings);
  const configuredActive =
    settings.llmProfiles.find((profile) => profile.id === settings.activeLlmId) ??
    settings.llmProfiles[0] ??
    settings.llm;
  const llmRuntime = {
    active: {
      id: configuredActive.id ?? null,
      name: labelLlmProfile(configuredActive),
      provider: configuredActive.provider,
      model: configuredActive.model,
      fallbackUsed: !isUsableLlmProfile(configuredActive),
      reason: isUsableLlmProfile(configuredActive)
        ? `${labelLlmProfile(configuredActive)} esta configurado como LLM ativo.`
        : `${labelLlmProfile(configuredActive)} esta configurado como LLM ativo, mas nao esta operacional.`,
    },
    signals: describeResolvedLlm(resolveLlmProfile(settings, "signals", { strict: false })),
    strategyGeneration: describeResolvedLlm(resolveLlmProfile(settings, "strategy_generation", { strict: false })),
    marketExtraction: describeResolvedLlm(resolveLlmProfile(settings, "market_extraction", { strict: false })),
  };
  const positions = computePositions(indices, trades);
  const portfolio = computePortfolio(indices, wallet.currentBudget, trades, positions);
  const useFallbackSignals = signalSnapshot.status !== "idle" && signalSnapshot.signals.length === 0;
  const signals =
    signalSnapshot.signals.length > 0
      ? signalSnapshot.signals
      : useFallbackSignals
        ? fallbackSignals.signals
        : [];
  const analystSuggestion = buildAgentDecision(indices, settings);
  persistActiveUserBusinessDataset();

  return {
    version: "v1.44",
    generatedAt: new Date().toISOString(),
    indices,
    chartHistory: buildNormalizedHistory(),
    alternativeAssets,
    alternativeChartHistory: buildAlternativeHistory(),
    fxChartHistory: buildFxHistory(),
    wallet,
    settings,
    users,
    activeUserId,
    activeUser,
    trades: trades.map((trade) => ({
      ...trade,
      currency: indices.find((index) => index.id === trade.indexId)?.currency ?? "EUR",
    })),
    strategies: isSuperuser ? strategies : [],
    agents: isSuperuser ? agents.map((agent) => ({
      ...agent,
      budgetEur: Number(agent.budgetEur ?? 0),
      executionMode: agent.executionMode ?? "market_open",
      executionHours: Number(agent.executionHours ?? 6),
      loopCount: Number(agent.loopCount ?? 0),
      currentStep: String(agent.currentStep ?? "idle"),
      strategyName: strategies.find((strategy) => strategy.id === agent.strategyId)?.name ?? agent.strategyId,
    })) : [],
    agentLogs: isSuperuser ? agentLogs : [],
    activityLogs,
    positions,
    portfolio,
    signals,
    signalStates:
      signalSnapshot.signalStates.length > 0
        ? signalSnapshot.signalStates
        : useFallbackSignals
          ? fallbackSignals.signalStates
          : [],
    signalsMeta: {
      lastRunAt: signalSnapshot.lastRunAt,
      status: signalSnapshot.status,
      relations:
        (signalSnapshot.relations ?? []).length > 0
          ? signalSnapshot.relations
          : useFallbackSignals
            ? fallbackSignals.relations
            : [],
      promptPreview: signalSnapshot.promptPreview ?? buildSignalRefreshPrompt(indices, alternativeAssets, settings),
    },
    agentTradeShortlist,
    llmRuntime,
    analystSuggestion: isSuperuser
      ? analystSuggestion
      : {
          etfTicker: "",
          action: "hold" as const,
          confidence: 0,
          rationale: "AutoTrade disponivel apenas para superuser.",
          suggestedAmountEur: 0,
        },
  };
}

export function refreshIndices() {
  throw new Error("Use refreshIndicesAsync");
}

export async function refreshIndicesAsync() {
  assertSuperuser("Market refresh");
  return refreshMarketSourceAsync();
}

export async function primeMarketDataAsync() {
  const assets = [
    ...listIndices().map((item) => item.id),
    ...getAlternativeAssets().map((item) => item.id),
  ];
  const hasMissingAssetHistory = assets.some((assetId) => listAssetDailyHistory(assetId).length < 20);
  const hasMissingFxHistory = listFxHistory().length === 0;
  if (!hasMissingAssetHistory && !hasMissingFxHistory) {
    return getDashboardState();
  }
  if (getActiveUserProfile()?.role !== "superuser") {
    return getDashboardState();
  }
  await refreshMarketSourceAsync();
  await refreshFxRatesAsync();
  return getDashboardState();
}

export async function refreshMarketSourceAsync(assetId?: string) {
  assertSuperuser("Market refresh");
  const db = getDb();
  insertActivityLog({
    category: "market",
    action: "refresh",
    entityType: assetId ? "stock_item" : "market_batch",
    entityId: assetId ?? "all",
    status: "started",
    message: assetId ? `Atualizacao iniciada para ${assetId}.` : "Atualizacao global de stock items iniciada.",
  });
  const update = db.prepare("UPDATE indices SET payload = ? WHERE id = ?");
  const currentIndices = listIndices();
  const settings = getSettings<AppSettings>();
  const refreshed = await Promise.all(
    currentIndices.map(async (index) => {
      if (assetId && index.id !== assetId) {
        return index;
      }
      const source = settings.marketDataSources.find((item) => item.assetId === index.id);
      if (!source) {
        return index;
      }
      const quote = await syncMarketDataSource(source, settings).catch(() => null);
      if (!quote) {
        return index;
      }
      return {
        ...index,
        price: quote.close,
        changePct: quote.dailyChangePct,
        ytd: quote.ytdPct,
        volumeLabel: quote.volumeLabel,
      };
    }),
  );

  const tx = db.transaction((items: IndexAsset[]) => {
    for (const item of items) {
      update.run(JSON.stringify(item), item.id);
    }
  });
  tx(refreshed);

  const currentAlternativeAssets = getAlternativeAssets();
  const refreshedAlternatives = await Promise.all(
    currentAlternativeAssets.map(async (asset) => {
      if (assetId && asset.id !== assetId) {
        return asset;
      }
      const source = settings.marketDataSources.find((item) => item.assetId === asset.id);
      if (!source) {
        return asset;
      }
      const quote = await syncMarketDataSource(source, settings).catch(() => null);
      if (!quote) {
        return asset;
      }
      return {
        ...asset,
        symbol: source.symbol.toUpperCase(),
        price: quote.close,
        changePct: quote.dailyChangePct,
        ytd: quote.ytdPct,
        volumeLabel: quote.volumeLabel,
      };
    }),
  );
  db.prepare("UPDATE app_state SET value = ? WHERE key = ?").run(
    JSON.stringify(refreshedAlternatives),
    "alternative_assets",
  );
  if (!assetId) {
    await refreshFxRatesAsync();
  }

  insertActivityLog({
    category: "market",
    action: "refresh",
    entityType: assetId ? "stock_item" : "market_batch",
    entityId: assetId ?? "all",
    status: "success",
    message: assetId ? `Atualizacao concluida para ${assetId}.` : "Atualizacao global de stock items concluida.",
  });

  return refreshed;
}

export async function refreshFxRatesAsync() {
  assertSuperuser("FX refresh");
  const settings = getSettings<AppSettings>();
  insertActivityLog({
    category: "fx",
    action: "refresh",
    entityType: "fx_batch",
    entityId: "all",
    status: "started",
    message: "Atualizacao FX iniciada.",
  });
  const currencies = Array.from(
    new Set(
      [
        ...listIndices().map((item) => item.currency),
        ...getAlternativeAssets().map((item) => normalizeAlternativeCurrency(item.currency)),
      ].filter((currency) => currency && currency !== "EUR"),
    ),
  );
  const currencySpots: Record<string, number> = { EUR: 1 };
  const fxChartHistory: Record<string, HistoryBar[]> = {};
  for (const currency of currencies) {
    const series = await fetchYahooFxHistory(currency).catch(() => []);
    if (series.length === 0) {
      continue;
    }
    replaceFxHistory(
      currency,
      series.map((point) => ({
        currency,
        ts: point.ts,
        spot: point.close,
        source: point.source,
      })),
    );
    currencySpots[currency] = Number(series.at(-1)?.close.toFixed(6) ?? 1);
    fxChartHistory[currency] = series;
  }
  const nextSettings = normalizeSettings({
    currencySpots: {
      ...settings.currencySpots,
      ...currencySpots,
    },
    fxRates: {
      eurUsd: currencySpots.USD ?? settings.fxRates.eurUsd,
      usdEur: currencySpots.USD ? Number((1 / currencySpots.USD).toFixed(6)) : settings.fxRates.usdEur,
    },
  });
  setAppStateValue("settings", nextSettings);
  insertActivityLog({
    category: "fx",
    action: "refresh",
    entityType: "fx_batch",
    entityId: "all",
    status: "success",
    message: `Atualizacao FX concluida para ${Object.keys(currencySpots).length - 1} moedas.`,
  });
  persistActiveUserBusinessDataset();
  return getDashboardState();
}

export function normalizeSettings(partial: Partial<AppSettings>) {
  const current = getSettings<AppSettings>();
  const nextProfiles = (partial.llmProfiles ?? current.llmProfiles).map((profile) => {
    const currentProfile = current.llmProfiles.find((item) => item.id === profile.id);
    return {
      ...currentProfile,
      ...profile,
      apiKey: "",
    };
  });
  const next = {
    ...current,
    ...partial,
    llm: { ...current.llm, ...(partial.llm ?? {}) },
    llmProfiles: nextProfiles,
    agent: { ...current.agent, ...(partial.agent ?? {}) },
    fxRates: { ...current.fxRates, ...(partial.fxRates ?? {}) },
    currencySpots: { ...current.currencySpots, ...(partial.currencySpots ?? {}) },
    manualSignals: partial.manualSignals ?? current.manualSignals,
    signalOutput: partial.signalOutput ?? current.signalOutput,
    marketMode: partial.marketMode ?? current.marketMode ?? "LIVE",
  };
  const activeProfile =
    next.llmProfiles.find((profile) => profile.id === next.activeLlmId) ??
    next.llmProfiles[0] ??
    next.llm;
  return {
    ...next,
    activeLlmId: activeProfile.id ?? next.activeLlmId,
    llm: activeProfile,
  };
}

function getActiveUserProfile() {
  const activeUserId = getActiveUserId();
  return getUsers().find((user) => user.id === activeUserId) ?? null;
}

function redactLlmSecrets(settings: AppSettings): AppSettings {
  const llmProfiles = settings.llmProfiles.map((profile) => ({
    ...profile,
    apiKey: "",
  }));
  const activeProfile =
    llmProfiles.find((profile) => profile.id === settings.activeLlmId) ??
    llmProfiles[0] ??
    { ...settings.llm, apiKey: "" };
  return {
    ...settings,
    llmProfiles,
    llm: {
      ...activeProfile,
      apiKey: "",
    },
  };
}

function getLlmSecretEnvVar(profile: LlmProfile | undefined | null) {
  const profileId = profile?.id ?? "";
  const provider = (profile?.provider ?? "").toLowerCase();
  if (profileId === "llm-openai" || provider.includes("openai")) {
    return "OPENAI_API_KEY";
  }
  if (profileId === "llm-claude" || provider.includes("claude") || provider.includes("anthropic")) {
    return "ANTHROPIC_API_KEY";
  }
  if (profileId === "llm-ollama-local" || provider.includes("ollama")) {
    return "OLLAMA_API_KEY";
  }
  return "LLM_API_KEY";
}

function resolveLlmApiKey(profile: LlmProfile | undefined | null) {
  const envVar = getLlmSecretEnvVar(profile);
  return process.env[envVar]?.trim() ?? "";
}

function materializeLlmProfile(profile: LlmProfile) {
  return {
    ...profile,
    apiKey: resolveLlmApiKey(profile),
    secretConfigured: Boolean(resolveLlmApiKey(profile)) || Boolean(profile.local),
    secretEnvVar: getLlmSecretEnvVar(profile),
    secretLocationHint: "Editar manualmente no ficheiro .env da app ou nos secrets do servidor.",
  };
}

function assertSuperuser(feature: string) {
  const activeUser = getActiveUserProfile();
  if (!activeUser || activeUser.role !== "superuser") {
    throw new Error(`${feature} requires superuser permissions`);
  }
  return activeUser;
}

export function createTrade(input: {
  side: "BUY" | "SELL";
  indexId: string;
  amountValue: number;
  amountMode: "EUR" | "LOCAL";
  unitLimitUsd?: number | null;
  validUntil?: string | null;
  source?: "manual" | "rule" | "agent";
  strategyName?: string | null;
}) {
  assertSuperuser("Trading");
  const db = getDb();
  const indices = listIndices();
  const settings = getSettings<AppSettings>();
  const wallet = getWallet();
  const trades = listTrades();
  const index = indices.find((item) => item.id === input.indexId);

  if (!index) {
    throw new Error("Index not found");
  }
  if (!isMarketOpenForSettings(index.region, settings)) {
    throw new Error("Market is closed for this stock item");
  }

  const amountValue = Number(input.amountValue);
  if (!(amountValue > 0)) {
    throw new Error("Amount must be greater than zero");
  }

  const tradeCurrency = index.currency;
  const spotEurToCurrency = getEurToCurrencySpot(tradeCurrency, settings);
  const spotCurrencyToEur = getCurrencyToEurSpot(tradeCurrency, settings);
  const unitPriceLocal = index.price / 10;
  const grossLocal = input.side === "BUY" ? amountValue * spotEurToCurrency : amountValue;
  const grossEur = input.side === "BUY" ? amountValue : amountValue * spotCurrencyToEur;
  const units = Number((grossLocal / unitPriceLocal).toFixed(4));
  const feeEur = settings.feePerTrade;
  const impact = input.side === "BUY" ? grossEur + feeEur : grossEur - feeEur;

  const positions = computePositions(indices, trades);
  const currentPosition = positions.find((position) => position.indexId === index.id);

  if (input.side === "BUY" && impact > wallet.currentBudget) {
    throw new Error("Insufficient EUR budget");
  }

  if (input.side === "SELL" && (!currentPosition || currentPosition.units <= 0)) {
    throw new Error("No position available to sell");
  }

  if (input.side === "SELL" && currentPosition) {
    const maxSellEur = (currentPosition.units * unitPriceLocal) * spotCurrencyToEur;
    if (grossEur > maxSellEur + 0.01) {
      throw new Error("Sell amount exceeds current position value");
    }
  }

  const trade = {
    id: randomUUID(),
    side: input.side,
    indexId: index.id,
    etfTicker: index.etfTicker,
    indexName: index.name,
    units,
    unitPriceUsd: unitPriceLocal,
    grossEur: Number(grossEur.toFixed(2)),
    feeEur,
    totalEur: Number((input.side === "BUY" ? grossEur + feeEur : grossEur - feeEur).toFixed(2)),
    fxRateEurUsd: Number(spotEurToCurrency.toFixed(6)),
    fxRateUsdEur: Number(spotCurrencyToEur.toFixed(6)),
    timestamp: new Date().toLocaleString("pt-PT"),
    source: input.source ?? "manual",
    strategyName: input.strategyName ?? (input.source === "manual" ? "Manual entry" : input.source === "rule" ? "Rule engine" : null),
    unitLimitUsd: input.unitLimitUsd ?? null,
    validUntil: input.validUntil ?? null,
  };

  db.prepare(`
    INSERT INTO trades (
      id, side, indexId, etfTicker, indexName, units, unitPriceUsd, grossEur, feeEur, totalEur,
      fxRateEurUsd, fxRateUsdEur, timestamp, source, strategyName, unitLimitUsd, validUntil
    ) VALUES (
      @id, @side, @indexId, @etfTicker, @indexName, @units, @unitPriceUsd, @grossEur, @feeEur, @totalEur,
      @fxRateEurUsd, @fxRateUsdEur, @timestamp, @source, @strategyName, @unitLimitUsd, @validUntil
    )
  `).run(trade);

  const nextBudget =
    input.side === "BUY"
      ? wallet.currentBudget - grossEur - feeEur
      : wallet.currentBudget + grossEur - feeEur;

  db.prepare("UPDATE app_state SET value = ? WHERE key = ?").run(
    JSON.stringify({
      ...wallet,
      currentBudget: Number(nextBudget.toFixed(2)),
    }),
    "wallet",
  );

  insertActivityLog({
    category: "trading",
    action: input.side === "BUY" ? "buy" : "sell",
    entityType: "trade",
    entityId: trade.id,
    status: "success",
    message: `${input.side === "BUY" ? "Compra" : "Venda"} executada para ${index.etfTicker}.`,
    details: JSON.stringify({
      indexId: index.id,
      etfTicker: index.etfTicker,
      grossEur: trade.grossEur,
      feeEur: trade.feeEur,
      source: trade.source,
      strategyName: trade.strategyName,
    }),
  });

  return getDashboardState();
}

export function updateSettings(partial: Partial<AppSettings>) {
  assertSuperuser("Backoffice");
  const next = normalizeSettings(partial);
  getDb().prepare("UPDATE app_state SET value = ? WHERE key = ?").run(JSON.stringify(next), "settings");
  insertActivityLog({
    category: "backoffice",
    action: "update",
    entityType: "settings",
    entityId: "settings",
    status: "success",
    message: "Configuracoes de backoffice atualizadas.",
    details: JSON.stringify(Object.keys(partial)),
  });
  persistActiveUserBusinessDataset();
  return next;
}

export function createUser(name: string, email: string, role: "view_only" | "superuser") {
  assertSuperuser("User management");
  const trimmed = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmed) {
    throw new Error("User name is required");
  }
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Valid user email is required");
  }
  const users = getUsers();
  if (users.some((user) => user.name.trim().toLowerCase() === trimmed.toLowerCase())) {
    throw new Error("User name already exists");
  }
  if (users.some((user) => user.email.trim().toLowerCase() === trimmedEmail)) {
    throw new Error("User email already exists");
  }
  persistActiveUserBusinessDataset();
  const user: SimstockUser = { id: randomUUID(), name: trimmed, email: trimmedEmail, role, createdAt: new Date().toISOString() };
  setAppStateValue("users", [...users, user]);
  setAppStateValue(`user_dataset::${user.id}`, buildNewUserBusinessDataset(trimmed));
  setAppStateValue("active_user_id", user.id);
  applyUserBusinessDataset(getAppStateValue<UserBusinessDataset>(`user_dataset::${user.id}`, buildNewUserBusinessDataset(trimmed)));
  insertActivityLog({
    category: "users",
    action: "create",
    entityType: "user",
    entityId: user.id,
    status: "success",
    message: `Utilizador ${trimmed} criado.`,
  });
  return getDashboardState();
}

export function updateUser(userId: string, input: { name: string; email: string; role: "view_only" | "superuser" }) {
  assertSuperuser("User management");
  const trimmed = input.name.trim();
  const trimmedEmail = input.email.trim().toLowerCase();
  if (!trimmed) {
    throw new Error("User name is required");
  }
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Valid user email is required");
  }
  const users = getUsers();
  const current = users.find((user) => user.id === userId);
  if (!current) {
    throw new Error("User not found");
  }
  if (users.some((user) => user.id !== userId && user.name.trim().toLowerCase() === trimmed.toLowerCase())) {
    throw new Error("User name already exists");
  }
  if (users.some((user) => user.id !== userId && user.email.trim().toLowerCase() === trimmedEmail)) {
    throw new Error("User email already exists");
  }
  const nextUsers = users.map((user) =>
    user.id === userId
      ? { ...user, name: trimmed, email: trimmedEmail, role: input.role }
      : user,
  );
  setAppStateValue("users", nextUsers);
  insertActivityLog({
    category: "users",
    action: "update",
    entityType: "user",
    entityId: userId,
    status: "success",
    message: `Utilizador ${trimmed} atualizado.`,
  });
  return getDashboardState();
}

export function selectUser(userId: string) {
  const users = getUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) {
    throw new Error("User not found");
  }
  persistActiveUserBusinessDataset();
  const dataset = getAppStateValue<UserBusinessDataset>(`user_dataset::${userId}`, buildNewUserBusinessDataset(target.name));
  applyUserBusinessDataset(dataset);
  setAppStateValue("active_user_id", userId);
  insertActivityLog({
    category: "users",
    action: "select",
    entityType: "user",
    entityId: userId,
    status: "success",
    message: `Utilizador ativo mudado para ${target.name}.`,
  });
  return getDashboardState();
}

export function deleteUser(userId: string) {
  assertSuperuser("User management");
  const users = getUsers();
  if (users.length <= 1) {
    throw new Error("At least one user must remain");
  }
  const target = users.find((user) => user.id === userId);
  if (!target) {
    throw new Error("User not found");
  }
  const activeUserId = getActiveUserId();
  const nextUsers = users.filter((user) => user.id !== userId);
  setAppStateValue("users", nextUsers);
  getDb().prepare("DELETE FROM app_state WHERE key = ?").run(`user_dataset::${userId}`);
  if (activeUserId === userId) {
    return selectUser(nextUsers[0].id);
  }
  insertActivityLog({
    category: "users",
    action: "delete",
    entityType: "user",
    entityId: userId,
    status: "success",
    message: `Utilizador ${target.name} removido.`,
  });
  return getDashboardState();
}

export function exportSystemData() {
  assertSuperuser("Backoffice export");
  const db = getDb();
  const appStateRows = db.prepare("SELECT key, value FROM app_state ORDER BY key").all() as Array<{ key: string; value: string }>;
  const payload = {
    exportedAt: new Date().toISOString(),
    version: getDashboardState().version,
    appState: appStateRows.map((row) =>
      row.key === "settings"
        ? {
            ...row,
            value: JSON.stringify(redactLlmSecrets(JSON.parse(row.value) as AppSettings)),
          }
        : row,
    ),
    indices: db.prepare("SELECT id, payload FROM indices ORDER BY id").all(),
    trades: db.prepare("SELECT * FROM trades ORDER BY timestamp DESC").all(),
    strategies: db.prepare("SELECT * FROM strategies ORDER BY name").all(),
    agents: db.prepare("SELECT * FROM agents ORDER BY name").all(),
    agentLogs: db.prepare("SELECT * FROM agent_logs ORDER BY timestamp DESC").all(),
    activityLogs: db.prepare("SELECT * FROM activity_logs ORDER BY timestamp DESC").all(),
    assetHistoryDaily: db.prepare("SELECT * FROM asset_history_daily ORDER BY assetId, tradeDate").all(),
    assetHistoryIntraday: db.prepare("SELECT * FROM asset_history_intraday ORDER BY assetId, ts").all(),
    fxHistory: db.prepare("SELECT * FROM fx_history ORDER BY currency, ts").all(),
  };
  const exportsDir = path.join(process.cwd(), "data", "exports");
  fs.mkdirSync(exportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(exportsDir, `simstock-export-${stamp}.json`);
  const logPath = path.join(exportsDir, `simstock-export-${stamp}.log`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  const logText = [
    `exportedAt=${payload.exportedAt}`,
    `version=${payload.version}`,
    `file=${filePath}`,
    `tables=app_state,indices,trades,strategies,agents,agent_logs,activity_logs,asset_history_daily,asset_history_intraday,fx_history`,
    `counts=${JSON.stringify({
      appState: payload.appState.length,
      indices: payload.indices.length,
      trades: payload.trades.length,
      strategies: payload.strategies.length,
      agents: payload.agents.length,
      agentLogs: payload.agentLogs.length,
      activityLogs: payload.activityLogs.length,
      assetHistoryDaily: payload.assetHistoryDaily.length,
      assetHistoryIntraday: payload.assetHistoryIntraday.length,
      fxHistory: payload.fxHistory.length,
    })}`,
  ].join("\n");
  fs.writeFileSync(logPath, logText, "utf8");
  insertActivityLog({
    category: "system",
    action: "export",
    entityType: "dataset",
    entityId: filePath,
    status: "success",
    message: "Exportacao completa do sistema concluida.",
    details: JSON.stringify({ filePath, logPath }),
  });
  return { filePath, logPath, payload };
}

export function importSystemData(payload: {
  appState?: Array<{ key: string; value: string }>;
  indices?: Array<{ id: string; payload: string }>;
  trades?: Array<Record<string, unknown>>;
  strategies?: Array<Record<string, unknown>>;
  agents?: Array<Record<string, unknown>>;
  agentLogs?: Array<Record<string, unknown>>;
  activityLogs?: Array<Record<string, unknown>>;
  assetHistoryDaily?: Array<Record<string, unknown>>;
  assetHistoryIntraday?: Array<Record<string, unknown>>;
  fxHistory?: Array<Record<string, unknown>>;
}) {
  assertSuperuser("Backoffice import");
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM app_state").run();
    db.prepare("DELETE FROM indices").run();
    db.prepare("DELETE FROM trades").run();
    db.prepare("DELETE FROM strategies").run();
    db.prepare("DELETE FROM agents").run();
    db.prepare("DELETE FROM agent_logs").run();
    db.prepare("DELETE FROM activity_logs").run();
    db.prepare("DELETE FROM asset_history_daily").run();
    db.prepare("DELETE FROM asset_history_intraday").run();
    db.prepare("DELETE FROM fx_history").run();

    for (const row of payload.appState ?? []) {
      db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run(row.key, row.value);
    }
    for (const row of payload.indices ?? []) {
      db.prepare("INSERT INTO indices (id, payload) VALUES (?, ?)").run(row.id, row.payload);
    }
    for (const row of payload.trades ?? []) {
      db.prepare(`
        INSERT INTO trades (id, side, indexId, etfTicker, indexName, units, unitPriceUsd, grossEur, feeEur, totalEur, fxRateEurUsd, fxRateUsdEur, timestamp, source, strategyName, unitLimitUsd, validUntil)
        VALUES (@id, @side, @indexId, @etfTicker, @indexName, @units, @unitPriceUsd, @grossEur, @feeEur, @totalEur, @fxRateEurUsd, @fxRateUsdEur, @timestamp, @source, @strategyName, @unitLimitUsd, @validUntil)
      `).run(row);
    }
    for (const row of payload.strategies ?? []) {
      db.prepare(`
        INSERT INTO strategies (id, name, budgetEur, riskLevel, active, source, buyCriteria, sellCriteria, strategyBrief)
        VALUES (@id, @name, @budgetEur, @riskLevel, @active, @source, @buyCriteria, @sellCriteria, @strategyBrief)
      `).run({ source: "manual", ...row });
    }
    for (const row of payload.agents ?? []) {
      db.prepare(`
        INSERT INTO agents (id, name, strategyId, budgetEur, status, tradesToday)
        VALUES (@id, @name, @strategyId, @budgetEur, @status, @tradesToday)
      `).run(row);
    }
    for (const row of payload.agentLogs ?? []) {
      db.prepare(`
        INSERT INTO agent_logs (id, agentId, strategyName, action, etfTicker, explanation, confidence, timestamp)
        VALUES (@id, @agentId, @strategyName, @action, @etfTicker, @explanation, @confidence, @timestamp)
      `).run(row);
    }
    for (const row of payload.activityLogs ?? []) {
      db.prepare(`
        INSERT INTO activity_logs (id, category, action, entityType, entityId, status, message, details, timestamp)
        VALUES (@id, @category, @action, @entityType, @entityId, @status, @message, @details, @timestamp)
      `).run(row);
    }
    for (const row of payload.assetHistoryDaily ?? []) {
      db.prepare(`
        INSERT INTO asset_history_daily (assetId, tradeDate, open, high, low, close, volume, source)
        VALUES (@assetId, @tradeDate, @open, @high, @low, @close, @volume, @source)
      `).run(row);
    }
    for (const row of payload.assetHistoryIntraday ?? []) {
      db.prepare(`
        INSERT INTO asset_history_intraday (assetId, ts, open, high, low, close, volume, source)
        VALUES (@assetId, @ts, @open, @high, @low, @close, @volume, @source)
      `).run(row);
    }
    for (const row of payload.fxHistory ?? []) {
      db.prepare(`
        INSERT INTO fx_history (currency, ts, spot, source)
        VALUES (@currency, @ts, @spot, @source)
      `).run(row);
    }
  });
  tx();
  insertActivityLog({
    category: "system",
    action: "import",
    entityType: "dataset",
    entityId: "all",
    status: "success",
    message: "Importacao completa do sistema concluida.",
  });
  return getDashboardState();
}

export function importSystemDataFromFile(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  const raw = fs.readFileSync(resolvedPath, "utf8");
  const payload = JSON.parse(raw) as {
    appState?: Array<{ key: string; value: string }>;
    indices?: Array<{ id: string; payload: string }>;
    trades?: Array<Record<string, unknown>>;
    strategies?: Array<Record<string, unknown>>;
    agents?: Array<Record<string, unknown>>;
    agentLogs?: Array<Record<string, unknown>>;
    activityLogs?: Array<Record<string, unknown>>;
    assetHistoryDaily?: Array<Record<string, unknown>>;
    assetHistoryIntraday?: Array<Record<string, unknown>>;
    fxHistory?: Array<Record<string, unknown>>;
    payload?: {
      appState?: Array<{ key: string; value: string }>;
      indices?: Array<{ id: string; payload: string }>;
      trades?: Array<Record<string, unknown>>;
      strategies?: Array<Record<string, unknown>>;
      agents?: Array<Record<string, unknown>>;
      agentLogs?: Array<Record<string, unknown>>;
      activityLogs?: Array<Record<string, unknown>>;
      assetHistoryDaily?: Array<Record<string, unknown>>;
      assetHistoryIntraday?: Array<Record<string, unknown>>;
      fxHistory?: Array<Record<string, unknown>>;
    };
  };
  return importSystemData(payload.payload ?? payload);
}

export async function runSignalEngine() {
  assertSuperuser("Signal engine");
  insertActivityLog({
    category: "signals",
    action: "refresh",
    entityType: "signal_engine",
    entityId: "signal_snapshot",
    status: "started",
    message: "Atualizacao de sinais iniciada.",
  });

  const indices = listIndices();
  const alternativeAssets = getAlternativeAssets();
  const settings = getSettings<AppSettings>();
  getDb().prepare("UPDATE app_state SET value = ? WHERE key = ?").run(
    JSON.stringify({
      lastRunAt: null,
      status: "idle",
      signals: [],
      signalStates: [],
      relations: [],
      promptPreview: buildSignalRefreshPrompt(indices, alternativeAssets, settings),
    }),
    "signal_snapshot",
  );

  try {
    const snapshot = await buildSignalInsightsWithLlm(indices, alternativeAssets, settings);
    getDb().prepare("UPDATE app_state SET value = ? WHERE key = ?").run(
      JSON.stringify(snapshot),
      "signal_snapshot",
    );
    insertActivityLog({
      category: "signals",
      action: "refresh",
      entityType: "signal_engine",
      entityId: "signal_snapshot",
      status: "success",
      message: "Sinais e insights atualizados com sucesso.",
      details: JSON.stringify({
        lastRunAt: snapshot.lastRunAt,
        signals: snapshot.signals.length,
      }),
    });
  } catch (error) {
    const fallback = buildFallbackSignalInsights(indices, alternativeAssets, settings);
    getDb().prepare("UPDATE app_state SET value = ? WHERE key = ?").run(
      JSON.stringify({
        ...fallback,
        status: "success",
        lastRunAt: new Date().toLocaleString("pt-PT"),
      }),
      "signal_snapshot",
    );
    insertActivityLog({
      category: "signals",
      action: "refresh",
      entityType: "signal_engine",
      entityId: "signal_snapshot",
      status: "success",
      message: "Sinais atualizados com fallback local.",
      details: error instanceof Error ? error.message : "Falha ao atualizar sinais com LLM; fallback local aplicado.",
    });
  }

  return getDashboardState();
}

export function clearSignals() {
  assertSuperuser("Signal engine");
  getDb().prepare("UPDATE app_state SET value = ? WHERE key = ?").run(
    JSON.stringify({
      lastRunAt: null,
      status: "idle",
      signals: [],
      signalStates: [],
      relations: [],
      promptPreview: null,
    }),
    "signal_snapshot",
  );
  insertActivityLog({
    category: "signals",
    action: "clear",
    entityType: "signal_engine",
    entityId: "signal_snapshot",
    status: "success",
    message: "Signals removidos do dashboard.",
  });
  return getDashboardState();
}

export async function testLlmProfile(profileId: string, prompt: string) {
  assertSuperuser("LLM testing");
  const settings = getSettings<AppSettings>();
  const profile =
    settings.llmProfiles.find((item) => item.id === profileId) ??
    settings.llmProfiles[0] ??
    settings.llm;
  const resolvedApiKey = resolveLlmApiKey(profile);
  const endpoint = profile.endpoint.replace(/\/$/, "");
  const providerName = (profile.provider ?? "").toLowerCase();
  const isClaude = providerName.includes("claude") || endpoint.includes("anthropic");
  const isOllama = providerName.includes("ollama") || endpoint.includes("11434");
  const probeUrl = isClaude
    ? (endpoint.endsWith("/v1") ? `${endpoint}/messages` : `${endpoint}/v1/messages`)
    : (endpoint.endsWith("/v1") ? `${endpoint}/chat/completions` : `${endpoint}/v1/chat/completions`);
  const logs: string[] = [
    `user> ${prompt}`,
    `system> probing ${probeUrl}`,
  ];

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isClaude && resolvedApiKey) {
      headers["x-api-key"] = resolvedApiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else if (resolvedApiKey) {
      headers.Authorization = `Bearer ${resolvedApiKey}`;
    }
    const activeModel = isOllama
      ? await resolveOllamaModel(endpoint, profile.model)
      : isClaude && profile.model === "claude-3-5-sonnet-latest"
        ? "claude-sonnet-4-6"
        : profile.model;
    logs.push(`system> model ${activeModel}`);
    const body = isClaude
      ? JSON.stringify({
          model: activeModel,
          max_tokens: 32,
          messages: [{ role: "user", content: prompt }],
        })
      : JSON.stringify({
          model: activeModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 32,
        });
    const response = await fetch(probeUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(4000),
    });
    logs.push(`network> status ${response.status}`);
    if (!response.ok) {
      const errorBody = (await safeReadJson(response)) as
        | { error?: { message?: string } | string; message?: string }
        | null;
      const nestedError =
        typeof errorBody?.error === "string"
          ? errorBody.error
          : errorBody?.error?.message;
      const errorMessage = String(
        nestedError ??
          errorBody?.message ??
          errorBody?.error ??
          `Provider respondeu com erro HTTP ${response.status}.`,
      );
      logs.push(`error> ${errorMessage}`);
      insertActivityLog({
        category: "llm",
        action: "test",
        entityType: "llm_profile",
        entityId: profile.id ?? "unknown",
        status: "error",
        message: errorMessage,
        details: JSON.stringify(logs),
      });
      return {
        profileId: profile.id ?? "unknown",
        prompt,
        reply: null,
        error: errorMessage,
        logs,
        active: (profile.id ?? "") === settings.activeLlmId,
        provider: profile.provider,
        model: activeModel,
      };
    }

    const successBody = (await safeReadJson(response)) as
      | {
          choices?: Array<{ message?: { content?: string } }>;
          content?: Array<{ text?: string }>;
          message?: { content?: string } | string;
        }
      | null;
    const directMessage =
      typeof successBody?.message === "string"
        ? successBody.message
        : successBody?.message?.content;
    const reply = String(
      successBody?.choices?.[0]?.message?.content ??
        successBody?.content?.map((item: { text?: string }) => item.text ?? "").join("") ??
        directMessage ??
        `Teste OK: ${profile.name ?? activeModel} esta acessivel e pronto para dialogo.`,
    );
    logs.push(`assistant> ${reply}`);
    insertActivityLog({
      category: "llm",
      action: "test",
      entityType: "llm_profile",
      entityId: profile.id ?? "unknown",
      status: "success",
      message: `Teste de dialogo concluido para ${profile.name ?? profile.model}.`,
      details: JSON.stringify(logs),
    });
    return {
      profileId: profile.id ?? "unknown",
      prompt,
      reply,
      error: null,
      logs,
      active: (profile.id ?? "") === settings.activeLlmId,
      provider: profile.provider,
      model: activeModel,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Falha desconhecida ao contactar o provider.";
    logs.push(`error> ${errorMessage}`);
    insertActivityLog({
      category: "llm",
      action: "test",
      entityType: "llm_profile",
      entityId: profile.id ?? "unknown",
      status: "error",
      message: errorMessage,
      details: JSON.stringify(logs),
    });
    return {
      profileId: profile.id ?? "unknown",
      prompt,
      reply: null,
      error: errorMessage,
      logs,
      active: (profile.id ?? "") === settings.activeLlmId,
      provider: profile.provider,
      model: profile.model,
    };
  }
}

export function createStrategy(input: {
  name: string;
  buyCriteria: string;
  sellCriteria: string;
  strategyBrief: string;
  source?: "manual" | "generated";
}) {
  assertSuperuser("Strategies");
  const db = getDb();
  ensureStrategyNameAvailable(input.name);
  const strategy = {
    id: randomUUID(),
    budgetEur: 0,
    riskLevel: "N/A",
    active: 1,
    source: input.source ?? "manual",
    ...input,
  };
  db.prepare(`
    INSERT INTO strategies (id, name, budgetEur, riskLevel, active, source, buyCriteria, sellCriteria, strategyBrief)
    VALUES (@id, @name, @budgetEur, @riskLevel, @active, @source, @buyCriteria, @sellCriteria, @strategyBrief)
  `).run(strategy);
  insertActivityLog({
    category: "strategies",
    action: "create",
    entityType: "strategy",
    entityId: strategy.id,
    status: "success",
    message: `Estrategia ${strategy.name} criada.`,
  });
  return listStrategies();
}

export function updateStrategy(id: string, input: Partial<Omit<StrategyRecord, "id">>) {
  assertSuperuser("Strategies");
  const current = listStrategies().find((strategy) => strategy.id === id);
  if (!current) {
    throw new Error("Strategy not found");
  }
  const next = { ...current, ...input };
  next.budgetEur = current.budgetEur ?? 0;
  ensureStrategyNameAvailable(next.name, id);
  getDb().prepare(`
    UPDATE strategies
    SET name = @name, budgetEur = @budgetEur, riskLevel = @riskLevel, active = @active, source = @source, buyCriteria = @buyCriteria,
        sellCriteria = @sellCriteria, strategyBrief = @strategyBrief
    WHERE id = @id
  `).run(next);
  insertActivityLog({
    category: "strategies",
    action: "update",
    entityType: "strategy",
    entityId: id,
    status: "success",
    message: `Estrategia ${next.name} atualizada.`,
  });
  return listStrategies();
}

export function copyStrategy(id: string) {
  assertSuperuser("Strategies");
  const current = listStrategies().find((strategy) => strategy.id === id);
  if (!current) {
    throw new Error("Strategy not found");
  }
  const copiedName = buildUniqueStrategyCopyName(current.name);
  const result = createStrategy({
    name: copiedName,
    buyCriteria: current.buyCriteria,
    sellCriteria: current.sellCriteria,
    strategyBrief: current.strategyBrief,
    source: current.source ?? "manual",
  });
  insertActivityLog({
    category: "strategies",
    action: "copy",
    entityType: "strategy",
    entityId: id,
    status: "success",
    message: `Estrategia copiada para ${copiedName}.`,
  });
  return result;
}

export async function generateStrategyIdeas(input?: { nameHint?: string }) {
  assertSuperuser("Strategies");
  const settings = getSettings<AppSettings>();
  const indices = listIndices();
  const alternatives = getAlternativeAssets();
  const prompt = [
    "Gera 3 estrategias de trading poderosas para a app SimStock e responde apenas com JSON valido.",
    "Cada estrategia deve preencher: name, buyCriteria, sellCriteria, strategyBrief.",
    "As estrategias devem ser praticas, auditaveis, claras para um agente e adaptadas a um portfolio em EUR que compra ETFs de stock items.",
    "Hints importantes:",
    "- considerar fees por transacao, FX EUR para moeda do stock item, sinais buy/hold/sell, status de mercado, momentum, YTD, daily change, commodities e exposicao geografica",
    "- buyCriteria deve explicar gatilhos de entrada, confirmacoes, filtros de risco e tamanho de ordem",
    "- sellCriteria deve explicar take profit, stop, degradacao de sinal e protecao de capital",
    "- strategyBrief deve resumir edge, universo, horizonte e situacoes em que NAO deve operar",
    "- evitar nomes genericos e devolver nomes distintos",
    input?.nameHint ? `Name hint do utilizador: ${input.nameHint}` : "Nao existe name hint obrigatorio.",
    `Fee por trade: ${settings.feePerTrade} EUR`,
    `FX spots: ${JSON.stringify(settings.currencySpots)}`,
    `Signal sources: ${settings.signalSources.join(" | ")}`,
    `Signal relations: ${settings.signalRelations.join(" | ")}`,
    `Stock items: ${JSON.stringify(indices.map((index) => ({ name: index.name, region: index.region, currency: index.currency, etfTicker: index.etfTicker, changePct: index.changePct, ytd: index.ytd })))}`,
    `Alternatives: ${JSON.stringify(alternatives.map((asset) => ({ name: asset.name, currency: asset.currency, changePct: asset.changePct, ytd: asset.ytd })))}`,
    `Existing strategies: ${JSON.stringify(listStrategies().map((strategy) => ({ name: strategy.name, source: strategy.source ?? "manual" })))}`,
    'Formato: {"strategies":[{"name":"","buyCriteria":"","sellCriteria":"","strategyBrief":""}]}',
  ].join("\n");

  let activeProfile = resolveLlmProfile(settings, "strategy_generation").profile;
  try {
    let parsed: { strategies?: GeneratedStrategySuggestion[] } | null = null;
    let lastError: unknown = null;
    for (const profile of resolveLlmCandidateProfiles(settings)) {
      try {
        const endpoint = profile.endpoint.replace(/\/$/, "");
        const providerName = (profile.provider ?? "").toLowerCase();
        const isClaude = providerName.includes("claude") || endpoint.includes("anthropic");
        const isOllama = providerName.includes("ollama") || endpoint.includes("11434");
        const url = isClaude
          ? (endpoint.endsWith("/v1") ? `${endpoint}/messages` : `${endpoint}/v1/messages`)
          : (endpoint.endsWith("/v1") ? `${endpoint}/chat/completions` : `${endpoint}/v1/chat/completions`);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (isClaude && profile.apiKey) {
          headers["x-api-key"] = profile.apiKey;
          headers["anthropic-version"] = "2023-06-01";
        } else if (profile.apiKey) {
          headers.Authorization = `Bearer ${profile.apiKey}`;
        }
        const activeModel = isOllama ? await resolveOllamaModel(endpoint, profile.model) : profile.model;
        const body = isClaude
          ? { model: activeModel, max_tokens: 1200, messages: [{ role: "user", content: prompt }] }
          : {
              model: activeModel,
              messages: [
                { role: "system", content: "Responde apenas com JSON valido." },
                { role: "user", content: prompt },
              ],
              max_tokens: 1200,
              ...(isOllama ? {} : { response_format: { type: "json_object" } }),
            };
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) {
          throw new Error(`LLM strategy generation falhou com HTTP ${response.status}.`);
        }
        const payload = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          content?: Array<{ text?: string }>;
        };
        const rawText = isClaude
          ? payload.content?.map((item) => item.text ?? "").join("") ?? ""
          : payload.choices?.[0]?.message?.content ?? "";
        parsed = JSON.parse(extractJsonBlock(rawText)) as { strategies?: GeneratedStrategySuggestion[] };
        activeProfile = profile;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!parsed) {
      throw (lastError instanceof Error ? lastError : new Error("No LLM candidate succeeded"));
    }
    const suggestions = (parsed.strategies ?? [])
      .slice(0, 3)
      .map((strategy, index) => ({
        name: strategy.name?.trim() || `Generated Strategy ${index + 1}`,
        buyCriteria: strategy.buyCriteria?.trim() || "Comprar apenas com confirmação positiva multi-sinal.",
        sellCriteria: strategy.sellCriteria?.trim() || "Vender quando sinal, price action e risco se deterioram.",
        strategyBrief: strategy.strategyBrief?.trim() || "Estratégia gerada pelo LLM para SimStock.",
        source: "generated" as const,
      }))
      .filter((strategy) => strategy.name && strategy.buyCriteria && strategy.sellCriteria && strategy.strategyBrief);
    insertActivityLog({
      category: "strategies",
      action: "generate",
      entityType: "strategy_ideas",
      entityId: activeProfile.id ?? "active-llm",
      status: "success",
      message: `LLM gerou ${suggestions.length} sugestoes de estrategia.`,
      details: JSON.stringify({ provider: activeProfile.provider, model: activeProfile.model, nameHint: input?.nameHint ?? "" }),
    });
    return suggestions.length ? suggestions : buildFallbackStrategyIdeas(input?.nameHint);
  } catch (error) {
    const suggestions = buildFallbackStrategyIdeas(input?.nameHint);
    insertActivityLog({
      category: "strategies",
      action: "generate",
      entityType: "strategy_ideas",
      entityId: activeProfile.id ?? "active-llm",
      status: "error",
      message: error instanceof Error ? error.message : "Falha a gerar estrategias por LLM.",
      details: JSON.stringify({ fallback: true, suggestions: suggestions.length }),
    });
    return suggestions;
  }
}

export async function generateSignalFields() {
  assertSuperuser("Signals");
  const settings = getSettings<AppSettings>();
  const indices = listIndices();
  const alternatives = getAlternativeAssets();
  const activeProfile = resolveLlmProfile(settings, "signals", { strict: true }).profile;
  const endpoint = activeProfile.endpoint.replace(/\/$/, "");
  const providerName = (activeProfile.provider ?? "").toLowerCase();
  const isClaude = providerName.includes("claude") || endpoint.includes("anthropic");
  const isOllama = providerName.includes("ollama") || endpoint.includes("11434");
  const url = isClaude
    ? (endpoint.endsWith("/v1") ? `${endpoint}/messages` : `${endpoint}/v1/messages`)
    : (endpoint.endsWith("/v1") ? `${endpoint}/chat/completions` : `${endpoint}/v1/chat/completions`);
  const prompt = [
    "Gera os tres campos de configuracao do signal engine para a app SimStock e responde apenas com JSON valido.",
    "Intencao de signalSources: listar fontes curtas, praticas e observaveis que o motor de sinais deve considerar.",
    "Intencao de signalRelations: listar relacoes causais ou contextuais entre fontes e mercado que possam originar sinais.",
    "Intencao de signalOutput: descrever em texto curto o tipo de output esperado do motor, incluindo insights curtos e propostas buy, sell ou hold.",
    "Cada fonte ou relacao deve ser objetiva e pronta para uso em prompt.",
    "Nao repetir frases quase iguais e evitar texto genérico.",
    `Stock items: ${JSON.stringify(settings.marketDataSources.map((source) => ({ assetId: source.assetId, label: source.label, group: source.group, display: source.display, symbol: source.symbol })))}`,
    `Indices live snapshot: ${JSON.stringify(indices.map((index) => ({ name: index.name, region: index.region, currency: index.currency, changePct: index.changePct, ytd: index.ytd, etfTicker: index.etfTicker })))}`,
    `Alternative assets: ${JSON.stringify(alternatives.map((asset) => ({ name: asset.name, market: asset.market, currency: asset.currency, changePct: asset.changePct, ytd: asset.ytd })))}`,
    `Current signal sources: ${JSON.stringify(settings.signalSources)}`,
    `Current signal relations: ${JSON.stringify(settings.signalRelations)}`,
    `Current signal output: ${JSON.stringify(settings.signalOutput ?? "")}`,
    'Formato JSON: {"signalSources":[""],"signalRelations":[""],"signalOutput":""}',
  ].join("\n");
  const logs = [
    `provider> ${labelLlmProfile(activeProfile)}`,
    "intent> generate signalSources, signalRelations and signalOutput",
  ];
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isClaude && activeProfile.apiKey) {
      headers["x-api-key"] = activeProfile.apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else if (activeProfile.apiKey) {
      headers.Authorization = `Bearer ${activeProfile.apiKey}`;
    }
    const activeModel = isOllama ? await resolveOllamaModel(endpoint, activeProfile.model) : activeProfile.model;
    logs.push(`model> ${activeModel}`);
    const body = isClaude
      ? { model: activeModel, max_tokens: 900, messages: [{ role: "user", content: prompt }] }
      : {
          model: activeModel,
          messages: [
            { role: "system", content: "Responde apenas com JSON valido." },
            { role: "user", content: prompt },
          ],
          max_tokens: 900,
          ...(isOllama ? {} : { response_format: { type: "json_object" } }),
        };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    logs.push(`network> ${response.status}`);
    if (!response.ok) {
      throw new Error(`Signal field generation failed with HTTP ${response.status}.`);
    }
    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      content?: Array<{ text?: string }>;
    };
    const rawText = isClaude
      ? payload.content?.map((item) => item.text ?? "").join("") ?? ""
      : payload.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(extractJsonBlock(rawText)) as {
      signalSources?: string[];
      signalRelations?: string[];
      signalOutput?: string;
    };
    const result = {
      signalSources: (parsed.signalSources ?? []).map((item) => String(item).trim()).filter(Boolean).slice(0, 8),
      signalRelations: (parsed.signalRelations ?? []).map((item) => String(item).trim()).filter(Boolean).slice(0, 8),
      signalOutput: String(parsed.signalOutput ?? "").trim(),
      logs: [...logs, "assistant> signal fields generated"],
    } satisfies GeneratedSignalFields;
    insertActivityLog({
      category: "signals",
      action: "generate_fields",
      entityType: "signal_settings",
      entityId: activeProfile.id ?? "active-llm",
      status: "success",
      message: "Campos de signals gerados com LLM.",
      details: JSON.stringify(result.logs),
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signal field generation failed.";
    const errorLogs = [...logs, `error> ${message}`];
    insertActivityLog({
      category: "signals",
      action: "generate_fields",
      entityType: "signal_settings",
      entityId: activeProfile.id ?? "active-llm",
      status: "error",
      message,
      details: JSON.stringify(errorLogs),
    });
    throw new Error(message);
  }
}

export function setStrategyActive(id: string, active: boolean) {
  assertSuperuser("Strategies");
  getDb().prepare("UPDATE strategies SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
  insertActivityLog({
    category: "strategies",
    action: active ? "activate" : "disable",
    entityType: "strategy",
    entityId: id,
    status: "success",
    message: `Estrategia ${active ? "ativada" : "desativada"}.`,
  });
  return listStrategies();
}

export function deleteStrategy(id: string) {
  assertSuperuser("Strategies");
  getDb().prepare("DELETE FROM strategies WHERE id = ?").run(id);
  insertActivityLog({
    category: "strategies",
    action: "delete",
    entityType: "strategy",
    entityId: id,
    status: "success",
    message: "Estrategia removida.",
  });
  return listStrategies();
}

export function createAgent(input: { name: string; strategyId: string; budgetEur: number; executionMode: string; executionHours?: number }) {
  assertSuperuser("Agent config");
  const strategy = listStrategies().find((item) => item.id === input.strategyId);
  if (!strategy) {
    throw new Error("Strategy not found");
  }
  if (!(input.name ?? "").trim()) {
    throw new Error("Agent name is required");
  }
  if (!(Number(input.budgetEur) > 0)) {
    throw new Error("Agent budget must be greater than zero");
  }
  const agentId = randomUUID();
  getDb().prepare(`
    INSERT INTO agents (id, name, strategyId, budgetEur, executionMode, executionHours, status, tradesToday, loopCount, currentStep)
    VALUES (@id, @name, @strategyId, @budgetEur, @executionMode, @executionHours, @status, @tradesToday, @loopCount, @currentStep)
  `).run({
    id: agentId,
    name: input.name.trim(),
    strategyId: input.strategyId,
    budgetEur: Number(input.budgetEur),
    executionMode: input.executionMode || "market_open",
    executionHours: Number(input.executionHours ?? 6),
    status: "paused",
    tradesToday: 0,
    loopCount: 0,
    currentStep: "idle",
  });
  insertAgentLog({
    agentId,
    strategyName: strategy.name,
    action: "start",
    etfTicker: null,
    explanation: `Agente ${input.name} criado para a estrategia ${strategy.name} e pronto para ser iniciado.`,
    confidence: 100,
  });
  insertActivityLog({
    category: "agents",
    action: "create",
    entityType: "agent",
    entityId: agentId,
    status: "success",
    message: `Agente ${input.name.trim()} criado.`,
    details: JSON.stringify({ strategyId: input.strategyId, budgetEur: Number(input.budgetEur), executionMode: input.executionMode, executionHours: Number(input.executionHours ?? 6) }),
  });
  return listAgents();
}

export async function controlAgent(id: string, action: "start" | "pause" | "cancel") {
  assertSuperuser("Agent control");
  const nextStatus = action === "start" ? "running" : action === "pause" ? "paused" : "cancelled";
  getDb().prepare("UPDATE agents SET status = ?, currentStep = ? WHERE id = ?").run(
    nextStatus,
    action === "start" ? "starting" : action === "pause" ? "paused_by_user" : "cancelled_by_user",
    id,
  );
  const agent = listAgents().find((item) => item.id === id);
  if (agent) {
    const strategyName =
      listStrategies().find((strategy) => strategy.id === agent.strategyId)?.name ?? agent.strategyId;
    insertAgentLog({
      agentId: id,
      strategyName,
      action,
      etfTicker: null,
      explanation:
        action === "start"
          ? `Agente ${agent.name} iniciado com a estrategia ${strategyName}.`
          : action === "pause"
            ? `Agente ${agent.name} pausado pelo utilizador.`
            : `Agente ${agent.name} cancelado pelo utilizador.`,
      confidence: 100,
    });
    if (action === "start") {
      try {
        await runAgentCycle(id);
      } catch (error) {
        getDb().prepare("UPDATE agents SET status = ?, currentStep = ? WHERE id = ?").run("paused", "error", id);
        insertAgentLog({
          agentId: id,
          strategyName,
          action: "hold",
          etfTicker: null,
          explanation: `Falha no ciclo do agente: ${error instanceof Error ? error.message : "erro desconhecido"}.`,
          confidence: 0,
        });
      }
    } else if (action === "pause" || action === "cancel") {
      clearAgentTradeShortlistForAgent(id);
    }
    insertActivityLog({
      category: "agents",
      action,
      entityType: "agent",
      entityId: id,
      status: "success",
      message: `Agente ${agent.name} ${action === "start" ? "iniciado" : action === "pause" ? "parado" : "cancelado"}.`,
    });
  }
  return getDashboardState();
}

export async function approveAgentTradeProposal(agentId: string, proposalId: string) {
  assertSuperuser("Agent control");
  updateAgentRuntime(agentId, { currentStep: "executing_trade" });
  const shortlist = getAppStateValue<AgentTradeShortlist>("agent_trade_shortlist", {
    generatedAt: null,
    promptPreview: "",
    proposals: [],
  });
  const proposal = shortlist.proposals.find((item) => item.id === proposalId && item.agentId === agentId && item.status === "pending");
  const agent = listAgents().find((item) => item.id === agentId);
  if (!proposal || !agent) {
    throw new Error("Agent proposal not found");
  }
  const index = listIndices().find((item) => item.id === proposal.indexId);
  const settings = getSettings<AppSettings>();
  const amountValue =
    proposal.action === "sell" && index
      ? proposal.amountEur * getEurToCurrencySpot(index.currency, settings)
      : proposal.amountEur;
  createTrade({
    side: proposal.action === "sell" ? "SELL" : "BUY",
    indexId: proposal.indexId,
    amountValue,
    amountMode: proposal.action === "sell" ? "LOCAL" : "EUR",
    unitLimitUsd: null,
    validUntil: "Day · ate ao fecho",
    source: "agent",
    strategyName: proposal.strategyName,
  });
  setAppStateValue("agent_trade_shortlist", {
    ...shortlist,
    proposals: shortlist.proposals.map((item) =>
      item.id === proposalId ? { ...item, status: "approved" as const } : item,
    ).filter((item) => item.status === "pending"),
  });
  insertAgentLog({
    agentId,
    strategyName: proposal.strategyName,
    action: proposal.action,
    etfTicker: proposal.etfTicker,
    explanation: `Trade aprovada e executada: ${proposal.action.toUpperCase()} ${proposal.etfTicker} por ${formatCurrencyValue(proposal.amountEur)}. Conviccao ${proposal.conviction.toFixed(0)}%. ${proposal.whyNow}`,
    confidence: proposal.conviction,
  });
  await runAgentCycle(agentId);
  return getDashboardState();
}

export async function rejectAgentTradeProposal(agentId: string, proposalId: string) {
  assertSuperuser("Agent control");
  updateAgentRuntime(agentId, { currentStep: "human_rejected_trade" });
  const shortlist = getAppStateValue<AgentTradeShortlist>("agent_trade_shortlist", {
    generatedAt: null,
    promptPreview: "",
    proposals: [],
  });
  const proposal = shortlist.proposals.find((item) => item.id === proposalId && item.agentId === agentId && item.status === "pending");
  if (!proposal) {
    throw new Error("Agent proposal not found");
  }
  setAppStateValue("agent_trade_shortlist", {
    ...shortlist,
    proposals: shortlist.proposals.map((item) =>
      item.id === proposalId ? { ...item, status: "rejected" as const } : item,
    ).filter((item) => item.status === "pending"),
  });
  insertAgentLog({
    agentId,
    strategyName: proposal.strategyName,
    action: "hold",
    etfTicker: proposal.etfTicker,
    explanation: `Trade rejeitada pelo utilizador: ${proposal.action.toUpperCase()} ${proposal.etfTicker}. O agente volta a analisar sinais, noticias e timing.`,
    confidence: proposal.conviction,
  });
  await runAgentCycle(agentId);
  return getDashboardState();
}

export function deleteAgent(id: string) {
  assertSuperuser("Agent config");
  getDb().prepare("DELETE FROM agents WHERE id = ?").run(id);
  insertActivityLog({
    category: "agents",
    action: "delete",
    entityType: "agent",
    entityId: id,
    status: "success",
    message: "Agente apagado.",
  });
  return listAgents();
}

export function pruneInactiveAgentLogs() {
  assertSuperuser("Agent config");
  const db = getDb();
  db.prepare(`
    DELETE FROM agent_logs
    WHERE agentId IN (SELECT id FROM agents WHERE status != 'running')
       OR agentId NOT IN (SELECT id FROM agents)
  `).run();
  insertActivityLog({
    category: "agents",
    action: "prune_logs",
    entityType: "agent_logs",
    entityId: "inactive",
    status: "success",
    message: "Logs de agentes parados, cancelados ou apagados removidos.",
  });
  return getDashboardState();
}

async function runAgentCycle(agentId: string) {
  const agent = listAgents().find((item) => item.id === agentId);
  if (!agent || agent.status !== "running") {
    return;
  }
  updateAgentRuntime(agentId, {
    loopIncrement: 1,
    currentStep: "loading_strategy",
  });
  const settings = getSettings<AppSettings>();
  const strategy = listStrategies().find((item) => item.id === agent.strategyId);
  if (!strategy) {
    throw new Error("Agent strategy not found");
  }
  updateAgentRuntime(agentId, { currentStep: "reading_signals" });
  const signalSnapshot = getSignalSnapshot<SignalSnapshot>();
  if (signalSnapshot.status === "idle") {
    await runSignalEngine();
  }
  const nextSignalSnapshot = getSignalSnapshot<SignalSnapshot>();
  updateAgentRuntime(agentId, { currentStep: "screening_market" });
  const indices = listIndices();
  const positions = computePositions(indices, listTrades());
  const wallet = getWallet();
  const tradableIndices = indices.filter((index) => {
    if (settings.agent.requireMarketOpen && !isMarketOpenForSettings(index.region, settings)) {
      return false;
    }
    if (settings.agent.avoidRegions.includes(index.region)) {
      return false;
    }
    if (settings.agent.avoidStockItems.includes(index.id) || settings.agent.avoidStockItems.includes(index.name)) {
      return false;
    }
    return true;
  });
  updateAgentRuntime(agentId, { currentStep: "collecting_news" });
  const newsByAsset = await fetchNewsForStockItems(tradableIndices);
  insertAgentLog({
    agentId,
    strategyName: strategy.name,
    action: "hold",
    etfTicker: null,
    explanation: `Ciclo iniciado. ${tradableIndices.length} stock items em pracas abertas, ${nextSignalSnapshot.signals.length} sinais disponiveis e noticias recentes recolhidas.`,
    confidence: 82,
  });
  updateAgentRuntime(agentId, { currentStep: "building_shortlist" });
  const shortlist = await buildAgentShortlistWithLlm({
    agent,
    strategy,
    settings,
    tradableIndices,
    positions,
    wallet,
    signalSnapshot: nextSignalSnapshot,
    newsByAsset,
  });
  setAppStateValue("agent_trade_shortlist", shortlist);
  if (shortlist.proposals.length === 0) {
    updateAgentRuntime(agentId, { currentStep: "waiting_next_cycle" });
    insertAgentLog({
      agentId,
      strategyName: strategy.name,
      action: "hold",
      etfTicker: null,
      explanation: "Nenhuma proposta passou o limiar de conviccao ou o teste de impacto no portfolio. O agente mantem HOLD e aguarda novo ciclo.",
      confidence: settings.agent.minConvictionPct,
    });
    return;
  }
  updateAgentRuntime(agentId, { currentStep: "waiting_human_approval" });
  for (const proposal of shortlist.proposals) {
    if (!proposal) {
      continue;
    }
    insertAgentLog({
      agentId,
      strategyName: strategy.name,
      action: proposal.action,
      etfTicker: proposal.etfTicker,
      explanation: `${proposal.action.toUpperCase()} candidato ${proposal.etfTicker} com conviccao ${proposal.conviction.toFixed(0)}%. ${proposal.rationale} Agora: ${proposal.whyNow} Impacto: ${proposal.expectedPortfolioImpact}`,
      confidence: proposal.conviction,
    });
  }
}

async function buildAgentShortlistWithLlm(input: {
  agent: ReturnType<typeof listAgents>[number];
  strategy: StrategyRecord;
  settings: AppSettings;
  tradableIndices: IndexAsset[];
  positions: ReturnType<typeof computePositions>;
  wallet: ReturnType<typeof getWallet>;
  signalSnapshot: SignalSnapshot;
  newsByAsset: Record<string, string[]>;
}) {
  const { agent, strategy, settings, tradableIndices, positions, wallet, signalSnapshot, newsByAsset } = input;
  const signalStates = signalSnapshot.signalStates ?? [];
  const portfolioSummary = {
    currentBudget: wallet.currentBudget,
    investedAmount: positions.reduce((sum, item) => sum + item.marketValueEur, 0),
    openPositions: positions.map((position) => ({
      indexId: position.indexId,
      etfTicker: position.etfTicker,
      units: position.units,
      marketValueEur: position.marketValueEur,
    })),
  };
  const prompt = [
    "You are the supervised AutoTrade agent for SimStock.",
    "Use only the supplied strategy, signals, portfolio, tradable stock items and recent news.",
    "Follow OpenAI-style best practices for agents: reason step by step internally, but answer only with valid JSON.",
    "Generate a shortlist only for trades with conviction strictly above the configured threshold.",
    "A trade must explain why it is a good trade, why it can improve portfolio value, and why the moment is now.",
    "Only propose stock items whose markets are open right now.",
    "SELL is allowed only if the stock item already exists in the portfolio.",
    "BUY cannot exceed available EUR budget nor the agent budget nor maxTradeEur.",
    "If no trade meets the threshold, return an empty shortlist.",
    `Agent global mission: ${settings.agent.mission}`,
    `Primary objective: ${settings.agent.objective}`,
    `Free form influence: ${settings.agent.freeFormInfluence}`,
    `Risk profile: ${settings.agent.riskProfile}`,
    `Minimum conviction: ${settings.agent.minConvictionPct}`,
    `Max shortlist size: ${settings.agent.maxShortlist}`,
    `Require portfolio improvement: ${String(settings.agent.requirePortfolioImprovement)}`,
    `Ask if the moment is now: ${String(settings.agent.askIfMomentIsNow)}`,
    `Preferred regions: ${settings.agent.preferredRegions.join(", ") || "none"}`,
    `Avoid regions: ${settings.agent.avoidRegions.join(", ") || "none"}`,
    `Preferred stock items: ${settings.agent.preferredStockItems.join(", ") || "none"}`,
    `Avoid stock items: ${settings.agent.avoidStockItems.join(", ") || "none"}`,
    `Prioritize signals: ${settings.agent.prioritizeSignals.join(", ") || "none"}`,
    `Downweight signals: ${settings.agent.downweightSignals.join(", ") || "none"}`,
    `Strategy name: ${strategy.name}`,
    `Strategy brief: ${strategy.strategyBrief}`,
    `Buy criteria: ${strategy.buyCriteria}`,
    `Sell criteria: ${strategy.sellCriteria}`,
    `Agent budget EUR: ${agent.budgetEur}`,
    `Wallet budget EUR: ${wallet.currentBudget}`,
    `Max trade EUR: ${settings.agent.maxTradeEur}`,
    `Portfolio summary: ${JSON.stringify(portfolioSummary)}`,
    `Signal snapshot: ${JSON.stringify(signalStates)}`,
    `Tradable stock items: ${JSON.stringify(tradableIndices.map((index) => ({
      id: index.id,
      name: index.name,
      region: index.region,
      currency: index.currency,
      etfTicker: index.etfTicker,
      price: index.price,
      changePct: index.changePct,
      ytd: index.ytd,
      volumeLabel: index.volumeLabel,
      inPortfolio: positions.some((position) => position.indexId === index.id),
      news: newsByAsset[index.id] ?? [],
    })))}`,
    'Return JSON only with this shape: {"summary":"", "shortlist":[{"indexId":"","action":"buy|sell","conviction":0,"amountEur":0,"rationale":"","whyNow":"","expectedPortfolioImpact":"","risks":[""],"news":[""]}]}',
  ].join("\n");
  const parsed = await invokeActiveLlmJson<{ summary?: string; shortlist?: Array<{
    indexId: string;
    action: "buy" | "sell";
    conviction: number;
    amountEur: number;
    rationale: string;
    whyNow: string;
    expectedPortfolioImpact: string;
    risks?: string[];
    news?: string[];
  }>}>(settings, "signals", prompt, 1400);

  const maxBudget = Math.min(Number(agent.budgetEur ?? 0), wallet.currentBudget, settings.agent.maxTradeEur);
  const shortlist = ((parsed.shortlist ?? [])
    .filter((proposal) => proposal.indexId && (proposal.action === "buy" || proposal.action === "sell"))
    .map((proposal) => {
      const index = tradableIndices.find((item) => item.id === proposal.indexId);
      if (!index) {
        return null;
      }
      const position = positions.find((item) => item.indexId === proposal.indexId);
      const amountEur = Math.min(Number(proposal.amountEur), proposal.action === "buy" ? maxBudget : position?.marketValueEur ?? 0);
      return {
        id: randomUUID(),
        agentId: agent.id,
        strategyId: strategy.id,
        strategyName: strategy.name,
        indexId: index.id,
        indexName: index.name,
        etfTicker: index.etfTicker,
        action: proposal.action,
        conviction: Number(proposal.conviction),
        amountEur: Number(amountEur.toFixed(2)),
        rationale: String(proposal.rationale ?? "").trim(),
        whyNow: String(proposal.whyNow ?? "").trim(),
        expectedPortfolioImpact: String(proposal.expectedPortfolioImpact ?? "").trim(),
        risks: (proposal.risks ?? []).map((item) => String(item).trim()).filter(Boolean).slice(0, 4),
        news: (proposal.news ?? newsByAsset[index.id] ?? []).map((item) => String(item).trim()).filter(Boolean).slice(0, 3),
        status: "pending" as const,
      };
    })
    .filter(Boolean) as AgentTradeProposal[])
    .filter((proposal) => proposal.conviction > settings.agent.minConvictionPct)
    .filter((proposal) => proposal.amountEur > 0)
    .filter((proposal) => proposal.action === "buy" ? proposal.amountEur <= maxBudget : Boolean(positions.find((item) => item.indexId === proposal.indexId)))
    .slice(0, settings.agent.maxShortlist);

  return {
    generatedAt: new Date().toLocaleString("pt-PT"),
    promptPreview: prompt,
    proposals: shortlist,
  } satisfies AgentTradeShortlist;
}

function clearAgentTradeShortlistForAgent(agentId: string) {
  const shortlist = getAppStateValue<AgentTradeShortlist>("agent_trade_shortlist", {
    generatedAt: null,
    promptPreview: "",
    proposals: [],
  });
  setAppStateValue("agent_trade_shortlist", {
    ...shortlist,
    proposals: shortlist.proposals.filter((proposal) => proposal.agentId !== agentId || proposal.status !== "pending"),
  });
}

function updateAgentRuntime(
  agentId: string,
  input: {
    currentStep?: string;
    loopIncrement?: number;
  },
) {
  const current = listAgents().find((item) => item.id === agentId);
  if (!current) {
    return;
  }
  getDb().prepare("UPDATE agents SET currentStep = ?, loopCount = ? WHERE id = ?").run(
    input.currentStep ?? current.currentStep ?? "idle",
    Number(current.loopCount ?? 0) + Number(input.loopIncrement ?? 0),
    agentId,
  );
}

async function fetchNewsForStockItems(indices: IndexAsset[]) {
  const entries = await Promise.all(indices.map(async (index) => [index.id, await fetchRecentNewsForAsset(index)] as const));
  return Object.fromEntries(entries);
}

async function fetchRecentNewsForAsset(index: IndexAsset) {
  const query = encodeURIComponent(`${index.name} ${index.etfTicker} ETF`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 SimStock/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return [];
    }
    const xml = await response.text();
    const matches = Array.from(xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g))
      .map((match) => match[1]?.trim())
      .filter(Boolean)
      .filter((title) => title !== "Google News")
      .slice(0, 3);
    return matches;
  } catch {
    return [];
  }
}

function computePositions(indices: IndexAsset[], trades: TradeRecord[]) {
  const map = new Map<string, { indexId: string; etfTicker: string; units: number; averageCost: number; currentPriceUsd: number }>();

  for (const trade of trades) {
    const current = map.get(trade.indexId) ?? {
      indexId: trade.indexId,
      etfTicker: trade.etfTicker,
      units: 0,
      averageCost: trade.unitPriceUsd,
      currentPriceUsd: trade.unitPriceUsd,
    };

    if (trade.side === "BUY") {
      const nextUnits = current.units + trade.units;
      const weightedAverage =
        nextUnits > 0
          ? (current.averageCost * current.units + trade.unitPriceUsd * trade.units) / nextUnits
          : trade.unitPriceUsd;
      current.units = nextUnits;
      current.averageCost = weightedAverage;
    } else {
      current.units = Math.max(0, current.units - trade.units);
    }

    const currentIndex = indices.find((index) => index.id === trade.indexId);
    current.currentPriceUsd = currentIndex ? currentIndex.price / 10 : current.currentPriceUsd;
    map.set(trade.indexId, current);
  }

  return Array.from(map.values())
    .filter((position) => position.units > 0.0001)
    .map((position) => ({
      ...position,
      marketValueEur: Number((position.units * position.currentPriceUsd * getCurrencyToEurSpot(indices.find((item) => item.id === position.indexId)?.currency ?? "EUR", getSettings<AppSettings>())).toFixed(2)),
    }));
}

function computePortfolio(indices: IndexAsset[], currentBudget: number, trades: TradeRecord[], positions: ReturnType<typeof computePositions>) {
  const investedAmount = positions.reduce((sum, position) => sum + position.marketValueEur, 0);
  const fees = trades.reduce((sum, trade) => sum + trade.feeEur, 0);
  const totalValue = currentBudget + investedAmount;
  const performancePct = ((totalValue - getSettings<AppSettings>().defaultBudget) / getSettings<AppSettings>().defaultBudget) * 100;

  return {
    currentBudget,
    investedAmount,
    fees,
    totalValue,
    performancePct,
    openPositions: positions.map((position) => ({
      ...position,
      indexName: indices.find((item) => item.id === position.indexId)?.name ?? position.indexId,
    })),
  };
}

function buildFallbackSignalInsights(indices: IndexAsset[], alternativeAssets: ReturnType<typeof getAlternativeAssets>, settings: AppSettings): SignalSnapshot {
  const brent = alternativeAssets.find((asset) => asset.id === "brent");
  const momentumLeader = [...indices].sort((a, b) => b.changePct - a.changePct)[0];
  const laggard = [...indices].sort((a, b) => a.changePct - b.changePct)[0];
  const sourceText = settings.signalSources.slice(0, 3).join(" + ");
  const relationText = settings.signalRelations[0] ?? "Sem relacao configurada.";

  const generatedSignals: SignalInsight[] = [
    {
      id: "signal-momentum",
      assetId: momentumLeader.id,
      title: `${momentumLeader.name} lidera momentum`,
      summary: `${sourceText} indicam tracao positiva em ${momentumLeader.etfTicker}.`,
      actionBias: momentumLeader.changePct > 1 ? "buy" : "hold",
      confidence: Math.min(93, 60 + momentumLeader.changePct * 12),
      driver: relationText,
      source: "Fallback engine",
    },
    {
      id: "signal-risk",
      assetId: laggard.id,
      title: `${laggard.name} em zona de stress`,
      summary: `Queda diaria de ${laggard.changePct.toFixed(2)}% com leitura de risco para ${laggard.region}.`,
      actionBias: laggard.changePct < -1 ? "sell" : "hold",
      confidence: Math.min(91, 55 + Math.abs(laggard.changePct) * 10),
      driver: settings.signalRelations[2] ?? "Stress de preco sem regra adicional.",
      source: "Fallback engine",
    },
    {
      id: "signal-macro",
      assetId: "brent",
      title: `${brent?.name ?? "Brent"} vs FX`,
      summary: `${brent?.currency ?? "USD/EUR"} em ${brent?.price.toFixed(2) ?? "--"} com EUR/USD a ${settings.fxRates.eurUsd.toFixed(2)}.`,
      actionBias: (brent?.changePct ?? 0) > 1 ? "sell" : "hold",
      confidence: Math.min(88, 52 + Math.abs(brent?.changePct ?? 0) * 12),
      driver: settings.signalRelations[1] ?? "Sem relacao Brent/FX configurada.",
      source: "Fallback engine",
    },
  ];
  const signals: SignalInsight[] = generatedSignals;
  return {
    lastRunAt: new Date().toLocaleString("pt-PT"),
    status: "success",
    signals,
    signalStates: aggregateSignalStates(signals),
    relations: settings.signalRelations.slice(0, 4),
    promptPreview: buildSignalRefreshPrompt(indices, alternativeAssets, settings),
  };
}

function buildSignalRefreshPrompt(
  indices: IndexAsset[],
  alternativeAssets: ReturnType<typeof getAlternativeAssets>,
  settings: AppSettings,
) {
  const stockItems = settings.marketDataSources.map((source) => {
    const index = indices.find((item) => item.id === source.assetId);
    const alternative = alternativeAssets.find((item) => item.id === source.assetId);
    return {
      assetId: source.assetId,
      name: source.label,
      symbol: source.symbol,
      group: source.group,
      display: source.display,
      currency: index?.currency ?? alternative?.currency ?? "EUR",
      etfTicker: index?.etfTicker ?? alternative?.symbol ?? source.symbol,
      changePct: index?.changePct ?? alternative?.changePct ?? null,
      ytd: index?.ytd ?? alternative?.ytd ?? null,
      price: index?.price ?? alternative?.price ?? null,
      type: index ? "index" : "alternative",
    };
  });
  return [
    "Analisa os stock items e devolve JSON valido.",
    "Quero exatamente duas pecas de informacao: insights curtos e propostas para os stock items definidos.",
    "Mantem o JSON compacto para evitar truncation: 3 insights no maximo, summaries curtos, reasons curtas.",
    "insights: lista curta de observacoes relevantes do mercado.",
    "proposals: lista por stock item com action buy ou sell ou hold, confidence e reason.",
    "Cada insight deve ter: assetId, title, summary, actionBias, confidence, driver, source.",
    "Cada proposta deve ter: assetId, action, confidence, reason, source.",
    "summary e reason devem ser objetivas e curtas, preferencialmente numa frase curta.",
    "Devolve JSON no formato {\"insights\":[],\"proposals\":[],\"relations\":[]}.",
    `signal sources: ${settings.signalSources.join(" | ")}`,
    `signal relations: ${settings.signalRelations.join(" | ")}`,
    `output: ${settings.signalOutput ?? ""}`,
    `stock items: ${JSON.stringify(stockItems)}`,
  ].join("\n");
}

async function buildSignalInsightsWithLlm(
  indices: IndexAsset[],
  alternativeAssets: ReturnType<typeof getAlternativeAssets>,
  settings: AppSettings,
) {
  const fallback = buildFallbackSignalInsights(indices, alternativeAssets, settings);
  const prompt = buildSignalRefreshPrompt(indices, alternativeAssets, settings);
  let parsed: { insights?: SignalInsight[]; proposals?: SignalState[]; relations?: string[] } | null = null;
  let sourceLabel = "LLM";
  let lastError: unknown = null;
  for (const profile of resolveLlmCandidateProfiles(settings)) {
    try {
      const endpoint = profile.endpoint.replace(/\/$/, "");
      const providerName = (profile.provider ?? "").toLowerCase();
      const isClaude = providerName.includes("claude") || endpoint.includes("anthropic");
      const isOllama = providerName.includes("ollama") || endpoint.includes("11434");
      const url = isClaude
        ? (endpoint.endsWith("/v1") ? `${endpoint}/messages` : `${endpoint}/v1/messages`)
        : (endpoint.endsWith("/v1") ? `${endpoint}/chat/completions` : `${endpoint}/v1/chat/completions`);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isClaude && profile.apiKey) {
        headers["x-api-key"] = profile.apiKey;
        headers["anthropic-version"] = "2023-06-01";
      } else if (profile.apiKey) {
        headers.Authorization = `Bearer ${profile.apiKey}`;
      }
      const activeModel = isOllama ? await resolveOllamaModel(endpoint, profile.model) : profile.model;
      const maxTokens = Math.max(1400, Number(profile.maxTokens ?? 1200));
      const body = isClaude
        ? { model: activeModel, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }
        : {
            model: activeModel,
            messages: [
              { role: "system", content: "Responde apenas com JSON valido." },
              { role: "user", content: prompt },
            ],
            max_tokens: maxTokens,
            ...(isOllama ? {} : { response_format: { type: "json_object" } }),
          };
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        throw new Error(`LLM signal refresh falhou com HTTP ${response.status}.`);
      }
      const payload = await response.json() as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
        content?: Array<{ text?: string }>;
      };
      const rawText = isClaude
        ? payload.content?.map((item) => item.text ?? "").join("") ?? ""
        : payload.choices?.[0]?.message?.content ?? "";
      if (!isClaude && payload.choices?.[0]?.finish_reason === "length") {
        throw new Error("LLM signal refresh foi truncado por limite de tokens.");
      }
      parsed = JSON.parse(extractJsonBlock(rawText)) as { insights?: SignalInsight[]; proposals?: SignalState[]; relations?: string[] };
      sourceLabel = profile.name ?? profile.model;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!parsed) {
    throw lastError instanceof Error ? lastError : new Error("No LLM candidate succeeded");
  }
  const signals = ([...(parsed.insights ?? fallback.signals)])
    .slice(0, 5)
    .map((signal, index) => ({
      id: signal.id ?? `llm-signal-${index + 1}`,
      assetId: signal.assetId,
      title: signal.title,
      summary: signal.summary,
      actionBias: signal.actionBias,
      confidence: Number(signal.confidence),
      driver: signal.driver,
      source: signal.source ?? sourceLabel,
    }))
    .filter((signal) => signal.assetId && signal.title && signal.summary);
  const proposals = (parsed.proposals ?? [])
    .map((proposal) => ({
      assetId: proposal.assetId,
      action: proposal.action,
      confidence: Number(proposal.confidence),
      reason: proposal.reason,
      source: proposal.source ?? sourceLabel,
    }))
    .filter((proposal) => proposal.assetId && proposal.action && proposal.reason);

  return {
    lastRunAt: new Date().toLocaleString("pt-PT"),
    status: "success" as const,
    signals: signals.length > 0 ? signals : fallback.signals,
    signalStates: proposals.length > 0 ? proposals : aggregateSignalStates(signals.length > 0 ? signals : fallback.signals),
    relations: parsed.relations?.filter(Boolean)?.slice(0, 6) ?? fallback.relations,
    promptPreview: prompt,
  };
}

function aggregateSignalStates(signals: SignalInsight[]) {
  const byAsset = new Map<string, SignalState>();
  for (const signal of signals) {
    const current = byAsset.get(signal.assetId);
    if (!current || signal.confidence > current.confidence) {
      byAsset.set(signal.assetId, {
        assetId: signal.assetId,
        action: signal.actionBias,
        confidence: signal.confidence,
        reason: signal.title,
        source: signal.source,
      });
    }
  }
  return Array.from(byAsset.values());
}

function isMarketOpenForSettings(region: IndexAsset["region"], settings: AppSettings) {
  if ((settings.marketMode ?? "LIVE") === "DEBUG") {
    return true;
  }
  return getRegionStatus(region).isOpen;
}

function getEurToCurrencySpot(currency: string, settings: AppSettings) {
  return settings.currencySpots[currency] ?? 1;
}

function getCurrencyToEurSpot(currency: string, settings: AppSettings) {
  const spot = getEurToCurrencySpot(currency, settings);
  return spot > 0 ? 1 / spot : 1;
}

function buildNormalizedHistory() {
  return Object.fromEntries(
    listIndices().map((item) => [
      item.id,
      buildAssetHistoryRanges(item.id, item.price, initialHistory[item.id]),
    ]),
  );
}

function buildAlternativeHistory() {
  return Object.fromEntries(
    getAlternativeAssets().map((item) => [
      item.id,
      buildAssetHistoryRanges(item.id, item.price),
    ]),
  );
}

function buildFxHistory() {
  const settings = getSettings<AppSettings>();
  const currencies = Array.from(
    new Set([
      ...listIndices().map((item) => item.currency),
      ...getAlternativeAssets().map((item) => normalizeAlternativeCurrency(item.currency)),
    ]),
  ).filter((currency) => currency && currency !== "EUR");

  return Object.fromEntries(
    currencies.map((currency) => {
      const rows = listFxHistory(currency);
      return [currency, buildFxRanges(currency, rows, settings.currencySpots[currency] ?? 1)];
    }),
  );
}

function buildAssetHistoryRanges(assetId: string, currentPrice: number, fallback?: Record<RangeKey, PricePoint[]>) {
  const dailyRows = listAssetDailyHistory(assetId).map((row) => ({
    ...row,
    date: new Date(`${row.tradeDate}T00:00:00Z`),
  }));
  const intradayRows = listAssetIntradayHistory(assetId).map((row) => ({
    ...row,
    date: new Date(row.ts),
  }));
  if (dailyRows.length === 0) {
    return fallback ?? buildFlatRanges(currentPrice);
  }

  const latestIntradayDay = intradayRows.at(-1)?.ts.slice(0, 10) ?? null;
  const intradayDayRows = latestIntradayDay
    ? intradayRows.filter((row) => row.ts.slice(0, 10) === latestIntradayDay)
    : [];
  const oneWeekStart = daysAgoUtc(6);
  const oneMonthStart = daysAgoUtc(29);
  const ytdStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const twelveMonthRows = collapseToMonthEndPoints(dailyRows, 12);
  const ytdRows = collapseToMonthEndPoints(dailyRows.filter((row) => row.date >= ytdStart));

  return {
    "1D":
      intradayDayRows.length > 0
        ? intradayDayRows.map((row) => ({
            label: formatTimeLabel(row.date),
            value: Number(row.close.toFixed(2)),
          }))
        : dailyRows.slice(-8).map((row) => ({ label: formatDateLabel(row.date), value: Number(row.close.toFixed(2)) })),
    "1W": dailyRows
      .filter((row) => row.date >= oneWeekStart)
      .slice(-7)
      .map((row) => ({ label: formatDateLabel(row.date), value: Number(row.close.toFixed(2)) })),
    "1M": dailyRows
      .filter((row) => row.date >= oneMonthStart)
      .slice(-30)
      .map((row) => ({ label: formatDateLabel(row.date), value: Number(row.close.toFixed(2)) })),
    "12M": twelveMonthRows.map((row) => ({
      label: formatMonthLabel(row.date, true),
      value: Number(row.close.toFixed(2)),
    })),
    YTD: ytdRows.map((row) => ({
      label: formatMonthLabel(row.date, false),
      value: Number(row.close.toFixed(2)),
    })),
  } satisfies Record<RangeKey, PricePoint[]>;
}

function buildFxRanges(currency: string, rows: Array<{ ts: string; spot: number }>, currentSpot: number) {
  if (rows.length === 0) {
    return buildFlatRanges(currentSpot);
  }
  const parsed = rows.map((row) => ({ ...row, date: new Date(row.ts) }));
  const latestDay = parsed.at(-1)?.ts.slice(0, 10) ?? null;
  const sameDay = latestDay ? parsed.filter((row) => row.ts.slice(0, 10) === latestDay) : [];
  const oneWeekStart = daysAgoUtc(6);
  const oneMonthStart = daysAgoUtc(29);
  const ytdStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  return {
    "1D":
      sameDay.length > 0
        ? sameDay.map((row) => ({ label: formatTimeLabel(row.date), value: Number(row.spot.toFixed(4)) }))
        : parsed.slice(-8).map((row) => ({ label: formatDateLabel(row.date), value: Number(row.spot.toFixed(4)) })),
    "1W": parsed
      .filter((row) => row.date >= oneWeekStart)
      .slice(-7)
      .map((row) => ({ label: formatDateLabel(row.date), value: Number(row.spot.toFixed(4)) })),
    "1M": parsed
      .filter((row) => row.date >= oneMonthStart)
      .slice(-30)
      .map((row) => ({ label: formatDateLabel(row.date), value: Number(row.spot.toFixed(4)) })),
    "12M": collapseToMonthEndPoints(parsed, 12).map((row) => ({
      label: formatMonthLabel(row.date, true),
      value: Number(row.spot.toFixed(4)),
    })),
    YTD: collapseToMonthEndPoints(parsed.filter((row) => row.date >= ytdStart)).map((row) => ({
      label: formatMonthLabel(row.date, false),
      value: Number(row.spot.toFixed(4)),
    })),
  } satisfies Record<RangeKey, PricePoint[]>;
}

function buildFlatRanges(value: number) {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  return {
    "1D": ["09:00", "11:00", "13:00", "15:00", "17:00"].map((label) => ({ label, value: safeValue })),
    "1W": buildLastWeekLabels().map((label) => ({ label, value: safeValue })),
    "1M": buildLastMonthLabels().map((label) => ({ label, value: safeValue })),
    "12M": Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1}`, value: safeValue })),
    YTD: buildYearToDateMonthLabels().map((label) => ({ label, value: safeValue })),
  } satisfies Record<RangeKey, PricePoint[]>;
}

function collapseToMonthEndPoints<T extends { date: Date }>(rows: T[], limit?: number) {
  const byMonth = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.date.getUTCFullYear()}-${String(row.date.getUTCMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, row);
  }
  const values = Array.from(byMonth.values());
  return typeof limit === "number" ? values.slice(-limit) : values;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(date);
}

function formatMonthLabel(date: Date, includeYear: boolean) {
  return new Intl.DateTimeFormat("pt-PT", {
    month: "short",
    ...(includeYear ? { year: "2-digit" } : {}),
    timeZone: "UTC",
  }).format(date);
}

function daysAgoUtc(days: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
}

function normalizeAlternativeCurrency(currency: string) {
  return currency === "USD/EUR" ? "USD" : currency;
}

async function fetchStooqQuote(symbol: string) {
  const quoteResponse = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&i=d`, {
    cache: "no-store",
  });
  const quoteText = (await quoteResponse.text()).trim();
  const quoteLine = quoteText.split("\n")[0]?.trim();
  if (!quoteLine || quoteLine.includes("N/D") || quoteLine.includes("No data")) {
    return null;
  }

  const parts = quoteLine.split(",");
  const close = Number(parts[6]);
  const volume = Number(parts[7]);
  if (!Number.isFinite(close) || close <= 0) {
    return null;
  }

  const historyResponse = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`, {
    cache: "no-store",
  });
  const historyText = await historyResponse.text();
  const rows = historyText
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split(","))
    .filter((row) => row.length >= 6);

  const lastRows = rows.slice(-260);
  const previous = lastRows.at(-2);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const ytdRows = lastRows.filter((row) => new Date(row[0]) >= yearStart);
  const startYtd = ytdRows[0] ? Number(ytdRows[0][4]) : close;
  const prevClose = previous ? Number(previous[4]) : close;

  return {
    close: Number(close.toFixed(2)),
    dailyChangePct: prevClose ? Number((((close - prevClose) / prevClose) * 100).toFixed(2)) : 0,
    ytdPct: startYtd ? Number((((close - startYtd) / startYtd) * 100).toFixed(2)) : 0,
    volumeLabel: Number.isFinite(volume) && volume > 0 ? formatCompactVolume(volume) : "Live",
  };
}

async function syncMarketDataSource(
  source: AppSettings["marketDataSources"][number],
  settings: AppSettings,
) {
  const yahooSymbol = source.yahooSymbol ?? source.symbol;
  if (yahooSymbol) {
    const yahooData = await fetchYahooAssetData(yahooSymbol);
    if (yahooData) {
      replaceAssetDailyHistory(
        source.assetId,
        yahooData.daily.map((row) => ({
          assetId: source.assetId,
          tradeDate: row.ts.slice(0, 10),
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
          source: row.source,
        })),
      );
      replaceAssetIntradayHistory(
        source.assetId,
        yahooData.intraday.map((row) => ({
          assetId: source.assetId,
          ts: row.ts,
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
          source: row.source,
        })),
      );
      return deriveQuoteFromHistory(yahooData.daily, yahooData.intraday, "Yahoo Finance");
    }
  }

  const quote = source.url
    ? await fetchUrlMarketQuote(source, settings).catch(() => null)
    : await fetchStooqQuote(source.symbol).catch(() => null);
  if (!quote) {
    return null;
  }
  seedFallbackHistory(source.assetId, quote.close, quote.volumeLabel, source.provider);
  return quote;
}

async function fetchYahooAssetData(symbol: string) {
  const { daily, intraday } = await fetchYahooChartFromPython(symbol, "18mo", "1d", "5d", "60m");
  if (daily.length === 0) {
    return null;
  }
  return { daily, intraday };
}

async function fetchYahooFxHistory(currency: string) {
  const symbol = currency === "USD" ? "EURUSD=X" : `EUR${currency}=X`;
  const { daily, intraday } = await fetchYahooChartFromPython(symbol, "3mo", "1d", "5d", "60m");
  const merged = [...daily, ...intraday].sort((a, b) => a.ts.localeCompare(b.ts));
  const unique = new Map<string, HistoryBar>();
  for (const row of merged) {
    unique.set(row.ts, row);
  }
  return Array.from(unique.values());
}

async function fetchYahooChartFromPython(
  symbol: string,
  dailyPeriod: string,
  dailyInterval: string,
  intradayPeriod: string,
  intradayInterval: string,
) {
  const scriptPath = path.join(process.cwd(), "scripts", "fetch_yahoo_chart.py");
  const { stdout } = await execFileAsync("python3", [
    scriptPath,
    symbol,
    dailyPeriod,
    dailyInterval,
    intradayPeriod,
    intradayInterval,
  ], {
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const payload = JSON.parse(stdout) as {
    daily?: HistoryBar[];
    intraday?: HistoryBar[];
  };
  return {
    daily: (payload.daily ?? []).filter((row) => Number.isFinite(row.close)),
    intraday: (payload.intraday ?? []).filter((row) => Number.isFinite(row.close)),
  };
}

function deriveQuoteFromHistory(daily: HistoryBar[], intraday: HistoryBar[], sourceLabel: string) {
  const latest = intraday.at(-1) ?? daily.at(-1);
  const previousDaily = daily.at(-2) ?? daily.at(-1);
  const firstYtd = daily.find((row) => new Date(row.ts).getUTCFullYear() === new Date().getUTCFullYear()) ?? daily[0];
  if (!latest || !previousDaily || !firstYtd) {
    return null;
  }
  return {
    close: Number(latest.close.toFixed(2)),
    dailyChangePct:
      previousDaily.close > 0
        ? Number((((latest.close - previousDaily.close) / previousDaily.close) * 100).toFixed(2))
        : 0,
    ytdPct:
      firstYtd.close > 0
        ? Number((((latest.close - firstYtd.close) / firstYtd.close) * 100).toFixed(2))
        : 0,
    volumeLabel: latest.volume && latest.volume > 0 ? formatCompactVolume(latest.volume) : sourceLabel,
  };
}

function seedFallbackHistory(assetId: string, close: number, volumeLabel: string, source: string) {
  const daily = Array.from({ length: 260 }, (_, index) => {
    const date = daysAgoUtc(259 - index);
    const drift = 1 + (Math.sin(index / 17) * 0.02) + ((index - 130) / 5000);
    const value = Number((close / drift).toFixed(2));
    return {
      assetId,
      tradeDate: date.toISOString().slice(0, 10),
      open: value,
      high: Number((value * 1.004).toFixed(2)),
      low: Number((value * 0.996).toFixed(2)),
      close: value,
      volume: parseCompactVolume(volumeLabel),
      source,
    };
  });
  const intraday = ["09:00", "11:00", "13:00", "15:00", "17:00"].map((label, index) => {
    const [hour, minute] = label.split(":").map(Number);
    const date = new Date();
    date.setUTCHours(hour, minute, 0, 0);
    const value = Number((close * (1 + (index - 2) * 0.0025)).toFixed(2));
    return {
      assetId,
      ts: date.toISOString(),
      open: value,
      high: Number((value * 1.002).toFixed(2)),
      low: Number((value * 0.998).toFixed(2)),
      close: value,
      volume: parseCompactVolume(volumeLabel),
      source,
    };
  });
  replaceAssetDailyHistory(assetId, daily);
  replaceAssetIntradayHistory(assetId, intraday);
}

function parseCompactVolume(label: string) {
  const normalized = label.trim().toUpperCase();
  if (normalized.endsWith("B")) {
    return Number(normalized.slice(0, -1)) * 1_000_000_000;
  }
  if (normalized.endsWith("M")) {
    return Number(normalized.slice(0, -1)) * 1_000_000;
  }
  if (normalized.endsWith("K")) {
    return Number(normalized.slice(0, -1)) * 1_000;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

async function fetchUrlMarketQuote(
  source: AppSettings["marketDataSources"][number],
  settings: AppSettings,
) {
  if (!source.url) {
    return null;
  }
  const response = await fetch(source.url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 SimStock/1.0",
      "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
  });
  const html = await response.text();
  const llmExtract = await extractQuoteFromUrlWithLlm(html, source, settings).catch(() => null);
  if (llmExtract) {
    return llmExtract;
  }
  return extractQuoteFromTradingEconomicsHtml(html);
}

async function extractQuoteFromUrlWithLlm(
  html: string,
  source: AppSettings["marketDataSources"][number],
  settings: AppSettings,
) {
  const prompt = [
    "Extrai o preço atual de mercado a partir deste HTML e devolve apenas JSON valido.",
    "Campos obrigatorios: close, dailyChangePct, ytdPct, volumeLabel.",
    "Se a fonte tiver um texto descritivo com preco atual, usa-o.",
    `Asset: ${source.label}`,
    `URL: ${source.url ?? ""}`,
    html.slice(0, 12000),
  ].join("\n");
  let parsed: {
    close?: number | string;
    dailyChangePct?: number | string;
    ytdPct?: number | string;
    volumeLabel?: string;
  } | null = null;
  for (const profile of resolveLlmCandidateProfiles(settings)) {
    try {
      const endpoint = profile.endpoint.replace(/\/$/, "");
      const providerName = (profile.provider ?? "").toLowerCase();
      const isClaude = providerName.includes("claude") || endpoint.includes("anthropic");
      const isOllama = providerName.includes("ollama") || endpoint.includes("11434");
      const url = isClaude
        ? (endpoint.endsWith("/v1") ? `${endpoint}/messages` : `${endpoint}/v1/messages`)
        : (endpoint.endsWith("/v1") ? `${endpoint}/chat/completions` : `${endpoint}/v1/chat/completions`);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isClaude && profile.apiKey) {
        headers["x-api-key"] = profile.apiKey;
        headers["anthropic-version"] = "2023-06-01";
      } else if (profile.apiKey) {
        headers.Authorization = `Bearer ${profile.apiKey}`;
      }
      const activeModel = isOllama ? await resolveOllamaModel(endpoint, profile.model) : profile.model;
      const body = isClaude
        ? { model: activeModel, max_tokens: 300, messages: [{ role: "user", content: prompt }] }
        : {
            model: activeModel,
            messages: [
              { role: "system", content: "Responde apenas com JSON valido." },
              { role: "user", content: prompt },
            ],
            max_tokens: 300,
            ...(isOllama ? {} : { response_format: { type: "json_object" } }),
          };
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        throw new Error(`LLM market extraction falhou com HTTP ${response.status}.`);
      }
      const payload = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        content?: Array<{ text?: string }>;
      };
      const rawText = isClaude
        ? payload.content?.map((item) => item.text ?? "").join("") ?? ""
        : payload.choices?.[0]?.message?.content ?? "";
      parsed = JSON.parse(extractJsonBlock(rawText)) as {
        close?: number | string;
        dailyChangePct?: number | string;
        ytdPct?: number | string;
        volumeLabel?: string;
      };
      break;
    } catch {
      continue;
    }
  }
  if (!parsed) {
    return null;
  }
  const close = Number(parsed.close);
  if (!Number.isFinite(close) || close <= 0) {
    return null;
  }
  return {
    close: Number(close.toFixed(2)),
    dailyChangePct: Number(parsed.dailyChangePct ?? 0),
    ytdPct: Number(parsed.ytdPct ?? 0),
    volumeLabel: parsed.volumeLabel ?? "URL + LLM",
  };
}

function extractQuoteFromTradingEconomicsHtml(html: string) {
  const metaMatch = html.match(/content=\"O Brent subiu para ([0-9.,]+) USD\/Bbl.*?alta de ([0-9.,-]+)%.*?No último mês.*?subiu ([0-9.,-]+)%/i);
  const chartsMetaMatch = html.match(/\"last\":([0-9.]+)/);
  const parseLocalizedNumber = (value: string) => Number(value.replace(/\./g, "").replace(",", "."));
  const close = metaMatch ? parseLocalizedNumber(metaMatch[1]) : chartsMetaMatch ? Number(chartsMetaMatch[1]) : NaN;
  if (!Number.isFinite(close)) {
    return null;
  }
  return {
    close: Number(close.toFixed(2)),
    dailyChangePct: metaMatch ? Number(parseLocalizedNumber(metaMatch[2]).toFixed(2)) : 0,
    ytdPct: metaMatch ? Number(parseLocalizedNumber(metaMatch[3]).toFixed(2)) : 0,
    volumeLabel: "TradingEconomics",
  };
}

function formatCompactVolume(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

function ensureStrategyNameAvailable(name: string, excludeId?: string) {
  const normalized = name.trim().toLowerCase();
  const conflict = listStrategies().find(
    (strategy) => strategy.id !== excludeId && strategy.name.trim().toLowerCase() === normalized,
  );
  if (conflict) {
    throw new Error("Strategy name already exists");
  }
}

function buildUniqueStrategyCopyName(baseName: string) {
  const existing = new Set(listStrategies().map((strategy) => strategy.name.trim().toLowerCase()));
  let attempt = `${baseName} Copy`;
  let counter = 2;
  while (existing.has(attempt.trim().toLowerCase())) {
    attempt = `${baseName} Copy ${counter}`;
    counter += 1;
  }
  return attempt;
}

function splitBusinessSettings(settings: AppSettings) {
  return {
    feePerTrade: settings.feePerTrade,
    autoRefreshMinutes: settings.autoRefreshMinutes,
    fxRefreshMinutes: settings.fxRefreshMinutes,
    defaultBudget: settings.defaultBudget,
    slippagePct: settings.slippagePct,
    agent: settings.agent,
    fxRates: settings.fxRates,
    currencySpots: settings.currencySpots,
    signalSources: settings.signalSources,
    signalRelations: settings.signalRelations,
    signalOutput: settings.signalOutput,
    manualSignals: settings.manualSignals,
    marketDataSources: settings.marketDataSources,
    marketMode: settings.marketMode ?? "LIVE",
  } satisfies Partial<AppSettings>;
}

function buildBusinessDatasetSnapshot(): UserBusinessDataset {
  return {
    settings: splitBusinessSettings(getSettings<AppSettings>()),
    wallet: getWallet(),
    alternativeAssets: getAlternativeAssets(),
    indices: listIndices(),
    trades: listTrades(),
    strategies: listStrategies(),
    agents: listAgents(),
    agentLogs: listAgentLogs(),
    activityLogs: listActivityLogs(),
    signalSnapshot: getSignalSnapshot<SignalSnapshot>(),
  };
}

function persistActiveUserBusinessDataset() {
  const activeUserId = getActiveUserId();
  if (!activeUserId) {
    return;
  }
  setAppStateValue(`user_dataset::${activeUserId}`, buildBusinessDatasetSnapshot());
}

function applyUserBusinessDataset(dataset: UserBusinessDataset) {
  const db = getDb();
  const settings = getSettings<AppSettings>();
  const nextSettings = normalizeSettings({
    ...splitBusinessSettings(settings),
    ...(dataset.settings ?? {}),
    llmProfiles: settings.llmProfiles,
    activeLlmId: settings.activeLlmId,
    llm: settings.llm,
  });

  const tx = db.transaction(() => {
    setAppStateValue("settings", nextSettings);
    setAppStateValue("wallet", dataset.wallet);
    setAppStateValue("alternative_assets", dataset.alternativeAssets);
    setAppStateValue("signal_snapshot", dataset.signalSnapshot);

    db.prepare("DELETE FROM indices").run();
    const insertIndex = db.prepare("INSERT INTO indices (id, payload) VALUES (?, ?)");
    for (const item of dataset.indices) {
      insertIndex.run(item.id, JSON.stringify(item));
    }

    db.prepare("DELETE FROM trades").run();
    const insertTrade = db.prepare(`
      INSERT INTO trades (
        id, side, indexId, etfTicker, indexName, units, unitPriceUsd, grossEur, feeEur, totalEur,
        fxRateEurUsd, fxRateUsdEur, timestamp, source, strategyName, unitLimitUsd, validUntil
      ) VALUES (
        @id, @side, @indexId, @etfTicker, @indexName, @units, @unitPriceUsd, @grossEur, @feeEur, @totalEur,
        @fxRateEurUsd, @fxRateUsdEur, @timestamp, @source, @strategyName, @unitLimitUsd, @validUntil
      )
    `);
    for (const item of dataset.trades) {
      insertTrade.run(item);
    }

    db.prepare("DELETE FROM strategies").run();
    const insertStrategy = db.prepare(`
      INSERT INTO strategies (id, name, budgetEur, riskLevel, active, source, buyCriteria, sellCriteria, strategyBrief)
      VALUES (@id, @name, @budgetEur, @riskLevel, @active, @source, @buyCriteria, @sellCriteria, @strategyBrief)
    `);
    for (const item of dataset.strategies) {
      insertStrategy.run(item);
    }

    db.prepare("DELETE FROM agents").run();
    const insertAgent = db.prepare(`
      INSERT INTO agents (id, name, strategyId, budgetEur, executionMode, executionHours, status, tradesToday)
      VALUES (@id, @name, @strategyId, @budgetEur, @executionMode, @executionHours, @status, @tradesToday)
    `);
    for (const item of dataset.agents) {
      insertAgent.run(item);
    }

    db.prepare("DELETE FROM agent_logs").run();
    const insertAgentLogStatement = db.prepare(`
      INSERT INTO agent_logs (id, agentId, strategyName, action, etfTicker, explanation, confidence, timestamp)
      VALUES (@id, @agentId, @strategyName, @action, @etfTicker, @explanation, @confidence, @timestamp)
    `);
    for (const item of dataset.agentLogs) {
      insertAgentLogStatement.run(item);
    }

    db.prepare("DELETE FROM activity_logs").run();
    const insertActivity = db.prepare(`
      INSERT INTO activity_logs (id, category, action, entityType, entityId, status, message, details, timestamp)
      VALUES (@id, @category, @action, @entityType, @entityId, @status, @message, @details, @timestamp)
    `);
    for (const item of dataset.activityLogs) {
      insertActivity.run(item);
    }
  });

  tx();
}

function buildNewUserBusinessDataset(name: string): UserBusinessDataset {
  const current = buildBusinessDatasetSnapshot();
  return {
    ...current,
    wallet: { ...current.wallet, currentBudget: Number(getSettings<AppSettings>().defaultBudget || current.wallet.currentBudget) },
    activityLogs: [
      ...current.activityLogs,
      {
        id: randomUUID(),
        category: "users",
        action: "seed",
        entityType: "user",
        entityId: name,
        status: "success",
        message: `Perfil de negocio inicial criado para ${name}.`,
        details: null,
        timestamp: new Date().toLocaleString("pt-PT"),
      },
    ],
  };
}

function isUsableLlmProfile(profile: LlmProfile | undefined | null) {
  if (!profile) {
    return false;
  }
  const apiKey = resolveLlmApiKey(profile);
  const providerName = (profile.provider ?? "").toLowerCase();
  const endpoint = (profile.endpoint ?? "").toLowerCase();
  const isLocal = Boolean(profile.local) || providerName.includes("ollama") || endpoint.includes("11434");
  if (isLocal) {
    return Boolean(profile.endpoint && profile.model);
  }
  return Boolean(profile.endpoint && profile.model && apiKey);
}

function resolveLlmProfile(
  settings: AppSettings,
  target: LlmInvocationTarget,
  options?: { strict?: boolean },
): ResolvedLlmProfile {
  const profiles = settings.llmProfiles.length > 0 ? settings.llmProfiles : [settings.llm];
  const activeProfile = profiles.find((profile) => profile.id === settings.activeLlmId) ?? profiles[0];
  if (isUsableLlmProfile(activeProfile)) {
    return {
      profile: materializeLlmProfile(activeProfile),
      fallbackUsed: false,
      reason: `${labelLlmProfile(activeProfile)} ativo e operacional para ${target}.`,
    };
  }

  if (options?.strict) {
    throw new Error("No usable LLM profile available");
  }

  return {
    profile: materializeLlmProfile(activeProfile),
    fallbackUsed: false,
    reason: `${labelLlmProfile(activeProfile)} permanece configurado para ${target}, mas nao esta operacional.`,
  };
}

function resolveLlmCandidateProfiles(settings: AppSettings) {
  const activeProfile =
    (settings.llmProfiles.length > 0 ? settings.llmProfiles : [settings.llm]).find((profile) => profile.id === settings.activeLlmId) ??
    settings.llmProfiles[0] ??
    settings.llm;
  return isUsableLlmProfile(activeProfile) ? [materializeLlmProfile(activeProfile)] : [];
}

function labelLlmProfile(profile: LlmProfile) {
  return profile.name ?? `${profile.provider} ${profile.model}`.trim();
}

function describeResolvedLlm(resolved: ResolvedLlmProfile) {
  return {
    id: resolved.profile.id ?? null,
    name: labelLlmProfile(resolved.profile),
    provider: resolved.profile.provider,
    model: resolved.profile.model,
    fallbackUsed: resolved.fallbackUsed,
    reason: resolved.reason,
  };
}

async function invokeActiveLlmJson<T>(
  settings: AppSettings,
  target: LlmInvocationTarget,
  prompt: string,
  maxTokens: number,
) {
  const activeProfile = resolveLlmProfile(settings, target, { strict: true }).profile;
  const endpoint = activeProfile.endpoint.replace(/\/$/, "");
  const providerName = (activeProfile.provider ?? "").toLowerCase();
  const isClaude = providerName.includes("claude") || endpoint.includes("anthropic");
  const isOllama = providerName.includes("ollama") || endpoint.includes("11434");
  const url = isClaude
    ? (endpoint.endsWith("/v1") ? `${endpoint}/messages` : `${endpoint}/v1/messages`)
    : (endpoint.endsWith("/v1") ? `${endpoint}/chat/completions` : `${endpoint}/v1/chat/completions`);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isClaude && activeProfile.apiKey) {
    headers["x-api-key"] = activeProfile.apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else if (activeProfile.apiKey) {
    headers.Authorization = `Bearer ${activeProfile.apiKey}`;
  }
  const activeModel = isOllama ? await resolveOllamaModel(endpoint, activeProfile.model) : activeProfile.model;
  const body = isClaude
    ? { model: activeModel, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }
    : {
        model: activeModel,
        messages: [
          { role: "system", content: "Return valid JSON only. Use the supplied facts only. Do not include markdown." },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        ...(isOllama ? {} : { response_format: { type: "json_object" } }),
      };
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`LLM ${target} failed with HTTP ${response.status}`);
  }
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    content?: Array<{ text?: string }>;
  };
  const rawText = isClaude
    ? payload.content?.map((item) => item.text ?? "").join("") ?? ""
    : payload.choices?.[0]?.message?.content ?? "";
  return JSON.parse(extractJsonBlock(rawText)) as T;
}

function buildFallbackStrategyIdeas(nameHint?: string) {
  const prefix = nameHint?.trim() ? `${nameHint.trim()} ` : "";
  return [
    {
      name: `${prefix}FX Aware Momentum`,
      buyCriteria: "Entrar apenas quando o stock item mostrar momentum diario e semanal alinhado, mercado aberto, fee suportavel e FX EUR favoravel ou neutro face a moeda do ETF.",
      sellCriteria: "Sair em perda do sinal principal, reversao diaria confirmada ou quando o impacto combinado de fee e FX degrade a expectativa de retorno.",
      strategyBrief: "Explora momentum em ETFs de indices com filtro de custos, FX e status regional para evitar entradas de baixa qualidade.",
      source: "generated" as const,
    },
    {
      name: `${prefix}Cross Region Rotation`,
      buyCriteria: "Comprar a regiao com melhor combinacao de signal state buy, YTD resiliente e daily change superior ao grupo, limitando sobre-exposicao a uma unica geografia.",
      sellCriteria: "Reduzir ou sair quando a regiao perde liderança relativa, surgem sinais sell persistentes ou commodities e FX aumentam risco macro.",
      strategyBrief: "Faz rotacao disciplinada entre regioes usando força relativa, sinais e contexto macro para deslocar capital para onde a vantagem e mais clara.",
      source: "generated" as const,
    },
    {
      name: `${prefix}Commodity Stress Shield`,
      buyCriteria: "Aumentar exposição apenas quando Brent, ouro e FX não sinalizam stress importado e o stock item mantém buy ou hold com confiança elevada.",
      sellCriteria: "Desalavancar quando commodities pressionam a narrativa macro, o LLM ou signal engine sinalizam sell, ou a volatilidade ameaça o capital da carteira.",
      strategyBrief: "Protege a carteira usando commodities e FX como filtro macro antes de autorizar novas entradas em ETFs de indices.",
      source: "generated" as const,
    },
  ];
}

function insertAgentLog(input: {
  agentId: string;
  strategyName: string;
  action: "buy" | "sell" | "hold" | "start" | "pause" | "cancel";
  etfTicker: string | null;
  explanation: string;
  confidence: number;
}) {
  if (!input.agentId) {
    return;
  }
  getDb().prepare(`
    INSERT INTO agent_logs (id, agentId, strategyName, action, etfTicker, explanation, confidence, timestamp)
    VALUES (@id, @agentId, @strategyName, @action, @etfTicker, @explanation, @confidence, @timestamp)
  `).run({
    id: randomUUID(),
    ...input,
    timestamp: new Date().toLocaleString("pt-PT"),
  });
}

function insertActivityLog(input: {
  category: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  status: "success" | "error" | "started";
  message: string;
  details?: string;
}) {
  getDb().prepare(`
    INSERT INTO activity_logs (id, category, action, entityType, entityId, status, message, details, timestamp)
    VALUES (@id, @category, @action, @entityType, @entityId, @status, @message, @details, @timestamp)
  `).run({
    id: randomUUID(),
    category: input.category,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    status: input.status,
    message: input.message,
    details: input.details ?? null,
    timestamp: new Date().toLocaleString("pt-PT"),
  });
}

async function safeReadJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function resolveOllamaModel(endpoint: string, preferredModel: string) {
  if (preferredModel && preferredModel !== "gpt-4.1-mini") {
    return preferredModel;
  }
  const baseUrl = endpoint.replace(/\/v1$/, "");
  const response = await fetch(`${baseUrl}/api/tags`, {
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  const payload = (await response.json()) as { models?: Array<{ name?: string }> };
  return payload.models?.[0]?.name ?? "qwen2.5:7b";
}

function extractJsonBlock(input: string) {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return input.slice(start, end + 1);
  }
  return input;
}

function buildYearToDateMonthLabels() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", { month: "short" });
  return Array.from({ length: now.getMonth() + 1 }, (_, index) =>
    formatter.format(new Date(now.getFullYear(), index, 1)),
  );
}

function buildLastWeekLabels() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return formatter.format(date);
  });
}

function buildLastMonthLabels() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
  const offsets = [30, 24, 18, 12, 6, 0];
  return offsets.map((offset) => {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    return formatter.format(date);
  });
}
