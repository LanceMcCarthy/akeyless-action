module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/_tests_/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@actions)/)'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@actions/http-client/lib/(.*)$': '<rootDir>/node_modules/@actions/http-client/lib/$1.js',
    '^@actions/http-client$': '<rootDir>/node_modules/@actions/http-client/lib/index.js',
    '^@actions/core$': '<rootDir>/node_modules/@actions/core/lib/core.js',
    '^@actions/exec$': '<rootDir>/node_modules/@actions/exec/lib/exec.js',
    '^@actions/io$': '<rootDir>/node_modules/@actions/io/lib/io.js'
  },
};
