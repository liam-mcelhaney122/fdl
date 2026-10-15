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

it('restores the lesson and entered value after a reference detour', async()=>{
    window.location.hash='#learn';
    const page=document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);await page.updateComplete;
    let lesson=page.shadowRoot!.querySelector('fdl-learning-path') as any;await lesson.updateComplete;
    lesson.go(2);lesson.record.setField('charge',47);await lesson.updateComplete;
    window.location.hash='#validator';window.dispatchEvent(new Event('hashchange'));await page.updateComplete;
    window.location.hash='#learn';window.dispatchEvent(new Event('hashchange'));await page.updateComplete;
    lesson=page.shadowRoot!.querySelector('fdl-learning-path') as any;await lesson.updateComplete;
    expect(lesson.shadowRoot.querySelector('h2').textContent).toBe('What makes a value valid?');
    expect(lesson.record.getField('charge')).toBe(47);
    expect(lesson.shadowRoot.querySelector('select').value).toBe('2');
    lesson.reset();expect(lesson.record.getField('charge')).toBe(25);
    page.remove();window.location.hash='';
});

it('takes the home run-local link directly to the existing starter handoff',async()=>{
    HTMLElement.prototype.scrollIntoView=jest.fn();
    window.location.hash='#home';
    const page=document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);await page.updateComplete;
    const link=Array.from(page.shadowRoot!.querySelectorAll('a')).find(link=>link.textContent==='Run a complete example locally')!;
    window.location.hash=link.getAttribute('href')!;window.dispatchEvent(new Event('hashchange'));await page.updateComplete;await Promise.resolve();
    expect(page.shadowRoot!.querySelector('.starter-handoff h3')).toBe(page.shadowRoot!.activeElement);
    expect(page.shadowRoot!.querySelector('fdl-starter-download')).not.toBeNull();
    page.remove();window.location.hash='';
});
