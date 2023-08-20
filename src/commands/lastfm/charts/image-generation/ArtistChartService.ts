import { UnknownArtistArt } from "../../last-util/LastUtil.js";
import { Artist } from "../../last-util/types/ArtistResponse.js";
import {
  CHART_FONT,
  drawImageProp,
  drawStrokedText,
  fitString,
} from "../chart-util.js";
import { createCanvas, loadImage } from "canvas";
export class ArtistChartService {
  static artistSize = 300;
  static async renderChart(artists: Artist[]) {
    const canvas = createCanvas(
      Math.min(artists.length * this.artistSize, this.artistSize * 5),
      Math.ceil((artists.length / 5) * this.artistSize),
    );
    const ctx = canvas.getContext("2d");
    ctx.font = CHART_FONT;

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

      drawImageProp(image, x, y, this.artistSize, this.artistSize, ctx);

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
