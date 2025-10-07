// Configuration Jest simplifiée pour les tests
// Mock console methods pour éviter les warnings dans les tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
