import { Album } from "../last-util/types/AlbumResponse.js";
import { createCanvas, loadImage, registerFont } from "canvas";
export class AlbumChartService {
  static albumSize = 300;
  static async renderChart(albums: Album[]) {
    function fitString(str: string, maxWidth: number) {
      let { width } = ctx.measureText(str);
      const ellipsis = "…";
      const ellipsisWidth = ctx.measureText(ellipsis).width;
      if (width <= maxWidth || width <= ellipsisWidth) {
        return str;
      } else {
        let len = str.length;
        while (width >= maxWidth - ellipsisWidth && len-- > 0) {
          // rome-ignore lint/style/noParameterAssign: no it's not confusing mr rome
          str = str.substring(0, len);
          ({ width } = ctx.measureText(str));
        }
        return str + ellipsis;
      }
    }

    function drawStrokedText(text: string, x: number, y: number) {
      ctx.save();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    registerFont("./assets/Baloo2.ttf", { family: "Baloo 2", weight: "bold" });
    const canvas = createCanvas(
      Math.min(albums.length * this.albumSize, 1500),
      Math.ceil((albums.length / 5) * this.albumSize),
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.font = "bold 25px Baloo 2";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let x = 0;
    let y = 0;

    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";

    for (const album of albums) {
      const image = await loadImage(album.image);
      ctx.drawImage(image, x, y, this.albumSize, this.albumSize);

      drawStrokedText(
        fitString(album.name, this.albumSize - 10),
        x + 5,
        y + 20,
      );
      drawStrokedText(
        fitString(album.artist.name, this.albumSize - 10),
        x + 5,
        y + 45,
      );
      drawStrokedText(
        fitString(`${album.playcount} Plays`, this.albumSize - 10),
        x + 5,
        y + 70,
      );

      x += this.albumSize;
      if (x >= 1500) {
        x = 0;
        y += this.albumSize;
      }
    }

    ctx.stroke();
    ctx.fill();
    return canvas.toBuffer("image/png");
  }
}
