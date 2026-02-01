module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/_tests_/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  transformIgnorePatterns: ['node_modules/(?!(@actions|@octokit|before-after-hook|universal-user-agent)/)'],
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', {targets: {node: 'current'}}]]
      }
    ]
  }
};
