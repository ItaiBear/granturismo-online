// Default no-op scene. Override what you need. Ported from granturismo/scenes/base.py.
export class Scene {
  constructor(app) {
    this.app = app;
    this.world = app.world;
    this.config = app.config;
  }

  handleEvent(event) {}
  update() {}
  render(ctx) {}
}
