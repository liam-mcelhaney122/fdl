import { LitElement, css, html, nothing } from 'lit';
import { tableExampleStyles } from './table-example-styles';
import type Record from '../../record.js';
import Recordset from '../../recordset.js';

type SortDirection = 'ascending' | 'descending';
type SortColumn = {
    field: string;
    sort: SortDirection;
};

type RecordFilter = (record: Record<any>) => boolean;

type ColumnWidthLimits = {
    min: number;
    max?: number;
};

/**
 * Moves a divider while keeping the table's total width constant.  Space is
 * borrowed from (or returned to) columns on the right in display order.
 */
export function resizeColumnWidths(
    widths: number[],
    limits: ColumnWidthLimits[],
    leftIndex: number,
    requestedDelta: number
) {
    const next = [...widths];
    const left = limits[leftIndex];
    if (!left || !Number.isFinite(requestedDelta)) return next;

    const leftMinimumDelta = left.min - widths[leftIndex];
    const leftMaximumDelta = (left.max ?? Infinity) - widths[leftIndex];
    let delta = Math.max(leftMinimumDelta, Math.min(leftMaximumDelta, requestedDelta));

    const available = limits.slice(leftIndex + 1).reduce((total, limit, index) => {
        const width = widths[leftIndex + index + 1];
        return total + (delta > 0 ? width - limit.min : (limit.max ?? Infinity) - width);
    }, 0);
    delta = delta > 0 ? Math.min(delta, available) : Math.max(delta, -available);
    if (!delta) return next;

    next[leftIndex] += delta;
    let remaining = Math.abs(delta);
    const shrink = delta > 0;
    for (let index = leftIndex + 1; index < next.length && remaining > 0; index += 1) {
        const limit = limits[index];
        const capacity = shrink
            ? next[index] - limit.min
            : (limit.max ?? Infinity) - next[index];
        const adjustment = Math.min(remaining, capacity);
        next[index] += shrink ? -adjustment : adjustment;
        remaining -= adjustment;
    }
    return next;
}

export class FdlColumn extends HTMLElement {
    get field() {
        return this.getAttribute('field') ?? '';
    }

    set field(value: string) {
        this.setAttribute('field', value);
    }

    get label() {
        return this.getAttribute('label') ?? '';
    }

    set label(value: string) {
        this.setAttribute('label', value);
    }

}

export class FdlTable extends LitElement {
    static properties = {
        recordset: { attribute: false },
        filters: { attribute: false },
        showWidthDiagnostics: {type:Boolean, attribute:'show-width-diagnostics'},
    };

    recordset?: Recordset<any>;
    showWidthDiagnostics = false;
    private resizeMessage = '';
    /** Optional controlled filter text, keyed by field. */
    filters?: {[field: string]: string};

    private observedRecordset?: Recordset<any>;

    private columnWidths?: number[];

    private activeFilterField?: string;

    private columnFilters = new Map<string, string>();

    private filteringRecordset?: Recordset<any>;

    private baseRecordsetFilter?: RecordFilter;

    private appliedRecordsetFilter?: RecordFilter;

    private resizing?: {
        leftIndex: number;
        startX: number;
        widths: number[];
        input: 'mouse' | 'pointer';
        pointerId?: number;
        handle?: HTMLElement;
    };

    private columnObserver = new MutationObserver(() => this.requestUpdate());

    private onRecordsetChange = () => this.requestUpdate();

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('click', this.closeFilterFromOutside);
        this.columnObserver.observe(this, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }

    disconnectedCallback() {
        this.columnObserver.disconnect();
        window.removeEventListener('click', this.closeFilterFromOutside);
        this.stopResizeListeners();
        this.releaseRecordsetFilter();
        this.stopObservingRecordset();
        super.disconnectedCallback();
    }

    willUpdate() {
        if (this.observedRecordset !== this.recordset) {
            this.releaseRecordsetFilter();
            this.columnFilters.clear();
            this.activeFilterField = undefined;
            this.stopObservingRecordset();
            this.observedRecordset = this.recordset;
            this.observedRecordset?.addEventListener('page-changed', this.onRecordsetChange);
            this.observedRecordset?.addEventListener('updated', this.onRecordsetChange);
            void this.observedRecordset?.requestUpdate();
        }
        if (this.filters) {
            const next = Object.entries(this.filters).filter(([,value]) => value.trim());
            if (JSON.stringify(next) !== JSON.stringify([...this.columnFilters])) {
                this.columnFilters = new Map(next);
                this.applyRecordsetFilter();
            }
        }
    }

    private stopObservingRecordset() {
        this.observedRecordset?.removeEventListener('page-changed', this.onRecordsetChange);
        this.observedRecordset?.removeEventListener('updated', this.onRecordsetChange);
        this.observedRecordset = undefined;
    }

    private get columns() {
        return [...this.querySelectorAll<FdlColumn>('fdl-column')].filter(column => column.field);
    }

    private get sortColumns() {
        return (this.recordset?.sortColumns ?? []) as SortColumn[];
    }

    private sortFor(field: string) {
        return this.sortColumns.find(column => column.field === field);
    }

    private sortPriority(field: string) {
        const index = this.sortColumns.findIndex(column => column.field === field);
        return index < 0 ? undefined : index + 1;
    }

    private isSortable(column: FdlColumn) {
        return this.recordset?.getFieldType(column.field).sortable() ?? false;
    }

    private isFilterable(column: FdlColumn) {
        return this.recordset?.getFieldType(column.field).hasFilter() ?? false;
    }

    private filterFor(field: string) {
        return this.columnFilters.get(field) ?? '';
    }

    private openFilter(column: FdlColumn) {
        this.activeFilterField =
            this.activeFilterField === column.field ? undefined : column.field;
        this.requestUpdate();
        if (this.activeFilterField) {
            void this.updateComplete.then(() => {
                this.shadowRoot
                    ?.querySelector<HTMLInputElement>(`[data-filter-input="${column.field}"]`)
                    ?.focus();
            });
        }
    }

    private closeFilter(field: string, restoreFocus = true) {
        this.activeFilterField = undefined;
        this.requestUpdate();
        if (restoreFocus) {
            void this.updateComplete.then(() => {
                this.shadowRoot
                    ?.querySelector<HTMLButtonElement>(`[data-filter-button="${field}"]`)
                    ?.focus();
            });
        }
    }

    private closeFilterFromOutside = (event: MouseEvent) => {
        if (!this.activeFilterField) return;
        const clickedFilter = event.composedPath().some(
            target =>
                target instanceof Element &&
                (target.matches('.filter-button') || target.matches('.filter-popover'))
        );
        if (!clickedFilter) this.closeFilter(this.activeFilterField, false);
    };

    private notifyFilters() {
        this.dispatchEvent(new CustomEvent('filters-changed', {detail: Object.fromEntries(this.columnFilters), bubbles:true, composed:true}));
    }

    private updateFilter(column: FdlColumn, value: string) {
        if (value.trim()) this.columnFilters.set(column.field, value);
        else this.columnFilters.delete(column.field);
        this.applyRecordsetFilter();
        this.notifyFilters();
        this.requestUpdate();
    }

    private clearFilter(field: string) {
        this.columnFilters.delete(field);
        this.applyRecordsetFilter();
        this.notifyFilters();
        this.requestUpdate();
    }

    private clearFilters() {
        this.columnFilters.clear();
        this.activeFilterField = undefined;
        this.applyRecordsetFilter();
        this.notifyFilters();
        this.requestUpdate();
    }

    private applyRecordsetFilter() {
        if (!this.recordset) return;

        if (this.filteringRecordset !== this.recordset) {
            this.filteringRecordset = this.recordset;
            this.baseRecordsetFilter = this.recordset.filter;
        } else if (
            this.appliedRecordsetFilter &&
            this.recordset.filter !== this.appliedRecordsetFilter
        ) {
            // Preserve a filter supplied by the application while this table is connected.
            this.baseRecordsetFilter = this.recordset.filter;
        }

        if (!this.columnFilters.size) {
            this.releaseRecordsetFilter();
            return;
        }

        const baseFilter = this.baseRecordsetFilter ?? (() => true);
        const filters = [...this.columnFilters];
        const predicate: RecordFilter = record =>
            baseFilter(record) &&
            filters.every(([field, searchText]) =>
                record.fieldTypeForField(field).match(searchText, record.getField(field))
            );
        this.appliedRecordsetFilter = predicate;
        this.recordset.filter = predicate;
    }

    private releaseRecordsetFilter() {
        if (
            this.filteringRecordset &&
            this.appliedRecordsetFilter &&
            this.filteringRecordset.filter === this.appliedRecordsetFilter
        ) {
            this.filteringRecordset.filter = this.baseRecordsetFilter ?? (() => true);
        }
        this.filteringRecordset = undefined;
        this.baseRecordsetFilter = undefined;
        this.appliedRecordsetFilter = undefined;
    }

    private columnLimits(column: FdlColumn): ColumnWidthLimits {
        const properties = this.recordset?.getFieldType(column.field).properties;
        return {
            min: properties?.minColumnWidth ?? 30,
            max: properties?.maxColumnWidth,
        };
    }

    private measureColumnWidths() {
        const headers = this.shadowRoot?.querySelectorAll<HTMLTableCellElement>('thead th');
        const headerWidths = headers
            ? [...headers].map(header => header.getBoundingClientRect().width)
            : [];
        if (
            headerWidths.length === this.columns.length &&
            headerWidths.every(width => width > 0)
        ) {
            return headerWidths;
        }

        // Keep a fallback for layout engines and tests that expose geometry on
        // <col>, although Safari does not consistently give <col> a layout box.
        const columnElements = this.shadowRoot?.querySelectorAll<HTMLTableColElement>('col');
        const columnWidths = columnElements
            ? [...columnElements].map(column => column.getBoundingClientRect().width)
            : [];
        return columnWidths.length === this.columns.length && columnWidths.every(width => width > 0)
            ? columnWidths
            : undefined;
    }

    updated() {
        if (this.columnWidths) return;
        const widths = this.measureColumnWidths();
        // JSDOM does not lay out tables; wait for a real layout before fixing widths.
        if (!widths) return;

        this.columnWidths = widths.map((width, index) => {
            const limit = this.columnLimits(this.columns[index]);
            return Math.max(limit.min, Math.min(limit.max ?? Infinity, width));
        });
        this.requestUpdate();
    }

    private columnStyle(column: FdlColumn, index: number) {
        const limits = this.columnLimits(column);
        const width = this.columnWidths?.[index];
        return [
            `min-width:${limits.min}px`,
            limits.max === undefined ? '' : `max-width:${limits.max}px`,
            width === undefined ? '' : `width:${width}px`,
        ].filter(Boolean).join(';');
    }

    private resizeWidths() {
        return this.columnWidths ?? this.measureColumnWidths() ?? this.columns.map(column => {
            const limits = this.columnLimits(column);
            const target = this.recordset?.getFieldType(column.field).properties.targetColumnWidth;
            return Math.max(limits.min, Math.min(limits.max ?? Infinity, target ?? 160));
        });
    }

    private resizeRange(widths: number[], leftIndex: number) {
        const limits = this.columns.map(column => this.columnLimits(column));
        const left = limits[leftIndex];
        const current = widths[leftIndex];
        const availableToGrow = limits.slice(leftIndex + 1).reduce((total, limit, index) => {
            const width = widths[leftIndex + index + 1];
            return total + (limit.max === undefined ? Infinity : limit.max - width);
        }, 0);
        const availableToShrink = limits.slice(leftIndex + 1).reduce((total, limit, index) => {
            const width = widths[leftIndex + index + 1];
            return total + width - limit.min;
        }, 0);
        return {
            min: Math.max(left.min, current - availableToGrow),
            max: Math.min(left.max ?? Infinity, current + availableToShrink),
            now: current,
        };
    }

    private resizeWithKeyboard(event: KeyboardEvent, leftIndex: number) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const widths = this.resizeWidths();
        if (leftIndex >= widths.length - 1) return;
        const range = this.resizeRange(widths, leftIndex);
        const step = event.shiftKey ? 10 : 1;
        const target =
            event.key === 'Home'
                ? range.min
                : event.key === 'End'
                  ? range.max
                  : range.now + (event.key === 'ArrowRight' ? step : -step);
        this.columnWidths = resizeColumnWidths(
            widths,
            this.columns.map(column => this.columnLimits(column)),
            leftIndex,
            target - range.now
        );
        this.describeResize(leftIndex, target);
        this.requestUpdate();
        event.preventDefault();
    }

    private describeResize(index: number, requested: number) {
        const width = this.columnWidths?.[index];
        if (width === undefined) return;
        const limit = this.columnLimits(this.columns[index]);
        const neighborAtLimit = this.columnWidths!.slice(index + 1).some((value, offset) => { const neighbor = this.columnLimits(this.columns[index + offset + 1]); return value <= neighbor.min || (neighbor.max !== undefined && value >= neighbor.max); });
        this.resizeMessage = width <= limit.min ? 'Minimum reached.'
            : limit.max !== undefined && width >= limit.max ? 'Maximum reached.'
            : neighborAtLimit || Math.abs(width - requested) > 0.5 ? 'A neighboring column reached its limit; total table width is preserved.'
            : 'Resizing within the configured limits.';
    }

    private startResize(
        event: MouseEvent | PointerEvent,
        leftIndex: number,
        input: 'mouse' | 'pointer'
    ) {
        if (this.resizing || event.button !== 0) return;
        const widths = this.measureColumnWidths();
        if (!widths || leftIndex >= widths.length - 1) return;
        const handle = event.currentTarget as HTMLElement;
        const pointerId = input === 'pointer' ? (event as PointerEvent).pointerId : undefined;
        if (input === 'pointer' && pointerId !== undefined && Number.isInteger(pointerId)) {
            handle.setPointerCapture?.(pointerId);
        }
        this.resizing = { leftIndex, startX: event.clientX, widths, input, pointerId, handle };
        this.columnWidths = widths;
        if (input === 'pointer') {
            window.addEventListener('pointermove', this.resize);
            window.addEventListener('pointerup', this.endResize);
            window.addEventListener('pointercancel', this.endResize);
        } else {
            window.addEventListener('mousemove', this.resize);
            window.addEventListener('mouseup', this.endResize);
        }
        event.preventDefault();
    }

    private resize = (event: MouseEvent | PointerEvent) => {
        if (!this.resizing) return;
        this.columnWidths = resizeColumnWidths(
            this.resizing.widths,
            this.columns.map(column => this.columnLimits(column)),
            this.resizing.leftIndex,
            event.clientX - this.resizing.startX
        );
        this.describeResize(this.resizing.leftIndex, this.resizing.widths[this.resizing.leftIndex] + event.clientX - this.resizing.startX);
        this.requestUpdate();
    };

    private endResize = () => {
        if (!this.resizing) return;
        const { handle, pointerId } = this.resizing;
        if (
            handle &&
            pointerId !== undefined &&
            Number.isInteger(pointerId) &&
            handle.hasPointerCapture?.(pointerId)
        ) {
            handle.releasePointerCapture(pointerId);
        }
        this.resizing = undefined;
        this.stopResizeListeners();
    };

    private stopResizeListeners() {
        window.removeEventListener('pointermove', this.resize);
        window.removeEventListener('pointerup', this.endResize);
        window.removeEventListener('pointercancel', this.endResize);
        window.removeEventListener('mousemove', this.resize);
        window.removeEventListener('mouseup', this.endResize);
    }

    private async sort(column: FdlColumn) {
        if (!this.recordset || !this.isSortable(column)) return;

        const currentSort = this.sortFor(column.field)?.sort;
        const sort = currentSort === 'ascending' ? 'descending' : 'ascending';

        await this.recordset.sort({ field: column.field, sort });
        await this.recordset.requestUpdate();
    }

    private heading(column: FdlColumn) {
        const record = this.recordset?.currentPage[0];
        const configuredLabel = this.recordset?.getFieldType(column.field).label(record);
        return (
            column.label ||
            configuredLabel ||
            column.field
                .replace(/[-_]+/g, ' ')
                .replace(/\b\w/g, letter => letter.toUpperCase())
        );
    }

    private rowClasses(record: Record<any>) {
        return this.columns
            .flatMap(column => {
                const value = record.getField(column.field);
                return record.fieldTypeForField(column.field).rowClasses(value, record);
            })
            .join(' ');
    }

    private renderHeading(column: FdlColumn, index: number) {
        const activeSort = this.sortFor(column.field);
        const priority = this.sortPriority(column.field);
        const indicator =
            activeSort?.sort === 'ascending'
                ? '↑'
                : activeSort?.sort === 'descending'
                  ? '↓'
                  : '';
        const ariaSort =
            priority === 1 && activeSort
                ? activeSort.sort
                : nothing;

        const heading = this.heading(column);
        const filterText = this.filterFor(column.field);
        const filterOpen = this.activeFilterField === column.field;
        const resizeRange = this.resizeRange(this.resizeWidths(), index);

        return html`<th aria-sort=${ariaSort} style=${`text-align:${this.recordset?.getFieldType(column.field).textAlign() ?? 'left'}`}>
            <div class="heading-actions">
                ${this.isSortable(column)
                    ? html`<button
                      type="button"
                      class=${`sort-button ${activeSort ? 'sorted' : ''}`}
                      title=${activeSort
                          ? `${heading}: ${activeSort.sort}, sort priority ${priority}`
                          : `Sort by ${heading}`}
                      @click=${() => this.sort(column)}
                  >
                      <span>${heading}</span>
                      ${indicator
                          ? html`<span class="sort-indicator" aria-hidden="true"
                                >${indicator}<small>${priority}</small></span
                            >`
                          : nothing}
                  </button>`
                    : html`<span class="heading-label">${heading}</span>`}
                ${this.isFilterable(column)
                    ? html`<button
                          type="button"
                          class=${`filter-button ${filterText ? 'filtered' : ''}`}
                          data-filter-button=${column.field}
                          aria-label=${`Filter ${heading}`}
                          aria-controls=${`filter-popover-${index}`}
                          aria-expanded=${filterOpen ? 'true' : 'false'}
                          title=${filterText
                              ? `${heading} is filtered by “${filterText}”`
                              : `Filter ${heading}`}
                          @click=${() => this.openFilter(column)}
                      >
                          <svg aria-hidden="true" viewBox="0 0 20 20">
                              <path d="M3 4h14l-5.4 6.2v4.6l-3.2 1.7v-6.3z"></path>
                          </svg>
                      </button>`
                    : nothing}
            </div>
            ${filterOpen
                ? html`<div
                      class="filter-popover"
                      id=${`filter-popover-${index}`}
                      role="dialog"
                      aria-label=${`Filter ${heading}`}
                      @keydown=${(event: KeyboardEvent) => {
                          if (event.key === 'Escape') this.closeFilter(column.field);
                      }}
                  >
                      <label>
                          <span>Filter ${heading}</span>
                          <input
                              type="search"
                              data-filter-input=${column.field}
                              .value=${filterText}
                              placeholder="Type to filter"
                              @input=${(event: InputEvent) =>
                                  this.updateFilter(
                                      column,
                                      (event.currentTarget as HTMLInputElement).value
                                  )}
                          />
                      </label>
                      <div class="filter-popover-actions">
                          <button
                              type="button"
                              class="clear-filter"
                              ?disabled=${!filterText}
                              @click=${() => this.clearFilter(column.field)}
                          >Clear</button>
                          <button
                              type="button"
                              class="close-filter"
                              @click=${() => this.closeFilter(column.field)}
                          >Done</button>
                      </div>
                  </div>`
                : nothing}
            ${index < this.columns.length - 1
                ? html`<div
                      class="resize-handle"
                      role="separator"
                      tabindex="0"
                      aria-label=${`Resize ${this.heading(column)} column`}
                      aria-orientation="vertical"
                      aria-valuemin=${resizeRange.min}
                      aria-valuemax=${resizeRange.max}
                      aria-valuenow=${resizeRange.now}
                      @keydown=${(event: KeyboardEvent) => this.resizeWithKeyboard(event, index)}
                      @pointerdown=${(event: PointerEvent) => this.startResize(event, index, 'pointer')}
                      @mousedown=${(event: MouseEvent) => this.startResize(event, index, 'mouse')}
                  ></div>`
                : nothing}
        </th>`;
    }

    private renderCell(record: Record<any>, column: FdlColumn) {
        const value = record.getField(column.field);
        const fieldType = record.fieldTypeForField(column.field);
        return html`<td
            class=${fieldType.cellClasses(value).join(' ')}
            style=${`text-align:${fieldType.textAlign()}`}
        >
            ${record.print(column.field)}
        </td>`;
    }

    render() {
        const columns = this.columns;
        const records = this.recordset?.currentPage ?? [];
        const activeFilters = [...this.columnFilters].map(([field, value]) => ({
            field,
            value,
            heading: this.heading(columns.find(column => column.field === field)!),
        }));

        return html`
            ${activeFilters.length
                ? html`<div class="active-filters" role="region" aria-label="Active table filters">
                      <span>Filters</span>
                      ${activeFilters.map(
                          filter => html`<button
                              type="button"
                              class="filter-chip"
                              aria-label=${`Remove ${filter.heading} filter`}
                              @click=${() => this.clearFilter(filter.field)}
                          >${filter.heading}: “${filter.value}” <span aria-hidden="true">×</span></button>`
                      )}
                      <button type="button" class="clear-all" @click=${this.clearFilters}
                          >Clear all</button
                      >
                  </div>`
                : nothing}
            <div class=${`table-frame ${this.activeFilterField ? 'filter-open' : ''}`}>
                <table style=${this.columnWidths ? `width:${this.columnWidths.reduce((total, width) => total + width, 0)}px` : ''}>
                    <colgroup>
                        ${columns.map((column, index) => html`<col style=${this.columnStyle(column, index)} />`)}
                    </colgroup>
                    <thead>
                        <tr>${columns.map((column, index) => this.renderHeading(column, index))}</tr>
                    </thead>
                    <tbody>
                        ${records.length
                            ? records.map(
                                  record => html`<tr class=${this.rowClasses(record)}>
                                      ${columns.map(column => this.renderCell(record, column))}
                                  </tr>`
                              )
                            : html`<tr><td class="empty-state" colspan=${columns.length}
                                  >${activeFilters.length
                                      ? 'No rows match the active filters.'
                                      : 'No rows to display.'}</td
                              ></tr>`}
                    </tbody>
                </table>
            </div>
            ${this.showWidthDiagnostics ? html`<section class="width-diagnostics" aria-label="Column width measurements"><h3>Live column widths</h3><ul>${columns.map((column,index) => {
                const properties = this.recordset?.getFieldType(column.field).properties;
                return html`<li><strong>${this.heading(column)}</strong>: ${this.columnWidths ? `${Math.round(this.columnWidths[index])}px` : 'Measuring…'} · min ${this.columnLimits(column).min}px${properties?.targetColumnWidth ? ` · preferred ${properties.targetColumnWidth}px` : ''}${properties?.maxColumnWidth ? ` · max ${properties.maxColumnWidth}px` : ''}</li>`;
            })}</ul><p role="status">${this.resizeMessage || 'Drag a divider or use its arrow keys. The table keeps its total width.'}</p></section>` : nothing}
            <slot></slot>
        `;
    }

    static styles = css`
        :host {
            display: block;
        }

        .table-frame {
            overflow-x: auto;
        }

        .table-frame.filter-open {
            padding-bottom: 6rem;
        }

        .active-filters {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.45rem;
            margin-bottom: 0.65rem;
            color: #586174;
            font-size: var(--fdl-table-label-font-size, 0.78rem);
            font-weight: 700;
        }

        .filter-chip,
        .clear-all {
            border: 0;
            cursor: pointer;
            font: inherit;
        }

        .filter-chip {
            border-radius: 999px;
            background: #eeecff;
            color: #4938bd;
            padding: 0.35rem 0.6rem;
        }

        .clear-all {
            background: transparent;
            color: #5b52d6;
            padding: 0.35rem;
            text-decoration: underline;
            text-underline-offset: 0.15rem;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        th,
        td {
            border-bottom: 1px solid #dfe3ee;
            padding: 0.65rem;
            text-align: left;
        }

        ${tableExampleStyles.cellClass}
        ${tableExampleStyles.rowClasses}
        ${tableExampleStyles.template}

        th {
            position: relative;
            color: #586174;
            font-size: var(--fdl-table-label-font-size, 0.75rem);
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .resize-handle {
            position: absolute;
            z-index: 1;
            top: 0;
            right: 0;
            width: 0.8rem;
            height: 100%;
            cursor: col-resize;
            touch-action: none;
        }

        .resize-handle::after {
            position: absolute;
            top: 0.35rem;
            bottom: 0.35rem;
            right: 0;
            width: 2px;
            border-radius: 1px;
            background: transparent;
            content: '';
        }

        .resize-handle:hover::after,
        .resize-handle:focus-visible::after {
            background: #7657ff;
        }

        .heading-actions {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .heading-label {
            flex: 1;
            font-weight: 800;
        }

        .sort-button {
            display: block;
            min-width: 0;
            flex: 1;
            border: 0;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font: inherit;
            font-weight: 800;
            letter-spacing: inherit;
            padding: 0;
            text-align: inherit;
            text-transform: inherit;
        }

        .sort-button:hover,
        .sort-button:focus-visible,
        .sort-button.sorted {
            color: #7657ff;
        }

        .sort-button:focus-visible,
        .filter-button:focus-visible,
        .filter-chip:focus-visible,
        .clear-all:focus-visible,
        .filter-popover button:focus-visible,
        .filter-popover input:focus-visible {
            border-radius: 0.2rem;
            outline: 2px solid #7657ff;
            outline-offset: 0.25rem;
        }

        .filter-button {
            display: grid;
            width: 1.7rem;
            height: 1.7rem;
            flex: 0 0 auto;
            place-items: center;
            border: 1px solid transparent;
            border-radius: 0.35rem;
            background: transparent;
            color: #71798b;
            cursor: pointer;
            font-size: 1.05rem;
        }

        .filter-button:hover,
        .filter-button[aria-expanded='true'],
        .filter-button.filtered {
            border-color: #c9c4ff;
            background: #eeecff;
            color: #5b52d6;
        }

        .filter-button svg {
            width: 1rem;
            height: 1rem;
            fill: currentColor;
        }

        .filter-popover {
            position: absolute;
            z-index: 3;
            top: calc(100% - 0.2rem);
            left: 0.45rem;
            width: min(18rem, calc(100vw - 2rem));
            border: 1px solid #dfe3ee;
            border-radius: 0.65rem;
            background: white;
            box-shadow: 0 12px 30px rgba(34, 45, 78, 0.18);
            color: #172033;
            letter-spacing: normal;
            padding: 0.75rem;
            text-align: left;
            text-transform: none;
        }

        .filter-popover label,
        .filter-popover label span {
            display: block;
        }

        .filter-popover label span {
            margin-bottom: 0.4rem;
            font-size: var(--fdl-table-label-font-size, 0.78rem);
            font-weight: 800;
        }

        .filter-popover input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #b8bfcc;
            border-radius: 0.4rem;
            color: #172033;
            font: 400 var(--fdl-table-control-font-size, 0.9rem)/1.3 system-ui, sans-serif;
            padding: 0.55rem 0.65rem;
        }

        .filter-popover-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.45rem;
            margin-top: 0.65rem;
        }

        .filter-popover-actions button {
            border: 0;
            border-radius: 0.4rem;
            cursor: pointer;
            font: 700 var(--fdl-table-control-font-size, 0.78rem)/1 system-ui, sans-serif;
            padding: 0.5rem 0.65rem;
        }

        .clear-filter {
            background: #f1f3f7;
            color: #4d5668;
        }

        .clear-filter:disabled {
            cursor: default;
            opacity: 0.5;
        }

        .close-filter {
            background: #10233f;
            color: white;
        }

        .empty-state {
            color: #71798b;
            font-style: italic;
            text-align: center;
        }

        .sort-indicator {
            margin-left: 0.5rem;
            display: inline-flex;
            align-items: center;
            gap: 0.12rem;
            font-size: 1rem;
            line-height: 1;
        }

        .sort-indicator small {
            min-width: 1.05rem;
            border-radius: 999px;
            background: #eeecff;
            font-size: 0.62rem;
            line-height: 1.05rem;
            text-align: center;
        }

        .width-diagnostics { margin-top:16px; padding:12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; font-size:.875rem; line-height:1.6; }
        .width-diagnostics h3 { margin:0 0 8px; font-size:1rem; }
        .width-diagnostics ul { margin:0; padding-left:20px; }
        .width-diagnostics p { margin:8px 0 0; }
        slot {
            display: none;
        }
    `;
}

if (!customElements.get('fdl-column')) customElements.define('fdl-column', FdlColumn);
if (!customElements.get('fdl-table')) customElements.define('fdl-table', FdlTable);
