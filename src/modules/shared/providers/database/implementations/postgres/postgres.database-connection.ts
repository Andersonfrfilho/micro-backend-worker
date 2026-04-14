import { DataSource } from 'typeorm';

import { Address } from '@app/modules/shared/entities/address.entity';
import { Phone } from '@app/modules/shared/entities/phone.entity';
import { UserAddress } from '@app/modules/shared/entities/user-address.entity';
import { User } from '@app/modules/shared/entities/user.entity';
import { getDatabaseConfig } from '@config/database-config';

import { migrations } from '../../migrations/index';
import { DATABASE_TYPES } from '../constant';

const config = getDatabaseConfig();
const PostgresDataSource = new DataSource({
  type: DATABASE_TYPES.POSTGRES,
  host: config.postgres.host,
  port: config.postgres.port,
  username: config.postgres.username,
  password: config.postgres.password,
  database: config.postgres.database,
  logging: config.postgres.logging,
  synchronize: config.postgres.synchronize,
  migrationsRun: false,
  entities: [User, Phone, Address, UserAddress],
  migrations,
});

export default PostgresDataSource;
