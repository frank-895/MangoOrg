/*
  Warnings:

  - The values [OPEN,IN_PROGRESS,CLOSED] on the enum `CaseStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `humidity` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `image_link` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `records` table. All the data in the column will be lost.
  - Added the required column `number_of_trees_checked` to the `records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number_of_trees_infected` to the `records` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PlantPart" AS ENUM ('LEAF', 'STEM', 'FRUIT');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."CaseStatus_new" AS ENUM ('ACTIVE', 'RESOLVED');
ALTER TABLE "public"."cases" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."cases" ALTER COLUMN "status" TYPE "public"."CaseStatus_new" USING ("status"::text::"public"."CaseStatus_new");
ALTER TYPE "public"."CaseStatus" RENAME TO "CaseStatus_old";
ALTER TYPE "public"."CaseStatus_new" RENAME TO "CaseStatus";
DROP TYPE "public"."CaseStatus_old";
ALTER TABLE "public"."cases" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."cases" DROP CONSTRAINT "cases_disease_id_fkey";

-- AlterTable
ALTER TABLE "public"."cases" DROP COLUMN "description",
DROP COLUMN "severity",
DROP COLUMN "title",
DROP COLUMN "user_id",
ADD COLUMN     "part_of_plant" "public"."PlantPart",
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "orchard_id" DROP NOT NULL,
ALTER COLUMN "disease_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."records" DROP COLUMN "humidity",
DROP COLUMN "image_link",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "notes",
DROP COLUMN "temperature",
DROP COLUMN "user_id",
ADD COLUMN     "number_of_trees_checked" INTEGER NOT NULL,
ADD COLUMN     "number_of_trees_infected" INTEGER NOT NULL,
ADD COLUMN     "orchard_id" TEXT,
ADD COLUMN     "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "case_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."records" ADD CONSTRAINT "records_orchard_id_fkey" FOREIGN KEY ("orchard_id") REFERENCES "public"."orchards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
