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
.high-value {
    background: #fff4d6;
    color: #8a4b00;
    font-weight: 800;
}
`,
    template: css`
.paid-balance {
    display: inline-block;
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    background: #e6f5ec;
    color: #17633b;
    font-weight: 700;
}
.due-balance {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.15rem;
    font-variant-numeric: tabular-nums;
}
.due-balance small {
    color: #77500d;
    font-size: 0.8rem;
}
`,
    rowClass: css`
tr.disputed-row {
    background: #fffdf7;
    box-shadow: inset 0.25rem 0 #ff695b;
}
`,
};
