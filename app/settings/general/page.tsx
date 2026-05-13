import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SettingsForm } from "@/components/projects/SettingsForm";
import { getSettings } from "@/lib/settings";

export default function GeneralSettingsPage() {
  const s = getSettings();
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header className="flex flex-col gap-2">
        <Link href="/settings" className="text-xs text-muted hover:text-ink w-fit">
          ← Settings
        </Link>
        <h1 className="text-3xl tracking-tight font-medium">General</h1>
      </header>
      <Card tabbed>
        <SettingsForm
          baseCurrency={s.baseCurrency}
          cashOnHandCents={s.cashOnHandCents}
          fiscalYearStartMonth={s.fiscalYearStartMonth}
        />
      </Card>
    </div>
  );
}
