-- AlterTable
ALTER TABLE "music_settings" ADD COLUMN     "blindtestChannelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "blindtestDisabledCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "blindtest_playlists" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tracks" JSONB NOT NULL DEFAULT '[]',
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blindtest_playlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blindtest_playlists_guildId_name_key" ON "blindtest_playlists"("guildId", "name");

-- AddForeignKey
ALTER TABLE "blindtest_playlists" ADD CONSTRAINT "blindtest_playlists_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

