export interface LastTrack {
  artist: Artist;
  mbid?: string;
  name: string;
  image: Image[];
  streamable: string;
  album: Album;
  url: string;
  date: Date;
  "@attr"?: Object;
  loved: string;
  nowplaying: boolean;
}

export interface Album {
  mbid?: string;
  name: string;
}

export interface Artist {
  url: string;
  name: string;
  image: Image[];
  mbid?: string;
}

export interface Image {
  size: string;
  url: string;
}

export type RecentResponse = {
  tracks: LastTrack[];
  total: number;
  user: string;
};
