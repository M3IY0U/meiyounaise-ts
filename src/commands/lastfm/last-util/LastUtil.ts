import { TimeSpan } from "./types/general.js";

export const UnknownAlbumArt =
  "https://lastfm.freetls.fastly.net/i/u/c6f59c1e5e7240a4c0d427abd71f3dbb";

export const cleanLastUrl = (url: string) =>
  url
    .replaceAll(" ", "+")
    .replaceAll("(", "%28")
    .replaceAll(")", "%29")
    .replaceAll("　", "%E3%80%80");

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
      throw new Error(
        "Invalid timespan.\nAvailable timespans: week, month, quarter, half(year), year, (over)all",
      );
  }
};
