import { LitElement, html, css, type PropertyValues } from 'lit';
import { highlightSourceCode, highlightModifier } from './highlight-javascript';
import { exampleTheme } from './example-theme';

/** A collapsible live example with source tabs and slotted example content. */
export class FdlExample extends LitElement {
    static properties = {
        heading: { type: String },
        filenames: { attribute: false },
        sources: { attribute: false },
        activeTab: { state: true },
        modifier: { type: String },
    };
    heading = 'Example';
    modifier = '';
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
            <summary>
                <span class="example-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="m9 5-7 7 7 7m6-14 7 7-7 7" />
                    </svg>
                </span>
                <span class="summary-copy">
                    <span class="eyebrow">Live example</span>
                    <h2>${this.heading}</h2>
                    <span class="summary-hint"
                        >Try it
                        out${this.filenames.length ? ' · Explore the source' : ''}</span
                    >
                </span>
                <span class="expand-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </span>
            </summary>
            <div class="example-content">
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
                            ><code>${this.modifier && index === 0 ? highlightModifier(this.sources[filename] ?? '', this.modifier) : highlightSourceCode(this.sources[filename] ?? 'Source unavailable.')}</code></pre>
                        </div>`
                )}
            </div>
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
            border: 1px solid #bfcee8;
            border-left: 4px solid #2563eb;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 2px 6px #0f172a08;
        }
        summary {
            display: flex;
            align-items: center;
            gap: 18px;
            padding: 24px;
            border-radius: 8px;
            background: linear-gradient(110deg, #eff6ff, #f8fafc);
            color: #172554;
            cursor: pointer;
            list-style: none;
            transition:
                background-color 160ms,
                box-shadow 160ms;
        }
        summary::-webkit-details-marker {
            display: none;
        }
        summary:hover {
            background: #e8f0ff;
            box-shadow: inset 0 0 0 1px #bfdbfe;
        }
        summary:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 4px;
        }
        .example-icon,
        .expand-icon {
            display: grid;
            place-items: center;
            flex-shrink: 0;
            color: #1d4ed8;
        }
        .example-icon {
            width: 48px;
            height: 48px;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            background: #fff;
        }
        svg {
            width: 24px;
            height: 24px;
            stroke: currentColor;
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .summary-copy {
            flex: 1;
            min-width: 0;
        }
        .eyebrow {
            display: block;
            margin-bottom: 6px;
            color: #1d4ed8;
            font-size: 0.6875rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
        h2 {
            margin: 0;
            font-size: 1.375rem;
            line-height: 1.35;
            overflow-wrap: anywhere;
        }
        .summary-hint {
            display: block;
            margin-top: 6px;
            color: #475569;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        .expand-icon {
            width: 32px;
            height: 32px;
            border: 1px solid #bfcee8;
            border-radius: 50%;
            background: #fff;
            transition: transform 160ms;
        }
        details[open] > summary {
            border-bottom: 1px solid #bfcee8;
            border-radius: 8px 8px 0 0;
        }
        details[open] .expand-icon {
            transform: rotate(180deg);
        }
        .example-content {
            padding: 4px 24px 24px;
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
        .code-line {
            display: inline-block;
            min-width: 100%;
            width: max-content;
            border-left: 4px solid transparent;
            padding: 0 8px;
        }
        .focused-line {
            border-left-color: #60a5fa;
            background: #1e3a5f;
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
            summary {
                gap: 12px;
                padding: 20px 16px;
            }
            .example-icon {
                width: 40px;
                height: 40px;
            }
            h2 {
                font-size: 1.125rem;
            }
            .example-content {
                padding: 4px 16px 16px;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            summary,
            .expand-icon {
                transition: none;
            }
        }
        @media (forced-colors: active) {
            details,
            details[open] > summary,
            .example-icon,
            .expand-icon {
                border-color: CanvasText;
            }
            summary,
            summary:hover {
                background: Canvas;
                color: CanvasText;
            }
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-example', FdlExample);
