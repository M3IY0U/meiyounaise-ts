import { BaseScraper } from "./BaseScraper.js";

export class SearchScraper extends BaseScraper {
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

export interface SearchResult {
  type: SearchType;
  name: string;
  url: string;
  artist?: string;
}

export enum SearchType {
  Artist = "artist",
  Album = "album",
}
