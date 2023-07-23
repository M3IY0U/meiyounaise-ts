import { UnknownArtistArt } from "../last-util/LastUtil.js";
import { Artist } from "../last-util/types/ArtistResponse.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import { drawImageProp, drawStrokedText, fitString } from "./chart-util.js";
export class ArtistChartService {
  static artistSize = 300;
  static async renderChart(artists: Artist[]) {
    const canvas = createCanvas(
      Math.min(artists.length * this.artistSize, 1500),
      Math.ceil((artists.length / 5) * this.artistSize),
    );
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 23px Baloo 2, Sans";

    let x = 0;
    let y = 0;

    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";

    for (const artist of artists) {
      let image;
      try {
        image = await loadImage(artist.image);
      } catch {
        image = await loadImage(UnknownArtistArt);
      }

      drawImageProp(image, x, y, ctx);

      drawStrokedText(
        fitString(artist.name, this.artistSize - 10, ctx),
        x + 5,
        y + 20,
        ctx,
      );

      drawStrokedText(
        fitString(`${artist.playcount} Plays`, this.artistSize - 10, ctx),
        x + 5,
        y + 290,
        ctx,
      );

      x += this.artistSize;
      if (x >= 1500) {
        x = 0;
        y += this.artistSize;
      }
    }

    return canvas.toBuffer("image/png");
  }
}
