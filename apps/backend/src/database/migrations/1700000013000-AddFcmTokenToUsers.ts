import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFcmTokenToUsers1700000013000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('users', 'fcmToken');

    if (!columnExists) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "fcmToken" TEXT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('users', 'fcmToken');

    if (columnExists) {
      await queryRunner.query(`
        ALTER TABLE "users"
        DROP COLUMN "fcmToken"
      `);
    }
  }
}
