import { request } from "undici";
import * as spotify from "spotify-info";
import { UnknownArtistArt } from "../lastfm/last-util/LastUtil.js";
import { Service } from "typedi";

@Service("sc")
export class SpotifyClient {
  private expiresAt: number = Date.now();
  private accessToken = "";

  async getRelatedArtists(
    artist: string,
  ): Promise<{ artist: SpotifyArtist; related: SpotifyArtist[] }> {
    const res = (await this.search(artist, "artist")) as spotify.ApiArtist;
    await this.refreshToken();

    const json = await request(
      `https://api.spotify.com/v1/artists/${res.id}/related-artists`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    ).then((res) => res.body.json());

    return {
      artist: {
        name: res.name,
        url: res.url,
        image: res.images[0].url,
        genres: res.genres,
        followers: res.followers,
      },
      related: json.artists.map(
        // rome-ignore lint/suspicious/noExplicitAny: not gonna type json
        (artist: any) =>
          ({
            name: artist.name,
            url: artist.external_urls.spotify,
            genres: artist.genres,
            image: artist.images[0].url ?? UnknownArtistArt,
            followers: artist.followers.total,
          }) as SpotifyArtist,
      ),
    };
  }

  private async search(query: string, type: "track" | "album" | "artist") {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET)
      throw new Error("Spotify credentials not found.");
    spotify.setApiCredentials(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET,
    );

    const results = await spotify.search(query, {
      type: [type],
    });

    if (!results) throw new Error("No results found.");

    switch (type) {
      case "track":
        return results.tracks.items[0];
      case "album":
        return results.albums.items[0];
      case "artist":
        return results.artists.items[0];
      default:
        return results.tracks.items[0];
    }
  }

  private async refreshToken() {
    if (this.expiresAt > Date.now()) return;

    const json = await request("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    }).then((res) => res.body.json());

    this.expiresAt = Date.now() + json.expires_in * 1000;
    this.accessToken = json.access_token;
  }
}

export interface SpotifyArtist {
  name: string;
  url: string;
  genres: string[];
  image: string;
  followers: number;
}
