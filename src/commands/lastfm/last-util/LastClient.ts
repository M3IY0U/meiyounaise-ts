import { Service } from "typedi";
import { request } from "undici";
import { LastTrack, RecentResponse } from "./types/RecentResponse.js";
import { Album, AlbumResponse } from "./types/AlbumResponse.js";
import { TimeSpan } from "./types/general.js";

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

    const res = await request(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&extended=1&api_key=${process.env.LAST_KEY}&format=json&limit=${limit}&page=${page}&from=${fromUnix}&to=${toUnix}`,
    );

    const json = await res.body.json();

    return {
      // rome-ignore lint/suspicious/noExplicitAny: this mf definitely is an any
      tracks: json.recenttracks.track.map((track: any) => {
        track["nowplaying"] = (track["@attr"]?.nowplaying as boolean) ?? false;
        track["date"] = new Date(
          parseInt(track.date?.uts ?? Date.now() / 1000),
        ).getTime();
        // fix album
        track.album = {
          mbid: track.album?.mbid,
          name: track.album?.["#text"],
        };
        // fix image
        track.image = track.image.at(-1)["#text"].replace("300x300/", "");

        return track as LastTrack;
      }),
      total: json.recenttracks["@attr"].total,
      user: json.recenttracks["@attr"].user,
    };
  }

  async getTopAlbums(user: string, timespan: TimeSpan): Promise<AlbumResponse> {
    const res = await request(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${user}&api_key=${process.env.LAST_KEY}&format=json&limit=25&period=${timespan}`,
    );

    const json = await res.body.json();

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

  async getTrackDurations(last: string) {
    const url = `http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${last}&api_key=${process.env.LAST_KEY}&format=json&limit=1000&period=7day`;

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
}
