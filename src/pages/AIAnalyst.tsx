import React, { useEffect, useRef, useState } from "react";
import * as LightweightCharts from "lightweight-charts";
import type { Time } from "lightweight-charts";

import { getAIAnalysis } from "@/services/aiService";
import { fetchKlineData } from "@/services/klineService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 🔧 Надійний тип для ChartApi — прямо з фабрики
type ChartApi = ReturnType<typeof LightweightCharts.createChart>;
type CandleSeriesApi = ReturnType<ChartApi["addCandlestickSeries"]>;

type Token = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
};

type CandlestickData = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

const AIAnalystPage: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartApi | null>(null);
  const candleSeriesRef = useRef<CandleSeriesApi | null>(null);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [chatHistory, setChatHistory] = useState<{ user: string; ai: string }[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setError(null);
        const res = await fetch(
          "/coingecko-api/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
        );
        if (!res.ok) throw new Error("Coingecko proxy error");
        const data: Token[] = await res.json();
        setTokens(data || []);
        if (data?.length) setSelectedToken(data[0]);
      } catch (e) {
        console.error(e);
        setError("Не вдалося завантажити список токенів.");
      }
    };
    fetchTokens();
  }, []);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
      candleSeriesRef.current = null;
    }

    const api = LightweightCharts.createChart(el, {
      width: el.clientWidth,
      height: 520,
      layout: { background: { color: "transparent" }, textColor: "#a1a1aa" },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      grid: {
        vertLines: { color: "rgba(148,163,184,.12)" },
        horzLines: { color: "rgba(148,163,184,.12)" },
      },
      crosshair: { mode: 1 },
    });

    // Жорстка перевірка на випадок кривого імпорту модуля
    if (typeof (api as any).addCandlestickSeries !== "function") {
      console.error("LightweightCharts exports:", Object.keys(LightweightCharts));
      throw new Error(
        "[AIAnalyst] Створений об'єкт не має addCandlestickSeries. " +
        "Ймовірно, модуль 'lightweight-charts' підмінився або Vite його перепакував криво."
      );
    }

    chartRef.current = api;
    candleSeriesRef.current = api.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });

    const onResize = () => api.applyOptions({ width: el.clientWidth || 0 });
    const observer = new ResizeObserver(onResize);
    observer.observe(el);

    return () => {
      observer.disconnect();
      try { api.remove(); } catch {}
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedToken || !candleSeriesRef.current || !chartRef.current) return;
      try {
        setError(null);
        const symbol = (selectedToken.symbol || "").toUpperCase();
        const pair = `${symbol}USDT`;
        const klines: CandlestickData[] = await fetchKlineData(pair, "1h", 200);

        if (klines?.length) {
          candleSeriesRef.current.setData(klines);
          chartRef.current.timeScale().fitContent();
        } else {
          candleSeriesRef.current.setData([]);
          setError(`Немає даних для пари ${pair}.`);
        }
      } catch (e) {
        console.error(e);
        setError("Помилка завантаження графіка.");
      }
    };
    run();
  }, [selectedToken]);

  const handleSendMessage = async () => {
    if (!userQuestion.trim() || !selectedToken) return;

    setIsLoading(true);
    setChatHistory((prev) => [...prev, { user: userQuestion, ai: "Аналізую..." }]);

    try {
      const symbol = (selectedToken.symbol || "").toUpperCase();
      const pair = `${symbol}USDT`;
      const klines: CandlestickData[] = await fetchKlineData(pair, "1h", 120);
      if (!klines?.length) throw new Error("Порожні свічки для аналізу");

      const aiText = await getAIAnalysis({
        tokenName: selectedToken.name,
        tokenTicker: symbol,
        candleData: klines,
        userQuestion,
      });

      setChatHistory((prev) => {
        const next = [...prev];
        next[next.length - 1].ai = aiText || "AI не повернув текст.";
        return next;
      });
    } catch (e: any) {
      console.error(e);
      const msg =
        typeof e?.message === "string" ? e.message :
        typeof e === "string" ? e :
        "Виникла помилка під час аналізу. Перевір ключ або мережу.";
      setChatHistory((prev) => {
        const next = [...prev];
        next[next.length - 1].ai = msg;
        return next;
      });
    } finally {
      setIsLoading(false);
      setUserQuestion("");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Ліва панель */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="text-sm text-muted-foreground mb-2">Вибір токена</div>
          <select
            className="w-full rounded-md bg-background border px-3 py-2"
            value={selectedToken?.id || ""}
            onChange={(e) => {
              const t = tokens.find((x) => x.id === e.target.value) || null;
              setSelectedToken(t);
            }}
          >
            {tokens.map((t) => (
              <option key={t.id} value={t.id}>
                {t.symbol?.toUpperCase()} — {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4 h-[520px] flex flex-col">
          <div className="text-sm text-muted-foreground mb-2">AI Analyst</div>
          <div className="flex-1 overflow-auto space-y-3 pr-1">
            {chatHistory.map((m, idx) => (
              <div key={idx} className="text-sm">
                <div className="font-medium">Ти:</div>
                <div className="mb-2">{m.user}</div>
                <div className="font-medium">AI:</div>
                <div className="whitespace-pre-wrap">{m.ai}</div>
                <div className="h-px bg-border/40 my-3" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Input
              placeholder="Запитай про сетап/ризики/рівні..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !userQuestion.trim()}>
              {isLoading ? "..." : "Надіслати"}
            </Button>
          </div>
        </div>
      </div>

      {/* Права панель: графік */}
      <div className="flex-1 rounded-xl border border-border/60 bg-card/60 p-3">
        <div
          ref={chartContainerRef}
          className="w-full min-h-[520px] rounded-lg"
          style={{ background: "linear-gradient(180deg, rgba(2,6,23,.35), rgba(2,6,23,.15))" }}
        />
        {error && <div className="text-rose-400 text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default AIAnalystPage;
