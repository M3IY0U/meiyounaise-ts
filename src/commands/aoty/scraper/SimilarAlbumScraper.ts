import { UnknownAlbumArt } from "../../lastfm/last-util/LastUtil.js";
import { SearchType, SimilarAlbum } from "./AOTY.types.js";
import { BaseScraper } from "./BaseScraper.js";
import { getOpenGraphImage } from "../../../util/general.js";

export class SimilarAlbumScraper extends BaseScraper {
  static async getSimilarAlbums(album: string): Promise<{
    album: { name: string; url: string; cover: string };
    similar: SimilarAlbum[];
  } | null> {
    const res = await this.search(album, SearchType.Album);

    if (res.length === 0) {
      return null;
    }

    const [name, url] = [res[0].name, res[0].url.replace(".php", "/")];

    const dom = await this.scrapeAndParse(`${url}similar/`);

    let cover = dom
      .querySelector(".albumHeaderCover a img")
      ?.getAttribute("data-src");

    if (!cover) cover = await getOpenGraphImage(url);
    if (!cover) cover = UnknownAlbumArt;

    const similar = dom
      .querySelectorAll(".albumBlock")
      .map((d) => d.querySelectorAll(".albumTitle,.artistTitle,.date"))
      .map((a) => {
        return {
          date: a[0].textContent,
          artist: {
            name: a[1].textContent,
            url:
              this.baseUrl + (a[1].parentNode.getAttribute("href") ?? "/404"),
          },
          album: {
            name: a[2].textContent,
            url:
              this.baseUrl + (a[2].parentNode.getAttribute("href") ?? "/404"),
          },
        };
      });

    return {
      album: { name, url, cover },
      similar,
    };
  }
}
