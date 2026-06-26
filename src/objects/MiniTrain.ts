import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { InteractionManager } from '../ui/InteractionManager';

const loader = new GLTFLoader();

async function loadGlb(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(url, g => resolve(g.scene), undefined, reject);
  });
}

/** Oval track path around the park (XZ plane) */
function buildTrackPath(rx = 55, rz = 40, y = 0): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const segs = 32;
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * rx, y, Math.sin(t) * rz));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  return curve;
}

/** Builds and animates a 3-car train along a closed oval path */
export class MiniTrain {
  private scene: THREE.Scene;
  private interaction: InteractionManager | undefined;
  private curve: THREE.CatmullRomCurve3;
  private parts: THREE.Group[] = [];
  private offsets = [0, 0.05, 0.10];
  private speed = 0.00015;
  private t = 0;
  private ready = false;

  constructor(scene: THREE.Scene, interaction?: InteractionManager) {
    this.scene = scene;
    this.interaction = interaction;
    this.curve = buildTrackPath();
    this.addTrackVisual();
    this.loadTrain();
  }

  private addTrackVisual(): void {
    const pts = this.curve.getPoints(200);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x8b6914, linewidth: 2 });
    this.scene.add(new THREE.Line(geo, mat));
  }

  private async loadTrain(): Promise<void> {
    const models = [
      '/assets/kenney/train/train-electric-city-a.glb',
      '/assets/kenney/train/train-connector.glb',
      '/assets/kenney/train/train-electric-city-b.glb',
    ];

    for (let i = 0; i < models.length; i++) {
      try {
        const group = await loadGlb(models[i]);
        group.scale.setScalar(2.5);
        this.scene.add(group);
        this.parts.push(group);
      } catch {
        // fallback: plain box so train still moves visibly
        const geo = new THREE.BoxGeometry(4, 2, 8);
        const mat = new THREE.MeshStandardMaterial({ color: i === 0 ? 0xcc3300 : 0x335599 });
        const mesh = new THREE.Mesh(geo, mat);
        const group = new THREE.Group();
        group.add(mesh);
        mesh.position.y = 1;
        this.scene.add(group);
        this.parts.push(group);
      }
    }

    if (this.interaction && this.parts.length > 0) {
      this.interaction.register(this.parts[0], {
        id: 'mini-train',
        name: '小火车',
        description: '萌萌的公园小火车，沿椭圆轨道绕园一圈约3分钟。',
        type: 'ride',
        detail: '票价：免费 · 每班间隔 3 分钟',
      });
    }

    this.ready = true;
  }

  /** Call in render loop with delta in seconds */
  public update(delta: number): void {
    if (!this.ready) return;
    this.t = (this.t + this.speed * delta * 1000) % 1;

    for (let i = 0; i < this.parts.length; i++) {
      const t = (this.t - this.offsets[i] + 1) % 1;
      const tNext = (t + 0.01) % 1;

      const pos = this.curve.getPointAt(t);
      const ahead = this.curve.getPointAt(tNext);

      this.parts[i].position.copy(pos);
      this.parts[i].position.y += 0.5;

      // face direction of travel
      const dir = ahead.clone().sub(pos).normalize();
      if (dir.lengthSq() > 0) {
        this.parts[i].rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  }
}
