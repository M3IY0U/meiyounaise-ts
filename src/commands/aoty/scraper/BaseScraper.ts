import { SearchResult, SearchType } from "./AOTY.types";
import cloudscraper from "cloudscraper";
import { parse } from "node-html-parser";

export abstract class BaseScraper {
  static baseUrl = "https://www.albumoftheyear.org";

  protected static scrapeAndParse = async (url: string) => {
    const html = await cloudscraper(encodeURI(url.replaceAll(" ", "+")));
    return this.parseBlock(html);
  };

  private static parseBlock = (text: string) =>
    parse(text, {
      blockTextElements: {
        script: true,
        noscript: true,
        style: true,
        pre: true,
      },
    });

  protected static scoreToEmoji = (score: number) => {
    if (Number.isNaN(score)) return "❔";

    if (score >= 70) return `🟢 ${score}`;
    else if (score >= 50) return `🟡 ${score}`;
    else return `🔴 ${score}`;
  };

  static async search(query: string, type: SearchType) {
    const searchHtml = await this.scrapeAndParse(
      `${this.baseUrl}/search/${type.toString()}s/?q=${query}`,
    );

    const elements = searchHtml.querySelectorAll(`.${type.toString()}Block`);

    const results: SearchResult[] = [];

    if (type === SearchType.Artist) {
      for (const element of elements) {
        const name = element.lastChild.textContent;
        const href =
          (element.firstChild as unknown as HTMLElement)
            .querySelector("a")
            ?.getAttribute("href") ?? "/404";

        results.push({ type, name, url: this.baseUrl + href });
      }
    } else if (type === SearchType.Album) {
      for (const element of elements) {
        const name = element.querySelector(".albumTitle")?.textContent ?? query;
        const href =
          element
            .querySelector(".albumTitle")
            ?.parentNode.getAttribute("href") ?? "404";
        const artist = element.querySelector(".artistTitle")?.textContent;

        results.push({ type, name, url: this.baseUrl + href, artist });
      }
    }

    return results;
  }
}
