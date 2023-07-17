import { Album } from "../last-util/types/AlbumResponse.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import { drawStrokedText, fitString } from "./chart-util.js";

export class AlbumChartService {
  private static albumSize = 300;

  static async renderChart(albums: Album[]) {
    registerFont("./assets/BalooThambi2.ttf", { family: "Baloo Thambi 2" })
    const canvas = createCanvas(
      Math.min(albums.length * this.albumSize, 1500),
      Math.ceil((albums.length / 5) * this.albumSize),
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.font = "30px Baloo Thambi 2";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let x = 0;
    let y = 0;

    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";

    for (const album of albums) {
      // draw cover art
      const image = await loadImage(album.image);
      ctx.drawImage(image, x, y, this.albumSize, this.albumSize);

      // draw album name
      drawStrokedText(
        fitString(album.name, this.albumSize - 10, ctx),
        x + 5,
        y + 20,
        ctx,
      );

      // draw artist name
      drawStrokedText(
        fitString(album.artist.name, this.albumSize - 10, ctx),
        x + 5,
        y + 45,
        ctx,
      );

      // draw playcount
      drawStrokedText(
        fitString(`${album.playcount} Plays`, this.albumSize - 10, ctx),
        x + 5,
        y + 70,
        ctx,
      );

      // move coordinates
      x += this.albumSize;
      if (x >= 1500) {
        x = 0;
        y += this.albumSize;
      }
    }

    return canvas.toBuffer("image/png");
  }
}
