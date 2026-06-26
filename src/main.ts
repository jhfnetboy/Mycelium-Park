import { ParkSceneManager } from './core/ParkSceneManager';
import { setupFPSCounter } from './utils/fpsCounter';

const container = document.getElementById('app') as HTMLElement;
const park = new ParkSceneManager(container);

setupFPSCounter();

function animate() {
  requestAnimationFrame(animate);
  park.update();
}

animate();
