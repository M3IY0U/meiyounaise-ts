-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_boards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
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
