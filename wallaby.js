module.exports = wallaby => ({
  files: [
    'src/**/*.ts'
  ],
  tests: ['test/**/*.spec.ts'],
  compilers: {
    '**/*.ts': wallaby.compilers.typeScript({
      module: 1,  // commonjs
      target: 1,  // ES5
    })
  }, 
  env: {
    type: 'node'
  },
  testFramework: 'jasmine'
});