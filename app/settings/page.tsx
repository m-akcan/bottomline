import Link from "next/link";

const links = [
  {
    href: "/settings/general",
    title: "General",
    description: "Base currency, cash on hand, fiscal year.",
  },
  {
    href: "/settings/categories",
    title: "Categories",
    description: "Manage expense and income categories.",
  },
  {
    href: "/settings/data",
    title: "Export & import",
    description: "Download a JSON backup, or replace all data from one.",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
          Settings
        </span>
        <h1 className="text-3xl tracking-tight font-medium">Configure bottomline</h1>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block bg-card border border-hairline rounded-[6px] p-5 hover:bg-card-deep transition-colors group"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-ink">{l.title}</h2>
              <span className="text-faint group-hover:text-olive transition-colors">
                →
              </span>
            </div>
            <p className="text-sm text-muted mt-1">{l.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
