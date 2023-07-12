export type AlbumResponse = {
  albums: Album[];
  meta: {
    user: string,
    total: number,
  }
}


export interface Album {
  artist: Artist;
  image: string;
  mbid: string;
  url: string;
  playcount: string;
  rank: number;
  name: string;
}

export interface AlbumAttr {
  rank: string;
}

export interface Artist {
  url: string;
  name: string;
  mbid: string;
}

export interface Image {
  size: Size;
  "#text": string;
}

export type Size = "small" | "medium" | "large" | "extralarge";
