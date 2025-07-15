const request = require('supertest');
const app = require('../../src/index');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  return {
    ...originalModule,
    PrismaClient: jest.fn().mockImplementation(() => ({
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      investigation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      case: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      indicator: {
       findUnique: jest.fn(),
       findMany: jest.fn(),
       create: jest.fn(),
       update: jest.fn(),
       delete: jest.fn(),
       count: jest.fn(),
       findFirst: jest.fn(),
       createMany: jest.fn(),
      },
      result: {
       findUnique: jest.fn(),
       findMany: jest.fn(),
       create: jest.fn(),
       update: jest.fn(),
       delete: jest.fn(),
       count: jest.fn(),
      },
      investigationLog: {
       findUnique: jest.fn(),
       findMany: jest.fn(),
       create: jest.fn(),
       update: jest.fn(),
       delete: jest.fn(),
       count: jest.fn(),
      },
      notification: {
       findUnique: jest.fn(),
       findMany: jest.fn(),
       create: jest.fn(),
       update: jest.fn(),
       delete: jest.fn(),
       count: jest.fn(),
      },
      user: {
       findUnique: jest.fn(),
       findMany: jest.fn(),
       create: jest.fn(),
       update: jest.fn(),
       delete: jest.fn(),
       count: jest.fn(),
      }
    })),
  };
});

// Mock le logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  investigation: jest.fn(),
  database: jest.fn(),
}));

describe('Health Check API', () => {
  it('should return 200 and a health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(['healthy', 'degraded']).toContain(res.body.status);
  });
});