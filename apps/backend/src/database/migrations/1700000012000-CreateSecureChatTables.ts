import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecureChatTables1700000012000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_conversations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userAId" uuid NOT NULL,
        "userBId" uuid NOT NULL,
        "requestedById" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "declinedById" uuid NULL,
        "lastMessagePreview" varchar(500) NULL,
        "lastMessageAt" timestamp NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_chat_pair" UNIQUE ("userAId", "userBId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conversationId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "message" text NOT NULL,
        "recipientReadAt" timestamp NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_blocks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "blockerId" uuid NOT NULL,
        "blockedId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_chat_blocks_pair" UNIQUE ("blockerId", "blockedId")
      )
    `);

    await queryRunner
      .query(
        `
      ALTER TABLE "chat_conversations"
      ADD CONSTRAINT "FK_chat_conversations_userA" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE CASCADE
    `,
      )
      .catch(() => undefined);
    await queryRunner
      .query(
        `
      ALTER TABLE "chat_conversations"
      ADD CONSTRAINT "FK_chat_conversations_userB" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE CASCADE
    `,
      )
      .catch(() => undefined);
    await queryRunner
      .query(
        `
      ALTER TABLE "chat_conversations"
      ADD CONSTRAINT "FK_chat_conversations_requestedBy" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE
    `,
      )
      .catch(() => undefined);
    await queryRunner
      .query(
        `
      ALTER TABLE "chat_conversations"
      ADD CONSTRAINT "FK_chat_conversations_declinedBy" FOREIGN KEY ("declinedById") REFERENCES "users"("id") ON DELETE SET NULL
    `,
      )
      .catch(() => undefined);
    await queryRunner
      .query(
        `
      ALTER TABLE "chat_messages"
      ADD CONSTRAINT "FK_chat_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE
    `,
      )
      .catch(() => undefined);
    await queryRunner
      .query(
        `
      ALTER TABLE "chat_messages"
      ADD CONSTRAINT "FK_chat_messages_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
    `,
      )
      .catch(() => undefined);
    await queryRunner
      .query(
        `
      ALTER TABLE "chat_blocks"
      ADD CONSTRAINT "FK_chat_blocks_blocker" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE
    `,
      )
      .catch(() => undefined);
    await queryRunner
      .query(
        `
      ALTER TABLE "chat_blocks"
      ADD CONSTRAINT "FK_chat_blocks_blocked" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE
    `,
      )
      .catch(() => undefined);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_conversations_status_lastMessageAt"
      ON "chat_conversations" ("status", "lastMessageAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_messages_conversation_createdAt"
      ON "chat_messages" ("conversationId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_messages_conversation_recipientReadAt"
      ON "chat_messages" ("conversationId", "recipientReadAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_notification_settings"
      ADD COLUMN IF NOT EXISTS "requireChatRequestApproval" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_notification_settings"
      DROP COLUMN IF EXISTS "requireChatRequestApproval"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "chat_blocks" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "chat_conversations" CASCADE`,
    );
  }
}
