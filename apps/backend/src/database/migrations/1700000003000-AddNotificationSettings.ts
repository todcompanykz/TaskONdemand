import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddNotificationSettings1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_notification_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isUnique: true,
          },
          // System notifications
          {
            name: 'loginFromNewDevice',
            type: 'boolean',
            default: true,
          },
          {
            name: 'passwordChange',
            type: 'boolean',
            default: true,
          },
          {
            name: 'securityErrors',
            type: 'boolean',
            default: true,
          },
          {
            name: 'accountBlocked',
            type: 'boolean',
            default: true,
          },
          // Account and profile
          {
            name: 'profileChanges',
            type: 'boolean',
            default: true,
          },
          {
            name: 'actionConfirmation',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sessionExpiration',
            type: 'boolean',
            default: true,
          },
          // Work/Service notifications
          {
            name: 'newMessages',
            type: 'boolean',
            default: true,
          },
          {
            name: 'newTasks',
            type: 'boolean',
            default: true,
          },
          {
            name: 'taskStatusChange',
            type: 'boolean',
            default: true,
          },
          {
            name: 'taskComments',
            type: 'boolean',
            default: true,
          },
          {
            name: 'executorAssigned',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_notification_settings',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_notification_settings');
  }
}
