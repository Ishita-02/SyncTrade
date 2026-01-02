"use client";

export default function LandingCandlestickChart() {
  // Generate realistic price movement
  let currentPrice = 140;
  const candles = Array.from({ length: 50 }, () => {
    const volatility = 8;
    const change = (Math.random() - 0.48) * volatility;
    const open = currentPrice;
    const close = currentPrice + change;
    const isBullish = close >= open;
    
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    
    currentPrice = close;
    
    return { open, close, high, low, isBullish };
  });

  // Calculate chart bounds
  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Convert price to Y position (%)
  const priceToY = (price: any) => {
    return ((maxPrice + padding - price) / (priceRange + padding * 2)) * 100;
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-gray-900/30 to-transparent">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-full h-px bg-gray-700/30" />
        ))}
      </div>

      {/* Price labels */}
      <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-4 text-[10px] text-gray-500 font-mono">
        <span>${Math.round(maxPrice + padding)}</span>
        <span>${Math.round(maxPrice + padding - (priceRange + padding * 2) * 0.2)}</span>
        <span>${Math.round(maxPrice + padding - (priceRange + padding * 2) * 0.4)}</span>
        <span>${Math.round(maxPrice + padding - (priceRange + padding * 2) * 0.6)}</span>
        <span>${Math.round(maxPrice + padding - (priceRange + padding * 2) * 0.8)}</span>
        <span>${Math.round(minPrice - padding)}</span>
      </div>

      {/* Candlesticks */}
      <div className="absolute inset-0 flex items-stretch gap-[1px] pl-12 pr-4">
        {candles.map((candle, i) => {
          const highY = priceToY(candle.high);
          const lowY = priceToY(candle.low);
          const openY = priceToY(candle.open);
          const closeY = priceToY(candle.close);
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.abs(openY - closeY);
          
          return (
            <div key={i} className="relative flex-1" style={{ minWidth: '2px' }}>
              {/* Upper wick */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-[1px] ${
                  candle.isBullish ? 'bg-green-500/70' : 'bg-red-500/70'
                }`}
                style={{
                  top: `${highY}%`,
                  height: `${bodyTop - highY}%`
                }}
              />
              
              {/* Body */}
              <div
                className={`absolute left-0 right-0 ${
                  candle.isBullish ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  top: `${bodyTop}%`,
                  height: `${Math.max(bodyHeight, 0.5)}%`,
                  boxShadow: candle.isBullish 
                    ? '0 0 4px rgba(34, 197, 94, 0.4)' 
                    : '0 0 4px rgba(239, 68, 68, 0.4)'
                }}
              />
              
              {/* Lower wick */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-[1px] ${
                  candle.isBullish ? 'bg-green-500/70' : 'bg-red-500/70'
                }`}
                style={{
                  top: `${bodyTop + bodyHeight}%`,
                  height: `${lowY - (bodyTop + bodyHeight)}%`
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/50 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}