import { compositionLink, learningContinuation } from '../examples/fdl-input/learning-continuation';
it('carries the delivery choice and stored charge into the next experiment', () => {
    const url=compositionLink({method:'pickup',charge:12.5});
    expect(learningContinuation(url)).toEqual({method:'pickup',charge:'12.5'});
    expect(learningContinuation('#composition')).toBeUndefined();
    expect(learningContinuation('#composition?from=learn&method=bad')).toBeUndefined();
    expect(learningContinuation(compositionLink({method:'ship',charge:undefined}))!.charge).toBe('undefined');
});
