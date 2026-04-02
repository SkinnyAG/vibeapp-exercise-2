const { createDefaultPreset } = require("ts-jest");
const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    ...tsJestTransformCfg,
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "middleware.ts",
    "components/**/*.{ts,tsx}", 
    "lib/**/*.{ts,tsx}", 
    "!lib/db/**",
    "!lib/auth/**",
    "!**/node_modules/**",
    "!**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 70,
      functions: 80,
    },
  },
};