const footerLinks = [
  { href: "/demo", label: "Demo" },
  { href: "/cookbook", label: "Cookbook" },
  { href: "/case-study", label: "Case study" },
  { href: "/reference", label: "Reference" },
  { href: "/docs", label: "Docs" },
  { href: "/project-history", label: "Project history" },
  { href: "https://github.com/pmcelhaney/FDL", label: "GitHub ↗" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="brand brand-footer" href="/" aria-label="FDL home">
            <span className="brand-mark" aria-hidden="true">F·</span>
            <span>FDL</span>
          </Link>
          <p className="footer-statement">
            A declarative model for fields, records, and recordsets.
          </p>
        </div>
        <nav className="footer-nav" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <a
              href={link.href}
              key={link.href}
              {...(link.href.startsWith("http")
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="shell footer-meta">
        <span>Open source under Apache-2.0</span>
        <span>Business rules → semantic state → accessible component → visual theme</span>
      </div>
    </footer>
  );
}
import Link from "next/link";
