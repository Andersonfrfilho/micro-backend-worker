import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { Address } from '@app/modules/shared/entities/address.entity';
import { Phone } from '@app/modules/shared/entities/phone.entity';
import { UserAddress } from '@app/modules/shared/entities/user-address.entity';
import { User } from '@app/modules/shared/entities/user.entity';

import { migrations } from '../../migrations/index';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_POSTGRES_PORT || '5432', 10),
  username: process.env.DATABASE_POSTGRES_USER || 'postgres',
  password: process.env.DATABASE_POSTGRES_PASSWORD || 'postgres',
  database: process.env.DATABASE_POSTGRES_NAME || 'backend_database_postgres',
  entities: [User, Phone, Address, UserAddress],
  migrations,
  synchronize: false,
  migrationsRun: false,
  logging: true,
});
