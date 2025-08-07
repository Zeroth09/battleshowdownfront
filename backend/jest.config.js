module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js', '**/test/**/*.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}; 