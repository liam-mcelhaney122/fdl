import '../examples/fdl-input/fdl-modifier-explorer';

describe('documentation-site validation examples', () => {
    it('connects a model validation error to the rendered control after validation is requested', async () => {
        window.location.hash = 'required';
        const page = document.createElement('fdl-modifier-explorer') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        document.body.append(page);
        await page.updateComplete;

        const field = page.shadowRoot?.querySelector('fdl-field') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        const button = page.shadowRoot?.querySelector<HTMLButtonElement>('.primary');

        await field.updateComplete;
        expect(field.shadowRoot?.querySelector('input')?.hasAttribute('aria-invalid')).toBe(false);

        button?.click();
        await page.updateComplete;
        await field.updateComplete;

        const input = field.shadowRoot?.querySelector<HTMLInputElement>('input');
        const errorId = input?.getAttribute('aria-describedby');
        expect(input?.getAttribute('aria-invalid')).toBe('true');
        expect(errorId).toBeTruthy();
        expect(field.shadowRoot?.getElementById(errorId!)?.textContent).toContain(
            'Legal name is required'
        );

        page.remove();
        window.location.hash = '';
    });
});
