// src/services/aiService.ts
type Candle = {
  time: number | string; // unix або business day string
  open: number;
  high: number;
  low: number;
  close: number;
};

export type AnalysisRequest = {
  tokenName: string;
  tokenTicker: string;
  candleData: Candle[];
  userQuestion: string;
};

// ———————————————————————————————————————————————————————————————
// 1) Публічне API: основна функція аналізу
// ———————————————————————————————————————————————————————————————
export async function getAIAnalysis(req: AnalysisRequest): Promise<string> {
  // Якщо ключ присутній — пробуємо хмарний режим
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

  // Мінімальна валідація вхідних даних
  if (!req?.tokenName || !req?.tokenTicker || !Array.isArray(req?.candleData) || req.candleData.length === 0) {
    throw new Error("Немає даних для аналізу: перевір токен і свічки.");
  }

  try {
    if (apiKey) {
      return await analyzeWithOpenAI(apiKey, req);
    }
  } catch (e: any) {
    // Якщо OpenAI недоступний/помилка CORS/ключ — падаємо в fallback
    console.warn("[AI] OpenAI недоступний, використовую локальний fallback. Причина:", e?.message || e);
  }

  // Локальний евристичний аналіз як фолбек (завжди щось поверне)
  return heuristicAnalysis(req);
}

// ———————————————————————————————————————————————————————————————
// 2) Хмарний режим: OpenAI API (chat.completions)
// ———————————————————————————————————————————————————————————————
async function analyzeWithOpenAI(apiKey: string, req: AnalysisRequest): Promise<string> {
  // Стиснемо свічки: не шлемо все “як є”
  const sample = compressCandles(req.candleData, 120);

  const sys = [
    "You are a rigorous crypto trading analyst.",
    "Return concise, structured Ukrainian analysis for intraday to swing context.",
    "Always include: trend, momentum, S/R levels, risk points (SL), invalidation, and 2 scenarios (bull/bear) with probabilities.",
    "Never give financial advice; this is educational analysis only."
  ].join(" ");

  const user = JSON.stringify({
    token: { name: req.tokenName, ticker: req.tokenTicker },
    question: req.userQuestion,
    candles: sample, // масив OHLC
    note: "time is in input order; last item is the most recent."
  });

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content:
            "Проаналізуй наведені OHLC-свічки (1h) для пари та дай структурований висновок українською.\n" +
            "Формат:\n" +
            "1) Тренд & контекст\n" +
            "2) Рівні S/R (ціни)\n" +
            "3) Сетапи (2 сценарії з імовірностями)\n" +
            "4) Ризики/інвалідація\n" +
            "5) Короткий підсумок у 1-2 рядки.\n" +
            "Вхідні дані: " + user
        }
      ]
    })
  });

  if (!resp.ok) {
    const text = await safeText(resp);
    throw new Error(`OpenAI HTTP ${resp.status}: ${text}`);
  }

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI повернув порожню відповідь.");
  return content;
}

// ———————————————————————————————————————————————————————————————
// 3) Локальний евристичний аналіз (fallback)
// ———————————————————————————————————————————————————————————————
function heuristicAnalysis(req: AnalysisRequest): string {
  const data = compressCandles(req.candleData, 200);
  const closes = data.map(c => c.close);
  const last = data[data.length - 1];
  const first = data[0];

  // Проста динаміка
  const changeAbs = last.close - first.close;
  const changePct = (changeAbs / first.close) * 100;

  // SMA
  const sma = (n: number) => {
    const slice = closes.slice(-n);
    if (!slice.length) return NaN;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  };

  const sma20 = sma(20);
  const sma50 = sma(50);
  const sma100 = sma(100);

  // Волатильність (ATR-прибл.)
  const atr = approxATR(data, 14);

  // S/R — прості рівні (локальні екстремуми)
  const { supports, resistances } = simpleLevels(data, 12);

  // Сценарії
  const bullBias =
    (last.close > (sma20 || last.close)) +
    (sma20 > (sma50 || sma20)) +
    (sma50 > (sma100 || sma50)) +
    (changePct > 0 ? 1 : 0);

  const bullProb = Math.round((bullBias / 4) * 100);
  const bearProb = 100 - bullProb;

  // SL-кандидати
  const lastSupport = supports[supports.length - 1];
  const invalidation = lastSupport ? (lastSupport * 0.99) : (last.close * 0.965);

  const fmt = (n: number) => (Math.abs(n) >= 1 ? n.toFixed(2) : n.toPrecision(3));

  return [
    `# ${req.tokenTicker} — базовий технічний огляд (offline)`,
    ``,
    `**Тренд/контекст:** ${changePct >= 0 ? "помірно висхідний" : "спадний"} (${fmt(changePct)}% за період).`,
    `SMA20=${fmt(sma20)} | SMA50=${fmt(sma50)} | SMA100=${fmt(sma100)} | ATR≈${fmt(atr)}`,
    ``,
    `**Рівні:**`,
    `• Підтримки: ${supports.slice(-3).map(fmt).join(", ") || "—"}`,
    `• Опори: ${resistances.slice(-3).map(fmt).join(", ") || "—"}`,
    ``,
    `**Сценарій Long (~${bullProb}%):**`,
    `- Ідея: вище SMA20/SMA50 з утриманням над останньою підтримкою.`,
    `- Тригер: ретест підтримки → локальне перехоплення (HL) з об’ємом.`,
    `- TP-зони: ${resistances.slice(-2).map(fmt).join(" → ") || "попередні максимуми"}.`,
    `- SL (інвалідація): ${fmt(invalidation)}.`,
    ``,
    `**Сценарій Short (~${bearProb}%):**`,
    `- Ідея: нижче SMA20 із пробоєм SMA50/SMA100.`,
    `- Тригер: відскок у зону опору → розворотна свічка/pattern, volume spike.`,
    `- TP-зони: ${supports.slice(-2).reverse().map(fmt).join(" → ") || "попередні мінімуми"}.`,
    `- SL (інвалідація): вище найближчої опори.`,
    ``,
    `**Ризики:** новини, маніпуляції обсягом, низька ліквідність, високий ATR.`,
    ``,
    `**Питання користувача:** ${req.userQuestion || "—"}`,
    `**Підсумок:** працюємо від рівнів та свічкового підтвердження; керуємо ризиком.`,
  ].join("\n");
}

// ———————————————————————————————————————————————————————————————
// 4) Утиліти
// ———————————————————————————————————————————————————————————————
function compressCandles(src: Candle[], max = 200): Candle[] {
  if (src.length <= max) return src;
  // рівномірне семплювання
  const step = Math.floor(src.length / max);
  const out: Candle[] = [];
  for (let i = 0; i < src.length; i += step) {
    out.push(src[i]);
  }
  if (out[out.length - 1] !== src[src.length - 1]) out.push(src[src.length - 1]);
  return out;
}

function approxATR(data: Candle[], period = 14): number {
  if (data.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const h = data[i].high, l = data[i].low, pc = data[i - 1].close;
    const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    trs.push(tr);
  }
  const last = trs.slice(-period);
  return last.reduce((a, b) => a + b, 0) / last.length;
}

function simpleLevels(data: Candle[], lookback = 12) {
  const supports: number[] = [];
  const resistances: number[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    const lows = data.slice(i - lookback, i + lookback + 1).map(c => c.low);
    const highs = data.slice(i - lookback, i + lookback + 1).map(c => c.high);
    const low = data[i].low;
    const high = data[i].high;
    if (low === Math.min(...lows)) supports.push(low);
    if (high === Math.max(...highs)) resistances.push(high);
  }
  return { supports: dedupNear(supports), resistances: dedupNear(resistances) };
}

function dedupNear(arr: number[], epsRatio = 0.002) {
  // прибираємо дуже близькі рівні
  const out: number[] = [];
  const sorted = [...arr].sort((a, b) => a - b);
  for (const x of sorted) {
    if (!out.length || Math.abs(x - out[out.length - 1]) / out[out.length - 1] > epsRatio) out.push(x);
  }
  return out;
}

async function safeText(r: Response) {
  try { return await r.text(); } catch { return "<no-body>"; }
}
