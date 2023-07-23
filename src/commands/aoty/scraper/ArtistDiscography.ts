import { UnknownAlbumArt } from "../../lastfm/last-util/LastUtil.js";
import { BaseScraper } from "../scraper/BaseScraper.js";
import { ScrapeSearch, SearchType } from "../scraper/Search.js";
import { Discography, Scores } from "./AOTY.types.js";

export class ArtistDiscography extends BaseScraper {
  static async getDiscography(artist: string): Promise<Discography> {
    const res = await ScrapeSearch.search(artist, SearchType.Artist);

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
            ?.querySelector(".text strong")?.textContent ?? "0",
        ),
      },
      user: {
        score:
          artistDom.querySelector(".artistUserScoreBox")?.childNodes[1]
            .textContent || "NR",
        ratings: parseInt(
          artistDom
            .querySelector(".artistUserScoreBox")
            ?.querySelector(".text strong")?.textContent ?? "0",
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
      const albumCover =
        entry.querySelector("img")?.getAttribute("data-src") ?? UnknownAlbumArt;
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
        albumCover,
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
