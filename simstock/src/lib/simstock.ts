export type Region = "Europe" | "US" | "Asia" | "China" | "Brazil" | "India";
export type RangeKey = "1D" | "1W" | "1M" | "12M" | "YTD";
export type ActionType = "buy" | "sell" | "hold";

export type IndexAsset = {
  id: string;
  name: string;
  region: Region;
  currency: string;
  symbol: string;
  etfTicker: string;
  etfName: string;
  price: number;
  changePct: number;
  ytd: number;
  volumeLabel: string;
};

export type PricePoint = {
  label: string;
  value: number;
};

export type Position = {
  etfTicker: string;
  indexId: string;
  units: number;
  averageCost: number;
  currentPrice: number;
};

export type Trade = {
  id: string;
  side: "BUY" | "SELL";
  etfTicker: string;
  indexName: string;
  units: number;
  unitPrice: number;
  fee: number;
  total: number;
  timestamp: string;
  source: "manual" | "rule" | "agent";
};

export type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  mode: "suggest" | "auto";
  condition: string;
  action: string;
};

export type AgentDecision = {
  etfTicker: string;
  action: ActionType;
  confidence: number;
  rationale: string;
  suggestedAmountEur: number;
};

export type LlmConfig = {
  id?: string;
  name?: string;
  provider: string;
  model: string;
  endpoint: string;
  apiKey?: string;
  local: boolean;
  temperature: number;
  maxTokens: number;
};

export type AgentConfig = {
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

export type BackofficeSettings = {
  feePerTrade: number;
  autoRefreshMinutes: number;
  fxRefreshMinutes: number;
  defaultBudget: number;
  slippagePct: number;
  currencySpots: Record<string, number>;
  llm: LlmConfig;
  llmProfiles: LlmConfig[];
  activeLlmId: string;
  agent: AgentConfig;
  signalSources: string[];
  signalRelations: string[];
  signalOutput?: string;
  manualSignals: Array<{
    id: string;
    assetId: string;
    title: string;
    summary: string;
    output?: string;
    actionBias: ActionType;
    confidence: number;
    source: string;
  }>;
};

export const rangeLabels: RangeKey[] = ["1D", "1W", "1M", "12M", "YTD"];

export const regions: Region[] = [
  "Europe",
  "US",
  "Asia",
  "China",
  "Brazil",
  "India",
];

export const marketHours: Record<
  Region,
  { timeZone: string; openHour: number; openMinute: number; closeHour: number; closeMinute: number }
> = {
  Europe: {
    timeZone: "Europe/London",
    openHour: 8,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 30,
  },
  US: {
    timeZone: "America/New_York",
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
  },
  Asia: {
    timeZone: "Asia/Tokyo",
    openHour: 9,
    openMinute: 0,
    closeHour: 15,
    closeMinute: 0,
  },
  China: {
    timeZone: "Asia/Shanghai",
    openHour: 9,
    openMinute: 30,
    closeHour: 15,
    closeMinute: 0,
  },
  Brazil: {
    timeZone: "America/Sao_Paulo",
    openHour: 10,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 0,
  },
  India: {
    timeZone: "Asia/Kolkata",
    openHour: 9,
    openMinute: 15,
    closeHour: 15,
    closeMinute: 30,
  },
};

export const initialIndices: IndexAsset[] = [
  {
    id: "stoxx600",
    name: "STOXX Europe 600",
    region: "Europe",
    currency: "EUR",
    symbol: "SXXP",
    etfTicker: "EXSA",
    etfName: "iShares STOXX Europe 600 UCITS ETF",
    price: 512.38,
    changePct: 0.86,
    ytd: 6.4,
    volumeLabel: "4.8M",
  },
  {
    id: "eurostoxx50",
    name: "EURO STOXX 50",
    region: "Europe",
    currency: "EUR",
    symbol: "SX5E",
    etfTicker: "EUN2",
    etfName: "iShares EURO STOXX 50 UCITS ETF",
    price: 4987.21,
    changePct: 0.55,
    ytd: 8.1,
    volumeLabel: "3.1M",
  },
  {
    id: "sp500",
    name: "S&P 500",
    region: "US",
    currency: "USD",
    symbol: "SPX",
    etfTicker: "CSPX",
    etfName: "iShares Core S&P 500 UCITS ETF",
    price: 5274.44,
    changePct: 1.12,
    ytd: 9.3,
    volumeLabel: "12.2M",
  },
  {
    id: "nasdaq100",
    name: "Nasdaq-100",
    region: "US",
    currency: "USD",
    symbol: "NDX",
    etfTicker: "EQQQ",
    etfName: "Invesco Nasdaq-100 UCITS ETF",
    price: 18422.11,
    changePct: 1.67,
    ytd: 14.8,
    volumeLabel: "10.9M",
  },
  {
    id: "dowjones",
    name: "Dow Jones Industrial Average",
    region: "US",
    currency: "USD",
    symbol: "DJI",
    etfTicker: "IUSD",
    etfName: "iShares Dow Jones Industrial Average UCITS ETF",
    price: 38988.16,
    changePct: 0.38,
    ytd: 4.1,
    volumeLabel: "2.6M",
  },
  {
    id: "msci-asia",
    name: "MSCI Asia Pacific",
    region: "Asia",
    currency: "JPY",
    symbol: "MXAP",
    etfTicker: "CPXJ",
    etfName: "iShares MSCI AC Far East ex-Japan ETF",
    price: 183.27,
    changePct: 0.42,
    ytd: 5.7,
    volumeLabel: "1.9M",
  },
  {
    id: "csi300",
    name: "CSI 300",
    region: "China",
    currency: "CNY",
    symbol: "CSI300",
    etfTicker: "ASHR",
    etfName: "Xtrackers Harvest CSI 300 ETF",
    price: 3568.41,
    changePct: -0.47,
    ytd: 1.9,
    volumeLabel: "6.3M",
  },
  {
    id: "hangseng",
    name: "Hang Seng",
    region: "China",
    currency: "HKD",
    symbol: "HSI",
    etfTicker: "2800.HK",
    etfName: "Tracker Fund of Hong Kong",
    price: 16782.06,
    changePct: -0.21,
    ytd: 3.4,
    volumeLabel: "8.1M",
  },
  {
    id: "bovespa",
    name: "Bovespa",
    region: "Brazil",
    currency: "BRL",
    symbol: "IBOV",
    etfTicker: "BOVA11",
    etfName: "iShares Ibovespa ETF",
    price: 129844.7,
    changePct: 0.94,
    ytd: 7.2,
    volumeLabel: "5.4M",
  },
  {
    id: "nifty50",
    name: "Nifty 50",
    region: "India",
    currency: "INR",
    symbol: "NIFTY",
    etfTicker: "INRL",
    etfName: "iShares MSCI India UCITS ETF",
    price: 22471.34,
    changePct: 0.61,
    ytd: 10.6,
    volumeLabel: "4.1M",
  },
];

const driftByRange: Record<RangeKey, number> = {
  "1D": 0.018,
  "1W": 0.035,
  "1M": 0.06,
  "12M": 0.18,
  YTD: 0.12,
};

export const initialHistory = initialIndices.reduce<Record<string, Record<RangeKey, PricePoint[]>>>(
  (acc, index, indexPosition) => {
    acc[index.id] = rangeLabels.reduce<Record<RangeKey, PricePoint[]>>((series, range, rangeIndex) => {
      const points = generateSeries(index.price, range, indexPosition + rangeIndex);
      series[range] = points;
      return series;
    }, {} as Record<RangeKey, PricePoint[]>);
    return acc;
  },
  {},
);

export const initialTrades: Trade[] = [
  {
    id: "t1",
    side: "BUY",
    etfTicker: "CSPX",
    indexName: "S&P 500",
    units: 12,
    unitPrice: 493.2,
    fee: 1.9,
    total: 5920.3,
    timestamp: "2026-03-12 10:18",
    source: "manual",
  },
  {
    id: "t2",
    side: "BUY",
    etfTicker: "EXSA",
    indexName: "STOXX Europe 600",
    units: 15,
    unitPrice: 98.4,
    fee: 1.9,
    total: 1477.9,
    timestamp: "2026-03-13 09:42",
    source: "rule",
  },
];

export const initialPositions: Position[] = [
  {
    etfTicker: "CSPX",
    indexId: "sp500",
    units: 12,
    averageCost: 493.2,
    currentPrice: 507.6,
  },
  {
    etfTicker: "EXSA",
    indexId: "stoxx600",
    units: 15,
    averageCost: 98.4,
    currentPrice: 101.2,
  },
];

export const initialRules: Rule[] = [
  {
    id: "r1",
    name: "Dip buyer US growth",
    enabled: true,
    mode: "auto",
    condition: "Compra Nasdaq-100 se cair 2.5% em 5 dias",
    action: "Investir EUR 750 em EQQQ",
  },
  {
    id: "r2",
    name: "Protect Europe gains",
    enabled: true,
    mode: "suggest",
    condition: "Vende 30% se EXSA subir 8% acima do preço médio",
    action: "Gerar recomendação de venda parcial",
  },
  {
    id: "r3",
    name: "India DCA",
    enabled: false,
    mode: "auto",
    condition: "Comprar todos os domingos antes da abertura",
    action: "Investir EUR 250 em INRL",
  },
];

export const initialSettings: BackofficeSettings = {
  feePerTrade: 1.9,
  autoRefreshMinutes: 5,
  fxRefreshMinutes: 60,
  defaultBudget: 10000,
  slippagePct: 0.15,
  currencySpots: {
    EUR: 1,
    USD: 1.09,
    BRL: 5.96,
    CNY: 7.84,
    HKD: 8.52,
    JPY: 162.4,
    INR: 90.4,
    "USD/EUR": 1.09,
  },
  llm: {
    id: "llm-ollama-local",
    name: "Ollama Local",
    provider: "Ollama",
    model: "qwen2.5:7b",
    endpoint: "http://localhost:11434/v1",
    apiKey: "",
    local: true,
    temperature: 0.35,
    maxTokens: 900,
  },
  llmProfiles: [
    {
      id: "llm-ollama-local",
      name: "Ollama Local",
      provider: "Ollama",
      model: "qwen2.5:7b",
      endpoint: "http://localhost:11434/v1",
      apiKey: "",
      local: true,
      temperature: 0.35,
      maxTokens: 900,
    },
    {
      id: "llm-openai",
      name: "OpenAI",
      provider: "OpenAI",
      model: "gpt-4.1",
      endpoint: "https://api.openai.com/v1",
      apiKey: "",
      local: false,
      temperature: 0.2,
      maxTokens: 1200,
    },
    {
      id: "llm-claude",
      name: "Claude",
      provider: "Claude",
      model: "claude-sonnet-4-6",
      endpoint: "https://api.anthropic.com/v1",
      apiKey: "",
      local: false,
      temperature: 0.2,
      maxTokens: 1200,
    },
  ],
  activeLlmId: "llm-ollama-local",
  agent: {
    autoExecute: false,
    cadenceMinutes: 20,
    riskProfile: "balanced",
    maxTradeEur: 1200,
    maxOpenPositions: 6,
    mission: "Gerar apenas trades de alta conviccao que possam aumentar o valor esperado do portfolio sem violar budget, risco e mercados abertos.",
    objective: "Criar uma shortlist curta de buy/sell com conviccao superior a 80%, sujeita a aprovacao humana antes de executar.",
    freeFormInfluence: "Favorecer trades auditaveis, com timing claro, sinais consistentes e impacto positivo esperado no portfolio.",
    preferredRegions: ["Europe", "US"],
    avoidRegions: [],
    preferredStockItems: [],
    avoidStockItems: [],
    prioritizeSignals: ["Market momentum", "Volume trend", "Regional market status"],
    downweightSignals: ["Manual analyst notes"],
    minConvictionPct: 80,
    maxShortlist: 3,
    requireMarketOpen: true,
    requirePortfolioImprovement: true,
    askIfMomentIsNow: true,
  },
  signalSources: [
    "Market momentum",
    "Volume trend",
    "Regional market status",
    "Portfolio exposure",
    "Manual analyst notes",
  ],
  signalRelations: [
    "Momentum positivo em US indices reforca compra de ETF core US.",
    "Brent em alta com USD forte reduz apetite por risco em mercados importadores.",
    "Queda forte num indice com volume elevado pode originar venda ou hedge.",
  ],
  signalOutput: "Devolve insights curtos e propostas objetivas de buy, sell ou hold para os stock items definidos.",
  manualSignals: [
    {
      id: "manual-signal-1",
      assetId: "sp500",
      title: "Manual core US watch",
      summary: "Observar possíveis entradas em dias de força relativa do S&P 500.",
      output: "Monitorizar oportunidade e manter hold enquanto nao houver confirmacao adicional.",
      actionBias: "hold",
      confidence: 58,
      source: "Manual signal",
    },
  ],
};

function generateSeries(basePrice: number, range: RangeKey, seed: number) {
  const lengthByRange: Record<RangeKey, number> = {
    "1D": 8,
    "1W": 7,
    "1M": 8,
    "12M": 12,
    YTD: 10,
  };
  const labelsByRange: Record<RangeKey, string[]> = {
    "1D": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
    "1W": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "1M": ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    "12M": ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    YTD: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  };

  return Array.from({ length: lengthByRange[range] }, (_, pointIndex) => {
    const wave = Math.sin((pointIndex + seed) * 0.85) * driftByRange[range];
    const trend = pointIndex * (driftByRange[range] / lengthByRange[range]);
    const noise = Math.cos((pointIndex + seed) * 1.27) * 0.009;
    const multiplier = 1 + wave + trend + noise - driftByRange[range] / 2;

    return {
      label: labelsByRange[range][pointIndex],
      value: Number((basePrice * multiplier).toFixed(2)),
    };
  });
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value);
}

export function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function getRegionStatus(region: Region, now = new Date()) {
  const schedule = marketHours[region];
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: schedule.timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const totalMinutes = hour * 60 + minute;
  const openMinutes = schedule.openHour * 60 + schedule.openMinute;
  const closeMinutes = schedule.closeHour * 60 + schedule.closeMinute;
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  const isOpen = isWeekday && totalMinutes >= openMinutes && totalMinutes <= closeMinutes;

  return {
    isOpen,
    localTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    label: isOpen ? "Open" : "Closed",
  };
}

export function getBestMomentumIndex(indices: IndexAsset[]) {
  return [...indices].sort((a, b) => b.changePct - a.changePct)[0];
}

export function buildAgentDecision(indices: IndexAsset[], settings: BackofficeSettings): AgentDecision {
  const leader = getBestMomentumIndex(indices);
  const action: ActionType = leader.changePct > 1.1 ? "buy" : leader.changePct < -1 ? "sell" : "hold";
  const suggestedAmount = Math.min(settings.agent.maxTradeEur, settings.defaultBudget * 0.12);

  return {
    etfTicker: leader.etfTicker,
    action,
    confidence: Math.min(92, Math.max(58, 60 + leader.changePct * 15)),
    rationale:
      action === "buy"
        ? `${leader.name} lidera o momentum intraday e mantém tração positiva na janela YTD.`
        : action === "sell"
          ? `${leader.name} mostra stress direcional e o agente prefere reduzir exposição.`
          : `${leader.name} continua estável, sem edge suficiente para justificar nova ordem.`,
    suggestedAmountEur: Number(suggestedAmount.toFixed(2)),
  };
}
