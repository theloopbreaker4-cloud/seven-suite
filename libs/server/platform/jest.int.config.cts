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
  // jose ships ESM only; compile it like our own code (pnpm nests it under .pnpm/).
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/jose@[^/]+/node_modules/)?jose/)',
  ],
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 30000,
};
