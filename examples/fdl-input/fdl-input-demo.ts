import { LitElement, css, html } from 'lit';

export class FdlInputDemo extends LitElement {
    render() {
        return html`
            <main>
                <header class="hero">
                    <img class="brand-wordmark" src="./d-cut-02.png" alt="FDL" />
                    <p class="eyebrow">Field Definition Language</p>
                    <h1>Forms that adapt to the work.</h1>
                    <p class="lede">
                        Define meaning once, then let forms, tables, and other consumers interpret
                        the same rules consistently.
                    </p>
                    <div class="actions">
                        <a class="button primary" href="./cookbook/">Explore the modifier cookbook <span aria-hidden="true">→</span></a>
                        <a class="button secondary" href="https://github.com/Banno/FDL" target="_blank" rel="noreferrer">View FDL on GitHub <span aria-hidden="true">↗</span></a>
                    </div>
                    <p class="rule-note"><span class="rule-dot"></span> Small definitions. Consistent behavior.</p>
                </header>

                <section class="principles" aria-labelledby="principles-heading">
                    <div>
                        <p class="eyebrow">Why FDL</p>
                        <h2 id="principles-heading">The rule belongs with the field, not the screen.</h2>
                    </div>
                    <div class="principle-grid">
                        <article>
                            <span>01</span>
                            <h3>Describe intent</h3>
                            <p>Define labels, validation, formatting, options, and dependencies in one composable field definition.</p>
                        </article>
                        <article>
                            <span>02</span>
                            <h3>React to context</h3>
                            <p>Let a record decide when a field is required, read-only, disabled, or visible.</p>
                        </article>
                        <article>
                            <span>03</span>
                            <h3>Reuse the meaning</h3>
                            <p>Forms, tables, and exports can each interpret the same model without recreating its rules.</p>
                        </article>
                    </div>
                </section>

                <section class="cookbook-callout" aria-labelledby="cookbook-heading">
                    <p class="eyebrow">Hands-on reference</p>
                    <h2 id="cookbook-heading">See each modifier in isolation.</h2>
                    <p>Browse focused, live examples for the supported public modifier surface, with clear notes where a native-control example cannot demonstrate a contract honestly.</p>
                    <a class="text-link" href="./cookbook/">Open the modifier cookbook <span aria-hidden="true">→</span></a>
                </section>
            </main>
        `;
    }

    static styles = css`
        :host { display: block; min-height: 100vh; color: #172033; background: #f7f8fb; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        main { max-width: 72rem; margin: 0 auto; padding: 0 1.25rem 5rem; }
        .hero { padding: 4.5rem 0 5.5rem; max-width: 56rem; }
        .brand-wordmark { display: block; width: 8.75rem; height: auto; margin-bottom: 2.5rem; }
        .eyebrow { margin: 0 0 .6rem; color: #7657ff; font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
        h1, h2, h3, p { margin-top: 0; } h1 { max-width: 42rem; margin-bottom: 1rem; color: #10233f; font-size: clamp(2.7rem, 7vw, 5.4rem); font-weight: 750; letter-spacing: -.065em; line-height: .98; }
        h2 { margin-bottom: .6rem; color: #10233f; font-size: clamp(2rem, 4vw, 3rem); font-weight: 750; letter-spacing: -.05em; } h3 { font-size: .9rem; margin-bottom: .35rem; }
        .lede { color: #586174; font-size: 1.1rem; line-height: 1.65; max-width: 45rem; } .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.9rem; } .button { align-items: center; border: 1px solid #10233f; border-radius: .45rem; display: inline-flex; font-size: .86rem; font-weight: 750; gap: .45rem; padding: .7rem 1rem; text-decoration: none; } .primary { background: #10233f; color: #fff; } .primary:hover { background: #7657ff; border-color: #7657ff; } .secondary { color: #10233f; } .secondary:hover { border-color: #7657ff; color: #7657ff; } .rule-note { display: flex; align-items: center; gap: .55rem; color: #10233f; font-size: .88rem; font-weight: 750; margin: 1.5rem 0 0; } .rule-dot { width: .55rem; height: .55rem; border-radius: 50%; background: #ff695b; }
        .principles { border-top: 1px solid #dfe3ee; display: grid; gap: 2.5rem; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); padding: 4.5rem 0; } .principles h2, .cookbook-callout h2 { color: #10233f; font-size: clamp(2rem, 4vw, 3rem); font-weight: 750; letter-spacing: -.05em; line-height: 1; } .principle-grid { display: grid; gap: 1px; background: #dfe3ee; border: 1px solid #dfe3ee; } .principle-grid article { background: #fff; padding: 1.25rem; } .principle-grid span { color: #7657ff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; font-weight: 800; } .principle-grid h3 { color: #10233f; font-size: 1rem; margin: .7rem 0 .45rem; } .principle-grid p, .cookbook-callout > p:not(.eyebrow) { color: #586174; font-size: .92rem; line-height: 1.6; margin-bottom: 0; }
        .cookbook-callout { background: #10233f; border-radius: 1rem; color: #fff; padding: clamp(2rem, 6vw, 4.5rem); } .cookbook-callout h2 { color: #fff; max-width: 28rem; } .cookbook-callout > p:not(.eyebrow) { color: #d6daea; max-width: 42rem; } .cookbook-callout .eyebrow { color: #b8a8ff; } .text-link { color: #fff; display: inline-block; font-size: .9rem; font-weight: 800; margin-top: 1.8rem; text-underline-offset: .25em; }
        @media (max-width: 42rem) { .hero { padding: 3.5rem 0 3.5rem; } .principles { grid-template-columns: 1fr; padding: 3.5rem 0; } }
    `;
}

customElements.define('fdl-input-demo', FdlInputDemo);
