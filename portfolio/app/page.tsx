import type { Metadata } from "next";
import { ArchitectureStrip } from "./components/ArchitectureStrip";
import { Eyebrow } from "./components/Eyebrow";
import { WorkflowProof } from "./components/WorkflowProof";

export const metadata: Metadata = {
  title: "One definition, every surface",
  description:
    "See how FDL keeps a complex payment workflow consistent from input through validation, review, and export.",
};

const consumers = [
  {
    number: "01",
    title: "Input",
    copy: "Choose an accessible control and bind it to the same field and record state.",
  },
  {
    number: "02",
    title: "Validation",
    copy: "Evaluate conditional requirements and cross-field rules in the model—not in an error label.",
  },
  {
    number: "03",
    title: "Review",
    copy: "Format, compare, sort, and align values without rebuilding their meaning for a table.",
  },
  {
    number: "04",
    title: "Export",
    copy: "Carry stable display intent into print- and export-oriented output without a second policy layer.",
  },
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <Eyebrow>Field Definition Language</Eyebrow>
          <h1 id="hero-title">Define the rule once. Keep every surface honest.</h1>
          <p className="hero-lede">
            FDL gives complex forms and tables one declarative source for field
            behavior. Input, validation, review tables, and export interpret the
            same definition instead of quietly drifting apart.
          </p>
          <div className="button-row">
            <a className="button button-primary" href="/demo">
              Run the ACH workflow <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-secondary" href="/cookbook">
              Follow the cookbook
            </a>
            <a className="button button-secondary" href="/case-study">
              Read the case study
            </a>
          </div>
          <p className="hero-note">
            Demonstrated with a multi-jurisdictional child-support payment flow.
          </p>
        </div>
        <WorkflowProof />
      </section>

      <section className="problem-section section-rule">
        <div className="shell split-intro">
          <div>
            <Eyebrow>The failure mode</Eyebrow>
            <h2>One payment. Four versions of the rules.</h2>
          </div>
          <div className="prose-large">
            <p>
              A routing number becomes required in the form, optional in an API
              guard, formatted differently in review, and absent from an export.
              Then the payment type changes—and every copy needs a careful edit.
            </p>
            <p>
              FDL moves that decision into a field model that can inspect the
              current record. Renderers receive semantic state; they do not
              become shadow policy engines.
            </p>
          </div>
        </div>
      </section>

      <section className="consumer-section shell" aria-labelledby="consumers-title">
        <div className="section-heading">
          <Eyebrow>One definition · four consumers</Eyebrow>
          <h2 id="consumers-title">A small language with a wide blast radius.</h2>
          <p>
            Define what a field means once, then let each surface interpret that
            meaning for its job.
          </p>
        </div>
        <div className="consumer-grid">
          {consumers.map((consumer) => (
            <article className="consumer" key={consumer.title}>
              <span className="consumer-number">{consumer.number}</span>
              <h3>{consumer.title}</h3>
              <p>{consumer.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <ArchitectureStrip />

      <section className="evidence-section shell" aria-labelledby="evidence-title">
        <div className="section-heading compact">
          <Eyebrow>Evidence, with edges</Eyebrow>
          <h2 id="evidence-title">Architecture you can inspect—not a finished-platform claim.</h2>
        </div>
        <div className="evidence-grid">
          <article className="evidence-block evidence-positive">
            <p className="evidence-label">In the repository today</p>
            <ul className="check-list">
              <li>Immutable, composable field builders</li>
              <li>Record-level dependencies and validation</li>
              <li>Recordset sorting, filtering, and pagination</li>
              <li>A unified Lit-based field adapter and table example</li>
              <li>Jest and TypeScript verification</li>
            </ul>
          </article>
          <article className="evidence-block evidence-caution">
            <p className="evidence-label">Deliberately not overstated</p>
            <ul className="plain-list">
              <li>Lit powers the current example adapter.</li>
              <li>Bare custom elements are a roadmap refactor.</li>
              <li>A parallel React implementation is planned, not shipped.</li>
              <li>Release automation and a generated API reference still need work.</li>
            </ul>
          </article>
        </div>
        <div className="text-link-row">
          <a className="text-link" href="/case-study">
            Examine the decisions <span aria-hidden="true">→</span>
          </a>
          <a className="text-link" href="/project-history">
            Read the project history <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="closing-cta">
        <div className="shell closing-inner">
          <div>
            <Eyebrow>See the contract move</Eyebrow>
            <h2>Change the payment rule. Watch every consumer follow.</h2>
          </div>
          <a className="button button-light" href="/demo">
            Open the interactive demo <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}
