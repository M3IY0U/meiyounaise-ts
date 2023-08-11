import { request } from "graphql-request";

export const searchAnilist = async (title: string, isManga: boolean) => {
  const res = (await request(
    "https://graphql.anilist.co",
    `{
        Media(search:"$search", type: ${isManga ? "MANGA" : "ANIME"}) {
          id,
          title {
            romaji
            english
          }
          siteUrl
          description
          format
          status
          startDate {
            year
            month
            day
          }
          coverImage {
            color
          }
        }
      }`.replace("$search", title),
  )) as any;

  return res.Media;
};

export const anilistById = async (id: number, isManga: boolean) => {
  const res = (await request(
    "https://graphql.anilist.co",
    `{
        Media(id: $id, type: ${isManga ? "MANGA" : "ANIME"}) {
          title {
            romaji
            english
          }
          siteUrl
          description
          format
          status
          episodes
          startDate {
            year
            month
            day
          }
          coverImage {
            color
          }
        }
      }`.replace("$id", id.toString()),
  )) as any;

  return res.Media;
};
