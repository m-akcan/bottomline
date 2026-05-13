"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  /** Match exactly, otherwise prefix-matches sub-routes. */
  exact?: boolean;
}

export function NavLink({ href, children, exact }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "relative inline-flex items-center px-1 py-1 text-sm transition-colors",
        isActive
          ? "text-ink"
          : "text-muted hover:text-ink",
      ].join(" ")}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute left-0 right-0 -bottom-[7px] h-[2px] transition-all",
          isActive ? "bg-olive" : "bg-transparent",
        ].join(" ")}
      />
    </Link>
  );
}
