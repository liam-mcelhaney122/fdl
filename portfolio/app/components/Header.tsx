"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navigation = [
  { href: "/cookbook", label: "Cookbook" },
  { href: "/case-study", label: "Case study" },
  { href: "/reference", label: "Reference" },
  { href: "/docs", label: "Docs" },
  { href: "/project-history", label: "History" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="FDL home">
          <span className="brand-mark" aria-hidden="true">F·</span>
          <span>FDL</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
          <a
            href="https://github.com/pmcelhaney/FDL"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span className="external-mark" aria-hidden="true">↗</span>
          </a>
        </nav>
        <a
          className="button button-small button-primary header-cta"
          href="/demo"
          aria-current={pathname === "/demo" ? "page" : undefined}
        >
          Demo <span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  );
}
