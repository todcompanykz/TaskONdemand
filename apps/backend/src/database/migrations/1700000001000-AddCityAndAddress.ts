import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCityAndAddress1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist
    const cityExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'city'
    `);

    if (cityExists.length === 0) {
      // Add city and address columns to tasks table
      await queryRunner.query(`
        ALTER TABLE "tasks" 
        ADD COLUMN "city" VARCHAR(100) DEFAULT 'Астана',
        ADD COLUMN "address" VARCHAR(200) DEFAULT ''
      `);

      // Update existing tasks to have default values
      await queryRunner.query(`
        UPDATE "tasks" 
        SET "city" = 'Астана', "address" = 'Адрес не указан'
        WHERE "city" IS NULL OR "address" IS NULL
      `);

      // Make columns NOT NULL after setting defaults
      await queryRunner.query(`
        ALTER TABLE "tasks" 
        ALTER COLUMN "city" SET NOT NULL,
        ALTER COLUMN "address" SET NOT NULL,
        ALTER COLUMN "city" DROP DEFAULT,
        ALTER COLUMN "address" DROP DEFAULT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      DROP COLUMN IF EXISTS "address",
      DROP COLUMN IF EXISTS "city"
    `);
  }
}
