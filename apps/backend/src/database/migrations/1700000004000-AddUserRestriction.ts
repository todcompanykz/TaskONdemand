import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRestriction1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'isRestricted'
    `);

    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "isRestricted" BOOLEAN NOT NULL DEFAULT false
      `);

      // Create index for performance
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_users_isRestricted" ON "users"("isRestricted")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_isRestricted"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "isRestricted"
    `);
  }
}
