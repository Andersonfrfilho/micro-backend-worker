/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Phone } from '@app/modules/shared/domain/entities/phone.entity';
import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { PhoneRepository } from './phone.repository';

describe('PhoneRepository - Unit Tests', () => {
  let repository: PhoneRepository;
  let mockTypeormRepo: Repository<Phone>;

  beforeEach(() => {
    mockTypeormRepo = {
      create: jest.fn() as any,
      save: jest.fn() as any,
      findOne: jest.fn() as any,
      find: jest.fn() as any,
      update: jest.fn() as any,
      delete: jest.fn() as any,
    } as unknown as Repository<Phone>;

    repository = new PhoneRepository(mockTypeormRepo);
  });

  describe('create', () => {
    it('should create a new phone', async () => {
      const phoneData = {
        country: '+55',
        area: '85',
        number: '993056772',
        userId: faker.string.uuid(),
      };

      const createdPhone = { id: faker.string.uuid(), ...phoneData } as Phone;

      (mockTypeormRepo.create as jest.Mock).mockReturnValue(phoneData);
      (mockTypeormRepo.save as jest.Mock).mockResolvedValue(createdPhone);

      const result = await repository.create(phoneData as any);

      expect(result).toEqual(createdPhone);
      expect(mockTypeormRepo.create).toHaveBeenCalledWith(phoneData);
      expect(mockTypeormRepo.save).toHaveBeenCalledWith(phoneData);
    });
  });

  describe('findById', () => {
    it('should find phone by id', async () => {
      const phoneId = faker.string.uuid();
      const phone = {
        id: phoneId,
        country: '+55',
        area: '85',
        number: '993056772',
      };

      (mockTypeormRepo.findOne as jest.Mock).mockResolvedValue(phone);

      const result = await repository.findById(phoneId);

      expect(result).toEqual(phone);
      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: phoneId },
      });
    });

    it('should return null when phone not found', async () => {
      (mockTypeormRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById(faker.string.uuid());

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find phones by user id', async () => {
      const userId = faker.string.uuid();
      const phones = [
        { id: faker.string.uuid(), userId, country: '+55', area: '85', number: '993056772' },
        { id: faker.string.uuid(), userId, country: '+55', area: '85', number: '998765432' },
      ];

      (mockTypeormRepo.find as jest.Mock).mockResolvedValue(phones);

      const result = await repository.findByUserId(userId);

      expect(result).toEqual(phones);
      expect(result).toHaveLength(2);
      expect(mockTypeormRepo.find).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return empty array when no phones found', async () => {
      (mockTypeormRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByUserId(faker.string.uuid());

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update phone', async () => {
      const phoneId = faker.string.uuid();
      const updateData = { number: '999999999' };
      const updatedPhone = {
        id: phoneId,
        country: '+55',
        area: '85',
        number: '999999999',
      };

      (mockTypeormRepo.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (mockTypeormRepo.findOne as jest.Mock).mockResolvedValue(updatedPhone);

      const result = await repository.update(phoneId, updateData as any);

      expect(result).toEqual(updatedPhone);
      expect(mockTypeormRepo.update).toHaveBeenCalledWith(phoneId, updateData);
    });

    it('should throw error when phone not found during update', async () => {
      (mockTypeormRepo.update as jest.Mock).mockResolvedValue({ affected: 0 });
      (mockTypeormRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(repository.update(faker.string.uuid(), {} as any)).rejects.toThrow('Phone not found');
    });
  });

  describe('delete', () => {
    it('should delete phone', async () => {
      const phoneId = faker.string.uuid();
      (mockTypeormRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await repository.delete(phoneId);

      expect(mockTypeormRepo.delete).toHaveBeenCalledWith(phoneId);
    });
  });
});
