import Matter from "matter-js";
import turkeyImage from "../../assets/turkey.png";

export const turkeySprite = (fromLeft: number, fromTop: number) => {
  const rockOptions = {
    density: 0.004,
    render: {
      sprite: {
        texture: turkeyImage,
        xScale: 0.4,
        yScale: 0.4,
      },
    },
  };

  return Matter.Bodies.circle(fromLeft, fromTop, 21, rockOptions);
};
