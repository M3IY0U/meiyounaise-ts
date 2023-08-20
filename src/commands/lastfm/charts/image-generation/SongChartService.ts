import { TopTrack } from "../../last-util/types/TopTracksResponse.js";
import { CHART_FONT } from "../chart-util.js";
import { createCanvas } from "canvas";

export class SongChartService {
  static width = 1024;
  static async renderChart(tracks: TopTrack[]) {
    const canvas = createCanvas(this.width, tracks.length * 50);
    const ctx = canvas.getContext("2d");
    const maxPlayCount = Math.max(...tracks.map((t) => parseInt(t.playcount)));
    ctx.font = CHART_FONT;

    ctx.fillStyle = "#262626";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const x = 10;
    let y = 20;

    const grd = ctx.createLinearGradient(x, y, x + canvas.width, y);
    grd.addColorStop(0, "#bb0000");
    grd.addColorStop(1, "#ccff00");

    ctx.fillStyle = "white";
    for (const track of tracks) {
      // draw text
      ctx.fillText(`${track.name} by ${track.artist.name}`, x, y);

      ctx.fillStyle = grd;
      ctx.strokeStyle = grd;
      // draw box
      ctx.strokeRect(x - 2, y + 8, canvas.width - 16, 14);
      // draw fill
      ctx.fillRect(
        x,
        y + 10,
        (canvas.width - 20) *
          Math.max(parseInt(track.playcount) / maxPlayCount, 0.01),
        10,
      );

      // draw playcount
      ctx.fillStyle = "white";
      ctx.fillText(
        `${track.playcount} Plays`,
        canvas.width - ctx.measureText(`${track.playcount} Plays`).width - 15,
        y,
      );
      y += 50;
    }

    return canvas.toBuffer("image/png");
  }
}
