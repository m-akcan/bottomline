import Link from "next/link";
import { NavLink } from "./NavLink";

export function TopNav() {
  return (
    <header className="border-b border-hairline bg-paper">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between gap-8">
        <Link
          href="/"
          className="group flex items-baseline gap-2 select-none"
        >
          <span
            aria-hidden
            className="inline-block w-2 h-2 rounded-[2px] bg-olive translate-y-[1px] transition-transform group-hover:rotate-45"
          />
          <span className="text-lg font-semibold tracking-tight">
            bottomline
          </span>
          <span className="tabular text-[10px] uppercase tracking-[0.2em] text-faint">
            ledger
          </span>
        </Link>
        <nav className="flex items-center gap-7 relative">
          <NavLink href="/" exact>
            Dashboard
          </NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </nav>
      </div>
    </header>
  );
}
