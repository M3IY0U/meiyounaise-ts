export type ArtistResponse = {
  artists: Artist[];
  meta: {
    user: string;
    total: number;
  };
};

export interface Artist {
  streamable: string;
  image: string;
  mbid: string;
  url: string;
  playcount: string;
  rank: number;
  name: string;
}
