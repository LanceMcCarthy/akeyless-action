module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/_tests_/**/*.test.(ts|js)'],
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  transformIgnorePatterns: ['node_modules/(?!(@actions|@octokit|before-after-hook|universal-user-agent)/)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', {targets: {node: 'current'}}]]
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  preset: 'ts-jest',
  globals: {},
};
