-- CreateEnum
CREATE TYPE "public"."DiseaseType" AS ENUM ('DISEASE', 'PEST');

-- CreateTable
CREATE TABLE "public"."diseases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."DiseaseType" NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 0,
    "spreadability" INTEGER NOT NULL DEFAULT 0,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "controlMethod" TEXT NOT NULL,
    "imageLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diseases_name_key" ON "public"."diseases"("name");
