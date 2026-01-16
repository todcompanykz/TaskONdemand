import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "phoneNumber" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create tasks table with PostGIS geometry
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shortDescription" character varying NOT NULL,
        "fullDescription" text NOT NULL,
        "reward" integer NOT NULL,
        "geoPoint" geometry(Point,4326) NOT NULL,
        "urgency" character varying NOT NULL DEFAULT 'medium',
        "status" character varying NOT NULL DEFAULT 'created',
        "createdById" uuid,
        "claimedById" uuid,
        "customerConfirmed" boolean NOT NULL DEFAULT false,
        "executorConfirmed" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP,
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_createdById" ON "tasks" ("createdById")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_claimedById" ON "tasks" ("claimedById")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_expiresAt" ON "tasks" ("expiresAt")
    `);

    // Create spatial index for geoPoint
    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_geoPoint" ON "tasks" USING GIST ("geoPoint")
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_createdBy"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_claimedBy"
      FOREIGN KEY ("claimedById") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_claimedBy"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_createdBy"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_geoPoint"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_expiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_status"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_claimedById"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_createdById"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS postgis`);
  }
}
