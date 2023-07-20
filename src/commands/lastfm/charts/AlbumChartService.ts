import { UnknownAlbumArt } from "../last-util/LastUtil.js";
import { Album } from "../last-util/types/AlbumResponse.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import { drawStrokedText, fitString } from "./chart-util.js";
export class AlbumChartService {
  static albumSize = 300;
  static async renderChart(albums: Album[]) {
    const canvas = createCanvas(
      Math.min(albums.length * this.albumSize, 1500),
      Math.ceil((albums.length / 5) * this.albumSize),
    );
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 23px Baloo 2, Sans";

    let x = 0;
    let y = 0;

    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";

    for (const album of albums) {
      let image;
      try {
        image = await loadImage(album.image);
      } catch {
        image = await loadImage(UnknownAlbumArt);
      }

      ctx.drawImage(image, x, y, this.albumSize, this.albumSize);

      drawStrokedText(
        fitString(album.name, this.albumSize - 10, ctx),
        x + 5,
        y + 20,
        ctx,
      );
      drawStrokedText(
        fitString(album.artist.name, this.albumSize - 10, ctx),
        x + 5,
        y + 45,
        ctx,
      );
      drawStrokedText(
        fitString(`${album.playcount} Plays`, this.albumSize - 10, ctx),
        x + 5,
        y + 290,
        ctx,
      );

      x += this.albumSize;
      if (x >= 1500) {
        x = 0;
        y += this.albumSize;
      }
    }

    return canvas.toBuffer("image/png");
  }
}
