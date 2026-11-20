module.exports = {
  passWithNoTests: true,
  displayName: 'server-platform',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // jose ships ESM only; compile it like our own code (pnpm nests it under .pnpm/).
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/jose@[^/]+/node_modules/)?jose/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/server/platform',
};
