import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSupportChatTables1700000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create support_conversations table
    await queryRunner.createTable(
      new Table({
        name: 'support_conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'topic',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'open'",
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '20',
            default: "'normal'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'lastMessageAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create support_messages table
    await queryRunner.createTable(
      new Table({
        name: 'support_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'senderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'senderRole',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for support_conversations
    await queryRunner.createForeignKey(
      'support_conversations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for support_messages
    await queryRunner.createForeignKey(
      'support_messages',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'support_conversations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'support_messages',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'support_conversations',
      new TableIndex({
        name: 'IDX_support_conversations_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'support_conversations',
      new TableIndex({
        name: 'IDX_support_conversations_status_priority_lastMessageAt',
        columnNames: ['status', 'priority', 'lastMessageAt'],
      }),
    );

    await queryRunner.createIndex(
      'support_messages',
      new TableIndex({
        name: 'IDX_support_messages_conversationId_createdAt',
        columnNames: ['conversationId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'support_messages',
      new TableIndex({
        name: 'IDX_support_messages_senderId_createdAt',
        columnNames: ['senderId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'support_messages',
      new TableIndex({
        name: 'IDX_support_messages_isRead_createdAt',
        columnNames: ['isRead', 'createdAt'],
      }),
    );

    // Migrate existing support_requests to support_conversations
    const supportRequests = await queryRunner.query(`
      SELECT id, "userId", topic, message, status, "responseMessage", "answeredAt", "respondedByAdminId", "createdAt"
      FROM support_requests
      ORDER BY "createdAt" ASC
    `);

    for (const request of supportRequests) {
      // Create conversation
      const conversationStatus = request.status === 'answered' ? 'closed' : 'open';
      const lastMessageAt = request.answeredAt || request.createdAt;

      const [conversation] = await queryRunner.query(
        `
        INSERT INTO support_conversations ("id", "userId", topic, status, priority, "createdAt", "updatedAt", "lastMessageAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        `,
        [
          request.id, // Use same ID for easier tracking
          request.userId,
          request.topic,
          conversationStatus,
          'normal',
          request.createdAt,
          request.createdAt,
          lastMessageAt,
        ],
      );

      // Create first message from user
      await queryRunner.query(
        `
        INSERT INTO support_messages ("conversationId", "senderId", "senderRole", message, "isRead", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          conversation.id,
          request.userId,
          'USER',
          request.message,
          request.status === 'answered', // Mark as read if answered
          request.createdAt,
        ],
      );

      // Create admin reply message if exists
      if (request.responseMessage && request.respondedByAdminId) {
        await queryRunner.query(
          `
          INSERT INTO support_messages ("conversationId", "senderId", "senderRole", message, "isRead", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            conversation.id,
            request.respondedByAdminId,
            'ADMIN',
            request.responseMessage,
            false, // User might not have read it yet
            request.answeredAt || request.createdAt,
          ],
        );
      }
    }

    console.log(`Migrated ${supportRequests.length} support requests to conversations`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('support_messages', 'IDX_support_messages_isRead_createdAt');
    await queryRunner.dropIndex('support_messages', 'IDX_support_messages_senderId_createdAt');
    await queryRunner.dropIndex('support_messages', 'IDX_support_messages_conversationId_createdAt');
    await queryRunner.dropIndex(
      'support_conversations',
      'IDX_support_conversations_status_priority_lastMessageAt',
    );
    await queryRunner.dropIndex('support_conversations', 'IDX_support_conversations_userId_createdAt');

    // Drop foreign keys
    const supportMessagesTable = await queryRunner.getTable('support_messages');
    const supportConversationsTable = await queryRunner.getTable('support_conversations');

    if (supportMessagesTable) {
      const foreignKeys = supportMessagesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('support_messages', fk);
      }
    }

    if (supportConversationsTable) {
      const foreignKeys = supportConversationsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('support_conversations', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('support_messages');
    await queryRunner.dropTable('support_conversations');
  }
}
