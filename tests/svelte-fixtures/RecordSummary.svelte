<script lang="ts">
    import type Record from '../../record.js';
    import { recordStore } from '../../adapters/svelte';

    let { record }: { record: Record<any> } = $props();
    const values = recordStore(record);
</script>

<p>{$values.getField('name')}</p>
