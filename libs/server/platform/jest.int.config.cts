/** Integration tests (*.int-spec.ts) against a real PostgreSQL — see test/global-setup.cts. */
module.exports = {
  displayName: 'server-platform:integration',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.int-spec.ts'],
  globalSetup: '<rootDir>/test/global-setup.cts',
  setupFiles: ['<rootDir>/test/load-env.cts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 30000,
};
