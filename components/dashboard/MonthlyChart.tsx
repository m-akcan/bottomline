"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { monthLabel } from "@/lib/date";

export interface MonthlyChartDatum {
  month: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

export interface MonthlyChartProps {
  data: MonthlyChartDatum[];
  currency?: string;
  height?: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyChartDatum }>;
  label?: string | number;
  currency: string;
}

function ChartTooltip({
  active,
  payload,
  currency,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  return (
    <div className="bg-card border border-hairline rounded-[6px] shadow-[0_2px_8px_rgba(26,23,20,0.08)] p-3 min-w-[180px]">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted mb-1.5">
        {monthLabel(datum.month)}
      </div>
      <table className="w-full tabular text-xs">
        <tbody>
          <tr>
            <td className="text-muted py-0.5">Income</td>
            <td className="text-right text-gain py-0.5">
              {formatMoney(datum.incomeCents, { currency })}
            </td>
          </tr>
          <tr>
            <td className="text-muted py-0.5">Expense</td>
            <td className="text-right text-loss py-0.5">
              {formatMoney(datum.expenseCents, { currency })}
            </td>
          </tr>
          <tr className="border-t border-hairline">
            <td className="text-ink-soft pt-1.5">Net</td>
            <td
              className={`text-right pt-1.5 ${
                datum.netCents >= 0 ? "text-gain" : "text-loss"
              }`}
            >
              {formatMoney(datum.netCents, { currency, signed: true })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function MonthlyChart({
  data,
  currency = "USD",
  height = 280,
}: MonthlyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: monthLabel(d.month),
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ComposedChart
          data={chartData}
          margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
          barGap={2}
        >
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gain-soft)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--color-gain-soft)" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-loss-soft)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--color-loss-soft)" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--color-hairline)"
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--color-hairline)" }}
            tick={{
              fill: "var(--color-muted)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatMoneyCompact(Number(v), { currency })}
            tick={{
              fill: "var(--color-muted)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
            width={56}
          />
          <Tooltip
            content={<ChartTooltip currency={currency} />}
            cursor={{ fill: "var(--color-olive-tint)", opacity: 0.4 }}
          />
          <Bar
            dataKey="incomeCents"
            fill="url(#incomeFill)"
            stroke="var(--color-gain)"
            strokeWidth={0.5}
            radius={[3, 3, 0, 0]}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="expenseCents"
            fill="url(#expenseFill)"
            stroke="var(--color-loss)"
            strokeWidth={0.5}
            radius={[3, 3, 0, 0]}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="netCents"
            stroke="var(--color-ink)"
            strokeWidth={1.5}
            dot={{ r: 2, fill: "var(--color-ink)" }}
            activeDot={{ r: 4, fill: "var(--color-olive)" }}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
