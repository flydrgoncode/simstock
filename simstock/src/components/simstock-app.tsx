"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  ArrowRightLeft,
  Bot,
  ChartCandlestick,
  CircleDollarSign,
  Cog,
  Copy,
  CircleHelp,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Square,
  TableProperties,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { formatCurrency, formatPct, getRegionStatus, type RangeKey } from "@/lib/simstock";

const MarketChart = dynamic(
  () => import("./market-chart").then((module) => module.MarketChart),
  { ssr: false, loading: () => <div className="h-full rounded-[20px] bg-white/5" /> },
);
const PerformanceBarChart = dynamic(
  () => import("./performance-bar-chart").then((module) => module.PerformanceBarChart),
  { ssr: false, loading: () => <div className="h-full rounded-[20px] bg-white/5" /> },
);

type TransactionMode = "buy" | "sell";
type PortfolioRange = "1D" | "1W" | "1M" | "YTD";
type PortfolioChartType = "area" | "bar";
type AppTab = "dashboard" | "wallet" | "fx" | "transactions" | "buySell" | "trade" | "strategies" | "backoffice";
type BackofficeTab = "llms" | "budget" | "signals" | "marketData" | "agentConfig" | "users" | "logs" | "export";
type StockDisplay = "DASH" | "ALTER" | "HIDE" | string;

type AppState = {
  version: string;
  generatedAt: string;
  indices: Array<{
    id: string;
    name: string;
    region: "Europe" | "US" | "Asia" | "China" | "Brazil" | "India";
    currency: string;
    symbol: string;
    etfTicker: string;
    etfName: string;
    price: number;
    changePct: number;
    ytd: number;
    volumeLabel: string;
  }>;
  chartHistory: Record<string, Record<RangeKey, { label: string; value: number }[]>>;
  alternativeAssets: Array<{
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
  alternativeChartHistory: Record<string, Record<RangeKey, { label: string; value: number }[]>>;
  fxChartHistory: Record<string, Record<RangeKey, { label: string; value: number }[]>>;
  wallet: {
    baseCurrency: string;
    currentBudget: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "view_only" | "superuser";
    createdAt: string;
  }>;
  activeUserId: string;
  activeUser?: {
    id: string;
    name: string;
    email: string;
    role: "view_only" | "superuser";
    createdAt: string;
  } | null;
  settings: {
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
    fxRates: {
      eurUsd: number;
      usdEur: number;
    };
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
      display: StockDisplay;
      group: string;
    }>;
  };
  trades: Array<{
    id: string;
    side: "BUY" | "SELL";
    indexId: string;
    etfTicker: string;
    indexName: string;
    currency?: string;
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
  }>;
  strategies: Array<{
    id: string;
    name: string;
    active?: number;
    source?: "manual" | "generated";
    buyCriteria: string;
    sellCriteria: string;
    strategyBrief: string;
  }>;
  agents: Array<{
    id: string;
    name: string;
    strategyId: string;
    budgetEur: number;
    executionMode: string;
    executionHours: number;
    status: "running" | "paused" | "cancelled";
    tradesToday: number;
    loopCount: number;
    currentStep: string;
    strategyName: string;
  }>;
  agentLogs: Array<{
    id: string;
    agentId: string;
    strategyName: string;
    action: "buy" | "sell" | "hold" | "start" | "pause" | "cancel";
    etfTicker: string | null;
    explanation: string;
    confidence: number;
    timestamp: string;
  }>;
  positions: Array<{
    indexId: string;
    etfTicker: string;
    units: number;
    averageCost: number;
    currentPriceUsd: number;
    marketValueEur: number;
  }>;
  portfolio: {
    currentBudget: number;
    investedAmount: number;
    fees: number;
    totalValue: number;
    performancePct: number;
    openPositions: Array<{
      indexId: string;
      etfTicker: string;
      units: number;
      averageCost: number;
      currentPriceUsd: number;
      marketValueEur: number;
      indexName: string;
    }>;
  };
  signals: Array<{
    id: string;
    assetId: string;
    title: string;
    summary: string;
    actionBias: "buy" | "sell" | "hold";
    confidence: number;
    driver: string;
    source: string;
  }>;
  signalStates: Array<{
    assetId: string;
    action: "buy" | "sell" | "hold";
    confidence: number;
    reason: string;
    source?: string;
  }>;
  signalsMeta: {
    lastRunAt: string | null;
    status: "idle" | "success" | "error";
    relations: string[];
    promptPreview?: string;
  };
  llmRuntime: {
    active: {
      id: string | null;
      name: string;
      provider: string;
      model: string;
      fallbackUsed: boolean;
      reason: string;
    };
    signals: {
      id: string | null;
      name: string;
      provider: string;
      model: string;
      fallbackUsed: boolean;
      reason: string;
    };
    strategyGeneration: {
      id: string | null;
      name: string;
      provider: string;
      model: string;
      fallbackUsed: boolean;
      reason: string;
    };
    marketExtraction: {
      id: string | null;
      name: string;
      provider: string;
      model: string;
      fallbackUsed: boolean;
      reason: string;
    };
  };
  agentTradeShortlist?: {
    generatedAt: string | null;
    promptPreview?: string;
    proposals: Array<{
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
    }>;
  };
  activityLogs: Array<{
    id: string;
    category: string;
    action: string;
    entityType: string;
    entityId: string | null;
    status: "success" | "error" | "started";
    message: string;
    details: string | null;
    timestamp: string;
  }>;
  analystSuggestion: {
    etfTicker: string;
    action: "buy" | "sell" | "hold";
    confidence: number;
    rationale: string;
    suggestedAmountEur: number;
  };
};

const indexRanges: RangeKey[] = ["1D", "1W", "1M", "12M", "YTD"];
const portfolioRanges: PortfolioRange[] = ["1D", "1W", "1M", "YTD"];
const appTabs: { id: AppTab; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <ChartCandlestick size={16} /> },
  { id: "wallet", label: "Carteira", icon: <Wallet size={16} /> },
  { id: "fx", label: "FX", icon: <CircleDollarSign size={16} /> },
  { id: "transactions", label: "Transacoes", icon: <TableProperties size={16} /> },
  { id: "buySell", label: "Compra/Venda", icon: <ArrowRightLeft size={16} /> },
  { id: "trade", label: "AutoTrade", icon: <ArrowRightLeft size={16} /> },
  { id: "strategies", label: "Estrategias", icon: <Copy size={16} /> },
];
const backofficeTabs: { id: BackofficeTab; label: string }[] = [
  { id: "llms", label: "LLMs" },
  { id: "budget", label: "Budget" },
  { id: "signals", label: "Signals" },
  { id: "marketData", label: "Stock items" },
  { id: "agentConfig", label: "Agent Config" },
  { id: "users", label: "Users" },
  { id: "logs", label: "Logs" },
  { id: "export", label: "Export/Import" },
];

export function SimStockApp({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState<AppState | null>(initialState);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [selectedIndexId, setSelectedIndexId] = useState(initialState.indices[0]?.id ?? "");
  const [selectedAlternativeId, setSelectedAlternativeId] = useState(initialState.alternativeAssets[0]?.id ?? "");
  const [selectedRange, setSelectedRange] = useState<RangeKey>("1M");
  const [portfolioRange, setPortfolioRange] = useState<PortfolioRange>("1M");
  const [portfolioChartType, setPortfolioChartType] = useState<PortfolioChartType>("area");
  const [backofficeTab, setBackofficeTab] = useState<BackofficeTab>("llms");
  const [activeLlmProviderTab, setActiveLlmProviderTab] = useState(initialState.settings.llmProfiles[0]?.id ?? "");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionReturnTab, setTransactionReturnTab] = useState<AppTab>("dashboard");
  const [selectedFxCurrency, setSelectedFxCurrency] = useState(initialState.indices[0]?.currency ?? "USD");
  const [transactionMode, setTransactionMode] = useState<TransactionMode>("buy");
  const [transactionQuantity, setTransactionQuantity] = useState("100");
  const [orderType, setOrderType] = useState("Market");
  const [orderPrice, setOrderPrice] = useState("");
  const [timeInForce, setTimeInForce] = useState("Day");
  const [validUntil, setValidUntil] = useState("ate ao fecho");
  const [editingStrategyId, setEditingStrategyId] = useState<string>("");
  const [strategyDraft, setStrategyDraft] = useState({
    name: "",
    source: "manual" as "manual" | "generated",
    buyCriteria: "",
    sellCriteria: "",
    strategyBrief: "",
  });
  const [generatedStrategyIdeas, setGeneratedStrategyIdeas] = useState<Array<{
    name: string;
    source: "generated";
    buyCriteria: string;
    sellCriteria: string;
    strategyBrief: string;
  }>>([]);
  const [newAgentName, setNewAgentName] = useState("Agent-New");
  const [newAgentStrategyId, setNewAgentStrategyId] = useState(initialState.strategies[0]?.id ?? "");
  const [newAgentBudget, setNewAgentBudget] = useState("1000");
  const [newAgentExecutionMode, setNewAgentExecutionMode] = useState("market_open");
  const [newAgentExecutionHours, setNewAgentExecutionHours] = useState("6");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"view_only" | "superuser">("view_only");
  const [editingUserId, setEditingUserId] = useState("");
  const [selectedAgentLogId, setSelectedAgentLogId] = useState(initialState.agents.find((agent) => agent.status === "running")?.id ?? initialState.agents[0]?.id ?? "");
  const [llmTests, setLlmTests] = useState<Record<string, string[]>>({});
  const [showAllStockItems, setShowAllStockItems] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState("");
  const [overlayAssetId, setOverlayAssetId] = useState("");
  const [overlayStrategyId, setOverlayStrategyId] = useState("");
  const [agentDecisionOverlayAgentId, setAgentDecisionOverlayAgentId] = useState("");
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [fxOverlayCurrency, setFxOverlayCurrency] = useState("");
  const [logsHidden, setLogsHidden] = useState(false);
  const [systemPayload, setSystemPayload] = useState("");
  const [systemExportLog, setSystemExportLog] = useState("");
  const [signalGenerationLog, setSignalGenerationLog] = useState<string[]>([]);
  const [saving, startTransition] = useTransition();
  const [error, setError] = useState("");

  const activeUser = state?.activeUser ?? state?.users.find((user) => user.id === state.activeUserId) ?? null;
  const isSuperuser = activeUser?.role === "superuser";
  const visibleAppTabs = useMemo(
    () => appTabs.filter((tab) => isSuperuser || !["buySell", "trade", "strategies"].includes(tab.id)),
    [isSuperuser],
  );
  const effectiveActiveTab =
    !isSuperuser && ["buySell", "trade", "strategies", "backoffice"].includes(activeTab)
      ? "dashboard"
      : activeTab;

  const isMarketOpenForState = useCallback(
    (region: AppState["indices"][number]["region"]) =>
      state?.settings.marketMode === "DEBUG" ? true : getRegionStatus(region).isOpen,
    [state],
  );

  const hydrateStrategyDraft = useCallback((strategy: AppState["strategies"][number]) => {
    setStrategyDraft({
      name: strategy.name,
      source: strategy.source ?? "manual",
      buyCriteria: strategy.buyCriteria,
      sellCriteria: strategy.sellCriteria,
      strategyBrief: strategy.strategyBrief,
    });
  }, []);

  const loadState = useCallback(async () => {
    const response = await fetch("/api/bootstrap", { cache: "no-store" });
    if (response.status === 401) {
      window.location.reload();
      return;
    }
    const data = (await response.json()) as AppState;
    setState(data);
    setSelectedIndexId((current) => current || data.indices[0]?.id || "");
    setNewAgentStrategyId((current) => current || data.strategies[0]?.id || "");
    setSelectedAgentLogId((current) => current || data.agents.find((agent) => agent.status === "running")?.id || data.agents[0]?.id || "");
    setActiveLlmProviderTab((current) => current || data.settings.llmProfiles[0]?.id || "");
    if (!editingStrategyId && data.strategies[0]) {
      hydrateStrategyDraft(data.strategies[0]);
      setEditingStrategyId(data.strategies[0].id);
    }
  }, [editingStrategyId, hydrateStrategyDraft]);

  const refreshIndices = useCallback(async () => {
    setUpdateFeedback("Atualizacao global iniciada...");
    const response = await fetch("/api/indices/refresh", { method: "POST" });
    const data = (await response.json()) as AppState;
    setState(data);
    setUpdateFeedback(`Atualizacao concluida sem problemas as ${new Date().toLocaleTimeString("pt-PT")}.`);
  }, []);

  const runSignals = useCallback(async () => {
      setState((current) =>
        current
          ? {
              ...current,
              signals: [],
              signalStates: [],
              signalsMeta: {
                ...current.signalsMeta,
                relations: [],
                lastRunAt: null,
                status: "idle",
              },
            }
          : current,
      );
      setUpdateFeedback("Motor de sinais iniciado. A limpar resultados anteriores e a preparar prompt.");
      const response = await fetch("/api/signals/run", { method: "POST" });
      const data = (await response.json()) as AppState;
      setState(data);
      setUpdateFeedback(`Motor de sinais concluido com ${data.signals.length} insights e ${data.signalStates.length} propostas as ${new Date().toLocaleTimeString("pt-PT")}.`);
    }, []);

  const refreshMarketAsset = useCallback(async (assetId: string) => {
    setUpdateFeedback(`Atualizacao iniciada para ${assetId}...`);
    const response = await fetch(`/api/market-data/${assetId}/refresh`, { method: "POST" });
    const data = (await response.json()) as AppState;
    setState(data);
    const label = data.settings.marketDataSources.find((source) => source.assetId === assetId)?.label ?? assetId;
    setUpdateFeedback(`${label} atualizado sem problemas as ${new Date().toLocaleTimeString("pt-PT")}.`);
  }, []);

  useEffect(() => {
    if (!state) {
      return;
    }
    const hasOpenRegion = state.indices.some((index) => isMarketOpenForState(index.region));
    if (!hasOpenRegion || state.settings.autoRefreshMinutes <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      void refreshIndices();
    }, state.settings.autoRefreshMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [refreshIndices, isMarketOpenForState, state]);

  useEffect(() => {
    if (!state || state.settings.fxRefreshMinutes <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      void (async () => {
        setUpdateFeedback("Atualizacao FX iniciada.");
        const response = await fetch("/api/fx/refresh", { method: "POST" });
        const data = (await response.json()) as AppState;
        setState(data);
        setUpdateFeedback(`Atualizacao FX concluida sem problemas as ${new Date().toLocaleTimeString("pt-PT")}.`);
      })();
    }, state.settings.fxRefreshMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  async function saveSettings(partial: Partial<AppState["settings"]>) {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Failed to save settings");
        return;
      }
      await loadState();
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  async function createUserProfile() {
    if (!newUserName.trim()) {
      setError("Indica um nome de utilizador.");
      return;
    }
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, role: newUserRole }),
      });
      const body = await response.json() as { error?: string } | AppState;
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "User create failed");
        return;
      }
      setState(body as AppState);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("view_only");
    });
  }

  function startUserEdit(user: AppState["users"][number]) {
    setEditingUserId(user.id);
    setNewUserName(user.name);
    setNewUserEmail(user.email);
    setNewUserRole(user.role);
  }

  function resetUserEditor() {
    setEditingUserId("");
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("view_only");
  }

  async function saveUserProfile() {
    if (!newUserName.trim()) {
      setError("Indica um nome de utilizador.");
      return;
    }
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, role: newUserRole }),
      });
      const body = await response.json() as { error?: string } | AppState;
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "User update failed");
        return;
      }
      setState(body as AppState);
      resetUserEditor();
    });
  }

  async function selectUserProfile(userId: string) {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/users/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const body = await response.json() as { error?: string } | AppState;
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "User switch failed");
        return;
      }
      setState(body as AppState);
    });
  }

  async function deleteUserProfile(userId: string) {
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const body = await response.json() as { error?: string } | AppState;
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "User delete failed");
        return;
      }
      setState(body as AppState);
      if (editingUserId === userId) {
        resetUserEditor();
      }
    });
  }

  async function testLlmDialog(profileId: string) {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          prompt: "Como está o dia de hoje?",
        }),
      });
      const body = (await response.json()) as { reply?: string | null; error?: string | null; logs?: string[] };
      setLlmTests((current) => ({
        ...current,
        [profileId]: body.logs ?? [body.reply ?? body.error ?? "Sem resposta do teste."],
      }));
    });
  }

  async function generateSignalFieldsWithLlm() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/signals/generate-fields", {
        method: "POST",
      });
      const body = await response.json() as {
        signalSources?: string[];
        signalRelations?: string[];
        signalOutput?: string;
        logs?: string[];
        error?: string;
      };
      if (!response.ok) {
        setError(body.error ?? "Signal field generation failed");
        setSignalGenerationLog(body.logs ?? []);
        return;
      }
      setState((current) =>
        current
          ? {
              ...current,
              settings: {
                ...current.settings,
                signalSources: body.signalSources ?? current.settings.signalSources,
                signalRelations: body.signalRelations ?? current.settings.signalRelations,
                signalOutput: body.signalOutput ?? current.settings.signalOutput,
              },
            }
          : current,
      );
      setSignalGenerationLog(body.logs ?? ["assistant> signal fields generated"]);
    });
  }

  async function clearSignalsFromDashboard() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/signals/clear", {
        method: "POST",
      });
      const body = await response.json() as { error?: string } | AppState;
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "Signal clear failed");
        return;
      }
      setState(body as AppState);
      setUpdateFeedback("Signals removidos do dashboard.");
    });
  }

  async function submitTrade() {
    if (!state || !selectedIndex) {
      return;
    }
    setError("");
    startTransition(async () => {
      const unitPriceLocal = orderPrice ? Number(orderPrice) : selectedIndex.price / 10;
      const quantity = Number(transactionQuantity);
      const grossLocal = quantity * unitPriceLocal;
      const spotEurToCurrency = state.settings.currencySpots[selectedIndex.currency] ?? 1;
      const spotCurrencyToEur = spotEurToCurrency > 0 ? 1 / spotEurToCurrency : 1;
      const grossEur = grossLocal * spotCurrencyToEur;
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side: transactionMode === "buy" ? "BUY" : "SELL",
          indexId: selectedIndex.id,
          amountValue: transactionMode === "buy" ? grossEur : grossLocal,
          amountMode: transactionMode === "buy" ? "EUR" : "LOCAL",
          unitLimitUsd: orderType === "Market" ? null : unitPriceLocal,
          validUntil: `${timeInForce} · ${validUntil}`,
          source: "manual",
          strategyName: null,
        }),
      });
      const body = await response.json() as { error?: string } | AppState;
      if (!response.ok) {
        setError((body as { error?: string }).error ?? "Trade failed");
        return;
      }
      setState(body as AppState);
      setTransactionOpen(false);
      setActiveTab(transactionReturnTab);
    });
  }

  async function createStrategy() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...strategyDraft,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Strategy creation failed");
        return;
      }
      await loadState();
    });
  }

  async function updateStrategy() {
    if (!editingStrategyId) {
      return;
    }
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/strategies/${editingStrategyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...strategyDraft,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Strategy update failed");
        return;
      }
      await loadState();
    });
  }

  async function generateStrategyIdeasWithLlm() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/strategies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameHint: strategyDraft.name }),
      });
      const body = (await response.json()) as {
        error?: string;
        suggestions?: Array<{
          name: string;
          source: "generated";
          buyCriteria: string;
          sellCriteria: string;
          strategyBrief: string;
        }>;
      };
      if (!response.ok) {
        setError(body.error ?? "Strategy generation failed");
        return;
      }
      setGeneratedStrategyIdeas(body.suggestions ?? []);
      setUpdateFeedback(`Foram geradas ${(body.suggestions ?? []).length} sugestoes de estrategia.`);
    });
  }

  async function copyStrategy(id: string) {
    startTransition(async () => {
      await fetch(`/api/strategies/${id}/copy`, { method: "POST" });
      await loadState();
    });
  }

  async function toggleStrategy(id: string, active: boolean) {
    startTransition(async () => {
      await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      await loadState();
    });
  }

  async function deleteStrategyById(id: string, name: string) {
    if (!window.confirm(`Apagar a estrategia "${name}"?`)) {
      return;
    }
    startTransition(async () => {
      await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      await loadState();
    });
  }

  async function createAgent() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgentName,
          strategyId: newAgentStrategyId,
          budgetEur: Number(newAgentBudget),
          executionMode: newAgentExecutionMode,
          executionHours: Number(newAgentExecutionHours),
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Agent creation failed");
        return;
      }
      setCreateAgentOpen(false);
      setNewAgentName("Agent-New");
      setNewAgentBudget("1000");
      setNewAgentExecutionMode("market_open");
      setNewAgentExecutionHours("6");
      await loadState();
    });
  }

  async function deleteAgentById(id: string, name: string) {
    if (!window.confirm(`Apagar o agente "${name}"?`)) {
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Agent delete failed");
        return;
      }
      await loadState();
    });
  }

  async function clearInactiveAgentLogs() {
    startTransition(async () => {
      const response = await fetch("/api/agents/logs/prune", { method: "POST" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Agent log cleanup failed");
        return;
      }
      await loadState();
      setUpdateFeedback("Logs de agentes parados ou apagados removidos.");
    });
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setUpdateFeedback(`${label} copiado para clipboard.`);
    } catch {
      setError(`Nao foi possivel copiar ${label}.`);
    }
  }

  async function loadSystemExport() {
    const response = await fetch("/api/system/export", { cache: "no-store" });
    const payload = await response.json() as { filePath?: string; logPath?: string; payload?: unknown };
    setSystemPayload(payload.filePath ?? "");
    setSystemExportLog(payload.logPath ?? "");
    setUpdateFeedback(`Exportacao criada em ${payload.filePath ?? "ficheiro local"}.`);
  }

  async function importSystemPayload() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/system/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: systemPayload }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Import failed");
        return;
      }
      await loadState();
      setUpdateFeedback("Importacao concluida sem problemas depois de limpar todas as tabelas.");
    });
  }

  async function controlAgent(agentId: string, action: "start" | "pause" | "cancel") {
    startTransition(async () => {
      await fetch(`/api/agents/${agentId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadState();
    });
  }

  const marketSourceById = useMemo(
    () => new Map(state?.settings.marketDataSources.map((source) => [source.assetId, source]) ?? []),
    [state],
  );
  const signalStateByAssetId = useMemo(
    () => new Map(state?.signalStates.map((item) => [item.assetId, item]) ?? []),
    [state],
  );
  const dashboardIndices = useMemo(
    () => state?.indices.filter((index) => marketSourceById.get(index.id)?.display === "DASH") ?? [],
    [marketSourceById, state],
  );
  const alternativeStockItems = useMemo(
    () =>
      [
        ...(state?.indices
          .filter((index) => marketSourceById.get(index.id)?.display === "ALTER")
          .map((index) => ({
            id: index.id,
            name: index.name,
            symbol: index.symbol,
            currency: index.currency,
            price: index.price,
            changePct: index.changePct,
            ytd: index.ytd,
            volumeLabel: index.volumeLabel,
            market: marketSourceById.get(index.id)?.group ?? index.region,
          })) ?? []),
        ...(state?.alternativeAssets
          .filter((asset) => marketSourceById.get(asset.id)?.display === "ALTER")
          .map((asset) => ({
            ...asset,
            market: marketSourceById.get(asset.id)?.group ?? asset.market,
          })) ?? []),
      ],
    [marketSourceById, state],
  );
  const selectedIndex =
    state?.indices.find((index) => index.id === selectedIndexId) ??
    dashboardIndices[0] ??
    state?.indices[0] ??
    null;
  const selectedAlternative =
    alternativeStockItems.find((asset) => asset.id === selectedAlternativeId) ??
    alternativeStockItems[0] ??
    null;

  const selectedHistory = useMemo(
    () => (selectedIndex ? state?.chartHistory[selectedIndex.id][selectedRange] ?? [] : []),
    [selectedIndex, selectedRange, state],
  );
  const selectedAlternativeHistory = useMemo(
    () =>
      selectedAlternative
        ? state?.alternativeChartHistory[selectedAlternative.id]?.[selectedRange] ??
          state?.chartHistory[selectedAlternative.id]?.[selectedRange] ??
          []
        : [],
    [selectedAlternative, selectedRange, state],
  );
  const selectedPeriodPerformance = useMemo(() => {
    if (!selectedHistory.length) {
      return 0;
    }
    const first = selectedHistory[0].value;
    const last = selectedHistory[selectedHistory.length - 1].value;
    return ((last - first) / first) * 100;
  }, [selectedHistory]);
  const selectedAlternativePerformance = useMemo(() => {
    if (!selectedAlternativeHistory.length) {
      return 0;
    }
    const first = selectedAlternativeHistory[0].value;
    const last = selectedAlternativeHistory[selectedAlternativeHistory.length - 1].value;
    return ((last - first) / first) * 100;
  }, [selectedAlternativeHistory]);

  const portfolioSeries = useMemo(() => {
    if (!state) {
      return [];
    }
    const base = state.portfolio.totalValue - 540;
    const labelsByRange: Record<PortfolioRange, string[]> = {
      "1D": ["09:00", "11:00", "13:00", "15:00", "17:00"],
      "1W": buildLastWeekLabels(),
      "1M": buildLastMonthLabels(),
      YTD: buildYearToDateMonthLabels(),
    };

    return labelsByRange[portfolioRange].map((label, index) => ({
      label,
      value: Number((base + index * 110 + Math.sin(index * 0.75) * 120).toFixed(0)),
    }));
  }, [portfolioRange, state]);

  const portfolioPeriodPerformance = useMemo(() => {
    if (!portfolioSeries.length) {
      return 0;
    }
    const first = portfolioSeries[0].value;
    const last = portfolioSeries[portfolioSeries.length - 1].value;
    return ((last - first) / first) * 100;
  }, [portfolioSeries]);

  const transactionPreview = useMemo(() => {
    if (!selectedIndex || !state) {
      return null;
    }
    const quantity = Number(transactionQuantity || 0);
    const feeEur = state.settings.feePerTrade;
    const spotEurToCurrency = state.settings.currencySpots[selectedIndex.currency] ?? 1;
    const spotCurrencyToEur = spotEurToCurrency > 0 ? 1 / spotEurToCurrency : 1;
    const unitPriceLocal = Number(orderPrice || selectedIndex.price / 10);
    const grossLocal = quantity * unitPriceLocal;
    const grossEur = grossLocal * spotCurrencyToEur;
    const units = quantity > 0 ? quantity : 0;
    const totalBudgetImpact = transactionMode === "buy" ? grossEur + feeEur : Math.max(0, grossEur - feeEur);

    return {
      grossEur,
      grossLocal,
      feeEur,
      unitPriceLocal,
      spotEurToCurrency,
      spotCurrencyToEur,
      units,
      totalBudgetImpact,
    };
  }, [orderPrice, selectedIndex, state, transactionMode, transactionQuantity]);
  const selectedPosition = useMemo(
    () => state?.positions.find((position) => position.indexId === selectedIndexId),
    [selectedIndexId, state],
  );
  const hasPositionForAsset = useCallback(
    (assetId: string) => (state?.positions.find((position) => position.indexId === assetId)?.units ?? 0) > 0,
    [state],
  );
  const selectedMarketOpen = selectedIndex ? isMarketOpenForState(selectedIndex.region) : false;
  const hasTradeBudget =
    !transactionPreview
      ? false
      : transactionMode === "buy"
        ? transactionPreview.totalBudgetImpact <= (state?.wallet.currentBudget ?? 0)
        : transactionPreview.units <= (selectedPosition?.units ?? 0);

  function openTransactionContext(assetId: string, mode: TransactionMode, returnTab?: AppTab) {
    if (!isSuperuser) {
      setError("Apenas superuser pode aceder a Compra/Venda.");
      return;
    }
    const asset = state?.indices.find((index) => index.id === assetId);
    if (asset && !isMarketOpenForState(asset.region)) {
      setUpdateFeedback(`${asset.name} está com o mercado fechado. Nao e possivel transacionar agora.`);
      return;
    }
    const resolvedReturnTab = returnTab ?? activeTab;
    setSelectedIndexId(assetId);
    setTransactionMode(mode);
    setTransactionReturnTab(resolvedReturnTab);
    setTransactionOpen(true);
    setActiveTab(resolvedReturnTab);
  }

  async function decideAgentTrade(proposalId: string, decision: "approve" | "reject") {
    if (!state || !runningAgent) {
      return;
    }
    const response = await fetch("/api/agents/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: runningAgent.id,
        proposalId,
        decision,
      }),
    });
    if (!response.ok) {
      const body = await response.json() as { error?: string };
      setError(body.error ?? "Agent trade failed");
      return;
    }
    setState(await response.json() as AppState);
    setUpdateFeedback(
      decision === "approve"
        ? `Trade do agente ${runningAgent.name} aprovada e executada.`
        : `Trade do agente ${runningAgent.name} rejeitada; novo ciclo iniciado.`,
    );
  }

  const fxRows = useMemo(() => {
    if (!state) {
      return [];
    }
    const uniqueCurrencies = Array.from(
      new Set([
        ...state.indices.map((item) => item.currency),
        ...state.alternativeAssets.map((item) => item.currency === "USD/EUR" ? "USD" : item.currency),
      ]),
    );
    return uniqueCurrencies.map((currency, index) => {
      const spot = state.settings.currencySpots[currency] ?? (currency === "USD" ? state.settings.fxRates.eurUsd : 1);
      const chart = state.fxChartHistory[currency]?.["1W"] ?? buildFxSeries(spot, index);
      const weekChart = chart.slice(-7);
      const firstWeek = weekChart[0]?.value ?? spot;
      const lastWeek = weekChart.at(-1)?.value ?? spot;
      const performancePct = firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0;
      const europeanPower = performancePct > 0;
      return {
        currency,
        spot,
        chart,
        performancePct,
        europeanPower,
        insight: europeanPower ? "Na ultima semana o EUR reforcou face a esta moeda." : "Na ultima semana o EUR enfraqueceu face a esta moeda.",
      };
    });
  }, [state]);
  const selectedFxRow = fxRows.find((row) => row.currency === selectedFxCurrency) ?? fxRows[0] ?? null;
  const overlayHistory =
    state?.chartHistory[overlayAssetId]?.["1D"] ?? state?.alternativeChartHistory[overlayAssetId]?.["1D"] ?? [];
  const overlayItem =
    state?.indices.find((item) => item.id === overlayAssetId) ??
    state?.alternativeAssets.find((item) => item.id === overlayAssetId) ??
    null;
  const fxOverlayRow = fxRows.find((row) => row.currency === fxOverlayCurrency) ?? null;
  const overlayStrategy = state?.strategies.find((strategy) => strategy.id === overlayStrategyId) ?? null;

  if (!state || !selectedIndex || !selectedAlternative || !transactionPreview) {
    return (
      <main className="min-h-screen px-4 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 text-center">
          Loading SimStock...
        </div>
      </main>
    );
  }

  const selectedStatus = state.settings.marketMode === "DEBUG"
    ? { isOpen: true, label: "DEBUG open", localTime: "forced" }
    : getRegionStatus(selectedIndex.region);
  const selectedLlmProvider =
    state.settings.llmProfiles.find((profile) => profile.id === activeLlmProviderTab) ??
    state.settings.llmProfiles[0];
  const runningAgent = state.agents.find((agent) => agent.status === "running") ?? null;
  const runningAgentProposals = runningAgent
    ? (state.agentTradeShortlist?.proposals ?? []).filter((proposal) => proposal.agentId === runningAgent.id && proposal.status === "pending")
    : [];
  const agentDecisionOverlayProposals = (state.agentTradeShortlist?.proposals ?? []).filter(
    (proposal) => proposal.agentId === agentDecisionOverlayAgentId && proposal.status === "pending",
  );
  const selectedAgentForLogs =
    state.agents.find((agent) => agent.id === selectedAgentLogId) ??
    runningAgent ??
    state.agents[0] ??
    null;
  const selectedAgentLogs = selectedAgentForLogs
    ? state.agentLogs.filter((log) => log.agentId === selectedAgentForLogs.id)
    : [];
  const lastRefreshByAsset = (() => {
    const map = new Map<string, string>();
    for (const log of state.activityLogs) {
      if (log.category === "market" && log.action === "refresh" && log.status === "success" && log.entityId && !map.has(log.entityId)) {
        map.set(log.entityId, log.timestamp);
      }
    }
    return map;
  })();
  const lastGlobalRefresh =
    state.activityLogs.find((log) => log.category === "market" && log.action === "refresh" && log.status === "success" && log.entityId === "all")?.timestamp ??
    "sem refresh global";
  const getLlmTestStatus = (profileId: string) => {
    const logs = llmTests[profileId] ?? [];
    if (logs.some((line) => line.toLowerCase().includes("error>"))) {
      return "offline";
    }
    if (logs.some((line) => line.toLowerCase().includes("assistant>") || line.toLowerCase().includes("teste ok"))) {
      return "online";
    }
    return "untested";
  };

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(13,38,49,0.96),rgba(7,23,34,0.78))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-200/90">
              <Sparkles size={14} />
              {state.version}
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-200">
                <User size={16} />
                <select
                  value={state.activeUserId}
                  onChange={(event) => void selectUserProfile(event.target.value)}
                  className="bg-transparent text-sm text-slate-100 outline-none"
                >
                  {state.users.map((user) => (
                    <option key={user.id} value={user.id} className="bg-slate-900 text-white">
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              {isSuperuser ? (
                <>
                  <button
                    type="button"
                    onClick={() => void refreshIndices()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    <RefreshCcw size={16} />
                    Refresh indices
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("backoffice")}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                      effectiveActiveTab === "backoffice"
                        ? "border-emerald-300/30 bg-emerald-300/15 text-white"
                        : "border-white/10 bg-white/6 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <Cog size={16} />
                    Backoffice
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <X size={16} />
                Logout
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">SimStock</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Full stack local para ETFs com SQLite, API local, carteira em EUR, ordens em USD,
              ledger persistente, estratégias e múltiplos agentes.
            </p>
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
              Utilizador ativo: {activeUser?.name ?? "N/A"} · {isSuperuser ? "Superuser" : "View only"}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "LLM ativo", value: state.llmRuntime.active },
                { label: "Signals", value: state.llmRuntime.signals },
                { label: "Strategies", value: state.llmRuntime.strategyGeneration },
                { label: "URL extraction", value: state.llmRuntime.marketExtraction },
              ].map((item) => (
                <div
                  key={item.label}
                  title={item.value.reason}
                  className={`rounded-2xl border px-3 py-2 text-xs ${
                    item.value.fallbackUsed
                      ? "border-amber-400/25 bg-amber-300/10 text-amber-100"
                      : "border-emerald-400/25 bg-emerald-300/10 text-emerald-100"
                  }`}
                >
                  <div className="uppercase tracking-[0.18em] text-[10px] opacity-75">{item.label}</div>
                  <div className="mt-1 font-medium">{item.value.name}</div>
                  <div className="opacity-80">{item.value.model}{item.value.fallbackUsed ? " · fallback" : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
        {updateFeedback ? (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            {updateFeedback}
          </div>
        ) : null}
        <nav className="flex flex-wrap gap-2">
            {visibleAppTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                effectiveActiveTab === tab.id
                  ? "border-emerald-300/30 bg-emerald-300/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/8"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {effectiveActiveTab === "dashboard" ? (
          <>
            <section className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,32,43,0.82),rgba(7,19,28,0.88))] p-5 shadow-[0_22px_56px_rgba(0,0,0,0.25)] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Quick selectors</p>
                  <h2 className="mt-1 text-xl font-semibold">Stock items em dashboard</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isSuperuser ? (
                    <button
                      type="button"
                      onClick={() => void clearSignalsFromDashboard()}
                      className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                    >
                      Clear signals
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowAllStockItems((current) => !current)}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                  >
                    {showAllStockItems ? "Fechar" : "Ver mais"}
                  </button>
                  <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">
                    Auto refresh {state.settings.autoRefreshMinutes} min
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">
                    Last refresh {lastGlobalRefresh}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                {dashboardIndices.map((index) => {
                  const status = state.settings.marketMode === "DEBUG"
                    ? { isOpen: true, label: "DEBUG open" }
                    : getRegionStatus(index.region);
                  const source = marketSourceById.get(index.id);
                  const signalState = signalStateByAssetId.get(index.id);
                  return (
                    <div
                      key={index.id}
                      className={`rounded-[16px] border px-2.5 py-2.5 text-left transition ${
                        selectedIndex.id === index.id
                          ? "border-emerald-300/25 bg-emerald-300/10"
                          : status.isOpen
                            ? "border-emerald-300/18 bg-emerald-300/6 hover:border-emerald-300/28 hover:bg-emerald-300/10"
                          : "border-rose-900/45 bg-rose-950/28 hover:border-rose-800/60 hover:bg-rose-950/38"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button type="button" onClick={() => setSelectedIndexId(index.id)} className="text-left">
                          <div className="text-[13px] font-medium leading-4.5">{index.name}</div>
                          <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-400">
                            {source?.group ?? index.region} · {index.currency}
                          </div>
                          <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
                            status.isOpen
                              ? "bg-emerald-300/15 text-emerald-200"
                              : "bg-rose-300/15 text-rose-200"
                          }`}>
                            {index.region} market · {status.isOpen ? "open" : "closed"}
                          </div>
                        </button>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`mt-0.5 inline-flex h-2 w-2 rounded-full ${status.isOpen ? "bg-emerald-300 shadow-[0_0_14px_rgba(132,240,194,0.85)]" : "bg-slate-500"}`} />
                          {status.isOpen ? (
                            <span className="rounded-full bg-emerald-300/18 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-emerald-200">
                              Open
                            </span>
                          ) : null}
                          {signalState ? (
                            <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
                              signalState.action === "buy"
                                ? "bg-emerald-300/15 text-emerald-200"
                                : signalState.action === "sell"
                                  ? "bg-rose-300/15 text-rose-200"
                                  : "bg-white/8 text-slate-300"
                            }`}>
                              {signalState.action}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-200">{formatMoney(index.price, index.currency)}</div>
                      <div className={`mt-0.5 text-[11px] ${index.changePct >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{formatPct(index.changePct)}</div>
                      {status.isOpen && isSuperuser ? (
                        <div className="mt-2 flex gap-2">
                          <button type="button" onClick={() => openTransactionContext(index.id, "buy")} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-950">
                            Buy
                          </button>
                          {hasPositionForAsset(index.id) ? (
                            <button type="button" onClick={() => openTransactionContext(index.id, "sell")} className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] text-slate-200">
                              Sell
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {showAllStockItems ? (
                <div className="mt-4 overflow-hidden rounded-[22px] border border-white/8">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/6 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Stock item</th>
                        <th className="px-4 py-3 font-medium">Group</th>
                        <th className="px-4 py-3 font-medium">Signal</th>
                        <th className="px-4 py-3 font-medium">Currency</th>
                        <th className="px-4 py-3 font-medium">Current</th>
                        <th className="px-4 py-3 font-medium">Last refresh</th>
                        <th className="px-4 py-3 font-medium">Day view</th>
                        <th className="px-4 py-3 font-medium">Refresh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.settings.marketDataSources.map((source) => {
                        const index = state.indices.find((item) => item.id === source.assetId);
                        const alternative = state.alternativeAssets.find((item) => item.id === source.assetId);
                        const signalState = signalStateByAssetId.get(source.assetId);
                        const currentValue = index?.price ?? alternative?.price ?? 0;
                        const currentCurrency = index?.currency ?? alternative?.currency ?? "USD";
                        const marketOpen = index ? isMarketOpenForState(index.region) : true;
                        const marketLabel = index ? `${index.region} market` : `${alternative?.market ?? source.group} market`;
                        return (
                          <tr key={`all-${source.assetId}`} className={`border-t border-white/8 ${marketOpen ? "bg-emerald-300/5" : "bg-rose-950/28"}`}>
                            <td className="px-4 py-3 text-white">
                              <div>{source.label}</div>
                              <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                                marketOpen
                                  ? "bg-emerald-300/15 text-emerald-200"
                                  : "bg-rose-300/15 text-rose-200"
                              }`}>
                                {marketLabel} · {marketOpen ? "open" : "closed"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{source.group}</td>
                            <td className="px-4 py-3 text-slate-300">
                              {signalState ? (
                                <span className={`rounded-full px-3 py-1 text-xs uppercase ${
                                  signalState.action === "buy"
                                    ? "bg-emerald-300/15 text-emerald-200"
                                    : signalState.action === "sell"
                                      ? "bg-rose-300/15 text-rose-200"
                                      : "bg-white/8 text-slate-300"
                                }`}>
                                  {signalState.action}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">none</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-300">{currentCurrency}</td>
                            <td className="px-4 py-3 text-slate-300">{formatMoney(currentValue, currentCurrency)}</td>
                            <td className="px-4 py-3 text-slate-300">{lastRefreshByAsset.get(source.assetId) ?? "-"}</td>
                            <td className="px-4 py-3 text-slate-300">
                              <ActionChip onClick={() => setOverlayAssetId(source.assetId)}><ChartCandlestick size={14} /> Open</ActionChip>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              <div className="flex flex-wrap gap-2">
                                {isSuperuser && index && marketOpen ? <ActionChip onClick={() => openTransactionContext(source.assetId, "buy")}><ArrowRightLeft size={14} /> Buy</ActionChip> : null}
                                {isSuperuser && index && marketOpen && hasPositionForAsset(source.assetId) ? <ActionChip onClick={() => openTransactionContext(source.assetId, "sell")}><ArrowRightLeft size={14} /> Sell</ActionChip> : null}
                                {isSuperuser ? <ActionChip onClick={() => void refreshMarketAsset(source.assetId)}><RefreshCcw size={14} /> Update</ActionChip> : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
              <Panel>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-xs text-slate-300">
                        {selectedIndex.region} · {selectedIndex.symbol} · {selectedIndex.etfTicker} · {selectedIndex.currency}
                      </div>
                      <h3 className="text-2xl font-semibold">{selectedIndex.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                        <span>{selectedIndex.etfName}</span>
                        <StatusPill open={selectedStatus.isOpen}>{selectedStatus.label} · {selectedStatus.localTime}</StatusPill>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isSuperuser ? <ActionChip onClick={() => void refreshMarketAsset(selectedIndex.id)}><RefreshCcw size={14} /> Update item</ActionChip> : null}
                      {indexRanges.map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setSelectedRange(range)}
                          className={`rounded-full px-3 py-1.5 text-xs tracking-wide transition ${
                            selectedRange === range ? "bg-white text-slate-950" : "bg-white/6 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <StatCard label="Preco" value={formatMoney(selectedIndex.price, selectedIndex.currency)} tone="neutral" />
                    <StatCard label="Volume" value={selectedIndex.volumeLabel} tone="neutral" />
                    <StatCard label="Daily change" value={formatPct(selectedIndex.changePct)} tone={selectedIndex.changePct >= 0 ? "positive" : "negative"} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                  {isSuperuser ? <ActionChip onClick={() => openTransactionContext(selectedIndex.id, "buy")}><ArrowRightLeft size={14} /> Comprar</ActionChip> : null}
                  {isSuperuser && hasPositionForAsset(selectedIndex.id) ? (
                    <ActionChip onClick={() => openTransactionContext(selectedIndex.id, "sell")}><ArrowRightLeft size={14} /> Vender</ActionChip>
                  ) : null}
                    {signalStateByAssetId.get(selectedIndex.id) ? (
                      <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">
                        Signal {signalStateByAssetId.get(selectedIndex.id)?.action} · {signalStateByAssetId.get(selectedIndex.id)?.confidence.toFixed(0)}%
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Performance do periodo escolhido</div>
                        <div className={`mt-2 text-2xl font-semibold ${selectedPeriodPerformance >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{formatPct(selectedPeriodPerformance)}</div>
                      </div>
                      <div className="text-right text-xs leading-6 text-slate-400">
                        <div>{selectedRange === "YTD" ? `De Jan ate ${currentMonthLabel()}` : null}</div>
                        <div>{selectedRange === "1W" ? "Escala semanal usa datas" : null}</div>
                        <div>{selectedRange === "1M" ? "Ultimos 30 dias ate hoje" : null}</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[320px] rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(92,233,186,0.16),transparent_38%),rgba(2,9,14,0.45)] p-4">
                    <MarketChart data={selectedHistory} />
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Analyst suggestion</p>
                    <h3 className="mt-1 text-xl font-semibold">Signal engine</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionChip onClick={() => void runSignals()}><RefreshCcw size={14} /> Refresh insights</ActionChip>
                    <button
                      type="button"
                      title={state.signalsMeta.promptPreview ?? "Prompt indisponivel."}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
                    >
                      <CircleHelp size={14} />
                    </button>
                    <Bot size={18} className="text-emerald-200" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <div>Last refresh: {state.signalsMeta.lastRunAt ?? "not yet executed"}</div>
                  <div>Status: {state.signalsMeta.status}</div>
                </div>
                <div className="mt-4 grid gap-2">
                  {state.signals.map((signal) => (
                    <div key={signal.id} className="rounded-[18px] border border-white/8 bg-white/4 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-white">{signal.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {(state.indices.find((item) => item.id === signal.assetId)?.name ?? state.alternativeAssets.find((item) => item.id === signal.assetId)?.name ?? signal.assetId)} · {signal.source}
                          </div>
                        </div>
                        <div className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${
                          signal.actionBias === "buy"
                            ? "bg-emerald-300/15 text-emerald-200"
                            : signal.actionBias === "sell"
                              ? "bg-rose-300/15 text-rose-200"
                              : "bg-white/8 text-slate-300"
                        }`}>
                          {signal.actionBias}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-300">{signal.summary}</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{signal.driver}</span>
                        <span>{signal.confidence.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[24px] border border-emerald-300/15 bg-emerald-300/8 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-emerald-100/80">Current suggestion</div>
                      <div className="mt-2 text-2xl font-semibold">{state.analystSuggestion.etfTicker}</div>
                    </div>
                    <div className="rounded-full bg-slate-950/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-100">
                      {state.analystSuggestion.action}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-100/90">{state.analystSuggestion.rationale}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>Confidence {state.analystSuggestion.confidence.toFixed(0)}%</span>
                    <span>{formatCurrency(state.analystSuggestion.suggestedAmountEur)}</span>
                  </div>
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <Panel>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Alternative markets</p>
                    <h3 className="mt-1 text-xl font-semibold">Stock items em alternativa</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">
                    View only
                  </div>
                </div>
                <div className="mt-5 grid gap-2">
                  {alternativeStockItems.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAlternativeId(asset.id)}
                      className={`rounded-[18px] border px-3 py-3 text-left transition ${
                        selectedAlternative.id === asset.id
                          ? "border-amber-300/25 bg-amber-300/10"
                          : "border-white/8 bg-white/4 hover:border-white/14 hover:bg-white/6"
                      }`}
                    >
                      <div className="text-sm font-medium">{asset.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        {asset.market} · {asset.symbol} · {asset.currency}
                      </div>
                      <div className="mt-1 inline-flex rounded-full bg-emerald-300/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                        {asset.market} market · open
                      </div>
                      <div className="mt-3 text-xs text-slate-200">{formatMoney(asset.price, asset.currency)}</div>
                      <div className={`mt-1 text-xs ${asset.changePct >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                        {formatPct(asset.changePct)}
                      </div>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-xs text-slate-300">
                        {selectedAlternative.market} · {selectedAlternative.symbol} · {selectedAlternative.currency}
                      </div>
                      <h3 className="text-2xl font-semibold">{selectedAlternative.name}</h3>
                      <div className="mt-2 text-sm text-slate-300">Alternative asset monitorizado como benchmark visual.</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isSuperuser ? <ActionChip onClick={() => void refreshMarketAsset(selectedAlternative.id)}><RefreshCcw size={14} /> Update item</ActionChip> : null}
                      {indexRanges.map((range) => (
                        <button
                          key={`alt-${range}`}
                          type="button"
                          onClick={() => setSelectedRange(range)}
                          className={`rounded-full px-3 py-1.5 text-xs tracking-wide transition ${
                            selectedRange === range ? "bg-white text-slate-950" : "bg-white/6 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Preco" value={formatMoney(selectedAlternative.price, selectedAlternative.currency)} tone="neutral" />
                    <StatCard label="Mercado" value={selectedAlternative.market} tone="neutral" />
                    <StatCard
                      label="Currency"
                      value={selectedAlternative.currency}
                      tone="neutral"
                    />
                    <StatCard
                      label="Daily change"
                      value={formatPct(selectedAlternative.changePct)}
                      tone={selectedAlternative.changePct >= 0 ? "positive" : "negative"}
                    />
                  </div>

                  <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Performance do periodo escolhido</div>
                        <div className={`mt-2 text-2xl font-semibold ${selectedAlternativePerformance >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                          {formatPct(selectedAlternativePerformance)}
                        </div>
                      </div>
                      <div className="text-right text-xs leading-6 text-slate-400">
                        <div>Commodities declaradas no backoffice</div>
                        <div>{selectedRange === "YTD" ? `De Jan ate ${currentMonthLabel()}` : null}</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[320px] rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(245,180,80,0.15),transparent_38%),rgba(2,9,14,0.45)] p-4">
                    <MarketChart data={selectedAlternativeHistory} />
                  </div>
                </div>
              </Panel>
            </section>
          </>
        ) : null}

        {effectiveActiveTab === "wallet" ? (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TopMetric label="Carteira atual" value={formatCurrency(state.portfolio.totalValue)} detail={`${formatPct(state.portfolio.performancePct)} vs budget inicial`} icon={<Wallet size={16} />} />
                <TopMetric label="Budget livre" value={formatCurrency(state.wallet.currentBudget)} detail="Persistido em SQLite" icon={<CircleDollarSign size={16} />} />
                <TopMetric label="Investido" value={formatCurrency(state.portfolio.investedAmount)} detail={`Fees ${formatCurrency(state.portfolio.fees)}`} icon={<ChartCandlestick size={16} />} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Performance da carteira</p>
                  <h3 className="mt-1 text-xl font-semibold">Budget atual, fees e investido</h3>
                </div>
                <Wallet size={18} className="text-slate-300" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {portfolioRanges.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setPortfolioRange(range)}
                    className={`rounded-full px-3 py-1.5 text-xs tracking-wide transition ${
                      portfolioRange === range ? "bg-white text-slate-950" : "bg-white/6 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {range}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPortfolioChartType("area")}
                    className={`rounded-full px-3 py-1.5 text-xs tracking-wide transition ${
                      portfolioChartType === "area" ? "bg-white text-slate-950" : "bg-white/6 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortfolioChartType("bar")}
                    className={`rounded-full px-3 py-1.5 text-xs tracking-wide transition ${
                      portfolioChartType === "bar" ? "bg-white text-slate-950" : "bg-white/6 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Bars
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Performance da carteira no periodo</div>
                    <div className={`mt-2 text-2xl font-semibold ${portfolioPeriodPerformance >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{formatPct(portfolioPeriodPerformance)}</div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {portfolioRange === "YTD" ? `De Jan ate ${currentMonthLabel()}` : "Escala alinhada ao periodo"}
                  </div>
                </div>
              </div>

              <div className="mt-5 h-[280px] rounded-[24px] border border-white/8 bg-white/4 p-4">
                {portfolioChartType === "area" ? <MarketChart data={portfolioSeries} /> : <PerformanceBarChart data={portfolioSeries} />}
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Open positions</p>
                  <h3 className="mt-1 text-xl font-semibold">Carteira por ETF</h3>
                </div>
                <CircleDollarSign size={18} className="text-slate-300" />
              </div>
              <div className="mt-5 grid gap-3">
                {state.portfolio.openPositions.map((position) => (
                  <div key={position.indexId} className="grid gap-3 rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 md:grid-cols-[0.9fr_1fr_0.8fr_0.8fr]">
                    <div>
                      <div className="font-medium">{position.etfTicker}</div>
                      <div className="text-xs text-slate-400">{position.indexName}</div>
                    </div>
                    <div className="text-sm text-slate-300">{position.units.toFixed(4)} units</div>
                    <div className="text-sm">${position.currentPriceUsd.toFixed(2)}</div>
                    <div className="text-sm">{formatCurrency(position.marketValueEur)}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {effectiveActiveTab === "fx" ? (
          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">FX Conversion</p>
                <h3 className="mt-1 text-xl font-semibold">EUR para moedas dos stock items</h3>
              </div>
              <CircleDollarSign size={18} className="text-slate-300" />
            </div>
            {selectedFxRow ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MiniMetric label="FX selecionado" value={`EUR/${selectedFxRow.currency}`} />
                <MiniMetric label="Spot atual" value={`1 EUR = ${selectedFxRow.spot.toFixed(4)} ${selectedFxRow.currency}`} />
                <MiniMetric label="Poder na Europa" value={selectedFxRow.europeanPower ? "A ganhar poder" : "A perder poder"} />
              </div>
            ) : null}
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/6 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Currency</th>
                    <th className="px-4 py-3 font-medium">Spot</th>
                    <th className="px-4 py-3 font-medium">Europa</th>
                    <th className="px-4 py-3 font-medium">Periodo</th>
                    <th className="px-4 py-3 font-medium">Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {fxRows.map((row) => (
                    <tr
                      key={row.currency}
                      className={`border-t border-white/8 bg-slate-950/20 transition hover:bg-white/6 ${selectedFxCurrency === row.currency ? "bg-white/8" : ""}`}
                    >
                      <td className="px-4 py-3 text-white">
                        <button type="button" onClick={() => setSelectedFxCurrency(row.currency)} className="text-left hover:text-emerald-200">
                          {row.currency}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-300">1 EUR = {row.spot.toFixed(4)} {row.currency}</td>
                      <td className={`px-4 py-3 ${row.europeanPower ? "text-emerald-200" : "text-rose-200"}`}>
                        {row.europeanPower ? "Mais favoravel" : "Menos favoravel"}
                      </td>
                      <td className={`px-4 py-3 ${row.performancePct >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                        {formatPct(row.performancePct)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <ActionChip onClick={() => {
                          setSelectedFxCurrency(row.currency);
                          setFxOverlayCurrency(row.currency);
                        }}><ChartCandlestick size={14} /> Ver grafico</ActionChip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedFxRow ? (
              <div className="mt-5 rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">Leitura para um investidor europeu</div>
                    <div className="mt-1 text-sm text-slate-300">{selectedFxRow.insight}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs ${selectedFxRow.europeanPower ? "bg-emerald-300/15 text-emerald-200" : "bg-rose-300/15 text-rose-200"}`}>
                    {selectedFxRow.europeanPower ? "Gain power" : "Lose power"}
                  </div>
                </div>
              </div>
            ) : null}
          </Panel>
        ) : null}

        {effectiveActiveTab === "transactions" ? (
          <section className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,32,43,0.82),rgba(7,19,28,0.88))] p-5 shadow-[0_22px_56px_rgba(0,0,0,0.25)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Ledger</p>
                <h3 className="mt-1 text-xl font-semibold">Registo persistente de transacoes</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">
                {state.trades.length} entries
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {state.trades.map((trade) => (
                <LedgerRow key={trade.id} trade={trade} />
              ))}
            </div>
          </section>
        ) : null}

        {isSuperuser && effectiveActiveTab === "buySell" ? (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Compra/Venda</p>
                  <h3 className="mt-1 text-xl font-semibold">Trading manual contextualizado</h3>
                </div>
                <ArrowRightLeft size={18} className="text-slate-300" />
              </div>
              <div className="mt-5 rounded-[28px] border border-white/8 bg-white/4 p-5">
                <div className="text-sm text-slate-300">
                  Escolhe um stock item se entraste sem contexto. Se vieres de outro ponto da app, mantemos o stock item anterior e a janela regressa ao ponto de chamada.
                </div>
                <label className="mt-4 block rounded-[24px] border border-white/8 bg-white/4 p-4">
                  <div className="text-sm font-medium">Stock item</div>
                  <select
                    value={selectedIndex.id}
                    onChange={(event) => setSelectedIndexId(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  >
                    {state.indices.map((index) => (
                      <option key={index.id} value={index.id}>
                        {index.name} · {index.etfTicker}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-5 grid gap-3">
                  <QuickButton onClick={() => openTransactionContext(selectedIndex.id, "buy", "trade")}>
                    Comprar {selectedIndex.etfTicker}
                  </QuickButton>
                  {hasPositionForAsset(selectedIndex.id) ? (
                    <QuickButton onClick={() => openTransactionContext(selectedIndex.id, "sell", "trade")}>
                      Vender {selectedIndex.etfTicker}
                    </QuickButton>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <MiniMetric label="Budget livre" value={formatCurrency(state.wallet.currentBudget)} />
                  <MiniMetric label="Fee por transacao" value={formatCurrency(state.settings.feePerTrade)} />
                  <MiniMetric label="Valor stock item em EUR" value={formatCurrency((selectedIndex.price / 10) * (1 / (state.settings.currencySpots[selectedIndex.currency] ?? 1)))} />
                  <MiniMetric label="Validade" value={validUntil} />
                </div>
              </div>
            </Panel>

            <Panel>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Selected asset</p>
                    <h3 className="mt-1 text-xl font-semibold">{selectedIndex.name}</h3>
                </div>
                <StatusPill open={selectedStatus.isOpen}>{selectedStatus.label}</StatusPill>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <StatCard label="ETF" value={selectedIndex.etfTicker} tone="neutral" />
                <StatCard label="Price index" value={formatCurrency(selectedIndex.price * (1 / (state.settings.currencySpots[selectedIndex.currency] ?? 1)))} tone="neutral" />
                <StatCard label="Daily change" value={formatPct(selectedIndex.changePct)} tone={selectedIndex.changePct >= 0 ? "positive" : "negative"} />
                <StatCard label="Order ref. EUR" value={formatCurrency(transactionPreview.unitPriceLocal * (1 / (state.settings.currencySpots[selectedIndex.currency] ?? 1)))} tone="neutral" />
              </div>
            </Panel>
          </section>
        ) : null}

        {isSuperuser && effectiveActiveTab === "trade" ? (
          <section className={`grid gap-6 ${runningAgent && runningAgentProposals.length > 0 ? "lg:grid-cols-[1.15fr_0.85fr]" : ""}`}>
            <Panel>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">AutoTrade</p>
                  <h3 className="mt-1 text-xl font-semibold">Caminho do agente e decisoes pendentes</h3>
                </div>
                <Bot size={18} className="text-emerald-200" />
              </div>
              <div className="mt-4 rounded-[24px] border border-white/8 bg-white/4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Gerir agentes</div>
                  <button
                    type="button"
                    onClick={() => setCreateAgentOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                  >
                    <Plus size={14} />
                    Create new agent
                  </button>
                </div>
                <div className="mt-4 text-sm text-slate-300">
                  Cria um agente numa janela dedicada com nome, estratégia, budget e modo de execução.
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-[22px] border border-white/8">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/6 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Agent</th>
                      <th className="px-4 py-3 font-medium">Strategy</th>
                      <th className="px-4 py-3 font-medium">Budget</th>
                      <th className="px-4 py-3 font-medium">Loop</th>
                      <th className="px-4 py-3 font-medium">Step</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.agents.length > 0 ? state.agents.map((agent) => (
                      <tr key={agent.id} className="border-t border-white/8 bg-slate-950/20">
                        <td className="px-4 py-3 text-white">
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-slate-400">{agent.executionMode === "hours" ? `${agent.executionHours}h` : "Mercado aberto"}</div>
                          {((state.agentTradeShortlist?.proposals ?? []).filter((proposal) => proposal.agentId === agent.id && proposal.status === "pending").length > 0) ? (
                            <button
                              type="button"
                              onClick={() => setAgentDecisionOverlayAgentId(agent.id)}
                              className="mt-2 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100"
                            >
                              {((state.agentTradeShortlist?.proposals ?? []).filter((proposal) => proposal.agentId === agent.id && proposal.status === "pending").length)} action pending
                            </button>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <button
                            type="button"
                            onClick={() => setOverlayStrategyId(agent.strategyId)}
                            className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                          >
                            {agent.strategyName}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{formatCurrency(agent.budgetEur)}</td>
                        <td className="px-4 py-3 text-slate-300">{agent.loopCount}</td>
                        <td className="px-4 py-3 text-slate-300">
                          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-200">
                            {humanizeAgentStep(agent.currentStep)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <span className={`rounded-full px-3 py-1 text-xs ${
                            agent.status === "running"
                              ? "bg-emerald-300/15 text-emerald-200"
                              : agent.status === "paused"
                                ? "bg-amber-300/15 text-amber-200"
                                : "bg-rose-300/15 text-rose-200"
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <ActionChip onClick={() => void controlAgent(agent.id, "start")}><PlayCircle size={14} /> Start</ActionChip>
                            <ActionChip onClick={() => void controlAgent(agent.id, "pause")}><PauseCircle size={14} /> Pause</ActionChip>
                            <ActionChip onClick={() => void controlAgent(agent.id, "cancel")}><Square size={14} /> Cancel</ActionChip>
                            <ActionChip onClick={() => void deleteAgentById(agent.id, agent.name)}><X size={14} /> Delete</ActionChip>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr className="border-t border-white/8 bg-slate-950/20">
                        <td colSpan={7} className="px-4 py-4 text-slate-400">Sem agentes configurados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-[22px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">Logs por agente</div>
                  <ActionChip onClick={() => void clearInactiveAgentLogs()}><Trash2 size={14} /> Clear stopped/deleted</ActionChip>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentLogId(agent.id)}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        selectedAgentForLogs?.id === agent.id
                          ? "bg-white text-slate-950"
                          : agent.status === "running"
                            ? "border border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                            : "border border-white/10 bg-white/6 text-slate-300"
                      }`}
                    >
                      {agent.name} · {agent.status}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-3">
                  {selectedAgentLogs.map((log) => (
                    <div key={log.id} className="rounded-[20px] border border-white/8 bg-slate-950/25 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-white">
                          {selectedAgentForLogs?.name ?? log.agentId}
                        </div>
                        <div className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
                          {log.action}
                        </div>
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {log.strategyName}{log.etfTicker ? ` · ${log.etfTicker}` : ""}
                      </div>
                      <div className="mt-3 text-sm leading-7 text-slate-300">{log.explanation}</div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>Confidence {log.confidence.toFixed(0)}%</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  {!selectedAgentLogs.length ? (
                    <div className="rounded-[20px] border border-white/8 bg-slate-950/25 px-4 py-4 text-sm text-slate-400">
                      Sem logs para o agente selecionado.
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>

          </section>
        ) : null}

        {isSuperuser && effectiveActiveTab === "strategies" ? (
          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Strategies</p>
                <h3 className="mt-1 text-xl font-semibold">Criar, editar e copiar estrategias</h3>
              </div>
              <Copy size={18} className="text-slate-300" />
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/6 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Origem</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {state.strategies.map((strategy) => (
                    <tr key={strategy.id} className="border-t border-white/8 bg-slate-950/20">
                      <td className="px-4 py-3 text-white">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStrategyId(strategy.id);
                            hydrateStrategyDraft(strategy);
                          }}
                          className="text-left hover:text-emerald-200"
                        >
                          {strategy.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className={`rounded-full px-3 py-1 text-xs ${strategy.source === "generated" ? "bg-emerald-300/15 text-emerald-200" : "bg-white/8 text-slate-300"}`}>
                          {strategy.source === "generated" ? "Generated" : "Manual"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{strategy.active === 0 ? "Inactive" : "Active"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void copyStrategy(strategy.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300"
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                          <ActionChip onClick={() => void toggleStrategy(strategy.id, strategy.active === 0)}>
                            {strategy.active === 0 ? "Activate" : "Disable"}
                          </ActionChip>
                          <ActionChip onClick={() => void deleteStrategyById(strategy.id, strategy.name)}>
                            <X size={14} /> Delete
                          </ActionChip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <ActionChip onClick={() => void generateStrategyIdeasWithLlm()}><Sparkles size={14} /> Gerar com LLM</ActionChip>
                <button
                  type="button"
                  title="Prompt de geracao: cria 3 estrategias fortes considerando fees, FX, sinais, status de mercado, momentum, YTD, commodities e exposicao geografica."
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
                >
                  <CircleHelp size={14} />
                </button>
                <div className="text-xs text-slate-400">
                  O pedido usa o LLM ativo e inclui hints de fees, FX, sinais, stock items, commodities e contexto de carteira para sugerir estrategias fortes.
                </div>
              </div>
              {generatedStrategyIdeas.length ? (
                <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                  <div className="text-sm font-medium text-white">Sugestoes geradas</div>
                  <div className="mt-3 grid gap-3">
                    {generatedStrategyIdeas.map((idea, index) => (
                      <button
                        key={`${idea.name}-${index}`}
                        type="button"
                        onClick={() => setStrategyDraft({
                          name: idea.name,
                          source: "generated",
                          buyCriteria: idea.buyCriteria,
                          sellCriteria: idea.sellCriteria,
                          strategyBrief: idea.strategyBrief,
                        })}
                        className="rounded-[20px] border border-white/8 bg-slate-950/25 px-4 py-4 text-left transition hover:border-emerald-300/25 hover:bg-emerald-300/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-white">{idea.name}</div>
                          <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs text-emerald-200">Apply</span>
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">Generated strategy</div>
                        <div className="mt-2 text-sm text-slate-300">{idea.strategyBrief}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <FieldBlock label="Strategy name" value={strategyDraft.name} onChange={(value) => setStrategyDraft((current) => ({ ...current, name: value }))} />
              <label className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="text-sm font-medium">Origem da estrategia</div>
                <select
                  value={strategyDraft.source}
                  onChange={(event) => setStrategyDraft((current) => ({ ...current, source: event.target.value as "manual" | "generated" }))}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                >
                  <option value="manual">Manual</option>
                  <option value="generated">Generated</option>
                </select>
              </label>
              <TextAreaBlock label="Buy criteria" value={strategyDraft.buyCriteria} onChange={(value) => setStrategyDraft((current) => ({ ...current, buyCriteria: value }))} />
              <TextAreaBlock label="Sell criteria" value={strategyDraft.sellCriteria} onChange={(value) => setStrategyDraft((current) => ({ ...current, sellCriteria: value }))} />
              <TextAreaBlock label="Strategy brief" value={strategyDraft.strategyBrief} onChange={(value) => setStrategyDraft((current) => ({ ...current, strategyBrief: value }))} />
              <div className="flex flex-wrap gap-3">
                <ActionChip onClick={() => void createStrategy()}><Plus size={14} /> Create</ActionChip>
                <ActionChip onClick={() => void updateStrategy()}><Save size={14} /> Save</ActionChip>
              </div>
            </div>
          </Panel>
        ) : null}

        {isSuperuser && effectiveActiveTab === "backoffice" ? (
          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Backoffice</p>
                <h3 className="mt-1 text-xl font-semibold">Configuracoes operacionais por tema</h3>
              </div>
              <Cog size={18} className="text-slate-300" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {backofficeTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBackofficeTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    backofficeTab === tab.id
                      ? "bg-white text-slate-950"
                      : "border border-white/10 bg-white/6 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {backofficeTab === "llms" ? (
              <div className="mt-5 grid gap-4">
                <div className="flex flex-wrap gap-2">
                  {state.settings.llmProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setActiveLlmProviderTab(profile.id ?? "")}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        (profile.id ?? "") === (selectedLlmProvider?.id ?? "")
                          ? "bg-white text-slate-950"
                          : "border border-white/10 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {profile.name ?? profile.provider}
                    </button>
                  ))}
                </div>
                {selectedLlmProvider ? (
                  <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-medium text-white">{selectedLlmProvider.name ?? selectedLlmProvider.model}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {selectedLlmProvider.provider} · {selectedLlmProvider.model} · {selectedLlmProvider.local ? "Local" : "Remote"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill open={getLlmTestStatus(selectedLlmProvider.id ?? "") === "online"}>
                          {getLlmTestStatus(selectedLlmProvider.id ?? "") === "online"
                            ? "Online"
                            : getLlmTestStatus(selectedLlmProvider.id ?? "") === "offline"
                              ? "Offline"
                              : "Untested"}
                        </StatusPill>
                        <StatusPill open={(selectedLlmProvider.id ?? "") === state.settings.activeLlmId}>
                          {(selectedLlmProvider.id ?? "") === state.settings.activeLlmId ? "Active LLM" : "Standby"}
                        </StatusPill>
                        <ActionChip
                          onClick={() =>
                            setState((current) =>
                              current
                                ? {
                                    ...current,
                                    settings: {
                                      ...current.settings,
                                      activeLlmId: selectedLlmProvider.id ?? current.settings.activeLlmId,
                                    },
                                  }
                                : current,
                            )
                          }
                        >
                          <Sparkles size={14} /> Set active
                        </ActionChip>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <FieldBlock
                        label="Provider"
                        value={selectedLlmProvider.provider}
                        onChange={(value) =>
                          setState((current) =>
                            current
                              ? {
                                  ...current,
                                  settings: {
                                    ...current.settings,
                                    llmProfiles: current.settings.llmProfiles.map((item) =>
                                      item.id === selectedLlmProvider.id ? { ...item, provider: value } : item,
                                    ),
                                  },
                                }
                              : current,
                          )
                        }
                      />
                      <FieldBlock
                        label="Endpoint"
                        value={selectedLlmProvider.endpoint}
                        onChange={(value) =>
                          setState((current) =>
                            current
                              ? {
                                  ...current,
                                  settings: {
                                    ...current.settings,
                                    llmProfiles: current.settings.llmProfiles.map((item) =>
                                      item.id === selectedLlmProvider.id ? { ...item, endpoint: value } : item,
                                    ),
                                  },
                                }
                              : current,
                          )
                        }
                      />
                      <div className="rounded-[24px] border border-white/8 bg-slate-950/25 p-4 md:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-white">Secret da app</div>
                            <div className="mt-1 text-xs text-slate-400">
                              A key nao aparece no backoffice nem fica guardada nas settings.
                            </div>
                          </div>
                          <StatusPill open={Boolean(selectedLlmProvider.secretConfigured)}>
                            {selectedLlmProvider.secretConfigured ? "Secret configured" : "Secret missing"}
                          </StatusPill>
                        </div>
                        <div className="mt-3 text-sm text-slate-300">
                          {selectedLlmProvider.secretEnvVar
                            ? `Env var: ${selectedLlmProvider.secretEnvVar}`
                            : "Env var nao definida."}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {selectedLlmProvider.secretLocationHint ?? "Editar manualmente no ficheiro .env da app ou nos secrets do servidor."}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <ActionChip onClick={() => void testLlmDialog(selectedLlmProvider.id ?? "")}><Bot size={14} /> Test online</ActionChip>
                      <button
                        type="button"
                        title="Prompt de teste enviado ao provider: Como está o dia de hoje?"
                        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
                      >
                        <CircleHelp size={14} />
                      </button>
                    </div>
                    <div className="mt-4 rounded-[20px] border border-white/8 bg-slate-950/30 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">LLM test log</div>
                      <div className="mt-2 space-y-1 text-sm text-slate-300">
                        {(llmTests[selectedLlmProvider.id ?? ""] ?? ["Sem teste executado para este provider."]).map((line, index) => (
                          <div key={`${selectedLlmProvider.id}-${index}`}>{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {backofficeTab === "budget" ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <FieldBlock
                  label="Default budget"
                  value={String(state.settings.defaultBudget)}
                  onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, defaultBudget: Number(value) } }) : current)}
                />
                <FieldBlock
                  label="Fee per trade"
                  value={String(state.settings.feePerTrade)}
                  onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, feePerTrade: Number(value) } }) : current)}
                />
                <FieldBlock
                  label="Auto refresh minutes"
                  value={String(state.settings.autoRefreshMinutes)}
                  onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, autoRefreshMinutes: Number(value) } }) : current)}
                />
                <FieldBlock
                  label="FX refresh minutes"
                  value={String(state.settings.fxRefreshMinutes)}
                  onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, fxRefreshMinutes: Number(value) } }) : current)}
                />
                <FieldBlock
                  label="Slippage pct"
                  value={String(state.settings.slippagePct)}
                  onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, slippagePct: Number(value) } }) : current)}
                />
                <label className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                  <div className="text-sm font-medium">Market mode</div>
                  <select
                    value={state.settings.marketMode ?? "LIVE"}
                    onChange={(event) =>
                      setState((current) => current ? ({ ...current, settings: { ...current.settings, marketMode: event.target.value as "LIVE" | "DEBUG" } }) : current)
                    }
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="DEBUG">DEBUG</option>
                  </select>
                </label>
              </div>
            ) : null}
            {backofficeTab === "signals" ? (
              <div className="mt-5 grid gap-4">
                <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">LLM assist para Signals</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Gera os 3 campos com o LLM ativo e instruções orientadas para preenchimento correto e intenção clara.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ActionChip onClick={() => void generateSignalFieldsWithLlm()}><Bot size={14} /> Generate with LLM</ActionChip>
                      <button
                        type="button"
                        title="O LLM recebe a intenção de cada campo: sources = fontes observáveis, relations = relações causais/contextuais, output = formato esperado de insights e propostas."
                        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
                      >
                        <CircleHelp size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[20px] border border-white/8 bg-slate-950/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Signal sources</div>
                      <div className="mt-2 text-sm text-slate-300">Fontes curtas e observáveis que o motor deve considerar.</div>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-slate-950/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Signal relations</div>
                      <div className="mt-2 text-sm text-slate-300">Relações causais ou contextuais que podem originar buy, sell ou hold.</div>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-slate-950/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Output</div>
                      <div className="mt-2 text-sm text-slate-300">Intenção do output final do motor: insights curtos e propostas objetivas por stock item.</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-[20px] border border-white/8 bg-slate-950/30 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Generation log</div>
                    <div className="mt-2 space-y-1 text-sm text-slate-300">
                      {(signalGenerationLog.length > 0 ? signalGenerationLog : ["Sem geração executada nesta sessão."]).map((line, index) => (
                        <div key={`signal-generation-${index}`}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <TextAreaBlock
                  label="Signal sources"
                  value={state.settings.signalSources.join("\n")}
                  onChange={(value) =>
                    setState((current) =>
                      current
                        ? {
                            ...current,
                            settings: {
                              ...current.settings,
                              signalSources: value.split("\n").map((item) => item.trim()).filter(Boolean),
                            },
                          }
                        : current,
                    )
                  }
                />
                <TextAreaBlock
                  label="Signal relations"
                  value={state.settings.signalRelations.join("\n")}
                  onChange={(value) =>
                    setState((current) =>
                      current
                        ? {
                            ...current,
                            settings: {
                              ...current.settings,
                              signalRelations: value.split("\n").map((item) => item.trim()).filter(Boolean),
                            },
                          }
                        : current,
                    )
                  }
                />
                <TextAreaBlock
                  label="Output"
                  value={state.settings.signalOutput ?? ""}
                  onChange={(value) =>
                    setState((current) =>
                      current
                        ? {
                            ...current,
                            settings: {
                              ...current.settings,
                              signalOutput: value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
            ) : null}
            {backofficeTab === "marketData" ? (
              <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/6 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Stock item</th>
                      <th className="px-4 py-3 font-medium">Display</th>
                      <th className="px-4 py-3 font-medium">Group</th>
                      <th className="px-4 py-3 font-medium">Currency</th>
                      <th className="px-4 py-3 font-medium">Current value</th>
                      <th className="px-4 py-3 font-medium">Provider</th>
                      <th className="px-4 py-3 font-medium">URL</th>
                      <th className="px-4 py-3 font-medium">Symbol</th>
                      <th className="px-4 py-3 font-medium">Mode</th>
                      <th className="px-4 py-3 font-medium">Real-time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.settings.marketDataSources.map((source) => {
                      const currentIndex = state.indices.find((item) => item.id === source.assetId);
                      const currentAlternative = state.alternativeAssets.find((item) => item.id === source.assetId);
                      const currentCurrency = currentIndex?.currency ?? currentAlternative?.currency ?? "USD";
                      const currentValue = currentIndex?.price ?? currentAlternative?.price ?? 0;
                      return (
                        <tr key={source.assetId} className="border-t border-white/8 bg-slate-950/20">
                          <td className="px-4 py-3 text-white">{source.label}</td>
                          <td className="px-4 py-3 text-slate-300">
                            <select
                              value={source.display}
                              onChange={(event) =>
                                setState((current) =>
                                  current
                                    ? {
                                        ...current,
                                        settings: {
                                          ...current.settings,
                                          marketDataSources: current.settings.marketDataSources.map((item) =>
                                            item.assetId === source.assetId ? { ...item, display: event.target.value as StockDisplay } : item,
                                          ),
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                            >
                              <option value="DASH">DASH</option>
                              <option value="ALTER">ALTER</option>
                              <option value="HIDE">HIDE</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <input
                              value={source.group}
                              onChange={(event) =>
                                setState((current) =>
                                  current
                                    ? {
                                        ...current,
                                        settings: {
                                          ...current.settings,
                                          marketDataSources: current.settings.marketDataSources.map((item) =>
                                            item.assetId === source.assetId ? { ...item, group: event.target.value } : item,
                                          ),
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-300">{currentCurrency}</td>
                          <td className="px-4 py-3 text-slate-300">{formatMoney(currentValue, currentCurrency)}</td>
                          <td className="px-4 py-3 text-slate-300">
                            <input
                              value={source.provider}
                              onChange={(event) =>
                                setState((current) =>
                                  current
                                    ? {
                                        ...current,
                                        settings: {
                                          ...current.settings,
                                          marketDataSources: current.settings.marketDataSources.map((item) =>
                                            item.assetId === source.assetId ? { ...item, provider: event.target.value } : item,
                                          ),
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <div className="flex items-center gap-2">
                              <input
                                value={source.url ?? buildMarketDataUrl(source.provider, source.symbol)}
                                onChange={(event) =>
                                  setState((current) =>
                                    current
                                      ? {
                                          ...current,
                                          settings: {
                                            ...current.settings,
                                            marketDataSources: current.settings.marketDataSources.map((item) =>
                                              item.assetId === source.assetId ? { ...item, url: event.target.value } : item,
                                            ),
                                          },
                                        }
                                      : current,
                                  )
                                }
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                              />
                              <ActionChip onClick={() => void copyText(source.url ?? buildMarketDataUrl(source.provider, source.symbol), source.label)}><Copy size={14} /> Copy</ActionChip>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <input
                              value={source.symbol}
                              onChange={(event) =>
                                setState((current) =>
                                  current
                                    ? {
                                        ...current,
                                        settings: {
                                          ...current.settings,
                                          marketDataSources: current.settings.marketDataSources.map((item) =>
                                            item.assetId === source.assetId ? { ...item, symbol: event.target.value } : item,
                                          ),
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <input
                              value={source.mode}
                              onChange={(event) =>
                                setState((current) =>
                                  current
                                    ? {
                                        ...current,
                                        settings: {
                                          ...current.settings,
                                          marketDataSources: current.settings.marketDataSources.map((item) =>
                                            item.assetId === source.assetId ? { ...item, mode: event.target.value } : item,
                                          ),
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <ActionChip onClick={() => void refreshMarketAsset(source.assetId)}><RefreshCcw size={14} /> Update</ActionChip>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
            {backofficeTab === "agentConfig" ? (
              <div className="mt-5 grid gap-5">
                <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Agent Model</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Configuracao global aplicavel a todos os agentes: missao, influencia, risco, shortlist e guardrails.
                      </div>
                    </div>
                    <button
                      type="button"
                      title="O agente segue praticas de structured outputs, aprovacao humana e passos auditaveis antes de executar trades."
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
                    >
                      <CircleHelp size={14} />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <TextAreaBlock label="Mission" value={state.settings.agent.mission} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, mission: value } } }) : current)} />
                    <TextAreaBlock label="Primary objective" value={state.settings.agent.objective} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, objective: value } } }) : current)} />
                    <TextAreaBlock label="Free form influence" value={state.settings.agent.freeFormInfluence} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, freeFormInfluence: value } } }) : current)} />
                    <label className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                      <div className="text-sm font-medium">Risk profile</div>
                      <select
                        value={state.settings.agent.riskProfile}
                        onChange={(event) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, riskProfile: event.target.value as "conservative" | "balanced" | "aggressive" } } }) : current)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                      >
                        <option value="conservative">conservative</option>
                        <option value="balanced">balanced</option>
                        <option value="aggressive">aggressive</option>
                      </select>
                    </label>
                    <FieldBlock label="Min conviction %" value={String(state.settings.agent.minConvictionPct)} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, minConvictionPct: Number(value) } } }) : current)} />
                    <FieldBlock label="Max shortlist" value={String(state.settings.agent.maxShortlist)} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, maxShortlist: Number(value) } } }) : current)} />
                    <FieldBlock label="Cadence minutes" value={String(state.settings.agent.cadenceMinutes)} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, cadenceMinutes: Number(value) } } }) : current)} />
                    <FieldBlock label="Max trade EUR" value={String(state.settings.agent.maxTradeEur)} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, maxTradeEur: Number(value) } } }) : current)} />
                    <TextAreaBlock label="Preferred regions" value={state.settings.agent.preferredRegions.join("\n")} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, preferredRegions: value.split('\n').map((item) => item.trim()).filter(Boolean) } } }) : current)} />
                    <TextAreaBlock label="Avoid regions" value={state.settings.agent.avoidRegions.join("\n")} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, avoidRegions: value.split('\n').map((item) => item.trim()).filter(Boolean) } } }) : current)} />
                    <TextAreaBlock label="Preferred stock items" value={state.settings.agent.preferredStockItems.join("\n")} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, preferredStockItems: value.split('\n').map((item) => item.trim()).filter(Boolean) } } }) : current)} />
                    <TextAreaBlock label="Avoid stock items" value={state.settings.agent.avoidStockItems.join("\n")} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, avoidStockItems: value.split('\n').map((item) => item.trim()).filter(Boolean) } } }) : current)} />
                    <TextAreaBlock label="Prioritize signals" value={state.settings.agent.prioritizeSignals.join("\n")} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, prioritizeSignals: value.split('\n').map((item) => item.trim()).filter(Boolean) } } }) : current)} />
                    <TextAreaBlock label="Downweight signals" value={state.settings.agent.downweightSignals.join("\n")} onChange={(value) => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, downweightSignals: value.split('\n').map((item) => item.trim()).filter(Boolean) } } }) : current)} />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <TogglePill label="Require market open" active={state.settings.agent.requireMarketOpen} onClick={() => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, requireMarketOpen: !current.settings.agent.requireMarketOpen } } }) : current)} />
                    <TogglePill label="Require portfolio improvement" active={state.settings.agent.requirePortfolioImprovement} onClick={() => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, requirePortfolioImprovement: !current.settings.agent.requirePortfolioImprovement } } }) : current)} />
                    <TogglePill label="Ask if now is the moment" active={state.settings.agent.askIfMomentIsNow} onClick={() => setState((current) => current ? ({ ...current, settings: { ...current.settings, agent: { ...current.settings.agent, askIfMomentIsNow: !current.settings.agent.askIfMomentIsNow } } }) : current)} />
                  </div>
                </div>

              </div>
            ) : null}
            {backofficeTab === "users" ? (
              <div className="mt-5 grid gap-5">
                <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{editingUserId ? "Editar utilizador" : "Criar utilizador"}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        O novo utilizador recebe o seu proprio budget, stock items, FX, agentes, estrategias, transacoes, sinais, logs e carteira.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionChip onClick={() => void (editingUserId ? saveUserProfile() : createUserProfile())}>
                        {editingUserId ? <Save size={14} /> : <Plus size={14} />}
                        {editingUserId ? "Save user" : "Create user"}
                      </ActionChip>
                      {editingUserId ? (
                        <ActionChip onClick={resetUserEditor}><X size={14} /> Cancel</ActionChip>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <FieldBlock label="User name" value={newUserName} onChange={setNewUserName} />
                    <FieldBlock label="User email" value={newUserEmail} onChange={setNewUserEmail} />
                    <label className="rounded-[24px] border border-white/8 bg-slate-950/25 p-4 text-sm text-slate-300">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Role</div>
                      <select
                        value={newUserRole}
                        onChange={(event) => setNewUserRole(event.target.value as "view_only" | "superuser")}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                      >
                        <option value="view_only" className="bg-slate-900 text-white">View only</option>
                        <option value="superuser" className="bg-slate-900 text-white">Superuser</option>
                      </select>
                    </label>
                    <div className="rounded-[24px] border border-white/8 bg-slate-950/25 p-4 text-sm text-slate-300">
                      Definicoes comuns a todos os utilizadores: LLMs, fallback LLM e Export/Import.
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-white/8">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/6 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.users.map((user) => (
                        <tr key={user.id} className="border-t border-white/8 bg-slate-950/20">
                          <td className="px-4 py-3 text-white">{user.name}</td>
                          <td className="px-4 py-3 text-slate-300">{user.email}</td>
                          <td className="px-4 py-3 text-slate-300">{user.role === "superuser" ? "Superuser" : "View only"}</td>
                          <td className="px-4 py-3 text-slate-300">{new Date(user.createdAt).toLocaleString("pt-PT")}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs ${state.activeUserId === user.id ? "bg-emerald-300/15 text-emerald-200" : "bg-white/8 text-slate-300"}`}>
                              {state.activeUserId === user.id ? "Active" : "Standby"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <ActionChip onClick={() => void selectUserProfile(user.id)}><User size={14} /> Switch</ActionChip>
                              <ActionChip onClick={() => startUserEdit(user)}><Pencil size={14} /> Edit</ActionChip>
                              {state.users.length > 1 ? (
                                <ActionChip onClick={() => void deleteUserProfile(user.id)}><Trash2 size={14} /> Delete</ActionChip>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {backofficeTab === "logs" ? (
              <div className="mt-5 rounded-[24px] border border-white/8 bg-slate-950/25 p-4">
                <div className="mb-3 flex justify-end">
                  <ActionChip onClick={() => setLogsHidden((current) => !current)}><X size={14} /> {logsHidden ? "Show logs" : "Clear screen"}</ActionChip>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  {(logsHidden ? [] : state.activityLogs).map((log) => (
                    <div key={log.id}>
                      [{log.timestamp}] {log.category}/{log.action}/{log.status} {log.message}{log.details ? ` :: ${log.details}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {backofficeTab === "export" ? (
              <div className="mt-5 grid gap-4">
                <div className="flex flex-wrap gap-3">
                  <ActionChip onClick={() => void loadSystemExport()}><Save size={14} /> Export file</ActionChip>
                  <ActionChip onClick={() => void importSystemPayload()}><RefreshCcw size={14} /> Import file</ActionChip>
                </div>
                <FieldBlock label="Export / Import file path" value={systemPayload} onChange={setSystemPayload} />
                <FieldBlock label="Export log path" value={systemExportLog} onChange={setSystemExportLog} />
              </div>
            ) : null}
            <div className="mt-4">
              <ActionChip onClick={() => void saveSettings(state.settings)}><Save size={14} /> Save backoffice</ActionChip>
            </div>
          </Panel>
        ) : null}
      </div>

      {overlayAssetId && overlayItem ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,32,43,0.96),rgba(7,19,28,0.98))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Stock item view</p>
                <h3 className="mt-1 text-2xl font-semibold">{overlayItem.name}</h3>
                <div className="mt-2 text-sm text-slate-300">
                  {overlayItem.symbol} · {overlayItem.currency}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverlayAssetId("")}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <StatCard label="Preco" value={formatMoney(overlayItem.price, overlayItem.currency)} tone="neutral" />
              <StatCard label="Volume" value={overlayItem.volumeLabel} tone="neutral" />
              <StatCard
                label="Daily change"
                value={formatPct(overlayItem.changePct)}
                tone={overlayItem.changePct >= 0 ? "positive" : "negative"}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {"region" in overlayItem ? (
                <StatusPill open={isMarketOpenForState(overlayItem.region)}>
                  {state.settings.marketMode === "DEBUG" ? "DEBUG open" : getRegionStatus(overlayItem.region).label}
                </StatusPill>
              ) : null}
              {state.signalStates.find((item) => item.assetId === overlayItem.id) ? (
                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">
                  Signal {state.signalStates.find((item) => item.assetId === overlayItem.id)?.action}
                </div>
              ) : null}
              {"region" in overlayItem && isMarketOpenForState(overlayItem.region) ? (
                <>
                  {isSuperuser ? <ActionChip onClick={() => openTransactionContext(overlayItem.id, "buy")}><ArrowRightLeft size={14} /> Buy</ActionChip> : null}
                  {isSuperuser && hasPositionForAsset(overlayItem.id) ? (
                    <ActionChip onClick={() => openTransactionContext(overlayItem.id, "sell")}><ArrowRightLeft size={14} /> Sell</ActionChip>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="mt-5 h-[320px] rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(92,233,186,0.16),transparent_38%),rgba(2,9,14,0.45)] p-4">
              <MarketChart data={overlayHistory} />
            </div>
          </div>
        </div>
      ) : null}

      {fxOverlayRow ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,32,43,0.96),rgba(7,19,28,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">FX view</p>
                <h3 className="mt-1 text-2xl font-semibold">EUR / {fxOverlayRow.currency}</h3>
                <div className="mt-2 text-sm text-slate-300">{fxOverlayRow.insight}</div>
              </div>
              <button
                type="button"
                onClick={() => setFxOverlayCurrency("")}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <StatCard label="Spot" value={`1 EUR = ${fxOverlayRow.spot.toFixed(4)} ${fxOverlayRow.currency}`} tone="neutral" />
              <StatCard label="Periodo" value={formatPct(fxOverlayRow.performancePct)} tone={fxOverlayRow.performancePct >= 0 ? "positive" : "negative"} />
              <StatCard label="Europa" value={fxOverlayRow.europeanPower ? "A ganhar poder" : "A perder poder"} tone={fxOverlayRow.europeanPower ? "positive" : "negative"} />
            </div>
            <div className="mt-5 h-[320px] rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(92,233,186,0.16),transparent_38%),rgba(2,9,14,0.45)] p-4">
              <MarketChart data={fxOverlayRow.chart} />
            </div>
          </div>
        </div>
      ) : null}

      {overlayStrategy ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,32,43,0.96),rgba(7,19,28,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Strategy</p>
                <h3 className="mt-1 text-2xl font-semibold">{overlayStrategy.name}</h3>
                <div className="mt-2 text-sm text-slate-300">{overlayStrategy.source === "generated" ? "Generated" : "Manual"}</div>
              </div>
              <button
                type="button"
                onClick={() => setOverlayStrategyId("")}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Buy criteria</div>
                <div className="mt-2 text-sm text-slate-200">{overlayStrategy.buyCriteria}</div>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Sell criteria</div>
                <div className="mt-2 text-sm text-slate-200">{overlayStrategy.sellCriteria}</div>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Brief</div>
                <div className="mt-2 text-sm text-slate-200">{overlayStrategy.strategyBrief}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {agentDecisionOverlayAgentId && agentDecisionOverlayProposals.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,32,43,0.96),rgba(7,19,28,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Human approval</p>
                <h3 className="mt-1 text-xl font-semibold">
                  {state.agents.find((agent) => agent.id === agentDecisionOverlayAgentId)?.name ?? "Agent"} pending actions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAgentDecisionOverlayAgentId("")}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {agentDecisionOverlayProposals.map((proposal) => (
                <div key={proposal.id} className="rounded-[18px] border border-amber-300/20 bg-amber-300/10 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{proposal.action.toUpperCase()} {proposal.etfTicker}</div>
                      <div className="mt-1 text-xs text-slate-300">{proposal.indexName} · {proposal.conviction.toFixed(0)}% · {formatCurrency(proposal.amountEur)}</div>
                    </div>
                    <div className="rounded-full bg-slate-950/35 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">
                      review
                    </div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-slate-300">{proposal.whyNow}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionChip onClick={() => void decideAgentTrade(proposal.id, "approve")}><PlayCircle size={14} /> Aprovar</ActionChip>
                    <ActionChip onClick={() => void decideAgentTrade(proposal.id, "reject")}><PauseCircle size={14} /> Rejeitar</ActionChip>
                    <ActionChip onClick={() => openTransactionContext(proposal.indexId, proposal.action === "sell" ? "sell" : "buy", "trade")}><ArrowRightLeft size={14} /> Abrir</ActionChip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {createAgentOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,32,43,0.97),rgba(7,19,28,0.99))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">AutoTrade</p>
                <h3 className="mt-1 text-2xl font-semibold">Create new agent</h3>
                <div className="mt-2 max-w-2xl text-sm text-slate-300">
                  Define o agente numa janela dedicada com nome, estratégia, budget e modo de execução antes de o colocares a correr.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateAgentOpen(false)}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-3">
                <div className="rounded-[24px] border border-emerald-300/15 bg-emerald-300/8 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Agent identity</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <FieldBlock label="Agent name" value={newAgentName} onChange={setNewAgentName} />
                    <FieldBlock label="Budget in EUR" value={newAgentBudget} onChange={setNewAgentBudget} />
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Execution profile</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="rounded-[20px] border border-white/8 bg-slate-950/25 p-4">
                      <div className="text-sm font-medium">Strategy</div>
                      <select
                        value={newAgentStrategyId}
                        onChange={(event) => setNewAgentStrategyId(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                      >
                        {state.strategies.filter((strategy) => strategy.active !== 0).map((strategy) => (
                          <option key={strategy.id} value={strategy.id}>
                            {strategy.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="rounded-[20px] border border-white/8 bg-slate-950/25 p-4">
                      <div className="text-sm font-medium">Execution window</div>
                      <select
                        value={newAgentExecutionMode}
                        onChange={(event) => setNewAgentExecutionMode(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                      >
                        <option value="market_open">During open markets</option>
                        <option value="hours">Fixed number of hours</option>
                      </select>
                    </label>
                  </div>
                  {newAgentExecutionMode === "hours" ? (
                    <div className="mt-3 max-w-sm">
                      <FieldBlock label="Hours to run" value={newAgentExecutionHours} onChange={setNewAgentExecutionHours} />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Creation summary</div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[18px] border border-white/8 bg-slate-950/25 px-4 py-3">
                    <div className="text-xs text-slate-400">Agent</div>
                    <div className="mt-1 text-sm font-medium text-white">{newAgentName || "Agent-New"}</div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-slate-950/25 px-4 py-3">
                    <div className="text-xs text-slate-400">Strategy</div>
                    <div className="mt-1 text-sm font-medium text-white">
                      {state.strategies.find((strategy) => strategy.id === newAgentStrategyId)?.name ?? "No strategy"}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-slate-950/25 px-4 py-3">
                    <div className="text-xs text-slate-400">Budget</div>
                    <div className="mt-1 text-sm font-medium text-white">{formatCurrency(Number(newAgentBudget) || 0)}</div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-slate-950/25 px-4 py-3">
                    <div className="text-xs text-slate-400">Run mode</div>
                    <div className="mt-1 text-sm font-medium text-white">
                      {newAgentExecutionMode === "hours" ? `${newAgentExecutionHours || "0"}h fixed run` : "Open markets only"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-[18px] border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-xs leading-6 text-amber-50">
                  O agente so pode operar em pracas abertas e continua sujeito a aprovacao humana quando gerar propostas.
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <ActionChip onClick={() => setCreateAgentOpen(false)}><X size={14} /> Cancel</ActionChip>
              <ActionChip onClick={() => void createAgent()}>
                <Plus size={14} /> Create agent
              </ActionChip>
            </div>
          </div>
        </div>
      ) : null}

      {transactionOpen && isSuperuser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,32,43,0.97),rgba(7,19,28,0.99))] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transaction</p>
                <h3 className="mt-1 text-base font-semibold">
                  {transactionMode === "buy" ? "Comprar" : "Vender"} {selectedIndex.etfTicker}
                </h3>
                <div className="mt-1 text-xs text-slate-400">{selectedIndex.name}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTransactionOpen(false);
                  setActiveTab(transactionReturnTab);
                }}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 grid gap-2 xl:grid-cols-[0.8fr_0.8fr_1fr_1fr_1fr_1fr_1.2fr]">
              <label className="rounded-[18px] border border-white/8 bg-white/4 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Side</div>
                <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white">
                  {transactionMode === "buy" ? "BUY" : "SELL"}
                </div>
              </label>
              <CompactField label="Quantity" value={transactionQuantity} onChange={setTransactionQuantity} />
              <label className="rounded-[18px] border border-white/8 bg-white/4 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Order Type</div>
                <select
                  value={orderType}
                  onChange={(event) => setOrderType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="Market">Market</option>
                  <option value="Limit">Limit</option>
                  <option value="Stop">Stop</option>
                </select>
              </label>
              <CompactField
                label={`Price ${orderType === "Market" ? "(current ref.)" : "(limit/stop)"} ${selectedIndex.currency}`}
                value={orderPrice}
                onChange={setOrderPrice}
              />
              <label className="rounded-[18px] border border-white/8 bg-white/4 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Time in Force</div>
                <select
                  value={timeInForce}
                  onChange={(event) => setTimeInForce(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="Day">Day</option>
                  <option value="GTC">GTC</option>
                </select>
              </label>
              <label className="rounded-[18px] border border-white/8 bg-white/4 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Order Validity</div>
                <select
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="ate ao fecho">ate ao fecho</option>
                </select>
              </label>
              <div className="rounded-[18px] border border-white/8 bg-white/4 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Estado da execucao</div>
                <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs ${
                  selectedMarketOpen && hasTradeBudget
                    ? "bg-emerald-300/15 text-emerald-200"
                    : "bg-rose-300/15 text-rose-100"
                }`}>
                  {!selectedMarketOpen
                    ? "Mercado fechado para transacao"
                    : transactionMode === "buy"
                    ? hasTradeBudget
                      ? "Ha budget suficiente para executar"
                      : "Budget insuficiente para executar"
                    : hasTradeBudget
                      ? "Ha posicao suficiente para vender"
                      : "Quantidade acima da posicao disponivel"}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  {transactionMode === "buy"
                    ? `Budget livre: ${formatCurrency(state.wallet.currentBudget)}`
                    : `Posicao atual: ${(selectedPosition?.units ?? 0).toFixed(3)} unidades`}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {orderType} · {timeInForce} · {validUntil}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <CompactStat label="Preco EUR" value={formatCurrency(transactionPreview.unitPriceLocal * transactionPreview.spotCurrencyToEur)} />
              <CompactStat label="Quantidade" value={transactionPreview.units.toFixed(3)} />
              <CompactStat label="Fee" value={formatCurrency(transactionPreview.feeEur)} />
              <CompactStat label="Impacto" value={formatCurrency(transactionPreview.totalBudgetImpact)} />
            </div>

            <div className="mt-3 flex flex-col gap-3 rounded-[18px] border border-white/8 bg-white/4 px-3 py-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm text-slate-200">Resumo para submissao</div>
                <div className="mt-1 text-xs text-slate-400">
                    {transactionMode === "buy" ? "BUY" : "SELL"} · Qty {transactionPreview.units.toFixed(3)} · {orderType} · {formatCurrency(transactionPreview.unitPriceLocal * transactionPreview.spotCurrencyToEur)} · {timeInForce} · {validUntil}
                </div>
              </div>
              <button
                type="button"
                disabled={saving || !hasTradeBudget || !selectedMarketOpen}
                onClick={() => void submitTrade()}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-50 xl:min-w-[260px]"
              >
                Submeter confirmacao da transacao
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,32,43,0.82),rgba(7,19,28,0.88))] p-5 shadow-[0_22px_56px_rgba(0,0,0,0.25)] sm:p-6">
      {children}
    </div>
  );
}

function TopMetric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
      <div className="flex items-center gap-2 text-slate-300">
        {icon}
        <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="mt-3 text-xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{detail}</div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "positive" | "negative" | "neutral" }) {
  const toneClass = tone === "positive" ? "text-emerald-200" : tone === "negative" ? "text-rose-200" : "text-white";
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-medium">{value}</div>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/4 px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function QuickButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-left text-sm transition hover:border-emerald-300/25 hover:bg-emerald-300/10"
    >
      {children}
    </button>
  );
}

function StatusPill({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${open ? "bg-emerald-300/15 text-emerald-200" : "bg-white/8 text-slate-300"}`}>
      {children}
    </span>
  );
}

function LedgerRow({ trade }: { trade: AppState["trades"][number] }) {
  const tradeCurrency = trade.currency ?? "EUR";
  const unitPriceLocal = trade.unitPriceUsd;
  const unitPriceEur = trade.unitPriceUsd * trade.fxRateUsdEur;
  const grossLocal = trade.grossEur * trade.fxRateEurUsd;
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 md:grid-cols-[0.7fr_1fr_0.8fr_0.8fr_0.8fr_0.9fr]">
      <div className="text-sm font-medium">{trade.side}</div>
      <div>
        <div className="font-medium">{trade.etfTicker}</div>
        <div className="text-xs text-slate-400">{trade.indexName}</div>
        <div className="text-xs text-slate-500">
          {formatCurrency(unitPriceEur)} · {formatMoney(unitPriceLocal, tradeCurrency)}
        </div>
      </div>
      <div className="text-sm">{trade.units.toFixed(4)} units</div>
      <div className="text-sm">
        <div>{formatCurrency(trade.grossEur)}</div>
        <div className="text-xs text-slate-400">{formatMoney(grossLocal, tradeCurrency)}</div>
      </div>
      <div className="text-sm text-slate-300">fee {formatCurrency(trade.feeEur)}</div>
      <div className="text-right text-xs text-slate-400">
        <div>{trade.timestamp}</div>
        <div>{trade.source}</div>
        <div>{trade.strategyName ?? "Manual entry"}</div>
        <div>spot {trade.fxRateEurUsd.toFixed(3)} / {trade.fxRateUsdEur.toFixed(3)}</div>
      </div>
    </div>
  );
}

function FieldBlock({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-[24px] border border-white/8 bg-white/4 p-4">
      <div className="text-sm font-medium">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition focus:border-emerald-300/30"
      />
    </label>
  );
}

function CompactField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-[18px] border border-white/8 bg-white/4 p-3">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/30"
      />
    </label>
  );
}

function TextAreaBlock({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-[24px] border border-white/8 bg-white/4 p-4">
      <div className="text-sm font-medium">{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition focus:border-emerald-300/30"
      />
    </label>
  );
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] border px-4 py-3 text-left transition ${
        active
          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
          : "border-white/8 bg-white/4 text-slate-300 hover:bg-white/6"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium">{active ? "On" : "Off"}</div>
    </button>
  );
}

function humanizeAgentStep(step: string) {
  const normalized = step.replace(/_/g, " ").trim();
  if (!normalized) {
    return "idle";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function ActionChip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
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

function currentMonthLabel() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
}

function buildFxSeries(baseSpot: number, seed: number) {
  const labels = buildLastWeekLabels();
  return labels.map((label, index) => {
    const wave = Math.sin(index * 0.9 + seed) * baseSpot * 0.015;
    const trend = (index - (labels.length - 1) / 2) * baseSpot * 0.004;
    return {
      label,
      value: Number((baseSpot + wave + trend).toFixed(4)),
    };
  });
}

function buildMarketDataUrl(provider: string, symbol: string) {
  if (provider.toLowerCase().includes("stooq")) {
    return `https://stooq.com/q/?s=${encodeURIComponent(symbol.toLowerCase())}`;
  }
  return symbol;
}

function formatMoney(value: number | null | undefined, currency: string) {
  if (value == null || Number.isNaN(value)) {
    return `-- ${currency}`;
  }
  if (currency.includes("/")) {
    return `${value.toFixed(2)} ${currency}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value);
}
