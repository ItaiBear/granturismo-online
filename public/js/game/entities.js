// Player / AI car / scenery sprites, ported from granturismo/game/entities.py.
// Rects use the image's natural pixel size (as pygame's get_rect() did), so the
// on-screen size matches the desktop original exactly.

export class CarModel {
  constructor(image, width, height) {
    this.image = image; // a canvas (colorkey already applied)
    this.width = width; // config width (used for spawn positioning)
    this.height = height; // config height (used for spawn y offset)
  }
}

export class Player {
  constructor(model, road, startingLane, horizontalSpeed) {
    this.image = model.image;
    this.rect = { x: 0, y: 0, w: model.image.width, h: model.image.height };
    this.road = road;
    this.targetLane = startingLane;
    this.horizontalSpeed = horizontalSpeed;
    this.rect.x = road.laneX(startingLane, this.rect.w);
  }

  shift(direction) {
    const newLane = this.targetLane + direction;
    if (newLane >= 1 && newLane <= this.road.laneCount) {
      this.targetLane = newLane;
    }
  }

  update() {
    const targetX = this.road.laneX(this.targetLane, this.rect.w);
    const dx = targetX - this.rect.x;
    if (Math.abs(dx) <= this.horizontalSpeed) {
      this.rect.x = targetX;
    } else {
      this.rect.x += dx > 0 ? this.horizontalSpeed : -this.horizontalSpeed;
    }
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.rect.x, this.rect.y);
  }
}

export class AICar {
  constructor(model, x, scrollSpeed) {
    this.image = model.image;
    this.rect = { x, y: -model.height, w: model.image.width, h: model.image.height };
    this.scrollSpeed = scrollSpeed;
    this.dead = false;
  }

  update(playerSpeed, windowHeight) {
    this.rect.y += Math.trunc(playerSpeed - this.scrollSpeed);
    if (this.rect.y >= windowHeight) this.dead = true;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.rect.x, this.rect.y);
  }
}

export class Scenery {
  constructor(image, x, y) {
    this.image = image;
    this.rect = { x, y, w: image.width, h: image.height };
    this.dead = false;
  }

  update(speed, windowHeight) {
    this.rect.y += Math.trunc(speed);
    if (this.rect.y >= windowHeight) this.dead = true;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.rect.x, this.rect.y);
  }
}
