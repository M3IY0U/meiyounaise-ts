export type RecentResponse = {
  tracks: LastTrack[];
  total: number;
  user: string;
};

export interface LastTrack {
  artist: Artist;
  name: string;
  image: string;
  album: string;
  url: string;
  date: number;
  nowplaying: boolean;
}

export interface Artist {
  url: string;
  name: string;
}
