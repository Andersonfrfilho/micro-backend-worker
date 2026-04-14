/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { AddressTypeEnum } from '@app/modules/shared';
import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AddressRepositoryInterface } from '@modules/address/repositories/address.repository.interface';
import type { PhoneRepositoryInterface } from '@modules/phone/repositories/phone.repository.interface';
import type { QueueProducerMessageProviderInterface } from '@modules/shared/providers/queue/producer/producer.interface';
import type { UserAddressRepositoryInterface } from '@modules/user/repositories/user-address.repository.interface';
import type { UserRepositoryInterface } from '@modules/user/repositories/user.repository.interface';
import { UserApplicationCreateUseCase } from './create-user.use-case';

describe('UserApplicationCreateUseCase - Unit Tests', () => {
  let useCase: UserApplicationCreateUseCase;
  let mockUserRepository: UserRepositoryInterface;
  let mockPhoneRepository: PhoneRepositoryInterface;
  let mockAddressRepository: AddressRepositoryInterface;
  let mockUserAddressRepository: UserAddressRepositoryInterface;
  let mockQueueProducer: QueueProducerMessageProviderInterface;

  beforeEach(() => {
    // Setup mocks
    mockUserRepository = {
      findByEmail: jest.fn() as any,
      findByCpf: jest.fn() as any,
      findByRg: jest.fn() as any,
      create: jest.fn() as any,
      findById: jest.fn() as any,
      update: jest.fn() as any,
      delete: jest.fn() as any,
    } as UserRepositoryInterface;

    mockPhoneRepository = {
      create: jest.fn() as any,
      findById: jest.fn() as any,
      findByUserId: jest.fn() as any,
      update: jest.fn() as any,
      delete: jest.fn() as any,
    } as PhoneRepositoryInterface;

    mockAddressRepository = {
      create: jest.fn() as any,
      findById: jest.fn() as any,
      findByCity: jest.fn() as any,
      findByState: jest.fn() as any,
      update: jest.fn() as any,
      delete: jest.fn() as any,
    } as AddressRepositoryInterface;

    mockUserAddressRepository = {
      create: jest.fn() as any,
      findById: jest.fn() as any,
      findByUserId: jest.fn() as any,
      findByAddressId: jest.fn() as any,
      update: jest.fn() as any,
      delete: jest.fn() as any,
      findPrimaryByUserId: jest.fn() as any,
    } as UserAddressRepositoryInterface;

    mockQueueProducer = {
      send: jest.fn() as any,
      sendDelayed: jest.fn() as any,
      sendBatch: jest.fn() as any,
      sendWithConfirmation: jest.fn() as any,
      sendWithQoS: jest.fn() as any,
      sendWithTTL: jest.fn() as any,
      getId: jest.fn() as any,
      getConfig: jest.fn() as any,
      isHealthy: jest.fn() as any,
      getPendingMessages: jest.fn() as any,
      purgeQueue: jest.fn() as any,
      getMetrics: jest.fn() as any,
      close: jest.fn() as any,
      reconnect: jest.fn() as any,
      on: jest.fn() as any,
      off: jest.fn() as any,
    } as QueueProducerMessageProviderInterface;

    useCase = new UserApplicationCreateUseCase(
      mockUserRepository,
      mockPhoneRepository,
      mockAddressRepository,
      mockUserAddressRepository,
      mockQueueProducer,
    );
  });

  const createParams = () => ({
    email: faker.internet.email(),
    cpf: '12345678901',
    rg: '123456789',
    phone: '+5585993056772',
    name: 'John',
    lastName: 'Doe',
    gender: 'M',
    birthDate: new Date(),
    active: true,
    passwordHash: 'hashed_password',
    details: {},
    address: {
      street: 'Test Street',
      number: '123',
      neighborhood: 'Test Neighborhood',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345-678',
      country: 'Brazil',
      latitude: 0,
      longitude: 0,
    },
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it('should throw error when email already exists', async () => {
      const params = createParams();

      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: params.email,
      });

      await expect(useCase.execute(params)).rejects.toThrow();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(params.email);
    });

    it('should throw error when CPF already exists', async () => {
      const params = createParams();

      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByCpf as jest.Mock).mockResolvedValue({
        id: 'user-1',
        cpf: params.cpf,
      });

      await expect(useCase.execute(params)).rejects.toThrow();
      expect(mockUserRepository.findByCpf).toHaveBeenCalledWith(params.cpf);
    });

    it('should throw error when RG already exists', async () => {
      const params = createParams();

      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByCpf as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByRg as jest.Mock).mockResolvedValue({ id: 'user-1', rg: params.rg });

      await expect(useCase.execute(params)).rejects.toThrow();
      expect(mockUserRepository.findByRg).toHaveBeenCalledWith(params.rg);
    });

    it('should successfully create user with all related data', async () => {
      const params = createParams();

      const userId = faker.string.uuid();
      const addressId = faker.string.uuid();
      const userAddressId = faker.string.uuid();

      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByCpf as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByRg as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.create as jest.Mock).mockResolvedValue({
        id: userId,
        ...params,
        createdAt: new Date(),
      });
      (mockPhoneRepository.create as jest.Mock).mockResolvedValue({
        id: 'phone-1',
        country: '+55',
        area: '85',
        number: '993056772',
        userId,
      });
      (mockAddressRepository.create as jest.Mock).mockResolvedValue({
        id: addressId,
        ...params.address,
      });
      (mockUserAddressRepository.create as jest.Mock).mockResolvedValue({
        id: userAddressId,
        userId,
        addressId,
        isPrimary: true,
        type: AddressTypeEnum.RESIDENTIAL,
      });

      const result = await useCase.execute(params);

      expect(result.id).toBe(userId);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockPhoneRepository.create).toHaveBeenCalled();
      expect(mockAddressRepository.create).toHaveBeenCalled();
      expect(mockUserAddressRepository.create).toHaveBeenCalled();
      expect(mockQueueProducer.send).toHaveBeenCalled();
    });

    it('should parse phone correctly before creating', async () => {
      const params = createParams();

      const userId = faker.string.uuid();
      const addressId = faker.string.uuid();

      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByCpf as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByRg as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.create as jest.Mock).mockResolvedValue({
        id: userId,
        ...params,
        createdAt: new Date(),
      });
      (mockPhoneRepository.create as jest.Mock).mockResolvedValue({ id: 'phone-1' });
      (mockAddressRepository.create as jest.Mock).mockResolvedValue({ id: addressId });
      (mockUserAddressRepository.create as jest.Mock).mockResolvedValue({ id: 'ua-1' });

      await useCase.execute(params);

      // Verify phone was created with parsed components
      expect(mockPhoneRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          country: '+55',
          area: '85',
          number: '993056772',
          userId,
        }),
      );
    });
  });
});
