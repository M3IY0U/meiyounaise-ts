import { Service } from "typedi";
import { request } from "undici";
import { LastTrack, RecentResponse } from "./LastTypes.js";

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
        );
        // fix album
        track.album = {
          mbid: track.album?.mbid,
          name: track.album?.["#text"],
        };
        // fix image
        track.image = track.image.map(
          (image: { size: string; "#text": string }) => {
            return {
              size: image.size,
              url: image["#text"],
            };
          },
        );

        return track as LastTrack;
      }),
      total: json.recenttracks["@attr"].total,
      user: json.recenttracks["@attr"].user,
    };
  }
}
