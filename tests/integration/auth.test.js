const request = require('supertest');
const app = require('../../src/index');
const bcrypt = require('bcryptjs');

// Mock le logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  case: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  $transaction: jest.fn().mockImplementation(async (queries) => {
    const results = [];
    for (const query of queries) {
      results.push(await query);
    }
    return results;
  }),
}));
const prisma = require('../../src/utils/prisma');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  it('should register a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '1', email: testUser.email });

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should not register a user with an existing email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: testUser.email });

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toEqual(409);
  });

  it('should login an existing user and return a JWT', async () => {
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: testUser.email, password: hashedPassword });

    const res = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
  });

  it('should access a protected route with a valid token', async () => {
    // 1. Login to get a token
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: testUser.email, password: hashedPassword });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send(testUser);
    const token = loginRes.body.token;

    // 2. Access a protected route
    const res = await request(app)
      .get('/api/cases')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
  });

  it('should not access a protected route without a token', async () => {
    const res = await request(app).get('/api/cases');
    expect(res.statusCode).toEqual(401);
  });
});