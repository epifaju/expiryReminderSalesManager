module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/android/",
    "<rootDir>/ios/",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-native-community|react-native-sqlite-storage|@expo)/)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
