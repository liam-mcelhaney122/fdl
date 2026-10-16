import { css } from 'lit';

/** Shared presentation for the documentation's nested shadow roots. */
export const exampleTheme = css`
    :host {
        --example-border: #dbe2ea;
        --example-surface: #f8fafc;
        --example-radius: 8px;
        --example-control-height: 48px;
    }
    .state,
    .model,
    .focused-state,
    .lesson-state,
    .lesson-controls {
        box-sizing: border-box;
        min-width: 0;
        padding: 20px;
        border: 1px solid var(--example-border);
        border-radius: var(--example-radius);
        background: var(--example-surface);
        overflow-wrap: anywhere;
    }
    .dependency-trace,
    .value-pipeline,
    .selection-explanation {
        padding: 16px;
        margin: 20px 0 0;
        border: 1px solid var(--example-border);
        border-left: 3px solid #2563eb;
        border-radius: var(--example-radius);
        background: var(--example-surface);
        overflow-wrap: anywhere;
        font-size: 1rem;
        line-height: 1.6;
    }
    .dependency-trace p,
    .value-pipeline p,
    .selection-explanation p {
        margin: 12px 0 0;
    }
    .value-pipeline h3 {
        margin: 0 0 12px;
        font-size: 1.125rem;
        line-height: 1.4;
    }
    .value-pipeline ol {
        margin: 0;
        padding-left: 24px;
    }
    .value-pipeline li {
        padding-left: 4px;
        margin: 0 0 12px;
    }
    .value-pipeline li:last-child {
        margin-bottom: 0;
    }
    .state-summary {
        margin: 0;
        overflow-wrap: anywhere;
    }
    .state-summary dt {
        font-weight: 600;
        font-size: 0.875rem;
        color: #475569;
    }
    .state-summary dd {
        margin: 4px 0 16px;
        font-size: 1rem;
        line-height: 1.6;
    }
    .state-summary dd:last-child {
        margin-bottom: 0;
    }
    .state-summary small {
        display: block;
        margin-top: 4px;
        font-size: 0.8125rem;
        color: #64748b;
    }
    .state-summary p {
        margin: 0 0 12px;
        font-size: 1rem;
        line-height: 1.6;
    }
    .state-summary p:last-child {
        margin-bottom: 0;
    }
    .state-label {
        margin: 0 0 16px;
        font:
            600 0.75rem/1.4 Arial,
            Helvetica,
            sans-serif;
        letter-spacing: 0.06em;
        color: #64748b;
    }
    button {
        border-radius: 6px;
    }
    select:not([multiple]) {
        box-sizing: border-box;
        appearance: none;
        height: var(--example-control-height);
        padding: 10px 44px 10px 14px;
        border: 1px solid #94a3b8;
        border-radius: 6px;
        background-color: #fff;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='m4 6 4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        background-size: 16px;
        color: #0f172a;
        font: inherit;
        line-height: 1.5;
    }
    @media (max-width: 480px) {
        .state,
        .model,
        .focused-state,
        .lesson-state,
        .lesson-controls {
            padding: 16px;
        }
    }
    @media (forced-colors: active) {
        select:not([multiple]) {
            appearance: auto;
            background-image: none;
        }
        .dependency-trace,
        .value-pipeline,
        .selection-explanation {
            border-color: CanvasText;
        }
    }
`;
