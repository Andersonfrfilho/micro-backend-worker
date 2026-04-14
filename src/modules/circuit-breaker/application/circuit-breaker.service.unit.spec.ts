import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCircuitBreaker', () => {
    it('should create a new circuit breaker', () => {
      const action = jest.fn().mockResolvedValue('success');
      const breaker = service.getCircuitBreaker('test', action);

      expect(breaker).toBeDefined();
      expect(service.getStats('test')).toBeTruthy();
    });

    it('should return existing circuit breaker for same name', () => {
      const action1 = jest.fn().mockResolvedValue('success1');
      const action2 = jest.fn().mockResolvedValue('success2');

      const breaker1 = service.getCircuitBreaker('test', action1);
      const breaker2 = service.getCircuitBreaker('test', action2);

      expect(breaker1).toBe(breaker2);
    });
  });

  describe('execute', () => {
    it('should execute action successfully', async () => {
      const action = jest.fn().mockResolvedValue('success');

      const result = await service.execute('test-execute', action);

      expect(result).toBe('success');
      expect(action).toHaveBeenCalled();
    });

    it('should handle action failure', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Action failed'));

      await expect(service.execute('test-fail', action)).rejects.toThrow('Action failed');
    });

    it('should use fallback when provided', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Action failed'));
      const fallback = jest.fn().mockResolvedValue('fallback result');

      const result = await service.execute('test-fallback', action, [], {}, fallback);

      expect(result).toBe('fallback result');
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return stats for existing circuit breaker', () => {
      const action = jest.fn().mockResolvedValue('success');
      service.getCircuitBreaker('test-stats', action);

      const stats = service.getStats('test-stats');

      expect(stats).toBeTruthy();
      expect(stats?.name).toBe('test-stats');
      expect(stats?.state).toBe('closed');
    });

    it('should return null for non-existing circuit breaker', () => {
      const stats = service.getStats('non-existing');

      expect(stats).toBeNull();
    });
  });

  describe('getAllStats', () => {
    it('should return stats for all circuit breakers', () => {
      const action1 = jest.fn().mockResolvedValue('success1');
      const action2 = jest.fn().mockResolvedValue('success2');

      service.getCircuitBreaker('breaker1', action1);
      service.getCircuitBreaker('breaker2', action2);

      const allStats = service.getAllStats();

      expect(allStats).toHaveLength(2);
      expect(allStats.map((s) => s.name)).toEqual(['breaker1', 'breaker2']);
    });
  });

  describe('circuit control', () => {
    it('should open circuit manually', () => {
      const action = jest.fn().mockResolvedValue('success');
      service.getCircuitBreaker('test-open', action);

      const success = service.openCircuit('test-open');

      expect(success).toBe(true);
      expect(service.isOpen('test-open')).toBe(true);
    });

    it('should close circuit manually', () => {
      const action = jest.fn().mockResolvedValue('success');
      service.getCircuitBreaker('test-close', action);
      service.openCircuit('test-close');

      const success = service.closeCircuit('test-close');

      expect(success).toBe(true);
      expect(service.isOpen('test-close')).toBe(false);
    });

    it('should return false for non-existing circuit operations', () => {
      expect(service.openCircuit('non-existing')).toBe(false);
      expect(service.closeCircuit('non-existing')).toBe(false);
    });
  });
});
