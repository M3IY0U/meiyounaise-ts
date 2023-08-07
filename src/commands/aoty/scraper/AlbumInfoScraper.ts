import { getOpenGraphImage } from "../../../util/general.js";
import { UnknownAlbumArt } from "../../lastfm/last-util/LastUtil.js";
import { Album, SearchType } from "./AOTY.types.js";
import { BaseScraper } from "./BaseScraper.js";

export class AlbumInfoScraper extends BaseScraper {
  static async getAlbumInfo(album: string): Promise<Album | null> {
    const res = await this.search(album, SearchType.Album);

    if (res.length === 0) {
      return null;
    }

    const [url, name] = [res[0].url, res[0].name];

    const albumDom = await this.scrapeAndParse(url);

    const artist =
      albumDom.querySelector(".artist a")?.textContent ?? "Unknown";

    let cover = albumDom.querySelector(".cover img")?.getAttribute("src");
    if (!cover) cover = await getOpenGraphImage(url);
    if (!cover) cover = UnknownAlbumArt;

    const ratings = {
      critic: {
        score: this.scoreToEmoji(
          parseInt(
            albumDom.querySelector(".albumCriticScore")?.textContent || "-1",
          ),
        ),
        ratings: parseInt(
          albumDom
            .querySelector(".albumCriticScoreBox .text.numReviews strong")
            ?.textContent.replace(/[.,\s]/g, "") ?? "0",
        ),
      },
      user: {
        score: this.scoreToEmoji(
          parseInt(
            albumDom.querySelector(".albumUserScore")?.textContent || "-1",
          ),
        ),
        ratings: parseInt(
          albumDom
            .querySelector(".albumUserScoreBox .text.numReviews strong")
            ?.textContent.replace(/[.,\s]/g, "") ?? "0",
        ),
      },
    };

    const tags = albumDom
      .querySelectorAll(".tag.strong")
      .map((e) => e.textContent);

    const detailsRaw = albumDom
      .querySelectorAll(".detailRow")
      .map((d) =>
        d.childNodes
          .map((d) => d.textContent)
          .filter((t) => !t.includes("Tags"))
          .join("")
          .split("/"),
      )
      .map((a) => a.map((a) => a.trim().replace(/ +/g, " ")))
      .filter((a) => a[0] !== "-" && a.length > 1);

    const details =
      detailsRaw.length <= 1
        ? undefined
        : detailsRaw.map((d) => ({
            title: d[1],
            content: d[0],
          }));

    let tracks: string[] | undefined;

    // check for the table variant first (best one)
    tracks = albumDom
      .querySelectorAll(".trackTitle a")
      .map((t) => t.textContent);

    if (tracks.length === 0) {
      // check for the list variant
      tracks = albumDom
        .querySelectorAll(".trackList li")
        .map((t) => t.textContent);
    }

    // if it's still empty, rip
    if (tracks.length === 0) {
      tracks = undefined;
    }
    
    const mustHear = albumDom.querySelector(".mustHearButton") !== null;

    return {
      name,
      url,
      artist,
      cover,
      details,
      tags,
      mustHear,
      scores: ratings,
      tracks,
    };
  }
}
