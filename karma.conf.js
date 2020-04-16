module.exports = function(config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],
    plugins: [
      "jasmine",
      "karma-chrome-launcher",
      "karma-jasmine",
      "karma-typescript"
    ],
    files: [
      "test/*.ts"
    ],
    preprocessors: {
      "**/*.ts": "karma-typescript"
    },
    compilerOptions: {
      // options passed to the typescript compiler
      options: {
        target: 'es2015'
      }
    },
    reporters: ["progress", "karma-typescript"],
    browsers: ["Chrome"]
  });
};