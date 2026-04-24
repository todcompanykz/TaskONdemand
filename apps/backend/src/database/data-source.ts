import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Review } from '../reviews/entities/review.entity';
import { UserNotificationSettings } from '../users/entities/user-notification-settings.entity';
import { SupportRequest } from '../support/entities/support-request.entity';
import { SupportConversation } from '../support/entities/support-conversation.entity';
import { SupportMessage } from '../support/entities/support-message.entity';
import { AdminAccessToken } from '../admin/entities/admin-access-token.entity';

config();

// Use paths relative to this file, so it works in both:
// - ts-node dev: .../src/database (migrations are .ts)
// - compiled prod: .../dist/**/database (migrations are .js)
const migrationsPath = [path.join(__dirname, 'migrations', '*.{ts,js}')];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'tod',
  entities: [
    User,
    Task,
    Review,
    UserNotificationSettings,
    SupportRequest,
    SupportConversation,
    SupportMessage,
    AdminAccessToken,
  ],
  migrations: migrationsPath,
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
