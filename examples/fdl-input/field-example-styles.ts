import { css } from 'lit';

// Used by the field adapter and displayed beside the disabled-state examples.
export const disabledFieldStyles = css`
    input:disabled,
    select:disabled,
    textarea:disabled {
        background-color: #e2e8f0;
        border-color: #94a3b8;
        border-style: dashed;
        color: #475569;
        -webkit-text-fill-color: currentColor;
        opacity: 1;
        cursor: not-allowed;
    }
`;
