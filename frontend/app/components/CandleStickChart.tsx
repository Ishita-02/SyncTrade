"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
} from "lightweight-charts";

export default function CandlestickChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 420,
      layout: {
        background: { color: "#0f1419" },
        textColor: "#c9d1d9",
      },
      grid: {
        vertLines: { color: "#21262d" },
        horzLines: { color: "#21262d" },
      },
      timeScale: {
        borderColor: "#30363d",
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#3fb950",
      downColor: "#f85149",
      wickUpColor: "#3fb950",
      wickDownColor: "#f85149",
      borderVisible: false,
    });

    // Mock data
    series.setData([
      { time: "2024-01-01", open: 3500, high: 3600, low: 3450, close: 3550 },
      { time: "2024-01-02", open: 3550, high: 3700, low: 3500, close: 3650 },
      { time: "2024-01-03", open: 3650, high: 3750, low: 3600, close: 3700 },
    ]);

    const resize = () => {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, []);

  return <div ref={containerRef} />;
}
