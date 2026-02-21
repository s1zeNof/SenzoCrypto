export interface StrategyPreset {
    id: string
    name: string
    description: string
    tags: string[]
    color: 'purple' | 'blue' | 'green' | 'orange'
    icon: string
    defaultTimeframe: string
    defaultSymbol: string
    svg: React.ReactNode
}

// ─── SVG Ілюстрації ────────────────────────────────────────────────────────────

const IctSvg = () => (
    <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background grid */}
        <rect width="240" height="140" fill="#0f0f1a" rx="8" />
        {[20,40,60,80,100,120].map(y => (
            <line key={y} x1="10" y1={y} x2="230" y2={y} stroke="#1e1e3a" strokeWidth="0.5" />
        ))}
        {[30,60,90,120,150,180,210].map(x => (
            <line key={x} x1={x} y1="10" x2={x} y2="130" stroke="#1e1e3a" strokeWidth="0.5" />
        ))}

        {/* Support level */}
        <line x1="10" y1="90" x2="230" y2="90" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        <text x="12" y="87" fill="#6366f1" fontSize="8" opacity="0.7">Support</text>

        {/* Order Block zone */}
        <rect x="80" y="72" width="40" height="18" fill="#10b981" opacity="0.12" rx="2" />
        <rect x="80" y="72" width="40" height="18" fill="none" stroke="#10b981" strokeWidth="0.7" rx="2" opacity="0.5" />
        <text x="82" y="69" fill="#10b981" fontSize="7" opacity="0.8">OB</text>

        {/* FVG zone */}
        <rect x="140" y="54" width="30" height="14" fill="#f59e0b" opacity="0.1" rx="2" />
        <text x="142" y="52" fill="#f59e0b" fontSize="7" opacity="0.8">FVG</text>

        {/* Price path: up → sweep below support → sharp reversal */}
        <polyline
            points="15,70 35,65 55,68 75,72 95,95 100,102 105,95 115,78 135,60 155,50 175,42 195,35 215,28"
            stroke="#6366f1" strokeWidth="1.5" fill="none" strokeLinejoin="round"
        />

        {/* Liquidity sweep arrow down */}
        <path d="M97,88 L100,102 L103,88" stroke="#ef4444" strokeWidth="1.2" fill="none" />
        <text x="106" y="106" fill="#ef4444" fontSize="7" opacity="0.9">Sweep</text>

        {/* CHoCH mark */}
        <text x="108" y="76" fill="#10b981" fontSize="7" opacity="0.9">CHoCH</text>
        <line x1="105" y1="78" x2="115" y2="78" stroke="#10b981" strokeWidth="0.8" />

        {/* Candles after reversal */}
        {[
            { x: 155, o: 50, c: 44, h: 42, l: 52 },
            { x: 165, o: 44, c: 38, h: 37, l: 46 },
            { x: 175, o: 38, c: 34, h: 33, l: 40 },
        ].map((c, i) => (
            <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke="#10b981" strokeWidth="1" />
                <rect x={c.x - 3} y={Math.min(c.o, c.c)} width="6" height={Math.abs(c.o - c.c) || 1} fill="#10b981" rx="0.5" />
            </g>
        ))}

        {/* Labels */}
        <text x="12" y="135" fill="#4b5563" fontSize="7">ICT · Smart Money Concept</text>
    </svg>
)

const PriceActionSvg = () => (
    <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="240" height="140" fill="#0f0f1a" rx="8" />
        {[25,50,75,100,125].map(y => (
            <line key={y} x1="10" y1={y} x2="230" y2={y} stroke="#1e1e3a" strokeWidth="0.5" />
        ))}

        {/* Strong support zone */}
        <rect x="10" y="95" width="220" height="8" fill="#10b981" opacity="0.08" />
        <line x1="10" y1="99" x2="230" y2="99" stroke="#10b981" strokeWidth="1" strokeDasharray="5 3" opacity="0.5" />
        <text x="12" y="109" fill="#10b981" fontSize="8" opacity="0.7">Support</text>

        {/* Resistance */}
        <line x1="10" y1="45" x2="230" y2="45" stroke="#ef4444" strokeWidth="1" strokeDasharray="5 3" opacity="0.4" />
        <text x="12" y="41" fill="#ef4444" fontSize="8" opacity="0.7">Resistance</text>

        {/* Candles sequence */}
        {[
            { x: 25,  o: 75, c: 65, h: 60, l: 80, bull: true  },
            { x: 40,  o: 65, c: 72, h: 62, l: 76, bull: false },
            { x: 55,  o: 72, c: 68, h: 65, l: 75, bull: false },
            { x: 70,  o: 68, c: 80, h: 65, l: 84, bull: false },
            { x: 85,  o: 80, c: 90, h: 77, l: 94, bull: false },
            { x: 100, o: 90, c: 98, h: 87, l: 102, bull: false },
            // Touch support
            { x: 115, o: 99, c: 96, h: 92, l: 106, bull: false },
            // Hammer candle
            { x: 130, o: 100, c: 97, h: 96, l: 112, bull: false },
            // Bullish reversal
            { x: 145, o: 97, c: 82, h: 80, l: 100, bull: true  },
            { x: 160, o: 82, c: 68, h: 65, l: 84, bull: true  },
            { x: 175, o: 68, c: 55, h: 52, l: 70, bull: true  },
            { x: 190, o: 55, c: 48, h: 45, l: 57, bull: true  },
            { x: 205, o: 48, c: 46, h: 43, l: 50, bull: true  },
        ].map((c, i) => (
            <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.bull ? '#10b981' : '#ef4444'} strokeWidth="1" />
                <rect x={c.x - 4} y={Math.min(c.o, c.c)} width="8" height={Math.abs(c.o - c.c) || 2} fill={c.bull ? '#10b981' : '#ef4444'} rx="1" />
            </g>
        ))}

        {/* Hammer annotation */}
        <path d="M130,88 L130,84" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1" />
        <text x="133" y="88" fill="#f59e0b" fontSize="7">Hammer</text>

        <text x="12" y="135" fill="#4b5563" fontSize="7">Price Action · Clean chart</text>
    </svg>
)

const EmaTrendSvg = () => (
    <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="240" height="140" fill="#0f0f1a" rx="8" />
        {[20,40,60,80,100,120].map(y => (
            <line key={y} x1="10" y1={y} x2="230" y2={y} stroke="#1e1e3a" strokeWidth="0.5" />
        ))}

        {/* EMA 200 (slow, baseline) */}
        <polyline
            points="15,105 35,102 55,99 75,97 95,94 115,90 135,85 155,79 175,72 195,64 215,56"
            stroke="#6b7280" strokeWidth="1.5" fill="none" strokeLinejoin="round"
        />
        <text x="217" y="57" fill="#6b7280" fontSize="7">200</text>

        {/* EMA 21 (medium) */}
        <polyline
            points="15,100 35,96 55,92 75,88 95,83 115,77 135,70 155,62 175,53 195,44 215,36"
            stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinejoin="round"
        />
        <text x="217" y="37" fill="#f59e0b" fontSize="7">21</text>

        {/* EMA 9 (fast) */}
        <polyline
            points="15,95 35,88 55,82 75,75 95,68 115,61 135,53 155,44 175,36 195,28 215,22"
            stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinejoin="round"
        />
        <text x="217" y="23" fill="#10b981" fontSize="7">9</text>

        {/* Price candles above EMAs (bullish trend) */}
        {[
            { x: 40,  o: 86, c: 82, h: 80, l: 88  },
            { x: 60,  o: 80, c: 76, h: 74, l: 82  },
            { x: 80,  o: 74, c: 68, h: 66, l: 76  },
            { x: 100, o: 66, c: 60, h: 58, l: 68  },
            { x: 120, o: 58, c: 52, h: 50, l: 60  },
            { x: 140, o: 50, c: 44, h: 42, l: 52  },
            { x: 160, o: 42, c: 36, h: 34, l: 44  },
            { x: 180, o: 34, c: 26, h: 24, l: 36  },
            { x: 200, o: 26, c: 20, h: 18, l: 28  },
        ].map((c, i) => (
            <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke="#10b981" strokeWidth="1" />
                <rect x={c.x - 4} y={Math.min(c.o, c.c)} width="8" height={Math.abs(c.o - c.c) || 2} fill="#10b981" rx="1" />
            </g>
        ))}

        {/* Golden cross annotation */}
        <circle cx="75" cy="88" r="6" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6" />
        <text x="83" y="83" fill="#f59e0b" fontSize="7">Cross</text>

        <text x="12" y="135" fill="#4b5563" fontSize="7">EMA 9 / 21 / 200 · Trend Following</text>
    </svg>
)

const BreakoutSvg = () => (
    <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="240" height="140" fill="#0f0f1a" rx="8" />
        {[25,50,75,100,125].map(y => (
            <line key={y} x1="10" y1={y} x2="230" y2={y} stroke="#1e1e3a" strokeWidth="0.5" />
        ))}

        {/* Consolidation channel */}
        <rect x="20" y="65" width="130" height="30" fill="#6366f1" opacity="0.06" rx="2" />
        <line x1="20" y1="65" x2="150" y2="65" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />
        <line x1="20" y1="95" x2="150" y2="95" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.4" />
        <text x="22" y="62" fill="#6366f1" fontSize="7" opacity="0.8">Resistance</text>
        <text x="22" y="104" fill="#6366f1" fontSize="7" opacity="0.6">Support</text>

        {/* Sideways candles inside channel */}
        {[
            { x: 30,  o: 82, c: 78, h: 76, l: 84, bull: true  },
            { x: 45,  o: 78, c: 81, h: 75, l: 84, bull: false },
            { x: 60,  o: 81, c: 76, h: 73, l: 82, bull: false },
            { x: 75,  o: 76, c: 80, h: 73, l: 82, bull: true  },
            { x: 90,  o: 80, c: 77, h: 74, l: 82, bull: false },
            { x: 105, o: 77, c: 80, h: 74, l: 82, bull: true  },
            { x: 120, o: 80, c: 76, h: 73, l: 82, bull: false },
            { x: 135, o: 76, c: 79, h: 72, l: 81, bull: true  },
        ].map((c, i) => (
            <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.bull ? '#10b981' : '#ef4444'} strokeWidth="1" />
                <rect x={c.x - 4} y={Math.min(c.o, c.c)} width="8" height={Math.abs(c.o - c.c) || 2} fill={c.bull ? '#10b981' : '#ef4444'} rx="1" />
            </g>
        ))}

        {/* Breakout candle — big green */}
        <line x1="158" y1="40" x2="158" y2="80" stroke="#10b981" strokeWidth="1.2" />
        <rect x="153" y="40" width="10" height="38" fill="#10b981" rx="1.5" />

        {/* Follow-through candles */}
        {[
            { x: 173, o: 40, c: 32, h: 30, l: 42 },
            { x: 188, o: 32, c: 24, h: 22, l: 34 },
            { x: 203, o: 24, c: 18, h: 16, l: 26 },
        ].map((c, i) => (
            <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke="#10b981" strokeWidth="1" />
                <rect x={c.x - 4} y={Math.min(c.o, c.c)} width="8" height={Math.abs(c.o - c.c) || 2} fill="#10b981" rx="1" />
            </g>
        ))}

        {/* Volume bars */}
        {[30,45,60,75,90,105,120,135].map((x, i) => (
            <rect key={i} x={x - 4} y={118} width="8" height={6 + Math.random() * 4} fill="#374151" rx="0.5" />
        ))}
        <rect x="154" y="112" width="10" height="16" fill="#10b981" opacity="0.6" rx="0.5" />
        {[173,188,203].map((x, i) => (
            <rect key={i} x={x - 4} y={116} width="8" height={10 + i * 2} fill="#10b981" opacity="0.4" rx="0.5" />
        ))}

        {/* Breakout arrow */}
        <path d="M158,58 L158,48 L155,53 M158,48 L161,53" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
        <text x="163" y="52" fill="#f59e0b" fontSize="7">Breakout!</text>

        <text x="12" y="135" fill="#4b5563" fontSize="7">Breakout · Channel · Volume confirm</text>
    </svg>
)

// ─── Пресети стратегій ─────────────────────────────────────────────────────────

export const STRATEGY_PRESETS: StrategyPreset[] = [
    {
        id: 'ict',
        name: 'ICT / Smart Money',
        description: 'Торгівля на основі інституційних концептів: Order Blocks, Fair Value Gaps, BOS/CHoCH та зняття ліквідності. Вхід після підтвердження зміни структури.',
        tags: ['ict', 'smc', 'order-block', 'fvg', 'liquidity'],
        color: 'purple',
        icon: '🏛️',
        defaultTimeframe: '15m',
        defaultSymbol: 'BTCUSDT',
        svg: <IctSvg />,
    },
    {
        id: 'price-action',
        name: 'Price Action',
        description: 'Чистий графік без індикаторів. Торгівля від ключових рівнів підтримки та опору, свічкові патерни підтвердження (hammer, engulfing, pin bar).',
        tags: ['price-action', 'support', 'resistance', 'candles'],
        color: 'green',
        icon: '📊',
        defaultTimeframe: '1H',
        defaultSymbol: 'BTCUSDT',
        svg: <PriceActionSvg />,
    },
    {
        id: 'ema-trend',
        name: 'Trend Following (EMA)',
        description: 'Торгівля в напрямку тренду з використанням EMA 9/21/200. Вхід на pullback до швидкої EMA, поки ціна вище повільної (бичачий тренд).',
        tags: ['ema', 'trend', 'momentum', 'pullback'],
        color: 'blue',
        icon: '📈',
        defaultTimeframe: '4H',
        defaultSymbol: 'BTCUSDT',
        svg: <EmaTrendSvg />,
    },
    {
        id: 'breakout',
        name: 'Breakout / Пробій',
        description: 'Торгівля на пробій рівнів консолідації, трикутників та каналів з підтвердженням обсягу. Вхід на ретесті пробитого рівня або одразу.',
        tags: ['breakout', 'channel', 'volume', 'consolidation'],
        color: 'orange',
        icon: '🚀',
        defaultTimeframe: '1H',
        defaultSymbol: 'BTCUSDT',
        svg: <BreakoutSvg />,
    },
]
