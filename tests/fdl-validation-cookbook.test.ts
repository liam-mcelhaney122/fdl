import '../examples/fdl-input/fdl-cookbook-page';

describe('cookbook validation examples', () => {
    it('connects a model validation error to the rendered control after validation is requested', async () => {
        const page = document.createElement('fdl-cookbook-page') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        document.body.append(page);
        await page.updateComplete;

        const catalog = page.shadowRoot?.querySelector('fdl-modifier-catalog') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        await catalog.updateComplete;

        const requiredCard = catalog.shadowRoot?.querySelector<HTMLElement>(
            '[data-modifier="required"]'
        );
        const field = requiredCard?.querySelector('fdl-field') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        const button = requiredCard?.querySelector<HTMLButtonElement>('button');

        await field.updateComplete;
        expect(field.shadowRoot?.querySelector('input')?.hasAttribute('aria-invalid')).toBe(false);

        button?.click();
        await catalog.updateComplete;
        await field.updateComplete;

        const input = field.shadowRoot?.querySelector<HTMLInputElement>('input');
        const errorId = input?.getAttribute('aria-describedby');
        expect(input?.getAttribute('aria-invalid')).toBe('true');
        expect(errorId).toBeTruthy();
        expect(field.shadowRoot?.getElementById(errorId!)?.textContent).toContain(
            'Legal name is required'
        );

        page.remove();
    });
});
