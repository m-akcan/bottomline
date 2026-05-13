"use client";

import { Area, AreaChart } from "recharts";

export interface SparklineProps {
  values: number[];
  tone?: "gain" | "loss" | "olive";
  height?: number;
  width?: number;
}

const TONE_COLOR: Record<NonNullable<SparklineProps["tone"]>, string> = {
  gain: "var(--color-gain)",
  loss: "var(--color-loss)",
  olive: "var(--color-olive)",
};

export function Sparkline({
  values,
  tone = "olive",
  height = 32,
  width = 90,
}: SparklineProps) {
  const data = values.map((v, i) => ({ i, v }));
  const id = `spark-${tone}-${values.length}`;
  return (
    <div style={{ width, height }} aria-hidden>
      <AreaChart
        data={data}
        width={width}
        height={height}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TONE_COLOR[tone]} stopOpacity={0.35} />
            <stop offset="100%" stopColor={TONE_COLOR[tone]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={TONE_COLOR[tone]}
          strokeWidth={1.5}
          fill={`url(#${id})`}
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />
      </AreaChart>
    </div>
  );
}
