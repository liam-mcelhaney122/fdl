import type { Metadata } from "next";
import { Eyebrow } from "../components/Eyebrow";

export const metadata: Metadata = {
  title: "Case study",
  description:
    "The architecture and tradeoffs behind FDL's model-first approach to complex forms and tables.",
};

const decisions = [
  {
    number: "01",
    title: "Immutable builders",
    decision: "Every modifier returns a specialized FieldType and leaves its source untouched.",
    tradeoff: "Call sites gain safe composition and reuse; the implementation must clone collection state carefully and document ordering and override behavior.",
  },
  {
    number: "02",
    title: "Renderer independence",
    decision: "Field definitions describe durable behavior, not a preferred tag, component property, or event shortcut.",
    tradeoff: "Adapters do more translation work, but the model remains meaningful to forms, tables, documents, tests, and future renderers.",
  },
  {
    number: "03",
    title: "Validation ownership",
    decision: "If a modifier claims a value is constrained or invalid, FieldType or Record must enforce it.",
    tradeoff: "Browser constraints can still improve interaction, but they cannot become a second, contradictory source of truth.",
  },
  {
    number: "04",
    title: "Accessibility is component work",
    decision: "Components own labels, roles, focus, keyboard behavior, events, and accessible state.",
    tradeoff: "FDL exposes semantic state without prescribing markup. CSS can express the state visually, but never exclusively.",
  },
];

export default function CaseStudyPage() {
  return (
    <main id="main-content">
      <section className="page-hero shell">
        <Eyebrow>Case study · system architecture</Eyebrow>
        <h1>Complex workflows fail when every surface gets its own truth.</h1>
        <div className="page-hero-grid">
          <p className="page-deck">
            FDL treats field behavior as a small declarative language, separating
            payment policy from the components and themes that express it.
          </p>
          <dl className="brief-facts">
            <div><dt>Domain lens</dt><dd>ACH &amp; child-support payments</dd></div>
            <div><dt>Core object</dt><dd>Field definition</dd></div>
            <div><dt>Primary tension</dt><dd>Reuse without renderer lock-in</dd></div>
          </dl>
        </div>
      </section>

      <section className="case-section section-rule">
        <div className="shell case-grid">
          <div className="case-index"><span>01</span><span>Problem</span></div>
          <div className="case-content">
            <h2>Conditional payment rules multiply faster than screens.</h2>
            <div className="two-column-prose">
              <p>
                Consider a multi-jurisdictional child-support disbursement. ACH
                selection makes routing and account fields required. Payment
                status can disable edits. State and agency choices constrain
                valid destinations. Values must be parsed for entry, validated
                as a record, formatted for review, and represented for export.
              </p>
              <p>
                Reimplementing those decisions in each UI, table, and output
                creates invisible policy forks. FDL&apos;s product hypothesis is
                that a reusable field model can make the disagreement harder to
                create and easier to test.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="case-section case-muted">
        <div className="shell case-grid">
          <div className="case-index"><span>02</span><span>Constraints</span></div>
          <div className="case-content">
            <h2>Keep three kinds of authority separate.</h2>
            <ul className="constraint-list">
              <li><strong>The model</strong><span>owns validation, dependencies, parsing, formatting, comparison, and field state.</span></li>
              <li><strong>The component</strong><span>owns accessible structure, interaction, focus, events, and native control choices.</span></li>
              <li><strong>The theme</strong><span>owns spacing, typography, color, density, decoration, and animation.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="case-section architecture-case">
        <div className="shell case-grid">
          <div className="case-index"><span>03</span><span>Architecture</span></div>
          <div className="case-content">
            <h2>A forward-only contract.</h2>
            <p className="section-lede">
              Each layer receives an explicit contract from the layer before it.
              A visual treatment cannot silently change meaning, and a component
              cannot invent policy for one convenient screen.
            </p>
            <div className="case-diagram" role="img" aria-label="Business rules flow to semantic state, accessible components, and visual theme; forms, review tables, and export consume the result">
              <div className="diagram-model">
                <span className="diagram-kicker">Source of truth</span>
                <strong>FDL model</strong>
                <span>FieldType · Record · Recordset</span>
              </div>
              <div className="diagram-connector" aria-hidden="true"><span>semantic state</span></div>
              <div className="diagram-adapter">
                <span className="diagram-kicker">Translation layer</span>
                <strong>Accessible adapter</strong>
                <span>controls · roles · focus · events</span>
              </div>
              <div className="diagram-connector" aria-hidden="true"><span>stable hooks</span></div>
              <div className="diagram-output-group">
                <div><strong>Form</strong><span>input</span></div>
                <div><strong>Review</strong><span>table</span></div>
                <div><strong>Output</strong><span>print / export</span></div>
              </div>
              <p className="diagram-theme"><span>Visual theme</span> applies without owning meaning</p>
            </div>
          </div>
        </div>
      </section>

      <section className="case-section section-rule">
        <div className="shell case-grid">
          <div className="case-index"><span>04</span><span>Decisions</span></div>
          <div className="case-content">
            <h2>The design is mostly about where to say “no.”</h2>
            <div className="decision-list">
              {decisions.map((item) => (
                <article className="decision" key={item.title}>
                  <span className="decision-number">{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.decision}</p>
                    <p className="tradeoff"><strong>Tradeoff:</strong> {item.tradeoff}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="case-section case-dark">
        <div className="shell case-grid">
          <div className="case-index"><span>05</span><span>Evidence</span></div>
          <div className="case-content">
            <h2>What can be examined today.</h2>
            <div className="proof-columns">
              <div>
                <h3>Implemented</h3>
                <ul className="check-list">
                  <li>Composable field modifiers and typed builder APIs</li>
                  <li>Conditional required, visible, disabled, and read-only state</li>
                  <li>Parsing, formatting, validation, comparison, filtering, and aggregation</li>
                  <li>Record and Recordset behavior with Jest coverage</li>
                  <li>Lit-based field and table examples using native controls</li>
                </ul>
              </div>
              <div>
                <h3>Known limitations</h3>
                <ul className="plain-list">
                  <li>The current example adapter depends on Lit.</li>
                  <li>Bare custom elements and React are roadmap items.</li>
                  <li>Some legacy DOM-specific modifiers are being retired.</li>
                  <li>Release/versioning and generated reference work remain.</li>
                  <li>The portfolio scenario demonstrates architecture; it does not claim measured business impact.</li>
                </ul>
              </div>
            </div>
            <div className="button-row">
              <a className="button button-light" href="/demo">Use the workflow <span aria-hidden="true">↗</span></a>
              <a className="button button-dark-outline" href="https://github.com/pmcelhaney/FDL/blob/main/docs/design-principles.md" target="_blank" rel="noreferrer">Read the complete principles <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
