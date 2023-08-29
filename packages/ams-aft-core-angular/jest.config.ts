/* eslint-disable */
export default {
  displayName: 'ams-aft-core-angular',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../docs/ams-aft-core-angular/coverage/lcov-report',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment'
  ],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: 'docs/ams-aft-core-angular/coverage',
        filename: 'index.html',
        pageTitle: 'AMS-AFT Core Angular Tests Report',
        expand: true,
        hideIcon: true
      }
    ]
  ]
};
