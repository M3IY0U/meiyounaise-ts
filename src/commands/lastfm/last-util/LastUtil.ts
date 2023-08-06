import { CommandError } from "../../../util/general.js";
import { TimeSpan } from "./types/general.js";
import ogs from "open-graph-scraper";

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
  const { result } = await ogs({
    url: encodeURI(`https://www.last.fm/music/${encodeURIComponent(artist)}`),
  });
  if (!result?.ogImage) return UnknownArtistArt;
  return result.ogImage[0].url ?? UnknownArtistArt;
};
