import { css } from 'lit';

// Shared by the live table and its documentation so the examples show the exact rules.
export const tableExampleStyles = {
    cellClass: css`
.amount-cell {
    border-left: 0.3rem solid #5b52d6;
    background: #e9edff;
    color: #34308f;
    font-family: Georgia, serif;
    font-size: 1.08rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
}
`,
    conditionalCellClass: css`
.high-value {
    background: #fff4d6;
    color: #8a4b00;
    font-weight: 800;
}
`,
    rowClasses: css`
tr.disputed-row {
    background: #fffdf7;
    box-shadow: inset 0.25rem 0 #ff695b;
}
`,
};
