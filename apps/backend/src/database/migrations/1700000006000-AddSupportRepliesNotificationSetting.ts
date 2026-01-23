import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSupportRepliesNotificationSetting1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const supportRepliesColumn = new TableColumn({
      name: 'supportReplies',
      type: 'boolean',
      default: true,
    });
    await queryRunner.addColumn('user_notification_settings', supportRepliesColumn);

    // Update existing records to have supportReplies=true
    await queryRunner.query(`
      UPDATE "user_notification_settings"
      SET "supportReplies" = true
      WHERE "supportReplies" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_notification_settings', 'supportReplies');
  }
}
