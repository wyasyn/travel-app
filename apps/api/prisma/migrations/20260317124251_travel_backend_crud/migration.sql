-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('ALL', 'FLIGHT', 'HOTEL', 'EXPERIENCE');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('HERO', 'GALLERY', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "DestinationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" TEXT DEFAULT 'user';

-- CreateTable
CREATE TABLE "destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Uganda',
    "region" TEXT NOT NULL,
    "district" TEXT,
    "shortLocation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heroImageUrl" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "durationHoursMin" INTEGER,
    "durationHoursMax" INTEGER,
    "distanceKm" DOUBLE PRECISION,
    "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "status" "DestinationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_image" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "type" "ImageType" NOT NULL DEFAULT 'GALLERY',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_package" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "type" "PackageType" NOT NULL DEFAULT 'EXPERIENCE',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "priceFrom" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "durationDays" INTEGER,
    "durationNights" INTEGER,
    "includes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_route_stop" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_route_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_destination" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destination_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_view" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "userId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destination_slug_key" ON "destination"("slug");

-- CreateIndex
CREATE INDEX "destination_country_region_idx" ON "destination"("country", "region");

-- CreateIndex
CREATE INDEX "destination_status_isFeatured_isPopular_idx" ON "destination"("status", "isFeatured", "isPopular");

-- CreateIndex
CREATE INDEX "destination_image_destinationId_type_sortOrder_idx" ON "destination_image"("destinationId", "type", "sortOrder");

-- CreateIndex
CREATE INDEX "travel_package_destinationId_type_isActive_idx" ON "travel_package"("destinationId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "destination_route_stop_destinationId_stopOrder_key" ON "destination_route_stop"("destinationId", "stopOrder");

-- CreateIndex
CREATE INDEX "favorite_destination_destinationId_idx" ON "favorite_destination"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_destination_userId_destinationId_key" ON "favorite_destination"("userId", "destinationId");

-- CreateIndex
CREATE INDEX "destination_like_destinationId_idx" ON "destination_like"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "destination_like_userId_destinationId_key" ON "destination_like"("userId", "destinationId");

-- CreateIndex
CREATE INDEX "destination_review_destinationId_rating_idx" ON "destination_review"("destinationId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "destination_review_userId_destinationId_key" ON "destination_review"("userId", "destinationId");

-- CreateIndex
CREATE INDEX "destination_view_destinationId_viewedAt_idx" ON "destination_view"("destinationId", "viewedAt");

-- CreateIndex
CREATE INDEX "destination_view_userId_viewedAt_idx" ON "destination_view"("userId", "viewedAt");

-- AddForeignKey
ALTER TABLE "destination" ADD CONSTRAINT "destination_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination" ADD CONSTRAINT "destination_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_image" ADD CONSTRAINT "destination_image_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_package" ADD CONSTRAINT "travel_package_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_route_stop" ADD CONSTRAINT "destination_route_stop_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_destination" ADD CONSTRAINT "favorite_destination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_destination" ADD CONSTRAINT "favorite_destination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_like" ADD CONSTRAINT "destination_like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_like" ADD CONSTRAINT "destination_like_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_review" ADD CONSTRAINT "destination_review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_review" ADD CONSTRAINT "destination_review_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_view" ADD CONSTRAINT "destination_view_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_view" ADD CONSTRAINT "destination_view_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
