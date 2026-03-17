"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/lib/simstock";

export function PerformanceBarChart({ data }: { data: PricePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" stroke="rgba(226,232,240,0.54)" tickLine={false} axisLine={false} />
        <YAxis
          stroke="rgba(226,232,240,0.54)"
          tickLine={false}
          axisLine={false}
          width={72}
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
        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#84f0c2" />
      </BarChart>
    </ResponsiveContainer>
  );
}
