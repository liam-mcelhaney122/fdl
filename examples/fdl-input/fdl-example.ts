import { LitElement, html, css, type PropertyValues } from 'lit';
import { highlightJavaScript } from './highlight-javascript';
import { exampleTheme } from './example-theme';

/** A collapsible live example with source tabs and slotted example content. */
export class FdlExample extends LitElement {
    static properties = {
        heading: { type: String },
        filenames: { attribute: false },
        sources: { attribute: false },
        activeTab: { state: true },
    };
    heading = 'Example';
    filenames: readonly string[] = [];
    sources: Readonly<Record<string, string>> = {};
    private activeTab = '';

    protected willUpdate(_changed: PropertyValues<this>) {
        if (!this.filenames.includes(this.activeTab)) this.activeTab = '';
    }

    private selectTab(filename: string) {
        this.activeTab = filename;
    }

    render() {
        const tabs = ['', ...this.filenames];
        return html`<details>
            <summary><h2>${this.heading}</h2></summary>
            <slot name="description"></slot>
            <div
                class="tabs"
                role="tablist"
                aria-label=${`${this.heading} views`}
            >
                ${tabs.map(
                    (filename, index) =>
                        html`<button
                            id=${`example-tab-${index}`}
                            role="tab"
                            aria-selected=${this.activeTab === filename}
                            aria-controls=${`example-panel-${index}`}
                            tabindex=${this.activeTab === filename ? 0 : -1}
                            @click=${() => this.selectTab(filename)}
                            @keydown=${(event: KeyboardEvent) => this.navigateTabs(event, index)}
                            >${filename || 'Interactive example'}</button
                        >`
                )}
            </div>
            <div
                id="example-panel-0"
                class="tab-panel"
                role="tabpanel"
                aria-labelledby="example-tab-0"
                ?hidden=${this.activeTab !== ''}
            >
                <slot></slot>
            </div>
            ${this.filenames.map(
                (filename, index) =>
                    html`<div
                        id=${`example-panel-${index + 1}`}
                        class="tab-panel"
                        role="tabpanel"
                        aria-labelledby=${`example-tab-${index + 1}`}
                        ?hidden=${this.activeTab !== filename}
                    >
                        <pre
                            class="code"
                        ><code>${highlightJavaScript(this.sources[filename] ?? 'Source unavailable.')}</code></pre>
                    </div>`
            )}
        </details>`;
    }

    private navigateTabs(event: KeyboardEvent, index: number) {
        const tabs = ['', ...this.filenames];
        let next: number;
        switch (event.key) {
            case 'ArrowRight':
                next = (index + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                next = (index + tabs.length - 1) % tabs.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = tabs.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        this.selectTab(tabs[next]);
        this.shadowRoot!.querySelector<HTMLButtonElement>(
            `#example-tab-${next}`
        )!.focus();
    }
    static styles = css`
        :host {
            display: block;
            margin: 24px 0 32px;
        }
        * {
            box-sizing: border-box;
        }
        details {
            border: 1px solid var(--example-border);
            border-radius: var(--example-radius);
            padding: 24px;
        }
        h2 {
            display: inline;
            margin: 0;
            font-size: 1.5rem;
        }
        summary {
            cursor: pointer;
        }
        summary:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 4px;
        }
        p {
            line-height: 1.6;
        }
        .tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin: 20px 0 0;
            border-bottom: 1px solid var(--example-border);
        }
        .tabs button {
            border: 0;
            border-bottom: 3px solid transparent;
            border-radius: 4px 4px 0 0;
            padding: 10px 14px;
            background: transparent;
            color: #475569;
            cursor: pointer;
            font: inherit;
            font-weight: 600;
        }
        .tabs button[aria-selected='true'] {
            border-bottom-color: #2563eb;
            color: #1d4ed8;
            background: #eff6ff;
        }
        .tabs button:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 2px;
        }
        .tab-panel {
            padding-top: 20px;
        }
        .code {
            margin: 0;
            padding: 20px;
            border-radius: var(--example-radius);
            background: #0f172a;
            color: #e2e8f0;
            font: 0.875rem/1.7 monospace;
            overflow: auto;
            tab-size: 2;
        }
        .syntax-comment {
            color: #a5b4c8;
            font-style: italic;
        }
        .syntax-string,
        .syntax-regex {
            color: #a7f3d0;
        }
        .syntax-keyword {
            color: #c4b5fd;
        }
        .syntax-builtin {
            color: #7dd3fc;
        }
        .syntax-function {
            color: #93c5fd;
        }
        .syntax-number,
        .syntax-literal {
            color: #fdba74;
        }
        .syntax-punctuation {
            color: #cbd5e1;
        }
        ::slotted([slot='description']) {
            margin: 16px 0;
            line-height: 1.6;
        }
        @media (max-width: 480px) {
            details {
                padding: 16px;
            }
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-example', FdlExample);
