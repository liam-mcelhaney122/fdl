import { html, svg } from 'lit';

const icons = {
    Validation: svg`<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6z"></path><path d="m8 12 3 3 5-6"></path>`,
    Display: svg`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>`,
    'Conditional state': svg`<circle cx="6" cy="5" r="2"></circle><circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="5" r="2"></circle><path d="M6 7v10m0-5h6a6 6 0 0 0 6-5"></path>`,
    Tables: svg`<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 10h18M3 15h18M10 4v16"></path>`,
    Values: svg`<ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"></path>`,
    Input: svg`<rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M8 8v8M6 8h4m-4 8h4m3-4h5"></path>`,
    'Adapter contracts': svg`<path d="M9 3v5m6-5v5M6 8h12v3a6 6 0 0 1-12 0Zm6 9v4"></path>`,
};

export const categoryDescriptions: { [category: string]: string } = {
    Validation:
        'Rules that determine whether a field value is valid, including requiredness, length limits, and custom checks.',
    Display:
        'How stored values are formatted or presented to the reader without changing the underlying data.',
    'Conditional state':
        'Whether a field is visible, editable, or required, either permanently or based on other values in the record.',
    Tables: 'How table consumers arrange, style, sort, and filter fields across a collection of records.',
    Values: 'Defaults, parsing, identity, and aggregation: how values are initialized, transformed, and used.',
    Input: 'Labels, hints, input types, and character masks that describe how a compatible control presents or accepts input.',
    'Adapter contracts':
        'Metadata that needs a compatible UI adapter. The native example does not implement these interactions.',
};

export function categoryIcon(category: string) {
    return html`<svg
        class="category-icon"
        data-category=${category}
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
    >
        ${icons[category as keyof typeof icons]}
    </svg>`;
}
