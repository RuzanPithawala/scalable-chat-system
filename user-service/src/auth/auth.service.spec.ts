import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    username: 'testuser',
    displayName: 'Test User',
    createdAt: new Date(),
  };

  const mockUsersService = {
    validatePassword: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access token and user when credentials are valid', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      mockUsersService.validatePassword.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token-12345');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'jwt-token-12345',
        user: {
          id: '1',
          username: 'testuser',
          displayName: 'Test User',
        },
      });
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        username: 'testuser',
        displayName: 'Test User',
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUsersService.validatePassword.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid username or password',
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const loginDto = {
        username: 'nonexistent',
        password: 'password123',
      };

      mockUsersService.validatePassword.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await service.validateUser('999');

      expect(result).toBeNull();
    });
  });
});