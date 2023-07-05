-- CreateTable
CREATE TABLE "boards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guild_id" DECIMAL NOT NULL,
    "channel_id" DECIMAL NOT NULL,
    "threshold" INTEGER NOT NULL,
    "banned_channels" TEXT
);

-- CreateTable
CREATE TABLE "guilds" (
    "id" DECIMAL NOT NULL PRIMARY KEY,
    "join_msg" TEXT,
    "leave_msg" TEXT,
    "join_chn" TEXT,
    "leave_chn" TEXT,
    "repeat_msg" INTEGER
);

-- CreateTable
CREATE TABLE "users" (
    "id" DECIMAL NOT NULL PRIMARY KEY,
    "lastfm" TEXT
);

