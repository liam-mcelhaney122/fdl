<!--
    One Svelte component for every FDL field. It chooses a native input, select,
    textarea, or read-only output from the field's metadata and keeps that
    control synchronized with its Record.
-->
<script lang="ts">
    import { untrack } from 'svelte';
    import type Record from '../../record.js';
    import { fieldControl } from './field-control';
    import { fieldStore } from './stores';

    interface Props {
        /** The Record that owns the field. */
        record: Record<any>;
        /** The name of the field to render. */
        field: string;
        /** Application policy: expose synchronous model errors. */
        showValidationErrors?: boolean;
        /** Text for a single select's empty choice. */
        selectPrompt?: string;
        /** Additional description IDs to keep on the control. */
        describedby?: string;
    }

    let {
        record,
        field,
        showValidationErrors = false,
        selectPrompt,
        describedby,
    }: Props = $props();

    const uid = $props.id();
    const controlId = `fdl-field-${uid}`;
    const labelId = `${controlId}-label`;
    const errorId = `${controlId}-error`;

    const store = $derived(
        fieldStore(record, field, {
            showValidationErrors: untrack(() => showValidationErrors),
        })
    );

    $effect.pre(() => {
        store.setShowValidationErrors(showValidationErrors);
    });

    const invalid = $derived($store.errors.length > 0);
    const descriptions = $derived(
        [describedby, invalid ? errorId : undefined].filter(Boolean).join(' ') || undefined
    );
    const loading = $derived($store.control === 'select' && $store.optionsLoading);
</script>

{#if $store.showLabel}
    <label id={labelId} for={controlId}
        >{$store.label}{#if $store.required && !$store.readonly}<span
                class="required"
                aria-hidden="true">&nbsp;*</span
            >{/if}</label
    >
{/if}
{#if $store.visible}
    <div class="control">
        {#if $store.control === 'output'}
            <!-- The adapter contract exposes visible model errors on read-only output too. -->
            <!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
            <output
                id={controlId}
                name={field}
                aria-labelledby={$store.showLabel ? labelId : undefined}
                aria-invalid={invalid ? 'true' : undefined}
                aria-describedby={descriptions}>{$store.printedValue}</output
            >
        {:else if $store.control === 'select'}
            <div class="control-input" data-loading={loading ? '' : undefined}>
                <select
                    use:fieldControl={{ store, selectPrompt }}
                    id={controlId}
                    name={field}
                    required={$store.required}
                    disabled={$store.disabled || loading}
                    autocomplete={$store.autocomplete as any}
                    aria-busy={loading ? 'true' : undefined}
                    aria-invalid={invalid ? 'true' : undefined}
                    aria-describedby={descriptions}
                ></select>
                {#if loading}<span class="options-spinner" aria-hidden="true"></span>{/if}
            </div>
            {#if loading}<p class="options-loading" role="status">Loading choices…</p>{/if}
        {:else if $store.control === 'textarea'}
            <textarea
                use:fieldControl={{ store }}
                id={controlId}
                name={field}
                rows={$store.rows}
                required={$store.required}
                disabled={$store.disabled}
                placeholder={$store.placeholder}
                minlength={$store.minLength}
                maxlength={$store.maxLength}
                autocomplete={$store.autocomplete as any}
                aria-invalid={invalid ? 'true' : undefined}
                aria-describedby={descriptions}></textarea>
        {:else}
            <input
                use:fieldControl={{ store }}
                id={controlId}
                name={field}
                type={$store.inputType ?? 'text'}
                required={$store.required}
                disabled={$store.disabled}
                placeholder={$store.placeholder}
                minlength={$store.minLength}
                maxlength={$store.maxLength}
                autocomplete={$store.autocomplete as any}
                pattern={$store.pattern}
                step={$store.step as any}
                max={$store.max as any}
                list={$store.list}
                aria-invalid={invalid ? 'true' : undefined}
                aria-describedby={descriptions}
            />
        {/if}
        {#if invalid}
            <div class="validation-error" id={errorId}>{$store.errors.join('. ')}</div>
        {/if}
    </div>
{/if}

<style>
    .control-input {
        position: relative;
    }
    .options-spinner {
        position: absolute;
        right: 2rem;
        top: calc(50% - 8px);
        width: 16px;
        height: 16px;
        border: 2px solid #94a3b8;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: options-spin 0.7s linear infinite;
        pointer-events: none;
    }
    @keyframes options-spin {
        to {
            transform: rotate(360deg);
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .options-spinner {
            animation: none;
        }
    }
</style>
