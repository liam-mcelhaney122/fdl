import '../examples/fdl-input/fdl-prediction';
import type { FdlPrediction } from '../examples/fdl-input/fdl-prediction';
const settle = async (demo: FdlPrediction) => {
    await demo.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await demo.updateComplete;
};
it('reveals actual hidden-but-invalid results after optional predictions', async () => {
    const demo = document.createElement('fdl-prediction') as FdlPrediction;
    document.body.append(demo);
    await settle(demo);
    expect(demo.shadowRoot!.querySelector('[role=status]')).toBeNull();
    for (const [field, value] of [
        ['visible', 'false'],
        ['required', 'false'],
        ['valid', 'true'],
    ]) {
        const control = demo.shadowRoot!.querySelector(`fdl-field[field="${field}"]`) as any;
        await control.updateComplete;
        const select = control.shadowRoot.querySelector('select');
        select.value = value;
        select.dispatchEvent(new Event('change'));
        await settle(demo);
    }
    demo.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    await settle(demo);
    const result = demo.shadowRoot!.querySelector('[role=status]')!.textContent!;
    expect(result).toContain('Hidden');
    expect(result).toContain('Invalid — differs from your prediction');
    demo.rules = { ...demo.rules };
    await settle(demo);
    expect(demo.shadowRoot!.querySelector('[role=status]')!.textContent).toBe(result);
    demo.rules = { visibility: 'shipping', requiredness: 'shipping', validation: 'off' };
    await settle(demo);
    expect(demo.shadowRoot!.querySelector('[role=status]')).toBeNull();
    demo.remove();
});

import { compositionExplanation } from '../examples/fdl-input/composition-model';
it('explains unconditional and conditional settings without inventing dependencies', () => {
    const unconditional = compositionExplanation(
        { visibility: 'all', requiredness: 'never', validation: 'off' },
        'pickup',
        'bad'
    );
    expect(unconditional.visibility).toContain('Both delivery methods');
    expect(unconditional.requiredness).toBe('No required rule is declared.');
    expect(unconditional.format).toBe('No format validator is declared.');
    expect(
        compositionExplanation(
            { visibility: 'all', requiredness: 'always', validation: 'on' },
            'pickup',
            ''
        ).requiredness
    ).toBe('The required rule always applies.');
    expect(
        compositionExplanation(
            { visibility: 'shipping', requiredness: 'shipping', validation: 'on' },
            'pickup',
            'bad'
        ).visibility
    ).toContain('false');
});
