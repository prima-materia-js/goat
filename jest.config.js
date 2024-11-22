/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  collectCoverage: false, // Enables coverage collection
  collectCoverageFrom: [
    // Specifies which files to collect coverage from
    '**/*.{ts,tsx}', // Collect coverage from TypeScript files
    '!**/node_modules/**', // Exclude node_modules
    '!**/*.spec.{ts,tsx}', // Exclude test files
  ],
  coverageReporters: [
    // Specifies the format of the coverage report
    'text', // Output a summary in the console
    'lcov', // Generate an LCOV report for HTML viewing
  ],
};
