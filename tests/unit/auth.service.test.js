'use strict';

const authService = require('../../src/services/auth.service');
const AppError = require('../../src/utils/AppError');

// Mock Sequelize models
jest.mock('../../src/models/User', () => ({
  scope: jest.fn().mockReturnThis(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));

const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register()', () => {
    it('should register a new user and return token', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 'uuid-1',
        name: 'Bray Test',
        email: 'bray@test.com',
        role: 'user',
      });

      const result = await authService.register({
        name: 'Bray Test',
        email: 'bray@test.com',
        password: 'Test@12345',
      });

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user).toHaveProperty('email', 'bray@test.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Test@12345', 12);
    });

    it('should throw 409 if email already exists', async () => {
      User.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.register({ name: 'X', email: 'exists@test.com', password: 'pass' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('login()', () => {
    it('should throw 401 if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@test.com', password: 'pass' })
      ).rejects.toThrow(AppError);
    });

    it('should throw 401 if password is wrong', async () => {
      User.findOne.mockResolvedValue({
        id: 'uuid-1',
        isActive: true,
        password: 'hashed',
        update: jest.fn(),
        toJSON: jest.fn().mockReturnValue({}),
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'user@test.com', password: 'wrong' })
      ).rejects.toThrow(AppError);
    });
  });
});
