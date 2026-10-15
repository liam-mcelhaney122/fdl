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

it.each(['#composition',compositionLink({method:'pickup',charge:25})])('keeps composition and builder work through navigation detours from %s',async(route)=>{
    window.location.hash=route;
    const page=document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);await page.updateComplete;
    const demo=page.shadowRoot!.querySelector('fdl-composition-experiment') as any;await demo.updateComplete;
    demo.record.setField('address','99 Maple Road');demo.keepCase();
    demo.configuration.setField('validation','off');await demo.updateComplete;
    const disclosure=demo.shadowRoot.querySelector('.field-builder') as HTMLDetailsElement;disclosure.open=true;
    const builder=demo.shadowRoot.querySelector('fdl-field-builder') as any;await builder.updateComplete;
    builder.configuration.setField('name','reference');builder.configuration.setField('validation','minimum');
    builder.record.setField('reference','AB');builder.record.setField('condition','disabled');await builder.updateComplete;
    const navigate=async(hash:string)=>{window.location.hash=hash;window.dispatchEvent(new Event('hashchange'));await page.updateComplete;};
    for (const detour of ['#home','#validator']) {
        await navigate(detour);await navigate(route);await demo.updateComplete;await builder.updateComplete;
        expect(page.shadowRoot!.querySelector('fdl-composition-experiment')).toBe(demo);
        expect(demo.record.getField('address')).toBe('99 Maple Road');expect(demo.rules.validation).toBe('off');
        expect(demo.shadowRoot.querySelector('.collected-cases').textContent).toContain('99 Maple Road');
        expect(disclosure.open).toBe(true);expect(builder.configuration.getField('name')).toBe('reference');
        expect(builder.configuration.getField('validation')).toBe('minimum');
        expect(builder.record.getField('reference')).toBe('AB');expect(builder.record.getField('condition')).toBe('disabled');
        expect(builder.shadowRoot.querySelector('pre').textContent).toContain('"AB"');
    }
    demo.reset();await demo.updateComplete;
    expect(demo.savedCases).toHaveLength(1);expect(demo.record.getField('address')).toBe('42 Orchard Street');
    Array.from((demo.shadowRoot as ShadowRoot).querySelectorAll<HTMLButtonElement>('button')).find(button=>button.textContent==='Clear kept cases')!.click();
    builder.shadowRoot.querySelector('button').click();await builder.updateComplete;
    await navigate('#home');await navigate(route);await demo.updateComplete;
    expect(demo.shadowRoot.querySelector('.collected-cases')).toBeNull();expect(builder.configuration.getField('name')).toBe('notes');
    expect(builder.record.getField('notes')).toBe('');
    await navigate(compositionLink({method:'ship',charge:99}));
    const fresh=page.shadowRoot!.querySelector('fdl-composition-experiment') as any;await fresh.updateComplete;
    expect(fresh).not.toBe(demo);expect(fresh.rules.validation).toBe('on');expect(fresh.record.getField('fulfillment')).toBe('ship');
    expect(fresh.savedCases).toHaveLength(0);
    page.remove();window.location.hash='';
});
