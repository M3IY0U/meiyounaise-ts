export type RecentResponse = {
  tracks: RecentTrack[];
  total: number;
  user: string;
};

export interface RecentTrack {
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
