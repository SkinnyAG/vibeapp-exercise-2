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
    "components/**/*.{ts,tsx}", 
    "lib/**/*.{ts,tsx}", 
    "!lib/db/**",
    "!lib/auth/**",
    "!**/node_modules/**",
    "!**/*.d.ts",
  ],
};