import { Service } from "typedi";
import { request } from "undici";
import { RecentTrack, RecentResponse } from "./types/RecentResponse.js";
import { Album, AlbumResponse } from "./types/AlbumResponse.js";
import { TimeSpan } from "./types/general.js";
import { ArtistResponse, Artist } from "./types/ArtistResponse.js";
import { getArtistImage } from "./LastUtil.js";
import { TopTrack, TopTracksResponse } from "./types/TopTracksResponse.js";

@Service("lc")
export class LastClient {
  async getRecentScrobbles(
    user: string,
    limit: number,
    page = 1,
    from?: Date,
    to?: Date,
  ): Promise<RecentResponse> {
    const fromUnix = from ? Math.floor(from.getTime() / 1000) : undefined;
    const toUnix = to ? Math.floor(to.getTime() / 1000) : undefined;

    const json = await request(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&extended=1&api_key=${process.env.LAST_KEY}&format=json&limit=${limit}&page=${page}&from=${fromUnix}&to=${toUnix}`,
    ).then((res) => res.body.json());

    return {
      // rome-ignore lint/suspicious/noExplicitAny: this mf definitely is an any
      tracks: json.recenttracks.track.map((track: any) => {
        track["nowplaying"] = (track["@attr"]?.nowplaying as boolean) ?? false;
        track["date"] = new Date(
          parseInt(track.date?.uts ?? Date.now() / 1000),
        ).getTime();
        // fix album
        track.album = track.album?.["#text"];

        // fix image
        track.image = track.image.at(-1)["#text"].replace("300x300/", "");

        return track as RecentTrack;
      }),
      total: json.recenttracks["@attr"].total,
      user: json.recenttracks["@attr"].user,
    };
  }

  async getTopAlbums(user: string, timespan: TimeSpan): Promise<AlbumResponse> {
    const json = await request(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${user}&api_key=${process.env.LAST_KEY}&format=json&limit=25&period=${timespan}`,
    ).then((res) => res.body.json());

    return {
      // rome-ignore lint/suspicious/noExplicitAny: <explanation>
      albums: json.topalbums.album.map((album: any) => {
        // fix rank
        album.rank = parseInt(album["@attr"].rank);
        // fix image
        album.image = album.image.at(-1)["#text"];
        return album as Album;
      }),
      meta: {
        user: json.topalbums["@attr"].user,
        total: json.topalbums["@attr"].total,
      },
    };
  }

  async getTopArtists(
    user: string,
    timespan: TimeSpan,
  ): Promise<ArtistResponse> {
    const json = await request(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${user}&api_key=${process.env.LAST_KEY}&format=json&limit=25&period=${timespan}`,
    ).then((res) => res.body.json());

    return {
      artists: await Promise.all(
        // rome-ignore lint/suspicious/noExplicitAny: <explanation>
        json.topartists.artist.map(async (artist: any) => {
          artist.rank = parseInt(artist["@attr"].rank);
          artist.image = await getArtistImage(artist.name);

          return artist as Artist;
        }),
      ),
      meta: {
        user: json.topartists["@attr"].user,
        total: json.topartists["@attr"].total,
      },
    };
  }

  async getTopTracks(
    last: string,
    timespan: TimeSpan,
  ): Promise<TopTracksResponse> {
    const url = `http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${last}&api_key=${process.env.LAST_KEY}&format=json&limit=1000&period=${timespan}`;

    let total = 1;
    let page = 1;

    const tracks: TopTrack[] = [];

    while (page <= total) {
      let json = await request(`${url}&page=${page}`).then((res) =>
        res.body.json(),
      );

      json = json.toptracks;

      if (page === 1) total = json["@attr"].totalPages;

      ++page;

      for (const track of json.track) {
        track["duration"] = parseInt(
          track.duration === "0" ? 200 : track.duration,
        );
        track["playcount"] = parseInt(track.playcount);
        track["image"] = track.image.at(-1)["#text"].replace("300x300/", "");

        tracks.push(track as TopTrack);
      }
    }

    return {
      tracks,
      meta: {
        user: last,
        total: tracks.length,
      },
    };
  }

  async getTrackDurations(last: string, timespan: TimeSpan) {
    const url = `http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${last}&api_key=${process.env.LAST_KEY}&format=json&limit=1000&period=${timespan}`;

    let total = 1;
    let page = 1;
    const durations = new Map<string, number>();

    while (page <= total) {
      let json = await request(`${url}&page=${page}`).then((res) =>
        res.body.json(),
      );

      json = json.toptracks;

      if (page === 1) total = json["@attr"].totalPages;

      ++page;

      for (const track of json.track) {
        const duration = parseInt(
          track.duration === "0" ? 200 : track.duration,
        );
        const artist = track.artist.name;
        const name = track.name;

        durations.set(`${artist}-${name}`, duration);
      }
    }
    return durations;
  }

  async getScrobblesSince(
    last: string,
    since: number,
  ): Promise<RecentResponse> {
    const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${last}&api_key=${
      process.env.LAST_KEY
    }&extended=1&format=json&limit=1000&from=${Math.floor(since / 1000)}`;

    let total = 1;
    let page = 1;
    const tracks: RecentTrack[] = [];

    while (page <= total) {
      let json = await request(`${url}&page=${page}`).then((res) =>
        res.body.json(),
      );

      json = json.recenttracks;

      if (page === 1) total = json["@attr"].totalPages;

      ++page;

      for (const track of json.track) {
        track["nowplaying"] = (track["@attr"]?.nowplaying as boolean) ?? false;
        track["date"] = new Date(
          parseInt(track.date?.uts ?? Date.now() / 1000),
        ).getTime();
        // fix album
        track.album = track.album?.["#text"];

        // fix image
        track.image = track.image.at(-1)["#text"].replace("300x300/", "");

        tracks.push(track as RecentTrack);
      }
    }

    return {
      tracks,
      total: tracks.length,
      user: last,
    };
  }
}
