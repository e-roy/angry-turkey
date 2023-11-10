import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import turkeyImage from "../assets/turkey.png";

import backgroundImage from "../assets/background.png";

import image1 from "../assets/corn.png";
import image2 from "../assets/pepper.png";
import image3 from "../assets/pumpkin.png";

const blockImages = [image1, image2, image3];

const SlingshotGame: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [rockLaunched, setRockLaunched] = useState(false);

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const {
      Engine,
      Render,
      Runner,
      Composites,
      Events,
      Constraint,
      MouseConstraint,
      Mouse,
      Body,
      Composite,
      Bodies,
      World,
    } = Matter;

    const engine = Engine.create();
    const { world } = engine;

    if (!sceneRef.current) return;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: dimensions.width,
        height: dimensions.height,
        showAngleIndicator: true,
        wireframes: false,
        background: "transparent",
      },
    });

    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    const groundHeight = 50;

    const ground = Bodies.rectangle(
      dimensions.width / 2,
      dimensions.height - groundHeight / 2,
      dimensions.width,
      groundHeight,
      {
        isStatic: true,
        render: { fillStyle: "#060a19" },
      }
    );

    const rockPositionFromLeft = dimensions.width * 0.3; // 30% from the left of the screen

    const rockOptions = {
      density: 0.004,
      render: {
        sprite: {
          texture: turkeyImage,
          xScale: 0.4, // Scale for the x-axis
          yScale: 0.4, // Scale for the y-axis
        },
      },
    };
    // Create rock at a position relative to screen width and height
    let rock = Bodies.polygon(
      rockPositionFromLeft,
      dimensions.height - groundHeight - 200, // above the ground
      8,
      20,
      rockOptions
    );
    const anchor = { x: rock.position.x, y: rock.position.y }; // New anchor based on rock position
    const elastic = Constraint.create({
      pointA: anchor,
      bodyB: rock,
      stiffness: 0.05,
    });

    const createPyramid = (
      x: number,
      y: number,
      columns: number,
      rows: number,
      columnGap: number,
      rowGap: number,
      fillStyle: string
    ) => {
      return Composites.pyramid(
        x,
        y,
        columns,
        rows,
        columnGap,
        rowGap,
        (x: number, y: number) => {
          const randomImage =
            blockImages[Math.floor(Math.random() * blockImages.length)];
          return Bodies.rectangle(x, y, 25, 40, {
            render: {
              sprite: {
                texture: randomImage,
                xScale: 0.7, // Adjust scale as needed
                yScale: 0.7, // Adjust scale as needed
              },
            },
          });
        }
      );
    };

    const pyramid = createPyramid(
      dimensions.width * 0.5, // Center of the screen width
      dimensions.height * 0.5, // Middle of the screen height
      9,
      10,
      0,
      0,
      "red"
    );

    const ground2 = Bodies.rectangle(
      dimensions.width * 0.75, // 75% from the left
      dimensions.height * 0.4, // 40% from the top
      200,
      20,
      {
        isStatic: true,
        render: { fillStyle: "#060a19" },
      }
    );

    const pyramid2 = createPyramid(
      dimensions.width * 0.7, // 60% from the left
      dimensions.height * 0.1, // 10% from the top
      5,
      10,
      0,
      0,
      "gold"
    );

    Composite.add(world, [ground, pyramid, ground2, pyramid2, rock, elastic]);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

    Composite.add(world, mouseConstraint);

    // Events.on(mouseConstraint, "enddrag", (event) => {
    //   const mouseEvent = event as Matter.IEvent<Matter.MouseConstraint> & {
    //     body?: Matter.Body | null;
    //   };

    //   if (mouseEvent.body === rock) {
    //     setTimeout(() => {
    //       rock = Bodies.polygon(rockPositionFromLeft, 450, 7, 20, rockOptions);
    //       Composite.add(world, rock);
    //       elastic.bodyB = rock;
    //     }, 1);
    //   }
    // });

    Events.on(mouseConstraint, "enddrag", (event) => {
      const mouseEvent = event as Matter.IEvent<Matter.MouseConstraint> & {
        body?: Matter.Body | null;
      };

      if (mouseEvent.body === rock) {
        setRockLaunched(true); // Set the rock as launched
        setTimeout(() => {
          rock = Bodies.polygon(rockPositionFromLeft, 450, 7, 20, rockOptions);
          Composite.add(world, rock);
          elastic.bodyB = rock;
          setRockLaunched(false); // Reset the rockLaunched state
        }, 1);
      }
    });

    // Events.on(engine, "afterUpdate", () => {
    //   if (
    //     mouseConstraint.mouse.button === -1 &&
    //     (rock.position.x > rockPositionFromLeft + 20 || rock.position.y < 430)
    //   ) {
    //     if (Body.getSpeed(rock) > 45) {
    //       Body.setSpeed(rock, 45);
    //     }
    //     rock = Bodies.polygon(rockPositionFromLeft, 450, 7, 20, rockOptions);
    //     Composite.add(world, rock);
    //     elastic.bodyB = rock;
    //   }
    // });

    Events.on(engine, "afterUpdate", () => {
      if (
        rockLaunched &&
        (rock.position.x > rockPositionFromLeft + 20 || rock.position.y < 430)
      ) {
        if (Body.getSpeed(rock) > 45) {
          Body.setSpeed(rock, 45);
        }
        rock = Bodies.polygon(rockPositionFromLeft, 450, 7, 20, rockOptions);
        Composite.add(world, rock);
        elastic.bodyB = rock;
        setRockLaunched(false); // Reset the rockLaunched state
      }
    });

    render.mouse = mouse;

    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: dimensions.width, y: dimensions.height },
    });

    // cleanup function
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      render.canvas?.remove();
      World.clear(world, false);
      Engine.clear(engine);
    };
  }, [dimensions]);

  const gameContainerStyle = {
    width: "100vw",
    height: "100vh",
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return <div ref={sceneRef} style={gameContainerStyle} />;
};

export default SlingshotGame;
