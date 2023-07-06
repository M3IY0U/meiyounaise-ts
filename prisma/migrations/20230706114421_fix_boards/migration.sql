/*
  Warnings:

  - You are about to alter the column `channel_id` on the `boards` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.
  - You are about to alter the column `guild_id` on the `boards` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_boards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guild_id" INTEGER NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "banned_channels" TEXT
);
INSERT INTO "new_boards" ("banned_channels", "channel_id", "guild_id", "id", "threshold") SELECT "banned_channels", "channel_id", "guild_id", "id", "threshold" FROM "boards";
DROP TABLE "boards";
ALTER TABLE "new_boards" RENAME TO "boards";
CREATE UNIQUE INDEX "boards_guild_id_key" ON "boards"("guild_id");
CREATE UNIQUE INDEX "boards_channel_id_key" ON "boards"("channel_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
