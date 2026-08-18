import type { Metadata } from "next";
import { Eyebrow } from "../components/Eyebrow";

export const metadata: Metadata = {
  title: "Project history",
  description:
    "A careful account of FDL's inherited foundation, recent rehabilitation, license, and AI-assisted development process.",
};

export default function ProjectHistoryPage() {
  return (
    <main id="main-content">
      <section className="page-hero history-hero shell">
        <Eyebrow>Project history · provenance</Eyebrow>
        <h1>Rehabilitation is a design discipline, not a rewrite story.</h1>
        <div className="page-hero-grid">
          <p className="page-deck">
            FDL has an inherited open-source foundation and a newer body of
            reconstruction work. This record separates what the repository can
            demonstrate from authorship it cannot responsibly assign.
          </p>
          <aside className="history-caveat">
            <strong>Attribution boundary</strong>
            <p>
              Repository history does not provide enough evidence here to make
              precise personal-authorship claims. This page intentionally uses
              project-level language and points to inspectable changes.
            </p>
          </aside>
        </div>
      </section>

      <section className="history-timeline section-rule">
        <div className="shell">
          <ol className="timeline">
            <li>
              <span className="timeline-marker">01</span>
              <div className="timeline-copy">
                <Eyebrow>Inherited foundation</Eyebrow>
                <h2>A working language for fields, records, and recordsets.</h2>
                <p>
                  The repository already contained the central FDL idea:
                  declarative field types, immutable-looking builder syntax,
                  record and recordset models, validation, dependencies,
                  formatting, filtering, and a Lit-oriented form integration.
                  That foundation is not presented as newly invented work.
                </p>
              </div>
              <div className="timeline-evidence">
                <span>Existing core</span>
                <ul>
                  <li>FieldType and modifiers</li>
                  <li>Record / Recordset</li>
                  <li>FormElement integration</li>
                  <li>Test suite and public docs</li>
                </ul>
              </div>
            </li>
            <li>
              <span className="timeline-marker">02</span>
              <div className="timeline-copy">
                <Eyebrow>Reconstruction</Eyebrow>
                <h2>Recover the boundary before adding surface area.</h2>
                <p>
                  Recent repository work clarifies the separation between model
                  behavior, component semantics, and presentation. It restores a
                  unified <code>&lt;fdl-field&gt;</code> example boundary and begins
                  deprecating modifiers that encode browser attributes,
                  component exceptions, or event orchestration in the model.
                </p>
              </div>
              <div className="timeline-evidence">
                <span>Inspectable artifacts</span>
                <ul>
                  <li>Design principles</li>
                  <li>Architecture decisions</li>
                  <li>Unified field control</li>
                  <li>Modifier retirement inventory</li>
                </ul>
              </div>
            </li>
            <li>
              <span className="timeline-marker">03</span>
              <div className="timeline-copy">
                <Eyebrow>Productization</Eyebrow>
                <h2>Turn an API catalog into an end-to-end argument.</h2>
                <p>
                  The current portfolio work reframes the library around a
                  concrete ACH and child-support workflow: define a rule once,
                  then observe form, validation, review, and output consumers.
                  Reference material remains available, but it no longer has to
                  carry the first impression.
                </p>
              </div>
              <div className="timeline-evidence">
                <span>Current direction</span>
                <ul>
                  <li>Narrative demo</li>
                  <li>Candid support matrix</li>
                  <li>Portfolio case study</li>
                  <li>Visible verification</li>
                </ul>
              </div>
            </li>
            <li>
              <span className="timeline-marker">04</span>
              <div className="timeline-copy">
                <Eyebrow>Roadmap</Eyebrow>
                <h2>Adapters should multiply; policy should not.</h2>
                <p>
                  Planned work includes removing the Lit runtime dependency in
                  favor of bare custom elements, building a parallel React
                  implementation, completing reference material, and improving
                  release and onboarding infrastructure. These are intentions,
                  not shipped claims.
                </p>
              </div>
              <div className="timeline-evidence">
                <span>Not complete</span>
                <ul>
                  <li>Bare custom-element adapter</li>
                  <li>React adapter</li>
                  <li>Generated API reference</li>
                  <li>Release automation</li>
                </ul>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="governance-section">
        <div className="shell governance-grid">
          <div>
            <Eyebrow>AI-assisted, review-governed</Eyebrow>
            <h2>Acceleration changes the pace—not the standard of evidence.</h2>
          </div>
          <div className="governance-copy">
            <p>
              AI can accelerate repository exploration, option generation,
              boilerplate, and focused implementation. It does not establish
              intent, prove compatibility, or decide that an abstraction belongs
              in the public model.
            </p>
            <p>
              Engineering judgment remains visible in the boundaries: design
              principles, decision records, focused diffs, automated tests,
              static type checks, build verification, and manual review of
              behavior and presentation.
            </p>
            <div className="governance-chain" aria-label="AI-assisted work is governed by review, tests, type checks, and manual verification">
              <span>Explore</span><span>Review</span><span>Test</span><span>Verify</span>
            </div>
          </div>
        </div>
      </section>

      <section className="license-section section-rule">
        <div className="shell license-grid">
          <div>
            <Eyebrow>Permission basis</Eyebrow>
            <h2>Open-source work, shown with its history intact.</h2>
          </div>
          <div>
            <p>
              The repository declares the package under the Apache License 2.0
              and includes the license text. That license provides the basis for
              using, modifying, and publicly displaying the work subject to its
              terms, including preservation of required notices and marking
              modified files when distributing derivatives.
            </p>
            <p className="small-print">
              This is a project provenance note, not legal advice. Commit history
              and repository records remain the authoritative evidence for
              individual contributions.
            </p>
            <div className="text-link-row">
              <a className="text-link" href="https://github.com/pmcelhaney/FDL/blob/main/LICENSE" target="_blank" rel="noreferrer">Read the Apache-2.0 license <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="/case-study">Examine the architecture <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
