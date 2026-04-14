import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerHealthIndicator } from './circuit-breaker.health-indicator';
import { CircuitBreakerService } from '../circuit-breaker.service';

describe('CircuitBreakerHealthIndicator', () => {
  let service: CircuitBreakerHealthIndicator;
  let mockCircuitBreakerService: jest.Mocked<CircuitBreakerService>;

  beforeEach(async () => {
    const mockService = {
      getAllStats: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerHealthIndicator,
        {
          provide: CircuitBreakerService,
          useValue: mockService,
        },
      ],
    }).compile();

    service = module.get<CircuitBreakerHealthIndicator>(CircuitBreakerHealthIndicator);
    mockCircuitBreakerService = module.get(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when all breakers are closed', async () => {
      mockCircuitBreakerService.getAllStats.mockReturnValue([
        {
          name: 'breaker1',
          state: 'closed',
          failures: 0,
          successes: 10,
          timeouts: 0,
          fallbacks: 0,
          errorRate: 0,
          isEnabled: true,
        },
        {
          name: 'breaker2',
          state: 'closed',
          failures: 1,
          successes: 9,
          timeouts: 0,
          fallbacks: 0,
          errorRate: 10,
          isEnabled: true,
        },
      ]);

      const result = await service.isHealthy('circuit-breakers');

      expect(result).toEqual({
        'circuit-breakers': {
          status: 'up',
          totalBreakers: 2,
          openBreakers: 0,
          breakers: [
            {
              name: 'breaker1',
              state: 'closed',
              errorRate: 0,
              failures: 0,
              successes: 10,
            },
            {
              name: 'breaker2',
              state: 'closed',
              errorRate: 10,
              failures: 1,
              successes: 9,
            },
          ],
          message: 'All circuit breakers are healthy',
        },
      });
    });

    it('should return unhealthy status when some breakers are open', async () => {
      mockCircuitBreakerService.getAllStats.mockReturnValue([
        {
          name: 'breaker1',
          state: 'closed',
          failures: 0,
          successes: 10,
          timeouts: 0,
          fallbacks: 0,
          errorRate: 0,
          isEnabled: true,
        },
        {
          name: 'breaker2',
          state: 'open',
          failures: 5,
          successes: 5,
          timeouts: 0,
          fallbacks: 0,
          errorRate: 50,
          isEnabled: true,
        },
      ]);

      const result = await service.isHealthy('circuit-breakers');

      expect(result).toEqual({
        'circuit-breakers': {
          status: 'down',
          totalBreakers: 2,
          openBreakers: 1,
          breakers: [
            {
              name: 'breaker1',
              state: 'closed',
              errorRate: 0,
              failures: 0,
              successes: 10,
            },
            {
              name: 'breaker2',
              state: 'open',
              errorRate: 50,
              failures: 5,
              successes: 5,
            },
          ],
          message: '1 circuit breaker(s) are open',
        },
      });
    });

    it('should handle service errors', async () => {
      mockCircuitBreakerService.getAllStats.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const result = await service.isHealthy('circuit-breakers');

      expect(result).toEqual({
        'circuit-breakers': {
          status: 'down',
          error: 'Service unavailable',
          message: 'Failed to check circuit breakers',
        },
      });
    });
  });

  describe('checkBreaker', () => {
    it('should return healthy status for closed breaker', async () => {
      mockCircuitBreakerService.getStats.mockReturnValue({
        name: 'test-breaker',
        state: 'closed',
        failures: 1,
        successes: 9,
        timeouts: 0,
        fallbacks: 0,
        errorRate: 10,
        isEnabled: true,
      });

      const result = await service.checkBreaker('breaker', 'test-breaker');

      expect(result).toEqual({
        breaker: {
          status: 'up',
          name: 'test-breaker',
          state: 'closed',
          errorRate: 10,
          failures: 1,
          successes: 9,
          timeouts: 0,
          fallbacks: 0,
          message: "Circuit breaker 'test-breaker' is healthy",
        },
      });
    });

    it('should return unhealthy status for open breaker', async () => {
      mockCircuitBreakerService.getStats.mockReturnValue({
        name: 'test-breaker',
        state: 'open',
        failures: 5,
        successes: 5,
        timeouts: 2,
        fallbacks: 1,
        errorRate: 50,
        isEnabled: true,
      });

      const result = await service.checkBreaker('breaker', 'test-breaker');

      expect(result).toEqual({
        breaker: {
          status: 'down',
          name: 'test-breaker',
          state: 'open',
          errorRate: 50,
          failures: 5,
          successes: 5,
          timeouts: 2,
          fallbacks: 1,
          message: "Circuit breaker 'test-breaker' is open",
        },
      });
    });

    it('should return unhealthy status for non-existing breaker', async () => {
      mockCircuitBreakerService.getStats.mockReturnValue(null);

      const result = await service.checkBreaker('breaker', 'non-existing');

      expect(result).toEqual({
        breaker: {
          status: 'down',
          message: "Circuit breaker 'non-existing' not found",
        },
      });
    });
  });
});
