import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAdminAccessTokenTable1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'admin_access_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'shortCode',
            type: 'varchar',
            length: '8',
            isUnique: true,
          },
          {
            name: 'createdById',
            type: 'uuid',
          },
          {
            name: 'assignedToUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'permissions',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isRevoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isActivated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'activatedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'admin_access_tokens',
      new TableIndex({
        name: 'IDX_admin_access_tokens_token',
        columnNames: ['token'],
      }),
    );

    await queryRunner.createIndex(
      'admin_access_tokens',
      new TableIndex({
        name: 'IDX_admin_access_tokens_shortCode',
        columnNames: ['shortCode'],
      }),
    );

    await queryRunner.createIndex(
      'admin_access_tokens',
      new TableIndex({
        name: 'IDX_admin_access_tokens_assignedToUserId',
        columnNames: ['assignedToUserId'],
      }),
    );

    await queryRunner.createIndex(
      'admin_access_tokens',
      new TableIndex({
        name: 'IDX_admin_access_tokens_createdById',
        columnNames: ['createdById'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'admin_access_tokens',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'admin_access_tokens',
      new TableForeignKey({
        columnNames: ['assignedToUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('admin_access_tokens');
  }
}
