import { UnknownAlbumArt } from "../../lastfm/last-util/LastUtil.js";
import { Discography, Scores, SearchType } from "./AOTY.types.js";
import { BaseScraper } from "./BaseScraper.js";

export class ArtistDiscographyScraper extends BaseScraper {
  static async getDiscography(artist: string): Promise<Discography | null> {
    const res = await this.search(artist, SearchType.Artist);

    if (res.length === 0) {
      return null;
    }

    const [artistUrl, artistName] = [res[0].url, res[0].name];

    const artistDom = await this.scrapeAndParse(`${artistUrl}?type=all`);

    const artistScores: Scores = {
      critic: {
        score:
          artistDom.querySelector(".artistCriticScoreBox")?.childNodes[1]
            .textContent || "NR",
        ratings: parseInt(
          artistDom
            .querySelector(".artistCriticScoreBox")
            ?.querySelector(".text strong")
            ?.textContent.replace(/[.,\s]/g, "") ?? "0",
        ),
      },
      user: {
        score:
          artistDom.querySelector(".artistUserScoreBox")?.childNodes[1]
            .textContent || "NR",
        ratings: parseInt(
          artistDom
            .querySelector(".artistUserScoreBox")
            ?.querySelector(".text strong")
            ?.textContent.replace(/[.,\s]/g, "") ?? "0",
        ),
      },
    };

    const entries = artistDom.querySelectorAll(".albumBlock");

    const albums = entries.map((entry) => {
      const type = entry.querySelector(".type")?.textContent ?? "Unknown";
      const albumName =
        entry.querySelector(".albumTitle")?.textContent ?? "Unknown";
      const albumUrl =
        `${this.baseUrl}${(
          entry.childNodes[2] as unknown as HTMLElement
        ).getAttribute("href")}` ?? "404";
      const albumYear = entry.firstChild.rawText;
      const albumRating = entry.querySelectorAll(".ratingRow").map(
        (t) =>
          `${this.scoreToEmoji(
            parseInt(t.firstChild.textContent),
          )} ${t.childNodes
            .slice(1)
            .map((n) => n.textContent.replace(")", " ratings)"))
            .filter((t) => t.trim())
            .join(" ")}`,
      );

      return {
        type,
        albumName,
        albumUrl,
        albumYear,
        albumRating,
      };
    });

    return {
      artist: {
        name: artistName,
        url: artistUrl,
        scores: artistScores,
      },
      albums,
    };
  }
}
