export type TopTracksResponse = {
  tracks: TopTrack[];
  meta: {
    user: string;
    total: number;
  };
};

export type TopTrack = {
  name: string;
  image: string;
  artist: Artist;
  url: string;
  duration: string;
  playcount: string;
};

export type Artist = {
  url: string;
  name: string;
};
