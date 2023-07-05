import { LastTrack } from "./LastTypes";

export const UnknownAlbumArt =
  "https://lastfm.freetls.fastly.net/i/u/c6f59c1e5e7240a4c0d427abd71f3dbb";

export function cleanLastUrl(url: string) {
  return url
    .replaceAll(" ", "+")
    .replaceAll("(", "%28")
    .replaceAll(")", "%29")
    .replaceAll("　", "%E3%80%80");
}
