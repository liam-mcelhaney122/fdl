export const validatorExamples = [
    {
        field: 'email',
        title: 'Email address',
        hint: 'A simple check: no whitespace, one @, and a dot in the domain. Try ada@example.com.',
        button: 'Check email',
    },
    {
        field: 'orderQuantity',
        title: 'Order quantity',
        hint: 'Enter a whole number from 1 to 12. Try 2.5, 0, 13, then 3.',
        button: 'Check quantity',
    },
    {
        field: 'username',
        title: 'Username',
        hint: 'Start with a letter and use only letters, numbers, or underscores. Try 7bad-name, then ada_7.',
        button: 'Check username',
    },
] as const;
