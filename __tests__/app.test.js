/**
 * Basic test suite for SuppleMate app
 * @jest-environment node
 */

describe('SuppleMate App', () => {
    test('app configuration is valid', () => {
        const packageJson = require('../package.json');

        // Check that package.json has required fields
        expect(packageJson.name).toBe('supplemate');
        expect(packageJson.version).toBeDefined();
        expect(packageJson.main).toBeDefined();
    });

    test('environment setup', () => {
        // Basic environment check
        expect(process.env.NODE_ENV).toBeDefined();
    });

    test('basic math operations work', () => {
        // Simple sanity check
        expect(1 + 1).toBe(2);
        expect(2 * 3).toBe(6);
    });
});
