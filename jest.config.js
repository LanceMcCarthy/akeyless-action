module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/_tests_/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  transformIgnorePatterns: [],
  moduleDirectories: ['node_modules', '<rootDir>'],
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', {targets: {node: 'current'}}]]
      }
    ]
  }
};
