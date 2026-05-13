"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { inputBase } from "./Field";
import { SUPPORTED_CURRENCIES } from "@/lib/fx";

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "$",
  AUD: "$",
  CHF: "Fr",
  JPY: "¥",
  INR: "₹",
  BRL: "R$",
  TRY: "₺",
  MXN: "$",
  SGD: "$",
  ZAR: "R",
};

export interface CurrencyInputProps {
  name?: string;
  defaultAmount?: number;
  defaultCurrency?: string;
  currencyName?: string;
  required?: boolean;
  id?: string;
}

export function CurrencyInput({
  name = "amount",
  currencyName = "currency",
  defaultAmount,
  defaultCurrency = "USD",
  required,
  id,
}: CurrencyInputProps) {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [value, setValue] = useState(
    defaultAmount != null ? defaultAmount.toFixed(2) : ""
  );

  return (
    <div className="flex">
      <span className="inline-flex items-center justify-center w-9 border border-r-0 border-hairline rounded-l-[4px] bg-card text-muted tabular text-sm">
        {SYMBOLS[currency] ?? "$"}
      </span>
      <input
        id={id}
        name={name}
        inputMode="decimal"
        required={required}
        placeholder="0.00"
        value={value}
        onChange={(e) => {
          // allow digits, dot, minus
          const cleaned = e.target.value.replace(/[^0-9.\-]/g, "");
          setValue(cleaned);
        }}
        onBlur={() => {
          if (value === "" || value === "-") return;
          const n = Number(value);
          if (Number.isFinite(n)) {
            setValue(
              n.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: true,
              })
            );
          }
        }}
        onFocus={() => {
          // strip grouping
          setValue(value.replace(/,/g, ""));
        }}
        className={cn(inputBase, "tabular flex-1 rounded-none border-l-0 border-r-0")}
      />
      <select
        name={currencyName}
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className={cn(
          inputBase,
          "tabular w-20 rounded-r-[4px] rounded-l-none cursor-pointer"
        )}
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
