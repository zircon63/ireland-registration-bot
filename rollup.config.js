import resolve from '@rollup/plugin-node-resolve';

export default [
    {
        input: 'main.js',
        output: {
            sourcemap: true,
            file: './dist/bundle.js',
            format: 'iife'
        },
        globals: {
            cv: 'cv'
        },
        plugins: [
            resolve()
        ]
    },
    {
        input: 'worker.js',
        output: {
            sourcemap: true,
            file: './dist/worker.bundle.js',
            format: 'iife'
        },
        plugins: [
            resolve()
        ]
    }
];
