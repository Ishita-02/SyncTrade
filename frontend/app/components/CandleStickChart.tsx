"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Brush,
} from "recharts";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface CandleData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function CandlestickChart() {
  const [timeframe, setTimeframe] = useState("1D");
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [allData, setAllData] = useState<CandleData[]>([]);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

  useEffect(() => {
    async function fetchCandles() {
      const intervalMap: Record<string, string> = {
        "1H": "1h",
        "4H": "4h",
        "1D": "1d",
        "1W": "1w",
      };

      const interval = intervalMap[timeframe] ?? "1d";

      try {
        const res = await fetch(
          `${BACKEND}/api/prices/candles?symbol=ETHUSDT&interval=${interval}&limit=200`
        );

        const raw = await res.json();
        console.log("raw", raw)

        const formatted: CandleData[] = raw.map((c: any) => ({
          timestamp: c.time * 1000,
          date: new Date(c.time * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: 0,
        }));

        setAllData(formatted);
        setBrushDomain(null);
      } catch (error) {
        console.error("Failed to fetch candles:", error);
      }
    }

    fetchCandles();
  }, [timeframe, BACKEND]);

  if (!allData.length) {
    return (
      <div style={{ 
        width: "100%", 
        height: "350px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "#8b949e"
      }}>
        Loading chart data...
      </div>
    );
  }

  const visibleData = brushDomain
    ? allData.slice(brushDomain[0], brushDomain[1] + 1)
    : allData.slice(-60);

  const currentCandle = allData[allData.length - 1];
  const priceChange =
    ((currentCandle.close - allData[0].open) / allData[0].open) * 100;
  const isPositive = priceChange >= 0;

  const handleZoomIn = () => {
    if (brushDomain) {
      const range = brushDomain[1] - brushDomain[0];
      const newRange = Math.max(10, Math.floor(range * 0.7));
      const center = Math.floor((brushDomain[0] + brushDomain[1]) / 2);
      const newStart = Math.max(0, center - Math.floor(newRange / 2));
      const newEnd = Math.min(allData.length - 1, newStart + newRange);
      setBrushDomain([newStart, newEnd]);
    } else {
      const currentVisible = 60;
      const newRange = Math.floor(currentVisible * 0.7);
      const newStart = allData.length - newRange;
      setBrushDomain([newStart, allData.length - 1]);
    }
  };

  const handleZoomOut = () => {
    if (brushDomain) {
      const range = brushDomain[1] - brushDomain[0];
      const newRange = Math.min(allData.length, Math.floor(range * 1.5));
      const center = Math.floor((brushDomain[0] + brushDomain[1]) / 2);
      const newStart = Math.max(0, center - Math.floor(newRange / 2));
      const newEnd = Math.min(allData.length - 1, newStart + newRange);
      setBrushDomain([newStart, newEnd]);
    } else {
      setBrushDomain([0, allData.length - 1]);
    }
  };

  const handleResetZoom = () => setBrushDomain(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isGreen = data.close >= data.open;

      return (
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <p
            style={{
              color: "#e6edf3",
              fontSize: "12px",
              fontWeight: "600",
              margin: "0 0 8px 0",
            }}
          >
            {data.date}
          </p>
          <div style={{ fontSize: "11px", color: "#8b949e", lineHeight: "1.6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <span>O:</span>
              <span style={{ color: "#e6edf3", fontWeight: "600" }}>
                ${data.open.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <span>H:</span>
              <span style={{ color: "#e6edf3", fontWeight: "600" }}>
                ${data.high.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <span>L:</span>
              <span style={{ color: "#e6edf3", fontWeight: "600" }}>
                ${data.low.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <span>C:</span>
              <span
                style={{
                  color: isGreen ? "#26a641" : "#f85149",
                  fontWeight: "600",
                }}
              >
                ${data.close.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #30363d",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#e6edf3", margin: 0 }}>
              ETH-USD
            </h3>
            <span
              style={{
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: isPositive ? "#1a3a1a" : "#3a1a1a",
                color: isPositive ? "#26a641" : "#f85149",
                fontSize: "11px",
                fontWeight: "600",
              }}
            >
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#e6edf3" }}>
            ${currentCandle.close.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: "#8b949e", marginTop: "2px" }}>
            O: ${currentCandle.open.toFixed(2)} H: ${currentCandle.high.toFixed(2)} L:{" "}
            ${currentCandle.low.toFixed(2)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Zoom Controls */}
          <div style={{ display: "flex", gap: "4px", marginRight: "8px" }}>
            <button
              onClick={handleZoomIn}
              style={{
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #30363d",
                backgroundColor: "transparent",
                color: "#8b949e",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #30363d",
                backgroundColor: "transparent",
                color: "#8b949e",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={handleResetZoom}
              style={{
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #30363d",
                backgroundColor: "transparent",
                color: "#8b949e",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Reset Zoom"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Timeframe Selector */}
          <div style={{ display: "flex", gap: "4px" }}>
            {["1H", "4H", "1D", "1W"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  border: "1px solid #30363d",
                  backgroundColor: timeframe === tf ? "#1f6feb" : "transparent",
                  color: timeframe === tf ? "#ffffff" : "#8b949e",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={visibleData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#8b949e"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "#30363d" }}
            minTickGap={30}
          />
          <YAxis
            stroke="#8b949e"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "#30363d" }}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#30363d", strokeWidth: 1 }} />

          <Bar
            dataKey="high"
            shape={(props: any) => {
              const isGreen = props.payload.close >= props.payload.open;
              const color = isGreen ? "#26a641" : "#f85149";
              const x = props.x;
              const width = Math.max(props.width - 2, 3);

              const yScale =
                props.height /
                (Math.max(...visibleData.map((d) => d.high)) -
                  Math.min(...visibleData.map((d) => d.low)));
              const yBase = props.y + props.height;
              const minPrice = Math.min(...visibleData.map((d) => d.low));

              const highY = yBase - (props.payload.high - minPrice) * yScale;
              const lowY = yBase - (props.payload.low - minPrice) * yScale;
              const openY = yBase - (props.payload.open - minPrice) * yScale;
              const closeY = yBase - (props.payload.close - minPrice) * yScale;

              const bodyTop = Math.min(openY, closeY);
              const bodyBottom = Math.max(openY, closeY);
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

              return (
                <g>
                  {/* Wick */}
                  <line
                    x1={x + width / 2}
                    y1={highY}
                    x2={x + width / 2}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  {/* Body */}
                  <rect
                    x={x + 1}
                    y={bodyTop}
                    width={width}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                  />
                </g>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Info bar */}
      <div
        style={{
          marginTop: "16px",
          padding: "10px 16px",
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "12px", color: "#8b949e" }}>
          <span style={{ color: "#e6edf3", fontWeight: "600" }}>{visibleData.length}</span> of{" "}
          {allData.length} candles displayed
        </div>
        <div style={{ fontSize: "11px", color: "#8b949e" }}>
          {visibleData[0]?.date} - {visibleData[visibleData.length - 1]?.date}
        </div>
      </div>
    </div>
  );
}