import { LitElement, css, html } from 'lit';
import './fdl-payment-workflow';
import './fdl-modifier-catalog';

export class FdlCookbookPage extends LitElement {
    render() {
        return html`
            <main>
                <header class="page-header">
                    <a class="back-link" href="../">← FDL home</a>
                    <img class="brand-wordmark" src="../d-cut-02.png" alt="FDL" />
                    <p class="eyebrow">Field Definition Language</p>
                    <h1>Modifier cookbook</h1>
                    <p class="lede">A living reference for FDL’s public builder modifiers, with small examples that show what each one does.</p>
                </header>
                <fdl-payment-workflow></fdl-payment-workflow>
                <fdl-modifier-catalog></fdl-modifier-catalog>
            </main>
        `;
    }

    static styles = css`
        :host { display: block; min-height: 100vh; color: #172033; background: #f7f8fb; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        main { max-width: 72rem; margin: 0 auto; padding: 0 1.25rem 5rem; }
        .page-header { max-width: 52rem; padding: 2rem 0 3.5rem; }
        .back-link { color: #343b53; font-size: .85rem; font-weight: 750; text-underline-offset: .2em; }
        .brand-wordmark { display: block; width: 8.75rem; height: auto; margin: 2.5rem 0; }
        .eyebrow { margin: 0 0 .6rem; color: #7657ff; font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
        h1, p { margin-top: 0; } h1 { max-width: 42rem; margin-bottom: 1rem; color: #10233f; font-size: clamp(2.7rem, 7vw, 5.4rem); font-weight: 750; letter-spacing: -.065em; line-height: .98; }
        .lede { color: #586174; font-size: 1.1rem; line-height: 1.65; }
        @media (max-width: 42rem) { .page-header { padding-bottom: 2.5rem; } }
    `;
}

customElements.define('fdl-cookbook-page', FdlCookbookPage);
