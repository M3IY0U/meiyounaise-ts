import cloudscraper from "cloudscraper";
import { Logger } from "../../../util/Logger.js";
import { CommandError } from "../../../util/general.js";
import { TimeSpan } from "./types/general.js";
import { parse } from "node-html-parser";
import { request } from "undici";

export const UnknownAlbumArt =
  "https://lastfm.freetls.fastly.net/i/u/c6f59c1e5e7240a4c0d427abd71f3dbb";

export const UnknownArtistArt =
  "https://lastfm.freetls.fastly.net/i/u/2a96cbd8b46e442fc41c2b86b821562f.jpg";

export const parseTimeSpan = (timespan: string | undefined) => {
  switch (timespan) {
    case "7day":
    case "week":
      return TimeSpan.Week;
    case "1month":
    case "month":
      return TimeSpan.Month;
    case "3month":
    case "quarter":
      return TimeSpan.Quarter;
    case "6month":
    case "half":
    case "halfyear":
      return TimeSpan.HalfYear;
    case "12month":
    case "year":
      return TimeSpan.Year;
    case "overall":
    case "all":
    case "alltime":
    case "":
    case undefined:
      return TimeSpan.All;
    default:
      throw new CommandError(
        "Invalid timespan.\nAvailable timespans: week, month, quarter, half(year), year, (over)all",
      );
  }
};

export const getLastArtistImage = async (artist: string) => {
  try {
    const text = await (
      await request(`https://www.last.fm/music/${encodeURIComponent(artist)}`)
    ).body.text();

    const html = parse(text, {
      blockTextElements: {
        script: true,
        noscript: true,
        style: true,
        pre: true,
      },
    });

    const image = html
      .querySelector("[property='og:image']")
      ?.getAttribute("content");

    return image ?? UnknownArtistArt;
  } catch (e) {
    Logger.error(e);
    return UnknownArtistArt;
  }
};
