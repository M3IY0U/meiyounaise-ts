import { SearchType, SimilarArtist } from "./AOTY.types.js";
import { BaseScraper } from "./BaseScraper.js";

export class SimilarArtistScraper extends BaseScraper {
  static async getSimilarArtists(artist: string): Promise<{
    artist: SimilarArtist;
    similarArtists: SimilarArtist[];
  } | null> {
    const res = await this.search(artist, SearchType.Artist);

    if (res.length === 0) {
      return null;
    }

    const [name, url] = [res[0].name, res[0].url];

    const artistDom = await this.scrapeAndParse(`${url}similar/`);

    const similarArtists = artistDom
      .querySelectorAll(".artistBlock .name a")
      .map((d) => {
        return {
          name: d.textContent,
          url: this.baseUrl + d.getAttribute("href"),
        };
      });

    return { artist: { name, url }, similarArtists };
  }
}
