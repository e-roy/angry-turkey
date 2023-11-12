import Matter from "matter-js";
import { veggieSprite } from "../sprites/veggieSprite";

export const createPyramid = (
  x: number,
  y: number,
  columns: number,
  rows: number,
  columnGap: number,
  rowGap: number
) => {
  return Matter.Composites.pyramid(
    x,
    y,
    columns,
    rows,
    columnGap,
    rowGap,
    (x: number, y: number) => veggieSprite(x, y)
  );
};
