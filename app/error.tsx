"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
      <span className="text-[11px] uppercase tracking-[0.18em] text-loss">
        Something went off-balance
      </span>
      <h1 className="text-3xl tracking-tight font-medium">
        We hit an unexpected error.
      </h1>
      <p className="text-sm text-muted max-w-md tabular">
        {error.message || "An unknown error occurred."}
      </p>
      {error.digest && (
        <p className="text-xs text-faint tabular">digest: {error.digest}</p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
