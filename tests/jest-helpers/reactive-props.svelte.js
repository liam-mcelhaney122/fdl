/**
 * Create deeply reactive props so a test can change a mounted component's props.
 * @template {object} T
 * @param {T} initial
 * @returns {T}
 */
export function reactiveProps(initial) {
    const props = $state(initial);
    return props;
}
