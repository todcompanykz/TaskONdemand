import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetSuperAdminEmail1700000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Set SUPER_ADMIN role for super@admin.com
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'SUPER_ADMIN', "permissions" = '[]'
      WHERE LOWER("email") = LOWER('super@admin.com')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to USER role
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'USER', "permissions" = '[]'
      WHERE LOWER("email") = LOWER('super@admin.com')
    `);
  }
}
