"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Post } from "@/types";

export default function PerformanceChart({ posts }: { posts: Post[] }) {
  const data = posts
    .filter((p) => p.posted_at)
    .map((p) => ({
      date: new Date(p.posted_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: p.views || 0,
      reach: p.accounts_reached || 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#737373", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#737373", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <Tooltip
          contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: 8 }}
          labelStyle={{ color: "#a3a3a3", fontSize: 12 }}
          itemStyle={{ color: "#fff", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#ffffff"
          strokeWidth={2}
          dot={false}
          name="Views"
        />
        <Line
          type="monotone"
          dataKey="reach"
          stroke="#525252"
          strokeWidth={1.5}
          dot={false}
          name="Reach"
          strokeDasharray="4 4"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
