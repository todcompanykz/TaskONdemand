import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add database-level constraint to prevent invalid status transitions
 * 
 * This constraint ensures that status can only be one of the valid enum values.
 * Actual transition validation is handled by TaskStateTransitionService.
 */
export class AddStatusConstraint1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure status column only accepts valid enum values
    // PostgreSQL enum constraint is already enforced by the enum type
    // But we add a check constraint for extra safety
    await queryRunner.query(`
      ALTER TABLE tasks
      ADD CONSTRAINT check_valid_status
      CHECK (status IN ('created', 'claimed', 'completed', 'cancelled', 'expired'))
    `);

    // Add index on status for faster filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status_created
      ON tasks(status, "createdAt")
      WHERE status = 'created'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tasks_status_created
    `);
    await queryRunner.query(`
      ALTER TABLE tasks
      DROP CONSTRAINT IF EXISTS check_valid_status
    `);
  }
}
