/* eslint-env jest */
/* global beforeAll, afterAll, beforeEach, describe, test, expect, jest */
const request = require('supertest');

jest.setTimeout(10000);

const API_BASE_URL = 'https://supplemate-api2.impaas.uk';
const TEST_USER_UID = '62fee1e1-441b-450a-acc5-631e64431c76';

beforeAll(async () => {
  // Clean up any existing test data
  await request(API_BASE_URL)
    .delete('/supplements/test-cleanup')
    .query({ user_uid: TEST_USER_UID });
});

afterAll(async () => {
  // Clean up test data
  await request(API_BASE_URL)
    .delete('/supplements/test-cleanup')
    .query({ user_uid: TEST_USER_UID });
});

describe('Deployed API Tests', () => {
  let testSupplement;

  beforeEach(async () => {
    // Clean up test data before each test
    await request(API_BASE_URL)
      .delete('/supplements/test-cleanup')
      .query({ user_uid: TEST_USER_UID });
  });

  describe('POST /supplements', () => {
    test('should create a new supplement', async () => {
      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Vitamin D',
        dosage: '1000 IU',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 30,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Vitamin D');
      expect(response.body.user_uid).toBe(TEST_USER_UID);
      expect(response.body.dosage).toBe('1000 IU');

      testSupplement = response.body;
    });

    test('should create a medication type supplement', async () => {
      const medicationData = {
        user_uid: TEST_USER_UID,
        name: 'Metformin',
        dosage: '500mg',
        frequency: '2 day',
        first_take: '2025-01-01T08:00:00Z',
        supply_amount: 60,
        type: 'medication'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(medicationData)
        .expect(201);

      expect(response.body.type).toBe('medication');
      expect(response.body.name).toBe('Metformin');
    });

    test('should default to supplement type when type is not specified', async () => {
      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Omega-3',
        dosage: '1000mg',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 30
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData)
        .expect(201);

      expect(response.body.type).toBe('supplement');
    });

    test('should return 400 if user_uid is missing', async () => {
      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send({
          name: 'Vitamin C',
          dosage: '500mg',
          frequency: '1 day'
        })
        .expect(400);

      expect(response.body.error).toBe('user_uid is required');
    });
  });

  describe('GET /supplements', () => {
    beforeEach(async () => {
      // Create test supplements
      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Test Vitamin',
        dosage: '500mg',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 30,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData);

      testSupplement = response.body;
    });

    test('should retrieve supplements for a user', async () => {
      const response = await request(API_BASE_URL)
        .get('/supplements')
        .query({ user_uid: TEST_USER_UID })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].user_uid).toBe(TEST_USER_UID);
    });

    test('should return empty array for user with no supplements', async () => {
      const response = await request(API_BASE_URL)
        .get('/supplements')
        .query({ user_uid: 'c130e77a-156f-492c-936b-bc36442e7bdb' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test('should return 400 if user_uid is missing', async () => {
      const response = await request(API_BASE_URL)
        .get('/supplements')
        .expect(400);

      expect(response.body.error).toBe('user_uid is required');
    });

    test('should return supplements with all required fields', async () => {
      const response = await request(API_BASE_URL)
        .get('/supplements')
        .query({ user_uid: TEST_USER_UID })
        .expect(200);

      const supplement = response.body[0];
      expect(supplement).toHaveProperty('id');
      expect(supplement).toHaveProperty('user_uid');
      expect(supplement).toHaveProperty('name');
      expect(supplement).toHaveProperty('dosage');
      expect(supplement).toHaveProperty('frequency');
      expect(supplement).toHaveProperty('first_take');
      expect(supplement).toHaveProperty('supply_amount');
      expect(supplement).toHaveProperty('type');
      expect(supplement).toHaveProperty('created_at');
      expect(supplement).toHaveProperty('updated_at');
    });
  });

  describe('PUT /supplements/:id', () => {
    beforeEach(async () => {
      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Test Vitamin',
        dosage: '500mg',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 30,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData);

      testSupplement = response.body;
    });

    test('should update an existing supplement', async () => {
      const updateData = {
        name: 'Vitamin D3',
        dosage: '2000 IU',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 60,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .put(`/supplements/${testSupplement.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Vitamin D3');
      expect(response.body.dosage).toBe('2000 IU');
      expect(response.body.supply_amount).toBe(60);
      expect(response.body.id).toBe(testSupplement.id);
    });

    test('should update supplement type from supplement to medication', async () => {
      const updateData = {
        name: 'Prescription Medicine',
        dosage: '100mg',
        frequency: '2 day',
        first_take: '2025-01-01T08:00:00Z',
        supply_amount: 30,
        type: 'medication'
      };

      const response = await request(API_BASE_URL)
        .put(`/supplements/${testSupplement.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.type).toBe('medication');
      expect(response.body.name).toBe('Prescription Medicine');
    });

    test('should update timestamps when supplement is modified', async () => {
      const originalUpdatedAt = testSupplement.updated_at;

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const updateData = {
        name: 'Updated Name',
        dosage: testSupplement.dosage,
        frequency: testSupplement.frequency,
        first_take: testSupplement.first_take,
        supply_amount: testSupplement.supply_amount,
        type: testSupplement.type
      };

      const response = await request(API_BASE_URL)
        .put(`/supplements/${testSupplement.id}`)
        .send(updateData)
        .expect(200);

      expect(new Date(response.body.updated_at)).toBeInstanceOf(Date);
      expect(response.body.updated_at).not.toBe(originalUpdatedAt);
    });

    test('should return 404 for non-existent supplement', async () => {
      const response = await request(API_BASE_URL)
        .put('/supplements/99999')
        .send({
          name: 'Test',
          dosage: '100mg',
          frequency: '1 day',
          first_take: '2025-01-01T09:00:00Z',
          supply_amount: 30,
          type: 'supplement'
        })
        .expect(404);

      expect(response.body.error).toBe('Supplement not found');
    });
  });

  describe('DELETE /supplements/:id', () => {
    beforeEach(async () => {
      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Test Vitamin',
        dosage: '500mg',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 30,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData);

      testSupplement = response.body;
    });

    // test('should delete an existing supplement', async () => {
    //   const response = await request(API_BASE_URL)
    //     .delete(`/supplements/${testSupplement.id}`)
    //     .expect(200);

    //   expect(response.body.message).toBe('Supplement deleted successfully');
    //   expect(response.body.supplement.id).toBe(testSupplement.id);

    //   // Verify it's actually deleted
    //   const getResponse = await request(API_BASE_URL)
    //     .get('/supplements')
    //     .query({ user_uid: TEST_USER_UID })
    //     .expect(200);

    //   console.log(getResponse.body);

    //   expect(getResponse.body.length).toBe(0);
    // });

    test('should return 404 for non-existent supplement', async () => {
      const response = await request(API_BASE_URL)
        .delete('/supplements/99999')
        .expect(404);

      expect(response.body.error).toBe('Supplement not found');
    });

    test('should return deleted supplement data', async () => {
      const response = await request(API_BASE_URL)
        .delete(`/supplements/${testSupplement.id}`)
        .expect(200);

      expect(response.body.supplement).toEqual(testSupplement);
    });
  });

  describe('Data Validation', () => {
    test('should handle large supply amounts', async () => {
      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Bulk Vitamin',
        dosage: '1000mg',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 365,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData)
        .expect(201);

      expect(response.body.supply_amount).toBe(365);
    });

    test('should handle different dosage formats', async () => {
      const dosages = ['100mg', '1000 IU', '2 tablets', '5ml'];

      for (const dosage of dosages) {
        const supplementData = {
          user_uid: TEST_USER_UID,
          name: `Test ${dosage}`,
          dosage: dosage,
          frequency: '1 day',
          first_take: '2025-01-01T09:00:00Z',
          supply_amount: 30,
          type: 'supplement'
        };

        const response = await request(API_BASE_URL)
          .post('/supplements')
          .send(supplementData)
          .expect(201);

        expect(response.body.dosage).toBe(dosage);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero supply amount', async () => {
      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Empty Supply',
        dosage: '100mg',
        frequency: '1 day',
        first_take: '2025-01-01T09:00:00Z',
        supply_amount: 0,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData)
        .expect(201);

      expect(response.body.supply_amount).toBe(0);
    });

    test('should handle future dates for first_take', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const supplementData = {
        user_uid: TEST_USER_UID,
        name: 'Future Supplement',
        dosage: '100mg',
        frequency: '1 day',
        first_take: futureDate.toISOString(),
        supply_amount: 30,
        type: 'supplement'
      };

      const response = await request(API_BASE_URL)
        .post('/supplements')
        .send(supplementData)
        .expect(201);

      expect(new Date(response.body.first_take)).toBeInstanceOf(Date);
    });
  })
});