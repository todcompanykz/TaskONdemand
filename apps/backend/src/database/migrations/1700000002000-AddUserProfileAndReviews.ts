import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAndReviews1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add firstName and lastName to users table
    const firstNameExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'firstName'
    `);

    if (firstNameExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "firstName" VARCHAR(100) DEFAULT 'User',
        ADD COLUMN "lastName" VARCHAR(100) DEFAULT 'Name'
      `);

      // Update existing users with default names
      await queryRunner.query(`
        UPDATE "users" 
        SET "firstName" = 'User', "lastName" = 'Name'
        WHERE "firstName" IS NULL OR "lastName" IS NULL
      `);

      // Make columns NOT NULL after setting defaults
      await queryRunner.query(`
        ALTER TABLE "users" 
        ALTER COLUMN "firstName" SET NOT NULL,
        ALTER COLUMN "lastName" SET NOT NULL,
        ALTER COLUMN "firstName" DROP DEFAULT,
        ALTER COLUMN "lastName" DROP DEFAULT
      `);
    }

    // Add rating fields to users table
    const ratingAvgExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'ratingAvg'
    `);

    if (ratingAvgExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "ratingAvg" DECIMAL(3,2) DEFAULT 0.00,
        ADD COLUMN "ratingCount" INTEGER DEFAULT 0
      `);
    }

    // Create reviews table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fromUserId" UUID NOT NULL,
        "toUserId" UUID NOT NULL,
        "taskId" UUID NOT NULL,
        "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
        "comment" VARCHAR(300),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_reviews_fromUser" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_toUser" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_reviews_fromUser_task" UNIQUE ("fromUserId", "taskId")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reviews_toUserId" ON "reviews"("toUserId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reviews_taskId" ON "reviews"("taskId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "ratingCount",
      DROP COLUMN IF EXISTS "ratingAvg",
      DROP COLUMN IF EXISTS "lastName",
      DROP COLUMN IF EXISTS "firstName"
    `);
  }
}
