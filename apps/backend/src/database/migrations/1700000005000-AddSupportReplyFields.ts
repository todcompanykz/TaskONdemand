import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSupportReplyFields1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status column
    const statusColumn = new TableColumn({
      name: 'status',
      type: 'varchar',
      length: '20',
      default: "'open'",
    });
    await queryRunner.addColumn('support_requests', statusColumn);

    // Add responseMessage column
    const responseMessageColumn = new TableColumn({
      name: 'responseMessage',
      type: 'text',
      isNullable: true,
    });
    await queryRunner.addColumn('support_requests', responseMessageColumn);

    // Add answeredAt column
    const answeredAtColumn = new TableColumn({
      name: 'answeredAt',
      type: 'timestamp',
      isNullable: true,
    });
    await queryRunner.addColumn('support_requests', answeredAtColumn);

    // Add respondedByAdminId column
    const respondedByAdminIdColumn = new TableColumn({
      name: 'respondedByAdminId',
      type: 'uuid',
      isNullable: true,
    });
    await queryRunner.addColumn('support_requests', respondedByAdminIdColumn);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "support_requests"
      ADD CONSTRAINT "FK_support_requests_respondedByAdminId"
      FOREIGN KEY ("respondedByAdminId")
      REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

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
