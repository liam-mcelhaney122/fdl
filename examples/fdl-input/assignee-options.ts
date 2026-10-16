/** Shared data for synchronous and asynchronous dependent-option examples. */
export const assigneeDirectory: {
    [department: string]: { text: string; value: string }[];
} = {
    engineering: [
        { text: 'Grace Hopper', value: 'grace' },
        { text: 'Margaret Hamilton', value: 'margaret' },
    ],
    finance: [
        { text: 'Katherine Johnson', value: 'katherine' },
        { text: 'Margaret Hamilton', value: 'margaret' },
        { text: 'Mary Jackson', value: 'mary' },
    ],
};

export const optionsDelay = 300;
