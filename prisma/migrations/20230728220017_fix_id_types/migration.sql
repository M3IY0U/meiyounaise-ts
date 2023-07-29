/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `guilds` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastfm" TEXT
);
INSERT INTO "new_users" ("id", "lastfm") SELECT "id", "lastfm" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE TABLE "new_guilds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "join_msg" TEXT NOT NULL DEFAULT '',
    "leave_msg" TEXT NOT NULL DEFAULT '',
    "join_chn" TEXT NOT NULL DEFAULT '',
    "leave_chn" TEXT NOT NULL DEFAULT '',
    "repeat_msg" INTEGER NOT NULL DEFAULT 0,
    "embed_spotify" BOOLEAN NOT NULL DEFAULT false,
    "embed_anilist" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_guilds" ("embed_anilist", "embed_spotify", "id", "join_chn", "join_msg", "leave_chn", "leave_msg", "repeat_msg") SELECT "embed_anilist", "embed_spotify", "id", "join_chn", "join_msg", "leave_chn", "leave_msg", "repeat_msg" FROM "guilds";
DROP TABLE "guilds";
ALTER TABLE "new_guilds" RENAME TO "guilds";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
