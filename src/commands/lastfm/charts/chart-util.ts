import { CanvasRenderingContext2D, Image } from "canvas";

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

export function drawImageProp(
  img: Image,
  x: number,
  y: number,
  ctx: CanvasRenderingContext2D,
) {
  const w = 300;
  const h = 300;

  const offsetX = 0.5;
  const offsetY = 0.5;

  // rome-ignore lint/style/useSingleVarDeclarator: <explanation>
  let iw = img.width,
    ih = img.height,
    r = Math.min(w / iw, h / ih),
    nw = iw * r, // new prop. width
    nh = ih * r, // new prop. height
    cx,
    cy,
    cw,
    ch,
    ar = 1;

  // decide which gap to fill
  if (nw < w) ar = w / nw;
  if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
  nw *= ar;
  nh *= ar;

  // calc source rectangle
  cw = iw / (nw / w);
  ch = ih / (nh / h);

  cx = (iw - cw) * offsetX;
  cy = (ih - ch) * offsetY;

  // make sure source rectangle is valid
  if (cx < 0) cx = 0;
  if (cy < 0) cy = 0;
  if (cw > iw) cw = iw;
  if (ch > ih) ch = ih;

  // fill image in dest. rectangle
  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}
