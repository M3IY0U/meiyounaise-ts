import { UnknownArtistArt } from "../../last-util/LastUtil.js";
import { Artist } from "../../last-util/types/ArtistResponse.js";
import {
  chartFont,
  drawImageProp,
  drawStrokedText,
  fitString,
} from "./chart-util.js";
import { createCanvas, loadImage } from "canvas";
export class ArtistChartService {
  static artistSize = 150;
  static async renderChart(artists: Artist[]) {
    const canvas = createCanvas(
      Math.min(artists.length * this.artistSize, this.artistSize * 5),
      Math.ceil((artists.length / 5) * this.artistSize),
    );
    const ctx = canvas.getContext("2d");
    ctx.font = chartFont(15);

    let x = 0;
    let y = 0;

    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    const unknownArtist = await loadImage(UnknownArtistArt);

    for (const artist of artists) {
      let image;
      try {
        image = await loadImage(artist.image);
      } catch {
        image = unknownArtist;
      }

      drawImageProp(image, x, y, this.artistSize, this.artistSize, ctx);

      drawStrokedText(
        fitString(artist.name, this.artistSize - 10, ctx),
        x + 5,
        y + 15,
        ctx,
      );

      drawStrokedText(
        fitString(`${artist.playcount} Plays`, this.artistSize - 10, ctx),
        x + 5,
        y + (this.artistSize - 10),
        ctx,
      );

      x += this.artistSize;
      if (x >= this.artistSize * 5) {
        x = 0;
        y += this.artistSize;
      }
    }

    return canvas.toBuffer("image/png");
  }
}
