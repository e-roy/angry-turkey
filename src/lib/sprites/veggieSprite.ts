import Matter from "matter-js";
import image1 from "../../assets/corn.png";
import image2 from "../../assets/pepper.png";
import image3 from "../../assets/pumpkin.png";

const blockImages = [image1, image2, image3];

export const veggieSprite = (x: number, y: number) => {
  const randomImage =
    blockImages[Math.floor(Math.random() * blockImages.length)];
  return Matter.Bodies.rectangle(x, y, 25, 40, {
    render: {
      sprite: {
        texture: randomImage,
        xScale: 0.7, // Adjust scale as needed
        yScale: 0.7, // Adjust scale as needed
      },
    },
  });
};
