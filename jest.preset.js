const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  setupFilesAfterEnv: [...(nxPreset.setupFilesAfterEnv ?? []), 'jest-extended/all'],
  resetMocks: true,
  restoreMocks: true
};
