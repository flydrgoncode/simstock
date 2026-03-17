module.exports=[32099,53290,29286,e=>{"use strict";var t=e.i(66680),a=e.i(85148),r=e.i(2157),o=e.i(50227);let i=["1D","1W","1M","12M","YTD"],s={Europe:{timeZone:"Europe/London",openHour:8,openMinute:0,closeHour:16,closeMinute:30},US:{timeZone:"America/New_York",openHour:9,openMinute:30,closeHour:16,closeMinute:0},Asia:{timeZone:"Asia/Tokyo",openHour:9,openMinute:0,closeHour:15,closeMinute:0},China:{timeZone:"Asia/Shanghai",openHour:9,openMinute:30,closeHour:15,closeMinute:0},Brazil:{timeZone:"America/Sao_Paulo",openHour:10,openMinute:0,closeHour:17,closeMinute:0},India:{timeZone:"Asia/Kolkata",openHour:9,openMinute:15,closeHour:15,closeMinute:30}},n=[{id:"stoxx600",name:"STOXX Europe 600",region:"Europe",currency:"EUR",symbol:"SXXP",etfTicker:"EXSA",etfName:"iShares STOXX Europe 600 UCITS ETF",price:512.38,changePct:.86,ytd:6.4,volumeLabel:"4.8M"},{id:"eurostoxx50",name:"EURO STOXX 50",region:"Europe",currency:"EUR",symbol:"SX5E",etfTicker:"EUN2",etfName:"iShares EURO STOXX 50 UCITS ETF",price:4987.21,changePct:.55,ytd:8.1,volumeLabel:"3.1M"},{id:"sp500",name:"S&P 500",region:"US",currency:"USD",symbol:"SPX",etfTicker:"CSPX",etfName:"iShares Core S&P 500 UCITS ETF",price:5274.44,changePct:1.12,ytd:9.3,volumeLabel:"12.2M"},{id:"nasdaq100",name:"Nasdaq-100",region:"US",currency:"USD",symbol:"NDX",etfTicker:"EQQQ",etfName:"Invesco Nasdaq-100 UCITS ETF",price:18422.11,changePct:1.67,ytd:14.8,volumeLabel:"10.9M"},{id:"dowjones",name:"Dow Jones Industrial Average",region:"US",currency:"USD",symbol:"DJI",etfTicker:"IUSD",etfName:"iShares Dow Jones Industrial Average UCITS ETF",price:38988.16,changePct:.38,ytd:4.1,volumeLabel:"2.6M"},{id:"msci-asia",name:"MSCI Asia Pacific",region:"Asia",currency:"JPY",symbol:"MXAP",etfTicker:"CPXJ",etfName:"iShares MSCI AC Far East ex-Japan ETF",price:183.27,changePct:.42,ytd:5.7,volumeLabel:"1.9M"},{id:"csi300",name:"CSI 300",region:"China",currency:"CNY",symbol:"CSI300",etfTicker:"ASHR",etfName:"Xtrackers Harvest CSI 300 ETF",price:3568.41,changePct:-.47,ytd:1.9,volumeLabel:"6.3M"},{id:"hangseng",name:"Hang Seng",region:"China",currency:"HKD",symbol:"HSI",etfTicker:"2800.HK",etfName:"Tracker Fund of Hong Kong",price:16782.06,changePct:-.21,ytd:3.4,volumeLabel:"8.1M"},{id:"bovespa",name:"Bovespa",region:"Brazil",currency:"BRL",symbol:"IBOV",etfTicker:"BOVA11",etfName:"iShares Ibovespa ETF",price:129844.7,changePct:.94,ytd:7.2,volumeLabel:"5.4M"},{id:"nifty50",name:"Nifty 50",region:"India",currency:"INR",symbol:"NIFTY",etfTicker:"INRL",etfName:"iShares MSCI India UCITS ETF",price:22471.34,changePct:.61,ytd:10.6,volumeLabel:"4.1M"}],l={"1D":.018,"1W":.035,"1M":.06,"12M":.18,YTD:.12},u=n.reduce((e,t,a)=>(e[t.id]=i.reduce((e,r,o)=>{var i,s,n;let u,d,p=(i=t.price,s=r,n=a+o,d={"1D":["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"],"1W":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"1M":["W1","W2","W3","W4","W5","W6","W7","W8"],"12M":["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"],YTD:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"]},Array.from({length:(u={"1D":8,"1W":7,"1M":8,"12M":12,YTD:10})[s]},(e,t)=>{let a=1+Math.sin((t+n)*.85)*l[s]+t*(l[s]/u[s])+.009*Math.cos((t+n)*1.27)-l[s]/2;return{label:d[s][t],value:Number((i*a).toFixed(2))}}));return e[r]=p,e},{}),e),{}),d=[{id:"t1",side:"BUY",etfTicker:"CSPX",indexName:"S&P 500",units:12,unitPrice:493.2,fee:1.9,total:5920.3,timestamp:"2026-03-12 10:18",source:"manual"},{id:"t2",side:"BUY",etfTicker:"EXSA",indexName:"STOXX Europe 600",units:15,unitPrice:98.4,fee:1.9,total:1477.9,timestamp:"2026-03-13 09:42",source:"rule"}],p={feePerTrade:1.9,autoRefreshMinutes:5,fxRefreshMinutes:60,defaultBudget:1e4,slippagePct:.15,currencySpots:{EUR:1,USD:1.09,BRL:5.96,CNY:7.84,HKD:8.52,JPY:162.4,INR:90.4,"USD/EUR":1.09},llm:{id:"llm-ollama-local",name:"Ollama Local",provider:"Ollama",model:"qwen2.5:7b",endpoint:"http://localhost:11434/v1",apiKey:"",local:!0,temperature:.35,maxTokens:900},llmProfiles:[{id:"llm-ollama-local",name:"Ollama Local",provider:"Ollama",model:"qwen2.5:7b",endpoint:"http://localhost:11434/v1",apiKey:"",local:!0,temperature:.35,maxTokens:900},{id:"llm-openai",name:"OpenAI",provider:"OpenAI",model:"gpt-4.1",endpoint:"https://api.openai.com/v1",apiKey:"",local:!1,temperature:.2,maxTokens:1200},{id:"llm-claude",name:"Claude",provider:"Claude",model:"claude-sonnet-4-6",endpoint:"https://api.anthropic.com/v1",apiKey:"",local:!1,temperature:.2,maxTokens:1200}],activeLlmId:"llm-ollama-local",agent:{autoExecute:!1,cadenceMinutes:20,riskProfile:"balanced",maxTradeEur:1200,maxOpenPositions:6,mission:"Gerar apenas trades de alta conviccao que possam aumentar o valor esperado do portfolio sem violar budget, risco e mercados abertos.",objective:"Criar uma shortlist curta de buy/sell com conviccao superior a 80%, sujeita a aprovacao humana antes de executar.",freeFormInfluence:"Favorecer trades auditaveis, com timing claro, sinais consistentes e impacto positivo esperado no portfolio.",preferredRegions:["Europe","US"],avoidRegions:[],preferredStockItems:[],avoidStockItems:[],prioritizeSignals:["Market momentum","Volume trend","Regional market status"],downweightSignals:["Manual analyst notes"],minConvictionPct:80,maxShortlist:3,requireMarketOpen:!0,requirePortfolioImprovement:!0,askIfMomentIsNow:!0},signalSources:["Market momentum","Volume trend","Regional market status","Portfolio exposure","Manual analyst notes"],signalRelations:["Momentum positivo em US indices reforca compra de ETF core US.","Brent em alta com USD forte reduz apetite por risco em mercados importadores.","Queda forte num indice com volume elevado pode originar venda ou hedge."],signalOutput:"Devolve insights curtos e propostas objetivas de buy, sell ou hold para os stock items definidos.",manualSignals:[{id:"manual-signal-1",assetId:"sp500",title:"Manual core US watch",summary:"Observar possíveis entradas em dias de força relativa do S&P 500.",output:"Monitorizar oportunidade e manter hold enquanto nao houver confirmacao adicional.",actionBias:"hold",confidence:58,source:"Manual signal"}]};function m(e,t=new Date){let a=s[e],r=new Intl.DateTimeFormat("en-GB",{timeZone:a.timeZone,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(t),o=r.find(e=>"weekday"===e.type)?.value??"Mon",i=Number(r.find(e=>"hour"===e.type)?.value??"0"),n=Number(r.find(e=>"minute"===e.type)?.value??"0"),l=60*i+n,u=60*a.openHour+a.openMinute,d=60*a.closeHour+a.closeMinute,p=!["Sat","Sun"].includes(o)&&l>=u&&l<=d;return{isOpen:p,localTime:`${String(i).padStart(2,"0")}:${String(n).padStart(2,"0")}`,label:p?"Open":"Closed"}}function c(e,t){let a=[...e].sort((e,t)=>t.changePct-e.changePct)[0],r=a.changePct>1.1?"buy":a.changePct<-1?"sell":"hold",o=Math.min(t.agent.maxTradeEur,.12*t.defaultBudget);return{etfTicker:a.etfTicker,action:r,confidence:Math.min(92,Math.max(58,60+15*a.changePct)),rationale:"buy"===r?`${a.name} lidera o momentum intraday e mant\xe9m tra\xe7\xe3o positiva na janela YTD.`:"sell"===r?`${a.name} mostra stress direcional e o agente prefere reduzir exposi\xe7\xe3o.`:`${a.name} continua est\xe1vel, sem edge suficiente para justificar nova ordem.`,suggestedAmountEur:Number(o.toFixed(2))}}e.s(["buildAgentDecision",()=>c,"getRegionStatus",()=>m,"initialHistory",0,u,"initialIndices",0,n,"initialSettings",0,p,"initialTrades",0,d],53290);let E=[{id:"brent",name:"Brent Crude",symbol:"BNO.US",currency:"USD/EUR",price:49.04,changePct:1.64,ytd:6.1,volumeLabel:"Stooq",market:"Commodities"},{id:"gold",name:"Gold",symbol:"GLD.US",currency:"USD/EUR",price:218.22,changePct:.84,ytd:8.9,volumeLabel:"Stooq",market:"Commodities"},{id:"silver",name:"Silver",symbol:"SLV.US",currency:"USD/EUR",price:24.18,changePct:-.21,ytd:5.4,volumeLabel:"Stooq",market:"Commodities"},{id:"copper",name:"Copper",symbol:"CPER.US",currency:"USD/EUR",price:28.74,changePct:.56,ytd:4.1,volumeLabel:"Stooq",market:"Commodities"},{id:"corn",name:"Corn",symbol:"CORN.US",currency:"USD/EUR",price:18.63,changePct:-.37,ytd:2.3,volumeLabel:"Stooq",market:"Commodities"}],T=[{assetId:"stoxx600",label:"STOXX Europe 600",provider:"Yahoo Finance",symbol:"vgk.us",yahooSymbol:"VGK",mode:"ETF proxy",display:"DASH",group:"Europe"},{assetId:"eurostoxx50",label:"EURO STOXX 50",provider:"Yahoo Finance",symbol:"fez.us",yahooSymbol:"FEZ",mode:"ETF proxy",display:"DASH",group:"Europe"},{assetId:"sp500",label:"S&P 500",provider:"Yahoo Finance",symbol:"^spx",yahooSymbol:"^GSPC",mode:"Direct index",display:"DASH",group:"US"},{assetId:"nasdaq100",label:"Nasdaq-100",provider:"Yahoo Finance",symbol:"^ndq",yahooSymbol:"^NDX",mode:"Direct index",display:"DASH",group:"US"},{assetId:"dowjones",label:"Dow Jones",provider:"Yahoo Finance",symbol:"^dji",yahooSymbol:"^DJI",mode:"Direct index",display:"DASH",group:"US"},{assetId:"msci-asia",label:"MSCI Asia Pacific",provider:"Yahoo Finance",symbol:"aaxj.us",yahooSymbol:"AAXJ",mode:"ETF proxy",display:"DASH",group:"Asia"},{assetId:"csi300",label:"CSI 300",provider:"Yahoo Finance",symbol:"ashr.us",yahooSymbol:"ASHR",mode:"ETF proxy",display:"DASH",group:"China"},{assetId:"hangseng",label:"Hang Seng",provider:"Yahoo Finance",symbol:"^hsi",yahooSymbol:"^HSI",mode:"Direct index",display:"DASH",group:"China"},{assetId:"bovespa",label:"Bovespa",provider:"Yahoo Finance",symbol:"ewz.us",yahooSymbol:"EWZ",mode:"ETF proxy",display:"DASH",group:"Brazil"},{assetId:"nifty50",label:"Nifty 50",provider:"Yahoo Finance",symbol:"inda.us",yahooSymbol:"INDA",mode:"ETF proxy",display:"DASH",group:"India"},{assetId:"brent",label:"Brent Crude",provider:"Yahoo Finance",symbol:"bno.us",yahooSymbol:"BZ=F",url:"https://pt.tradingeconomics.com/commodity/brent-crude-oil",mode:"Commodity future",display:"ALTER",group:"Commodities"},{assetId:"gold",label:"Gold",provider:"Yahoo Finance",symbol:"gld.us",yahooSymbol:"GC=F",mode:"Commodity future",display:"ALTER",group:"Commodities"},{assetId:"silver",label:"Silver",provider:"Yahoo Finance",symbol:"slv.us",yahooSymbol:"SI=F",mode:"Commodity future",display:"ALTER",group:"Commodities"},{assetId:"copper",label:"Copper",provider:"Yahoo Finance",symbol:"cper.us",yahooSymbol:"HG=F",mode:"Commodity future",display:"ALTER",group:"Commodities"},{assetId:"corn",label:"Corn",provider:"Yahoo Finance",symbol:"corn.us",yahooSymbol:"ZC=F",mode:"Commodity future",display:"ALTER",group:"Commodities"}],g=o.default.join(process.cwd(),"data"),L=o.default.join(g,"simstock.db");r.default.existsSync(g)||r.default.mkdirSync(g,{recursive:!0});let S=globalThis.simstockDb??new a.default(L);function y(){return S}function N(){return JSON.parse(S.prepare("SELECT value FROM app_state WHERE key = ?").get("settings").value)}function R(e,t){let a=S.prepare("SELECT value FROM app_state WHERE key = ?").get(e);return a?JSON.parse(a.value):t}function f(e,t){S.prepare(`
    INSERT INTO app_state (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(e,JSON.stringify(t))}function A(){return R("users",[]).map(e=>({...e,email:e.email??`${e.name.toLowerCase().replace(/\s+/g,".")}@simstock.local`,role:e.role??"superuser"}))}function O(){return R("active_user_id","user-default")}function U(e){f("active_user_id",e)}function I(){return JSON.parse(S.prepare("SELECT value FROM app_state WHERE key = ?").get("wallet").value)}function h(){return JSON.parse(S.prepare("SELECT value FROM app_state WHERE key = ?").get("alternative_assets").value)}function v(){return S.prepare("SELECT payload FROM indices ORDER BY id").all().map(e=>JSON.parse(e.payload))}function M(){return S.prepare("SELECT * FROM trades ORDER BY timestamp DESC").all()}function C(){return S.prepare("SELECT * FROM strategies ORDER BY name").all()}function b(){return S.prepare("SELECT * FROM agents ORDER BY name").all()}function D(){return S.prepare("SELECT * FROM agent_logs ORDER BY timestamp DESC").all()}function k(){return S.prepare("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 300").all()}function x(){return JSON.parse(S.prepare("SELECT value FROM app_state WHERE key = ?").get("signal_snapshot").value)}function F(e,t){S.transaction(()=>{if(S.prepare("DELETE FROM asset_history_daily WHERE assetId = ?").run(e),0===t.length)return;let a=S.prepare(`
      INSERT INTO asset_history_daily (assetId, tradeDate, open, high, low, close, volume, source)
      VALUES (@assetId, @tradeDate, @open, @high, @low, @close, @volume, @source)
    `);for(let e of t)a.run(e)})()}function X(e,t){S.transaction(()=>{if(S.prepare("DELETE FROM asset_history_intraday WHERE assetId = ?").run(e),0===t.length)return;let a=S.prepare(`
      INSERT INTO asset_history_intraday (assetId, ts, open, high, low, close, volume, source)
      VALUES (@assetId, @ts, @open, @high, @low, @close, @volume, @source)
    `);for(let e of t)a.run(e)})()}function _(e){return e?S.prepare("SELECT * FROM asset_history_daily WHERE assetId = ? ORDER BY tradeDate ASC").all(e):S.prepare("SELECT * FROM asset_history_daily ORDER BY assetId ASC, tradeDate ASC").all()}function H(e){return e?S.prepare("SELECT * FROM asset_history_intraday WHERE assetId = ? ORDER BY ts ASC").all(e):S.prepare("SELECT * FROM asset_history_intraday ORDER BY assetId ASC, ts ASC").all()}function P(e,t){S.transaction(()=>{if(S.prepare("DELETE FROM fx_history WHERE currency = ?").run(e),0===t.length)return;let a=S.prepare(`
      INSERT INTO fx_history (currency, ts, spot, source)
      VALUES (@currency, @ts, @spot, @source)
    `);for(let e of t)a.run(e)})()}function B(e){return e?S.prepare("SELECT * FROM fx_history WHERE currency = ? ORDER BY ts ASC").all(e):S.prepare("SELECT * FROM fx_history ORDER BY currency ASC, ts ASC").all()}S.pragma("journal_mode = WAL"),!function(){S.exec(`
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
  `);let e=S.prepare("PRAGMA table_info(strategies)").all();e.some(e=>"active"===e.name)||S.prepare("ALTER TABLE strategies ADD COLUMN active INTEGER NOT NULL DEFAULT 1").run(),e.some(e=>"source"===e.name)||S.prepare("ALTER TABLE strategies ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'").run();let t=S.prepare("PRAGMA table_info(agents)").all();t.some(e=>"budgetEur"===e.name)||S.prepare("ALTER TABLE agents ADD COLUMN budgetEur REAL NOT NULL DEFAULT 0").run(),t.some(e=>"executionMode"===e.name)||S.prepare("ALTER TABLE agents ADD COLUMN executionMode TEXT NOT NULL DEFAULT 'market_open'").run(),t.some(e=>"executionHours"===e.name)||S.prepare("ALTER TABLE agents ADD COLUMN executionHours REAL NOT NULL DEFAULT 6").run(),t.some(e=>"loopCount"===e.name)||S.prepare("ALTER TABLE agents ADD COLUMN loopCount INTEGER NOT NULL DEFAULT 0").run(),t.some(e=>"currentStep"===e.name)||S.prepare("ALTER TABLE agents ADD COLUMN currentStep TEXT NOT NULL DEFAULT 'idle'").run(),S.prepare("SELECT 1 FROM app_state WHERE key = ?").get("settings")||S.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("settings",JSON.stringify({...p,fxRates:{eurUsd:1.09,usdEur:.92},currencySpots:p.currencySpots,signalSources:["Market momentum","Volume trend","Regional market status","Portfolio exposure","Manual analyst notes"],signalOutput:"Devolve insights curtos e propostas objetivas de buy, sell ou hold para os stock items definidos.",manualSignals:p.manualSignals,marketDataSources:T,marketMode:"LIVE"}));let a=S.prepare("SELECT value FROM app_state WHERE key = ?").get("settings");if(a){let e=JSON.parse(a.value),t=new Map((e.llmProfiles??[]).map(e=>[e.id,e])),r=t.get("llm-ollama-local")?.model&&t.get("llm-ollama-local")?.model!=="gpt-4.1-mini"?t.get("llm-ollama-local")?.model:"qwen2.5:7b",o=t.get("llm-claude")?.model&&t.get("llm-claude")?.model!=="claude-3-5-sonnet-latest"?t.get("llm-claude")?.model:"claude-sonnet-4-6",i=[{id:"llm-openai",name:"OpenAI",provider:"OpenAI",model:t.get("llm-openai")?.model??"gpt-4.1",endpoint:t.get("llm-openai")?.endpoint??"https://api.openai.com/v1",apiKey:t.get("llm-openai")?.apiKey??"",local:!1,temperature:t.get("llm-openai")?.temperature??.2,maxTokens:t.get("llm-openai")?.maxTokens??1200},{id:"llm-claude",name:"Claude",provider:"Claude",model:o,endpoint:t.get("llm-claude")?.endpoint??"https://api.anthropic.com/v1",apiKey:t.get("llm-claude")?.apiKey??"",local:!1,temperature:t.get("llm-claude")?.temperature??.2,maxTokens:t.get("llm-claude")?.maxTokens??1200},{id:"llm-ollama-local",name:"Ollama Local",provider:"Ollama",model:r,endpoint:t.get("llm-ollama-local")?.endpoint??e.llm?.endpoint??"http://localhost:11434/v1",apiKey:t.get("llm-ollama-local")?.apiKey??e.llm?.apiKey??"",local:!0,temperature:t.get("llm-ollama-local")?.temperature??e.llm?.temperature??.35,maxTokens:t.get("llm-ollama-local")?.maxTokens??e.llm?.maxTokens??900}],s=e.activeLlmId??i[0]?.id??"llm-openai",n=i.find(e=>e.id===s)??i[0],l={...e,llmProfiles:i,activeLlmId:s,llm:n,agent:{...p.agent,...e.agent??{}},fxRates:e.fxRates??{eurUsd:1.09,usdEur:.92},fxRefreshMinutes:e.fxRefreshMinutes??p.fxRefreshMinutes,currencySpots:{...p.currencySpots,...e.currencySpots??{}},signalSources:e.signalSources??["Market momentum","Volume trend","Regional market status","Portfolio exposure","Manual analyst notes"],manualSignals:e.manualSignals??p.manualSignals,signalRelations:e.signalRelations??["Momentum positivo em US indices reforca compra de ETF core US.","Brent em alta com USD forte reduz apetite por risco em mercados importadores.","Queda forte num indice com volume elevado pode originar venda ou hedge."],signalOutput:e.signalOutput??"Devolve insights curtos e propostas objetivas de buy, sell ou hold para os stock items definidos.",marketMode:e.marketMode??"LIVE",marketDataSources:[...e.marketDataSources??T]};for(let e of T)l.marketDataSources.some(t=>t.assetId===e.assetId)||l.marketDataSources.push({...e});l.marketDataSources=l.marketDataSources.map(e=>({...e,display:e.display??(E.some(t=>t.id===e.assetId)?"ALTER":"DASH"),group:e.group??"General",provider:"brent"!==e.assetId||e.url&&"Stooq"!==e.provider?e.provider:"TradingEconomics URL",url:"brent"!==e.assetId||e.url?e.url:"https://pt.tradingeconomics.com/commodity/brent-crude-oil",mode:"brent"===e.assetId&&"ETF proxy"===e.mode?"URL + LLM":e.mode,yahooSymbol:"yahooSymbol"in e&&"string"==typeof e.yahooSymbol&&e.yahooSymbol.trim().length>0?e.yahooSymbol:T.find(t=>t.assetId===e.assetId)?.yahooSymbol})),S.prepare("UPDATE app_state SET value = ? WHERE key = ?").run(JSON.stringify(l),"settings")}S.prepare("SELECT 1 FROM app_state WHERE key = ?").get("wallet")||S.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("wallet",JSON.stringify({baseCurrency:"EUR",currentBudget:2601.8})),S.prepare("SELECT 1 FROM app_state WHERE key = ?").get("alternative_assets")||S.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("alternative_assets",JSON.stringify(E));let r=S.prepare("SELECT value FROM app_state WHERE key = ?").get("alternative_assets");if(r){let e=JSON.parse(r.value);S.prepare("UPDATE app_state SET value = ? WHERE key = ?").run(JSON.stringify([...e.map(e=>({...e,currency:e.currency??"USD/EUR"})),...E.filter(t=>!e.some(e=>e.id===t.id))]),"alternative_assets")}if(!S.prepare("SELECT 1 FROM indices LIMIT 1").get()){let e=S.prepare("INSERT INTO indices (id, payload) VALUES (?, ?)");S.transaction(t=>{for(let a of t)e.run(a.id,JSON.stringify(a))})(n)}let o=new Map(n.map(e=>[e.id,e.currency])),i=S.prepare("SELECT id, payload FROM indices").all(),s=S.prepare("UPDATE indices SET payload = ? WHERE id = ?");for(let e of i){let t=JSON.parse(e.payload);t.currency||s.run(JSON.stringify({...t,currency:o.get(e.id)??"USD"}),e.id)}if(!S.prepare("SELECT 1 FROM trades LIMIT 1").get()){let e=S.prepare(`
      INSERT INTO trades (
        id, side, indexId, etfTicker, indexName, units, unitPriceUsd, grossEur, feeEur, totalEur,
        fxRateEurUsd, fxRateUsdEur, timestamp, source, strategyName, unitLimitUsd, validUntil
      ) VALUES (
        @id, @side, @indexId, @etfTicker, @indexName, @units, @unitPriceUsd, @grossEur, @feeEur, @totalEur,
        @fxRateEurUsd, @fxRateUsdEur, @timestamp, @source, @strategyName, @unitLimitUsd, @validUntil
      )
    `),t=d.map(e=>({id:e.id,side:e.side,indexId:"CSPX"===e.etfTicker?"sp500":"stoxx600",etfTicker:e.etfTicker,indexName:e.indexName,units:e.units,unitPriceUsd:e.unitPrice,grossEur:"BUY"===e.side?e.total-e.fee:e.total+e.fee,feeEur:e.fee,totalEur:e.total,fxRateEurUsd:1.09,fxRateUsdEur:.92,timestamp:e.timestamp,source:e.source,strategyName:"agent"===e.source?"US Momentum Core":"Manual entry",unitLimitUsd:null,validUntil:null}));S.transaction(t=>{for(let a of t)e.run(a)})(t)}if(S.prepare("UPDATE trades SET strategyName = 'Manual entry' WHERE source = 'manual' AND (strategyName IS NULL OR strategyName = '')").run(),S.prepare("UPDATE trades SET strategyName = 'Rule engine' WHERE source = 'rule' AND (strategyName IS NULL OR strategyName = '')").run(),!S.prepare("SELECT 1 FROM strategies LIMIT 1").get()){let e=S.prepare(`
      INSERT INTO strategies (id, name, budgetEur, riskLevel, active, source, buyCriteria, sellCriteria, strategyBrief)
      VALUES (@id, @name, @budgetEur, @riskLevel, @active, @source, @buyCriteria, @sellCriteria, @strategyBrief)
    `);S.transaction(t=>{for(let a of t)e.run(a)})([{id:"strategy-us-momentum",name:"US Momentum Core",budgetEur:3200,riskLevel:"Balanced",active:1,source:"manual",buyCriteria:"Comprar em aceleração positiva com fee controlado e mercado aberto.",sellCriteria:"Reduzir posição em perda de força ou take-profit parcial.",strategyBrief:"Momentum disciplinado sobre índices US."},{id:"strategy-asia-rebound",name:"Asia Rebound",budgetEur:1800,riskLevel:"Moderate",active:1,source:"manual",buyCriteria:"Entrar em reversões de curto prazo com confirmação de volume.",sellCriteria:"Sair em quebra de suporte ou stress intraday.",strategyBrief:"Estratégia de rebound asiático."},{id:"strategy-europe-defensive",name:"Europe Defensive Rotation",budgetEur:1400,riskLevel:"Conservative",active:1,source:"manual",buyCriteria:"Aumentar exposição em índices defensivos com baixa volatilidade.",sellCriteria:"Cortar quando o drawdown regional excede o limiar.",strategyBrief:"Rotação defensiva europeia."}])}if(!S.prepare("SELECT 1 FROM agents LIMIT 1").get()){let e=S.prepare(`
      INSERT INTO agents (id, name, strategyId, budgetEur, executionMode, executionHours, status, tradesToday)
      VALUES (@id, @name, @strategyId, @budgetEur, @executionMode, @executionHours, @status, @tradesToday)
    `);S.transaction(t=>{for(let a of t)e.run(a)})([{id:"agent-a",name:"Agent-A",strategyId:"strategy-us-momentum",budgetEur:1200,executionMode:"market_open",executionHours:6,status:"running",tradesToday:2,loopCount:0,currentStep:"idle"},{id:"agent-b",name:"Agent-B",strategyId:"strategy-asia-rebound",budgetEur:900,executionMode:"hours",executionHours:4,status:"paused",tradesToday:1,loopCount:0,currentStep:"idle"}])}if(!S.prepare("SELECT 1 FROM agent_logs LIMIT 1").get()){let e=S.prepare(`
      INSERT INTO agent_logs (id, agentId, strategyName, action, etfTicker, explanation, confidence, timestamp)
      VALUES (@id, @agentId, @strategyName, @action, @etfTicker, @explanation, @confidence, @timestamp)
    `);S.transaction(t=>{for(let a of t)e.run(a)})([{id:"log-a-1",agentId:"agent-a",strategyName:"US Momentum Core",action:"buy",etfTicker:"CSPX",explanation:"Momentum positivo no S&P 500 com fee controlado e abertura do mercado US.",confidence:78,timestamp:"15/03/2026 15:20"},{id:"log-b-1",agentId:"agent-b",strategyName:"Asia Rebound",action:"hold",etfTicker:"CPXJ",explanation:"Sem confirmação suficiente de rebound; o agente aguardou novo sinal de volume.",confidence:61,timestamp:"15/03/2026 15:32"}])}S.prepare("SELECT 1 FROM app_state WHERE key = ?").get("signal_snapshot")||S.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("signal_snapshot",JSON.stringify({lastRunAt:null,status:"idle",signals:[],signalStates:[],relations:[]})),S.prepare("SELECT 1 FROM app_state WHERE key = ?").get("users")||S.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("users",JSON.stringify([{id:"user-default",name:"Default User",email:"default@simstock.local",role:"superuser",createdAt:new Date().toISOString()}])),S.prepare("SELECT 1 FROM app_state WHERE key = ?").get("active_user_id")||S.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("active_user_id",JSON.stringify("user-default"))}(),e.s(["getActiveUserId",()=>O,"getAlternativeAssets",()=>h,"getAppStateValue",()=>R,"getDb",()=>y,"getSettings",()=>N,"getSignalSnapshot",()=>x,"getUsers",()=>A,"getWallet",()=>I,"listActivityLogs",()=>k,"listAgentLogs",()=>D,"listAgents",()=>b,"listAssetDailyHistory",()=>_,"listAssetIntradayHistory",()=>H,"listFxHistory",()=>B,"listIndices",()=>v,"listStrategies",()=>C,"listTrades",()=>M,"replaceAssetDailyHistory",()=>F,"replaceAssetIntradayHistory",()=>X,"replaceFxHistory",()=>P,"setActiveUserId",()=>U,"setAppStateValue",()=>f],29286);let Y="simstock_session";function w(e){return(0,t.createHash)("sha256").update(e).digest("hex")}function W(){return new Date().toISOString()}function J(e,t){return new Date(e.getTime()+60*t*1e3)}function K(e,t){return new Date(e.getTime()+60*t*6e4)}function V(e){return e.trim().toLowerCase()}function q(e){let t=V(e);return A().find(e=>V(e.email)===t)??null}function j(){let e=W();S.prepare("DELETE FROM auth_codes WHERE expiresAt <= ?").run(e),S.prepare("DELETE FROM auth_sessions WHERE expiresAt <= ?").run(e),S.prepare("DELETE FROM auth_magic_links WHERE expiresAt <= ? OR consumedAt IS NOT NULL").run(e)}function z(){return{name:Y,httpOnly:!0,sameSite:"lax",secure:!0,path:"/",maxAge:43200}}function G(e){if(j(),!q(e))throw Error("Nao existe utilizador registado com esse email.");let a=V(e),r=String((0,t.randomInt)(0,1e6)).padStart(6,"0"),o=new Date,i=J(o,10).toISOString();return S.prepare("DELETE FROM auth_codes WHERE email = ?").run(a),S.prepare("INSERT INTO auth_codes (email, codeHash, expiresAt, createdAt) VALUES (?, ?, ?, ?)").run(a,w(r),i,o.toISOString()),{email:a,expiresAt:i,delivery:"local_preview",codePreview:r}}async function $(e,t){let a=process.env.RESEND_API_KEY,r=process.env.AUTH_EMAIL_FROM;if(!a||!r)return{delivery:"local_preview",preview:t};if(!(await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify({from:r,to:[e],subject:"SimStock login link",html:`<p>Use this login link to access SimStock:</p><p><a href="${t}">${t}</a></p>`})})).ok)throw Error("Nao foi possivel enviar o email de login.");return{delivery:"email",preview:null}}async function Z(e){if(j(),!q(e))throw Error("Nao existe utilizador registado com esse email.");let a=V(e),r=(0,t.randomBytes)(32).toString("hex"),o=w(r),i=new Date,s=J(i,10).toISOString(),n=process.env.AUTH_BASE_URL?.trim()||"http://localhost:3010",l=`${n.replace(/\/$/,"")}/api/auth/token?token=${encodeURIComponent(r)}`;S.prepare("DELETE FROM auth_magic_links WHERE email = ?").run(a),S.prepare("INSERT INTO auth_magic_links (email, tokenHash, expiresAt, createdAt, consumedAt) VALUES (?, ?, ?, ?, NULL)").run(a,o,s,i.toISOString());let u=await $(a,l);return{email:a,expiresAt:s,delivery:u.delivery,magicLinkPreview:u.preview}}function Q(e,a,r){j();let o=V(e),i=q(o);if(!i)throw Error("Utilizador nao encontrado.");let s=w(a.trim()),n=S.prepare("SELECT * FROM auth_codes WHERE email = ? AND codeHash = ?").get(o,s);if(!n||new Date(n.expiresAt).getTime()<=Date.now())throw Error("Codigo invalido ou expirado.");let l=(0,t.randomBytes)(32).toString("hex"),u=w(l),d=W(),p=K(new Date,12).toISOString();return S.prepare("DELETE FROM auth_codes WHERE email = ?").run(o),S.prepare(`INSERT INTO auth_sessions (id, userId, tokenHash, createdAt, expiresAt, userAgent, ipAddress)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run((0,t.randomUUID)(),i.id,u,d,p,r?.userAgent??null,r?.ipAddress??null),U(i.id),{token:l,user:i,expiresAt:p}}function ee(e,a){j();let r=w(e.trim()),o=S.prepare("SELECT * FROM auth_magic_links WHERE tokenHash = ?").get(r);if(!o||o.consumedAt||new Date(o.expiresAt).getTime()<=Date.now())throw Error("Token invalido ou expirado.");let i=q(o.email);if(!i)throw Error("Utilizador nao encontrado.");S.prepare("UPDATE auth_magic_links SET consumedAt = ? WHERE tokenHash = ?").run(W(),r);let s=(0,t.randomBytes)(32).toString("hex"),n=W(),l=K(new Date,12).toISOString();return S.prepare(`INSERT INTO auth_sessions (id, userId, tokenHash, createdAt, expiresAt, userAgent, ipAddress)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run((0,t.randomUUID)(),i.id,w(s),n,l,a?.userAgent??null,a?.ipAddress??null),U(i.id),{token:s,user:i,expiresAt:l}}function et(e){e&&S.prepare("DELETE FROM auth_sessions WHERE tokenHash = ?").run(w(e))}function ea(e){let t=function(e){if(!e)return null;j();let t=w(e),a=S.prepare("SELECT * FROM auth_sessions WHERE tokenHash = ?").get(t);if(!a)return null;let r=A().find(e=>e.id===a.userId)??null;return r?{session:a,user:r}:null}(function(e,t){if(!e)return null;let a=e.split(";").map(e=>e.trim()).find(e=>e.startsWith(`${t}=`));return a?decodeURIComponent(a.slice(t.length+1)):null}(e.headers.get("cookie"),Y));if(!t)throw Error("AUTH_REQUIRED");return U(t.user.id),t.user}function er(e){let t=ea(e);if("superuser"!==t.role)throw Error("FORBIDDEN");return t}function eo(e){return e instanceof Error&&"AUTH_REQUIRED"===e.message?Response.json({error:"Authentication required"},{status:401}):e instanceof Error&&"FORBIDDEN"===e.message?Response.json({error:"Forbidden"},{status:403}):null}e.s(["clearSessionByToken",()=>et,"getSessionCookieOptions",()=>z,"issueLoginCode",()=>G,"issueMagicLink",()=>Z,"mapAuthError",()=>eo,"requireAuthenticatedRequest",()=>ea,"requireSuperuserRequest",()=>er,"verifyLoginCode",()=>Q,"verifyMagicLinkToken",()=>ee],32099)}];

//# sourceMappingURL=src_lib_server_auth_ts_369da62a._.js.map