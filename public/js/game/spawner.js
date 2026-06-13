// Stochastic spawning, ported from granturismo/game/spawner.py.
import { AICar, Scenery } from "./entities.js";

function randint(lo, hi) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function choice(seq) {
  return seq[Math.floor(Math.random() * seq.length)];
}

// Maybe spawn a single AI car. Returns it (caller adds to the world) or null.
// Rules: never stack a car in the same top-of-screen lane, and never cover all
// but one lane near the top (would force the player into a roadblock).
export function trySpawnAi(road, cars, models, baseDensity, playerHeight, spawnMargin, scrollSpeed) {
  let density = baseDensity;
  if (cars.length === 0) {
    density = Math.trunc(density / 4);
  } else if (cars.length === 1) {
    density = Math.trunc(density / 2);
    if (cars[0].rect.y > Math.trunc(road.windowHeight / 2) + cars[0].rect.h + spawnMargin * 2) {
      density = Math.trunc(density / 2);
    }
  }
  if (density <= 0) density = 1;
  if (randint(0, density) !== 0) return null;

  const model = choice(models);
  const lane = randint(1, road.laneCount);
  const x = road.laneX(lane, model.width);

  const dangerZone = playerHeight + spawnMargin * 2;
  const topCars = cars.filter((c) => c.rect.y < dangerZone);
  for (const c of topCars) {
    if (Math.abs(c.rect.x - x) < Math.trunc(road.laneWidth / 2)) return null;
  }
  if (topCars.length >= road.laneCount - 1) return null;
  return new AICar(model, x, scrollSpeed);
}

export function trySpawnTree(road, image, treeWidth, treeHeight, density, marginFromRoad) {
  if (density <= 0 || randint(0, density) !== 1) return null;
  const x = offRoadX(road, treeWidth, marginFromRoad);
  return new Scenery(image, x, -treeHeight);
}

function offRoadX(road, spriteWidth, marginFromRoad) {
  const leftLo = -spriteWidth;
  const leftHi = road.roadLeft - spriteWidth - marginFromRoad;
  const rightLo = road.roadRight + marginFromRoad;
  const rightHi = road.windowWidth;
  const leftOk = leftHi >= leftLo;
  const rightOk = rightHi >= rightLo;
  if (leftOk && rightOk) {
    return Math.random() < 0.5 ? randint(leftLo, leftHi) : randint(rightLo, rightHi);
  }
  if (leftOk) return randint(leftLo, leftHi);
  if (rightOk) return randint(rightLo, rightHi);
  return 0;
}
