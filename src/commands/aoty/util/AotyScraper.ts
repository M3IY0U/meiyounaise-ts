import { parse } from "node-html-parser";
import cloudscraper from "cloudscraper";
import { UnknownAlbumArt } from "../../lastfm/last-util/LastUtil.js";

export class AotyScraper {
  static baseUrl = "https://www.albumoftheyear.org";
  static async getAotyArtist(artist: string) {
    const searchHtml = await cloudscraper(
      encodeURI(`${this.baseUrl}/search/?q=${artist}`.replaceAll(" ", "+")),
    );

    const searchDom = this.parseBlock(searchHtml);

    const artistUrl = searchDom
      .querySelector(".artistBlock")
      ?.querySelector("a")
      ?.getAttribute("href");

    const artistName =
      searchDom.querySelector(".artistBlock")?.querySelector(".name")
        ?.textContent ?? artist;

    if (!artistUrl) throw new Error("Artist not found.");

    const artistHtml = await cloudscraper(
      `${this.baseUrl}${artistUrl}?type=all`,
    );

    const artistDom = this.parseBlock(artistHtml);

    const artistScores = [
      // rome-ignore lint/style/noNonNullAssertion: we will simply explode
      ...artistDom.querySelector(".artistTopBox")!.childNodes,
    ]
      .slice(0, 2)
      .filter((d) => d.childNodes[1].textContent !== "NR")
      .map(
        (d) =>
          `${d.childNodes[0].textContent}: ${d.childNodes[1].textContent}, ${d.childNodes[2].textContent}`,
      )
      .join(" | ");

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
          `${this.scoreToEmoji(parseInt(t.firstChild.textContent))} ${
            t.firstChild.textContent
          } ${t.childNodes
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
        url: `https://www.albumoftheyear.org${artistUrl}`,
        scores: artistScores,
      },
      albums,
    };
  }

  private static parseBlock = (text: string) =>
    parse(text, {
      blockTextElements: {
        script: true,
        noscript: true,
        style: true,
        pre: true,
      },
    });

  private static scoreToEmoji = (score: number) => {
    if (score >= 70) return "🟩";
    else if (score >= 50) return "🟨";
    else return "🟥";
  };
}
