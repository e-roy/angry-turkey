// components/SlingshotGame.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Matter from "matter-js";

import { turkeySprite } from "../lib/sprites/turkeySprite";

import { createPyramid } from "../lib/helpers/createPyramid";

import backgroundImage from "../assets/background.png";
import skyBackgroundImage from "../assets/sky-background.png";
import turkeyBackgroundImage from "../assets/turkey-background.png";
import hillsBackgroundImage from "../assets/hills-background.png";

const SlingshotGame: React.FC = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [followRock, setFollowRock] = useState(false);
  const mouseControlEnabledRef = useRef(true);
  const sceneRef = useRef<HTMLDivElement>(null);
  const rockLaunched = useRef(false);
  const rockRef = useRef<Matter.Body | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  // const updateWindowSize = () => {
  //   const render = renderRef.current;
  //   if (render && render.canvas) {
  //     const { bounds, canvas } = render;
  //     bounds.max.x = bounds.min.x + windowSize.width;
  //     bounds.max.y = bounds.min.y + windowSize.height - 4;
  //     canvas.width = windowSize.width;
  //     canvas.height = windowSize.height - 4;
  //     Matter.Render.lookAt(render, {
  //       min: { x: 0, y: 0 },
  //       max: { x: windowSize.width, y: windowSize.height },
  //     });
  //   }
  // };

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

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
      Vector,
      Bounds,
    } = Matter;

    const engine = Engine.create();
    const { world } = engine;

    if (!sceneRef.current) return;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: windowSize.width,
        height: windowSize.height - 4,
        hasBounds: true,
        // showAngleIndicator: true,
        wireframes: false,
        background: skyBackgroundImage,
      },
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const groundHeight = 50;
    const sceneWidth = windowSize.width * 5;

    // The width of your background image
    const backgroundSize = 2;
    const backgroundWidth = 896 * backgroundSize; // Adjust this to the width of your background image
    const backgroundHeight = 512 * backgroundSize; // Adjust this as needed for the height

    // Calculate the number of background images needed to span the width of the scene
    const numBackgroundImages = Math.ceil(sceneWidth / backgroundWidth) + 1;

    const extraBackgroundToLeft = true;

    // Create the repeating background images
    for (let i = extraBackgroundToLeft ? -1 : 0; i < numBackgroundImages; i++) {
      World.add(
        world,
        Bodies.rectangle(
          i * backgroundWidth + backgroundWidth / 2, // x position
          windowSize.height - backgroundHeight / 2, // y position
          backgroundWidth,
          backgroundHeight,
          {
            isStatic: true,
            collisionFilter: {
              category: 0x0002,
              mask: 0x0000,
            },
            render: {
              sprite: {
                texture: hillsBackgroundImage,
                xScale: 1 * backgroundSize,
                yScale: 1 * backgroundSize,
              },
            },
          }
        )
      );
    }

    // Add walls
    World.add(world, [
      // Floor
      Bodies.rectangle(
        sceneWidth / 2,
        windowSize.height - groundHeight / 2,
        sceneWidth * 2,
        groundHeight,
        {
          isStatic: true,
          render: { fillStyle: "#86653a" },
        }
      ),
      // Back wall
      Bodies.rectangle(sceneWidth, 0, 50, windowSize.height * 2, {
        isStatic: true,
        render: { fillStyle: "#060a19" },
      }),
    ]);

    let rock = turkeySprite(windowSize.width * 0.4, windowSize.height * 0.4);

    rockRef.current = turkeySprite(
      windowSize.width * 0.4,
      windowSize.height * 0.4
    );
    renderRef.current = render;

    const hasLanded = (rock: Matter.Body) => {
      // Define what constitutes 'landing' in your game
      // For example, if the rock is slow enough and close to the ground, it might be considered landed
      // You may also check if the rock is sleeping, which indicates it's come to a rest
      const rockBottom = rock.bounds.max.y; // Get the bottom Y value of the rock's bounding box
      const groundLevel = windowSize.height - groundHeight; // Calculate the ground level Y position
      const isSlow = rock.speed < 1; // Check if the rock's speed is below a threshold
      const isOnGround = rockBottom >= groundLevel; // Check if the rock is on or below the ground level
      return isSlow && isOnGround;
    };

    const resetView = () => {
      // Reset the bounds to original view
      Bounds.translate(render.bounds, {
        x: -render.bounds.min.x,
        y: 0,
      });
    };

    const anchor = { x: rock.position.x, y: rock.position.y }; // New anchor based on rock position
    const elastic = Constraint.create({
      pointA: anchor,
      bodyB: rock,
      stiffness: 0.05,
    });

    const pyramid = createPyramid(
      sceneWidth * 0.5, // Center of the screen height
      windowSize.height * 0.5, // Middle of the screen height
      9,
      10,
      0,
      0
    );

    const ground2 = Bodies.rectangle(
      sceneWidth * 0.72, // % from the top
      windowSize.height * 0.4, // % from the top
      350,
      10,
      {
        isStatic: true,
        render: { fillStyle: "#060a19" },
      }
    );

    const pyramid2 = createPyramid(
      sceneWidth * 0.7, // % from the top
      windowSize.height * 0.1, // % from the top
      8,
      10,
      0,
      0
    );

    Composite.add(world, [pyramid, ground2, pyramid2, rock, elastic]);

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

    var width = render.options.width || 800;
    var height = render.options.height || 600;
    Events.on(mouseConstraint, "enddrag", (event) => {
      const mouseEvent = event as Matter.IEvent<Matter.MouseConstraint> & {
        body?: Matter.Body | null;
      };

      if (mouseEvent.body === rock && rockLaunched.current === false) {
        // Calculate the force vector based on the displacement from the anchor point
        const displacement = Vector.sub(rock.position, anchor);
        const forceMagnitude = 0.005; // Adjust this value as necessary
        const force = Vector.mult(Vector.neg(displacement), forceMagnitude);

        // Log the force to be applied
        // console.log(`Applying force: ${JSON.stringify(force)}`);

        // Apply the force to launch the turkey
        Body.applyForce(rock, rock.position, force);

        // Release the rock from the slingshot
        elastic.bodyB = null;
        rockLaunched.current = true;
        setFollowRock(true);
        mouseControlEnabledRef.current = false;
        if (elastic.render) {
          elastic.render.visible = false;
        }
      }
    });

    Events.on(engine, "afterUpdate", () => {
      if (rockLaunched.current && !hasLanded(rock)) {
        const cameraFollowSpeed = 0.2; // Adjust this value for smoother camera movement
        const currentCenter = {
          x:
            render.bounds.min.x +
            (render.bounds.max.x - render.bounds.min.x) / 2,
          y:
            render.bounds.min.y +
            (render.bounds.max.y - render.bounds.min.y) / 2,
        };
        const targetCenter = {
          x: rock.position.x,
          y: currentCenter.y, // Keep vertical position constant
        };

        // Linear interpolation (lerp) for smoother camera movement
        const lerp = (start: number, end: number, amt: number) => {
          return (1 - amt) * start + amt * end;
        };

        const newCenterX = lerp(
          currentCenter.x,
          targetCenter.x,
          cameraFollowSpeed
        );

        // Update render bounds to follow the rock position smoothly
        const translateX = newCenterX - currentCenter.x;
        Bounds.translate(render.bounds, {
          x: translateX,
          y: 0,
        });
      }

      // Check if the turkey has landed to reset the game state
      if (rockLaunched.current && hasLanded(rock)) {
        rockLaunched.current = false;
        setFollowRock(false);

        // Introduce a delay before resetting the view and creating a new turkey
        setTimeout(() => {
          // Reset the view to the starting position
          resetView();

          // Remove the old turkey (rock) from the world
          World.remove(world, rock);

          // Create a new turkey (rock) and add it to the world
          rock = turkeySprite(windowSize.width * 0.4, windowSize.height * 0.4);
          World.add(world, rock);

          // Reattach the slingshot constraint (elastic) to the new turkey
          elastic.bodyB = rock;
          mouseControlEnabledRef.current = true;
          if (elastic.render) {
            elastic.render.visible = true;
          }
        }, 3000); // Delay in milliseconds
      }
    });

    render.mouse = mouse;

    // get the centre of the viewport
    var viewportCentre = {
      x: width * 0.5,
      y: height * 0.5,
    };

    // create limits for the viewport
    var extents = {
      min: { x: 0, y: 0 },
      max: { x: sceneWidth, y: windowSize.height },
    };

    // keep track of current bounds scale (view zoom)
    var boundsScaleTarget = 1.5,
      boundsScale = {
        x: 1,
        y: 1,
      };

    Events.on(render, "beforeRender", () => {
      if (!followRock && mouseControlEnabledRef.current) {
        // Mouse zoom and panning logic goes here
        const mouse = mouseConstraint.mouse;
        let translate;

        // mouse wheel controls zoom
        const scaleFactor = mouse.wheelDelta * -0.1;
        if (scaleFactor !== 0) {
          if (
            (scaleFactor < 0 && boundsScale.x >= 0.6) ||
            (scaleFactor > 0 && boundsScale.x <= 1.4)
          ) {
            boundsScaleTarget += scaleFactor;
          }
        }

        // if scale has changed
        if (Math.abs(boundsScale.x - boundsScaleTarget) > 0.01) {
          // smoothly tween scale factor
          const scaleFactor = (boundsScaleTarget - boundsScale.x) * 0.2;
          boundsScale.x += scaleFactor;
          boundsScale.y += scaleFactor;

          // scale the render bounds
          render.bounds.max.x = render.bounds.min.x + width * boundsScale.x;
          render.bounds.max.y = render.bounds.min.y + height * boundsScale.y;

          // translate so zoom is from centre of view
          translate = {
            x: width * scaleFactor * -0.5,
            y: height * scaleFactor * -0.5,
          };

          Bounds.translate(render.bounds, translate);

          // update mouse
          Mouse.setScale(mouse, boundsScale);
          Mouse.setOffset(mouse, render.bounds.min);
        }

        // get vector from mouse relative to centre of viewport
        const deltaCentre = Vector.sub(mouse.absolute, viewportCentre);
        const centreDist = Vector.magnitude(deltaCentre);

        // translate the view if mouse has moved over 50px from the centre of viewport
        if (centreDist > 50) {
          // create a vector to translate the view, allowing the user to control view speed
          const direction = Vector.normalise(deltaCentre);
          const speed = Math.min(10, Math.pow(centreDist - 50, 2) * 0.0002);

          translate = Vector.mult(direction, speed);

          // prevent the view moving outside the extents
          if (render.bounds.min.x + translate.x < extents.min.x)
            translate.x = extents.min.x - render.bounds.min.x;

          if (render.bounds.max.x + translate.x > extents.max.x)
            translate.x = extents.max.x - render.bounds.max.x;

          if (render.bounds.min.y + translate.y < extents.min.y)
            translate.y = extents.min.y - render.bounds.min.y;

          if (render.bounds.max.y + translate.y > extents.max.y)
            translate.y = extents.max.y - render.bounds.max.y;

          // move the view
          Bounds.translate(render.bounds, translate);

          // we must update the mouse too
          Mouse.setOffset(mouse, render.bounds.min);
        }
      }
    });

    // cleanup function
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      World.clear(world, false);
      Engine.clear(engine);
    };
  }, []);

  return <div ref={sceneRef} />;
};

export default SlingshotGame;
