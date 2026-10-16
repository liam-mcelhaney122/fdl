export function compositionLink(values: { method: string; charge: unknown }) {
    return (
        '#composition?' +
        new URLSearchParams({
            from: 'learn',
            method: values.method,
            charge: JSON.stringify(values.charge) ?? 'undefined',
        }).toString()
    );
}
export function learningContinuation(hash: string) {
    if (hash.split('?')[0] !== '#composition') return undefined;
    const parameters = new URLSearchParams(hash.split('?')[1]);
    const method = parameters.get('method');
    if (
        parameters.get('from') !== 'learn' ||
        (method !== 'ship' && method !== 'pickup')
    )
        return undefined;
    return { method, charge: parameters.get('charge') ?? 'undefined' };
}
