import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskPhotos1700000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const photoUrlsExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'photoUrls'
    `);

    if (photoUrlsExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "tasks"
        ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT '{}'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
      DROP COLUMN IF EXISTS "photoUrls"
    `);
  }
}
