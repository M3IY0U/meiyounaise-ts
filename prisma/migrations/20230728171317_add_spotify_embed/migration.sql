-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guilds" (
    "id" DECIMAL NOT NULL PRIMARY KEY,
    "join_msg" TEXT NOT NULL DEFAULT '',
    "leave_msg" TEXT NOT NULL DEFAULT '',
    "join_chn" TEXT NOT NULL DEFAULT '',
    "leave_chn" TEXT NOT NULL DEFAULT '',
    "repeat_msg" INTEGER NOT NULL DEFAULT 0,
    "embed_spotify" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_guilds" ("id", "join_chn", "join_msg", "leave_chn", "leave_msg", "repeat_msg") SELECT "id", "join_chn", "join_msg", "leave_chn", "leave_msg", "repeat_msg" FROM "guilds";
DROP TABLE "guilds";
ALTER TABLE "new_guilds" RENAME TO "guilds";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
