/* eslint-disable */
export default {
  displayName: 'ams-aft-core',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../docs/ams-aft-core/coverage/lcov-report',
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: 'docs/ams-aft-core/coverage',
        filename: 'index.html',
        pageTitle: 'AMS-AFT Core Tests Report',
        expand: true,
        hideIcon: true
      }
    ]
  ]
};
