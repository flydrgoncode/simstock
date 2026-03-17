"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/lib/simstock";

export function MarketChart({ data }: { data: PricePoint[] }) {
  const values = data.map((point) => point.value).filter((value) => Number.isFinite(value));
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const spread = maxValue - minValue;
  const padding = spread > 0 ? spread * 0.08 : Math.max(Math.abs(maxValue) * 0.02, 1);
  const domain: [number, number] = [minValue - padding, maxValue + padding];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#84f0c2" stopOpacity={0.58} />
            <stop offset="95%" stopColor="#84f0c2" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" stroke="rgba(226,232,240,0.54)" tickLine={false} axisLine={false} />
        <YAxis
          stroke="rgba(226,232,240,0.54)"
          tickLine={false}
          axisLine={false}
          width={72}
          domain={domain}
          allowDataOverflow
          tickFormatter={(value) => `€${Number(value).toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(5, 16, 24, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            color: "#fff",
          }}
        />
        <Area type="monotone" dataKey="value" stroke="#84f0c2" strokeWidth={3} fill="url(#priceFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
