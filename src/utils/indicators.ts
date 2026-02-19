// RSI Calculation for Trading Chart
interface CandleData {
    time: number
    close: number
}

export function calculateRSI(data: CandleData[], period: number = 14): { time: number, value: number }[] {
    if (data.length < period + 1) return []

    const rsiData: { time: number, value: number }[] = []
    const changes: number[] = []

    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
        changes.push(data[i].close - data[i - 1].close)
    }

    // Calculate initial average gain and loss
    let avgGain = 0
    let avgLoss = 0

    for (let i = 0; i < period; i++) {
        if (changes[i] >= 0) {
            avgGain += changes[i]
        } else {
            avgLoss += Math.abs(changes[i])
        }
    }

    avgGain /= period
    avgLoss /= period

    // Calculate first RSI value
    let rs = avgGain / (avgLoss || 1)
    let rsi = 100 - (100 / (1 + rs))
    rsiData.push({ time: data[period].time, value: rsi })

    // Calculate subsequent RSI values using smoothed averages
    for (let i = period; i < changes.length; i++) {
        const change = changes[i]

        if (change >= 0) {
            avgGain = (avgGain * (period - 1) + change) / period
            avgLoss = (avgLoss * (period - 1)) / period
        } else {
            avgGain = (avgGain * (period - 1)) / period
            avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period
        }

        rs = avgGain / (avgLoss || 1)
        rsi = 100 - (100 / (1 + rs))
        rsiData.push({ time: data[i + 1].time, value: rsi })
    }

    return rsiData
}

export function calculateSMA(data: CandleData[], period: number): { time: number, value: number }[] {
    if (data.length < period) return []
    const smaData = []

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close
        }
        smaData.push({
            time: data[i].time,
            value: sum / period
        })
    }
    return smaData
}

export function calculateEMA(data: CandleData[], period: number): { time: number, value: number }[] {
    if (data.length < period) return []

    const k = 2 / (period + 1)
    const emaData = []

    // First EMA is SMA
    let sum = 0
    for (let i = 0; i < period; i++) {
        sum += data[i].close
    }
    let ema = sum / period
    emaData.push({ time: data[period - 1].time, value: ema })

    // Calculate rest
    for (let i = period; i < data.length; i++) {
        ema = (data[i].close - ema) * k + ema
        emaData.push({ time: data[i].time, value: ema })
    }

    return emaData
}

export function calculateMACD(data: CandleData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): { macd: { time: number, value: number }[], signal: { time: number, value: number }[], histogram: { time: number, value: number, color?: string }[] } | [] {
    if (data.length < slowPeriod) return []

    const fastEMA = calculateEMA(data, fastPeriod)
    const slowEMA = calculateEMA(data, slowPeriod)

    const macdLine: { time: number, value: number }[] = []

    // Synchronize arrays (slowEMA determines start)
    // We need to match times.

    // Create map for fastEMA
    const fastMap = new Map(fastEMA.map(i => [i.time, i.value]))

    slowEMA.forEach(slow => {
        const fastVal = fastMap.get(slow.time)
        if (fastVal !== undefined) {
            macdLine.push({
                time: slow.time,
                value: fastVal - slow.value
            })
        }
    })

    // Calculate Signal Line (EMA of MACD Line)
    // Convert macdLine to CandleData interface format (value -> close) for calculation
    const macdAsCandles = macdLine.map(m => ({ time: m.time, close: m.value }))
    const signalLine = calculateEMA(macdAsCandles, signalPeriod)

    // Calculate Histogram
    const histogram: { time: number, value: number, color?: string }[] = []

    const signalMap = new Map(signalLine.map(s => [s.time, s.value]))

    macdLine.forEach(macd => {
        const signalVal = signalMap.get(macd.time)
        if (signalVal !== undefined) {
            const histVal = macd.value - signalVal
            // TradingView Logic:
            // Grow Up (Green)
            // Grow Down (Pale Green)
            // Fall Down (Red)
            // Fall Up (Pale Red)
            // Simplified: Green if > 0, Red if < 0. Or standard trend logic.
            // We'll just return value, styling happens in component.
            histogram.push({
                time: macd.time,
                value: histVal
            })
        }
    })

    return {
        macd: macdLine,
        signal: signalLine,
        histogram: histogram
    }
}

export function calculateBollingerBands(data: CandleData[], period = 20, multiplier = 2) {
    if (data.length < period) return []

    const bands: { time: number, upper: number, lower: number, middle: number }[] = []

    for (let i = period - 1; i < data.length; i++) {
        // Calculate SMA (Middle)
        let sum = 0
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close
        }
        const middle = sum / period

        // Calculate StdDev
        let sumSqDiff = 0
        for (let j = 0; j < period; j++) {
            const diff = data[i - j].close - middle
            sumSqDiff += diff * diff
        }
        const stdDev = Math.sqrt(sumSqDiff / period)

        bands.push({
            time: data[i].time,
            middle: middle,
            upper: middle + (multiplier * stdDev),
            lower: middle - (multiplier * stdDev)
        })
    }

    return bands
}
