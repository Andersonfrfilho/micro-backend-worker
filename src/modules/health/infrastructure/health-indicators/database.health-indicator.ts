import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super();
  }

  async checkMigrations(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if migrations are up to date
      const migrations = await this.dataSource.query(
        'SELECT * FROM migrations ORDER BY id DESC LIMIT 1',
      );

      const isHealthy = migrations.length > 0;

      return this.getStatus(key, isHealthy, {
        migrations: migrations.length,
        latestMigration: migrations[0]?.name || 'none',
        message: isHealthy ? 'Migrations are up to date' : 'No migrations found',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        message: 'Failed to check migrations',
      });
    }
  }
}
