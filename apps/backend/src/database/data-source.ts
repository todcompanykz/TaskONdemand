import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Review } from '../reviews/entities/review.entity';
import { UserNotificationSettings } from '../users/entities/user-notification-settings.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'tod',
  entities: [User, Task, Review, UserNotificationSettings],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
