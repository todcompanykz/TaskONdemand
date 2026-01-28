import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSupportReplyFields1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if support_requests table exists
    const tableExists = await queryRunner.hasTable('support_requests');
    if (!tableExists) {
      // Create support_requests table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "support_requests" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "topic" character varying NOT NULL,
          "message" text NOT NULL,
          "status" character varying NOT NULL DEFAULT 'open',
          "responseMessage" text,
          "answeredAt" timestamp,
          "respondedByAdminId" uuid,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now(),
          CONSTRAINT "PK_support_requests" PRIMARY KEY ("id"),
          CONSTRAINT "FK_support_requests_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
      
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_support_requests_userId" ON "support_requests" ("userId")
      `);
      
      // If table was just created, columns already exist, so return early
      return;
    }

    // Add status column (only if it doesn't exist)
    const hasStatusColumn = await queryRunner.hasColumn('support_requests', 'status');
    if (!hasStatusColumn) {
      const statusColumn = new TableColumn({
        name: 'status',
        type: 'varchar',
        length: '20',
        default: "'open'",
      });
      await queryRunner.addColumn('support_requests', statusColumn);
    }

    // Add responseMessage column (only if it doesn't exist)
    const hasResponseMessageColumn = await queryRunner.hasColumn('support_requests', 'responseMessage');
    if (!hasResponseMessageColumn) {
      const responseMessageColumn = new TableColumn({
        name: 'responseMessage',
        type: 'text',
        isNullable: true,
      });
      await queryRunner.addColumn('support_requests', responseMessageColumn);
    }

    // Add answeredAt column (only if it doesn't exist)
    const hasAnsweredAtColumn = await queryRunner.hasColumn('support_requests', 'answeredAt');
    if (!hasAnsweredAtColumn) {
      const answeredAtColumn = new TableColumn({
        name: 'answeredAt',
        type: 'timestamp',
        isNullable: true,
      });
      await queryRunner.addColumn('support_requests', answeredAtColumn);
    }

    // Add respondedByAdminId column (only if it doesn't exist)
    const hasRespondedByAdminIdColumn = await queryRunner.hasColumn('support_requests', 'respondedByAdminId');
    if (!hasRespondedByAdminIdColumn) {
      const respondedByAdminIdColumn = new TableColumn({
        name: 'respondedByAdminId',
        type: 'uuid',
        isNullable: true,
      });
      await queryRunner.addColumn('support_requests', respondedByAdminIdColumn);
    }

    // Add foreign key constraint (only if it doesn't exist)
    const hasForeignKey = await queryRunner.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'FK_support_requests_respondedByAdminId'
    `);
    if (hasForeignKey.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "support_requests"
        ADD CONSTRAINT "FK_support_requests_respondedByAdminId"
        FOREIGN KEY ("respondedByAdminId")
        REFERENCES "users"("id")
        ON DELETE SET NULL
      `);
    }

    // Update existing records to have status='open'
    await queryRunner.query(`
      UPDATE "support_requests"
      SET "status" = 'open'
      WHERE "status" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "support_requests"
      DROP CONSTRAINT IF EXISTS "FK_support_requests_respondedByAdminId"
    `);

    // Remove columns
    await queryRunner.dropColumn('support_requests', 'respondedByAdminId');
    await queryRunner.dropColumn('support_requests', 'answeredAt');
    await queryRunner.dropColumn('support_requests', 'responseMessage');
    await queryRunner.dropColumn('support_requests', 'status');
  }
}
