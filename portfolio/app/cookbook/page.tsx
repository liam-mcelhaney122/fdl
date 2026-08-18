import type { Metadata } from "next";
import { Eyebrow } from "../components/Eyebrow";

export const metadata: Metadata = {
  title: "Workflow cookbook",
  description:
    "A task-oriented guide to modeling an ACH child-support payment workflow with FDL.",
};

const repository = "https://github.com/pmcelhaney/FDL";

const recipes = [
  {
    number: "01",
    title: "Name the record before the controls",
    copy: "Start with the payment and its policy state: destination, payment method, amount, jurisdiction, and status. The record gives every consumer a shared context before a component chooses a tag.",
    proof: "Record-level dependencies and validation",
  },
  {
    number: "02",
    title: "Make the payment method change the contract",
    copy: "When ACH is selected, routing and account details become required. When the payment is settled, edits can become unavailable. Put those decisions in field definitions that can inspect the current record.",
    proof: "Conditional required and disabled state",
  },
  {
    number: "03",
    title: "Let each surface do its job",
    copy: "An accessible control handles input. Validation reports model state. A review table formats and aligns values. An export carries stable display intent. None needs its own copy of the payment policy.",
    proof: "Forms, review tables, and output consumers",
  },
  {
    number: "04",
    title: "Test the rule where it lives",
    copy: "Exercise the model with focused tests, then use the example adapter to confirm that the semantics remain useful in interaction. The browser is evidence for the adapter—not the only enforcement point.",
    proof: "Jest, TypeScript, and Lit example coverage",
  },
];

export default function CookbookPage() {
  return (
    <main id="main-content">
      <section className="page-hero shell cookbook-hero">
        <Eyebrow>Cookbook · task-oriented guide</Eyebrow>
        <h1>Model a payment workflow without teaching every screen the rules.</h1>
        <div className="page-hero-grid">
          <p className="page-deck">
            Use the fictional ACH child-support payment workflow to see how FDL
            keeps one field definition useful from data entry through review and
            export. This guide explains the choices behind the scenario.
          </p>
          <aside className="cookbook-boundary">
            <strong>What this is</strong>
            <p>
              A short portfolio guide to a workflow. It is not the complete
              interactive modifier catalog or a replacement for the repository
              documentation.
            </p>
          </aside>
        </div>
        <div className="button-row">
          <a className="button button-primary" href="/demo">
            Run the payment workflow <span aria-hidden="true">↗</span>
          </a>
          <a className="button button-secondary" href={`${repository}/blob/main/docs/design-principles.md`} target="_blank" rel="noreferrer">
            Read the design principles <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="cookbook-recipes section-rule">
        <div className="shell">
          <div className="section-heading compact">
            <Eyebrow>The recipe</Eyebrow>
            <h2>Build the policy once, then keep the handoffs explicit.</h2>
          </div>
          <ol className="recipe-list">
            {recipes.map((recipe) => (
              <li key={recipe.number} className="recipe-item">
                <span className="recipe-number">{recipe.number}</span>
                <div>
                  <h3>{recipe.title}</h3>
                  <p>{recipe.copy}</p>
                </div>
                <span className="recipe-proof">{recipe.proof}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cookbook-surfaces">
        <div className="shell cookbook-surfaces-grid">
          <div>
            <Eyebrow>One payment, several jobs</Eyebrow>
            <h2>The workflow stays coherent because the policy does not move.</h2>
          </div>
          <div className="cookbook-surface-list">
            <div><strong>Input</strong><span>Accessible controls translate semantic field state into interaction.</span></div>
            <div><strong>Validation</strong><span>The record evaluates dependencies and reports what is missing or invalid.</span></div>
            <div><strong>Review</strong><span>A table formats values for comparison without recreating the business rule.</span></div>
            <div><strong>Export</strong><span>Output uses stable display intent without inventing a second policy layer.</span></div>
          </div>
        </div>
      </section>

      <section className="cookbook-catalog section-rule">
        <div className="shell cookbook-catalog-grid">
          <div>
            <Eyebrow>When you need the whole catalog</Eyebrow>
            <h2>Run the Lit modifier catalog locally.</h2>
          </div>
          <div>
            <p className="catalog-lede">
              The full interactive catalog belongs in the repository&apos;s Lit
              example, where individual modifiers can be explored in context.
              From a local clone, run <code>npm run example:fdl-input</code>.
            </p>
            <div className="text-link-row">
              <a className="text-link" href={`${repository}/tree/main/examples/fdl-input`} target="_blank" rel="noreferrer">
                Open the Lit example source <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="/reference">
                Browse the candid support matrix <span aria-hidden="true">→</span>
              </a>
              <a className="text-link" href={`${repository}/blob/main/docs/field-type.md`} target="_blank" rel="noreferrer">
                Read the FieldType guide <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="shell closing-inner">
          <div>
            <Eyebrow>Try the narrative first</Eyebrow>
            <h2>Change the payment method and follow the rule through the workflow.</h2>
          </div>
          <a className="button button-light" href="/demo">
            Open the ACH workflow <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}
