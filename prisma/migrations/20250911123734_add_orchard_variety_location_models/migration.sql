-- CreateEnum
CREATE TYPE "public"."Hemisphere" AS ENUM ('NORTH', 'SOUTH');

-- CreateTable
CREATE TABLE "public"."varieties" (
    "id" TEXT NOT NULL,
    "variety_name" TEXT NOT NULL,
    "variety_susceptability" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "varieties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "hemisphere" "public"."Hemisphere" NOT NULL DEFAULT 'SOUTH',
    "location_susceptability" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orchards" (
    "id" TEXT NOT NULL,
    "orchard_name" TEXT NOT NULL,
    "no_trees_row" INTEGER NOT NULL,
    "no_trees_column" INTEGER NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "user_id" TEXT NOT NULL,
    "variety_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orchards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."orchards" ADD CONSTRAINT "orchards_variety_id_fkey" FOREIGN KEY ("variety_id") REFERENCES "public"."varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orchards" ADD CONSTRAINT "orchards_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
