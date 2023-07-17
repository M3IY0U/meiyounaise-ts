import { CanvasRenderingContext2D } from "canvas";

export const fitString = (
  str: string,
  maxWidth: number,
  ctx: CanvasRenderingContext2D,
) => {
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
};

export const drawStrokedText = (
  text: string,
  x: number,
  y: number,
  ctx: CanvasRenderingContext2D,
) => {
  ctx.save();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
};
