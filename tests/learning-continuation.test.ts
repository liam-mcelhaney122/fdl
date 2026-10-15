import { compositionLink, learningContinuation } from '../examples/fdl-input/learning-continuation';
it('carries the delivery choice and stored charge into the next experiment', () => {
    const url=compositionLink({method:'pickup',charge:12.5});
    expect(learningContinuation(url)).toEqual({method:'pickup',charge:'12.5'});
    expect(learningContinuation('#composition')).toBeUndefined();
    expect(learningContinuation('#composition?from=learn&method=bad')).toBeUndefined();
    expect(learningContinuation(compositionLink({method:'ship',charge:undefined}))!.charge).toBe('undefined');
});

import '../examples/fdl-input/fdl-modifier-explorer';
import type {FdlModifierExplorer} from '../examples/fdl-input/fdl-modifier-explorer';
it('starts fresh when leaving a continued scenario for a plain composition link', async()=>{
    window.location.hash=compositionLink({method:'pickup',charge:25});
    const page=document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);await page.updateComplete;
    let demo=page.shadowRoot!.querySelector('fdl-composition-experiment') as any;await demo.updateComplete;
    expect(demo.shadowRoot.querySelector('.continuation').textContent).toContain('Pickup');
    window.location.hash='#composition';window.dispatchEvent(new Event('hashchange'));await page.updateComplete;
    demo=page.shadowRoot!.querySelector('fdl-composition-experiment') as any;await demo.updateComplete;
    expect(demo.shadowRoot.querySelector('.continuation')).toBeNull();
    page.remove();window.location.hash='';
});
