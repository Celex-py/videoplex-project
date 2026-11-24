CREATE TABLE "LibraryContent" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "posterUrl" TEXT,
  "videoUrl" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Movies',
  "releaseYear" INTEGER,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "visibility" "Visibility" NOT NULL DEFAULT 'UNLISTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LibraryContent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LibraryContent_visibility_category_idx" ON "LibraryContent"("visibility", "category");
CREATE INDEX "LibraryContent_createdAt_idx" ON "LibraryContent"("createdAt");
