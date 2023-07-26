import { Artist, Scores } from "./AOTY.types.js";
import { BaseScraper } from "./BaseScraper.js";
import { ScrapeSearch, SearchType } from "./ScrapeSearch.js";

export class ArtistInfo extends BaseScraper {
  static async getArtistInfo(artist: string): Promise<Artist | null> {
    const res = await ScrapeSearch.search(artist, SearchType.Artist);

    if (res.length === 0) {
      return null;
    }

    const [artistUrl, artistName] = [res[0].url, res[0].name];

    const artistDom = await this.scrapeAndParse(artistUrl);

    const artistScores: Scores = {
      critic: {
        score: this.scoreToEmoji(
          parseInt(
            artistDom.querySelector(".artistCriticScoreBox")?.childNodes[1]
              .textContent || "-1",
          ),
        ),
        ratings: parseInt(
          artistDom
            .querySelector(".artistCriticScoreBox")
            ?.querySelector(".text strong")
            ?.textContent.replace(/[.,\s]/g, "") ?? "0",
        ),
      },
      user: {
        score: this.scoreToEmoji(
          parseInt(
            artistDom.querySelector(".artistUserScoreBox")?.childNodes[1]
              .textContent || "-1",
          ),
        ),
        ratings: parseInt(
          artistDom
            .querySelector(".artistUserScoreBox")
            ?.querySelector(".text strong")
            ?.textContent.replace(/[.,\s]/g, "") ?? "0",
        ),
      },
    };

    const followers = parseInt(
      artistDom.querySelector(".followCount")?.textContent?.split(" ")[0] ??
        "0",
    );

    const detailsRaw = artistDom.querySelectorAll(".detailRow").map((e) =>
      e.childNodes
        .map((d) => d.textContent)
        .filter((t) => !t.includes("Tags"))
        .join("")
        .split("/"),
    );

    const details =
      detailsRaw.length <= 1
        ? undefined
        : detailsRaw
            .filter((t) => t.length > 1)
            .map((d) => ({
              title: d[1],
              content: d[0],
            }));

    const tags = artistDom
      .querySelectorAll(".tag")
      .map((e) => e.textContent)
      .filter((t) => !t.includes("add tag"));

    return {
      artist: { name: artistName, url: artistUrl, scores: artistScores },
      followers,
      details,
      tags,
    };
  }
}
