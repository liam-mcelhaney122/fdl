export function compareShirtSizes(left: string, right: string): -1 | 0 | 1 {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return Math.sign(sizes.indexOf(left) - sizes.indexOf(right)) as -1 | 0 | 1;
}

export const shirtOrders = [
    {firstName:'Ada', lastName:'Zulu', shirtSize:'L'},
    {firstName:'Grace', lastName:'Alpha', shirtSize:'XS'},
    {firstName:'Ada', lastName:'Mike', shirtSize:'XL'},
    {firstName:'Linus', lastName:'Beta', shirtSize:'M'},
    {firstName:'Grace', lastName:'Beta', shirtSize:'XXL'},
    {firstName:'Margaret', lastName:'Hamilton', shirtSize:'S'},
];

export const compareShirtSizesSource = `function compareShirtSizes(left, right) {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  return Math.sign(sizes.indexOf(left) - sizes.indexOf(right));
}`;
