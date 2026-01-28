import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleAndPermissionsToUser1700000007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for user role
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add role column
    const roleColumn = new TableColumn({
      name: 'role',
      type: 'enum',
      enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      default: "'USER'",
    });
    await queryRunner.addColumn('users', roleColumn);

    // Add permissions column
    const permissionsColumn = new TableColumn({
      name: 'permissions',
      type: 'jsonb',
      default: "'[]'",
    });
    await queryRunner.addColumn('users', permissionsColumn);

    // Migrate existing admins to SUPER_ADMIN
    // List of admin emails from old AdminGuard
    const adminEmails = [
      'admin@tod.kz',
      'admin@example.com',
    ];

    // Update existing admins
    if (adminEmails.length > 0) {
      const emailList = adminEmails.map(email => `'${email.toLowerCase()}'`).join(',');
      await queryRunner.query(`
        UPDATE "users"
        SET "role" = 'SUPER_ADMIN'
        WHERE LOWER("email") IN (${emailList})
      `);
    }

    // Also update users with email containing '@admin.' or starting with 'admin@'
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'SUPER_ADMIN'
      WHERE (
        LOWER("email") LIKE '%@admin.%' 
        OR LOWER("email") LIKE 'admin@%'
      )
      AND "role" = 'USER'
    `);
    
    // Note: SUPER_ADMIN_EMAIL from environment should be set manually
    // or through a separate migration script if needed
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'permissions');
    await queryRunner.dropColumn('users', 'role');
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
