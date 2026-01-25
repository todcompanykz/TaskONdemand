-- Migration: Add missing columns to users table
-- Add fcmToken column
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fcmToken" TEXT;

-- Add firstName column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='firstName') THEN
        ALTER TABLE users ADD COLUMN "firstName" VARCHAR(100);
        UPDATE users SET "firstName" = '' WHERE "firstName" IS NULL;
        ALTER TABLE users ALTER COLUMN "firstName" SET NOT NULL;
        ALTER TABLE users ALTER COLUMN "firstName" SET DEFAULT '';
    END IF;
END $$;

-- Add lastName column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastName') THEN
        ALTER TABLE users ADD COLUMN "lastName" VARCHAR(100);
        UPDATE users SET "lastName" = '' WHERE "lastName" IS NULL;
        ALTER TABLE users ALTER COLUMN "lastName" SET NOT NULL;
        ALTER TABLE users ALTER COLUMN "lastName" SET DEFAULT '';
    END IF;
END $$;

-- Add ratingAvg column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ratingAvg') THEN
        ALTER TABLE users ADD COLUMN "ratingAvg" DECIMAL(3,2) DEFAULT 0.00;
        ALTER TABLE users ALTER COLUMN "ratingAvg" SET NOT NULL;
        ALTER TABLE users ALTER COLUMN "ratingAvg" SET DEFAULT 0.00;
    END IF;
END $$;

-- Add ratingCount column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ratingCount') THEN
        ALTER TABLE users ADD COLUMN "ratingCount" INTEGER DEFAULT 0;
        ALTER TABLE users ALTER COLUMN "ratingCount" SET NOT NULL;
        ALTER TABLE users ALTER COLUMN "ratingCount" SET DEFAULT 0;
    END IF;
END $$;

-- Add isRestricted column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='isRestricted') THEN
        ALTER TABLE users ADD COLUMN "isRestricted" BOOLEAN DEFAULT false;
        ALTER TABLE users ALTER COLUMN "isRestricted" SET NOT NULL;
        ALTER TABLE users ALTER COLUMN "isRestricted" SET DEFAULT false;
    END IF;
END $$;
