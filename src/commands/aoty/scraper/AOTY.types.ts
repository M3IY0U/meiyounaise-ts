export interface Discography {
  artist: {
    name: string;
    url: string;
    scores: Scores;
  };
  albums: DiscographyEntry[];
}

export interface Scores {
  critic: { score: string; ratings?: number };
  user: { score: string; ratings?: number };
}

export interface DiscographyEntry {
  type: string;
  albumName: string;
  albumUrl: string;
  albumYear: string;
  albumCover: string;
  albumRating: string[];
}

export interface Artist {
  artist: {
    name: string;
    url: string;
    scores: Scores;
  };
  followers: number;
  details?: { title: string; content: string }[];
  tags: string[];
}
