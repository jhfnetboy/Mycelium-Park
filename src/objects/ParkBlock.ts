import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { InteractionManager } from '../ui/InteractionManager';

const loader = new GLTFLoader();

const TREE_MODELS = [
  '/assets/kenney/nature/tree_pineRoundA.glb',
  '/assets/kenney/nature/tree_pineRoundB.glb',
  '/assets/kenney/nature/tree_pineRoundC.glb',
  '/assets/kenney/nature/tree_cone_fall.glb',
  '/assets/kenney/nature/tree_simple_dark.glb',
];

const FLOWER_MODELS = [
  '/assets/kenney/nature/flower_yellowA.glb',
  '/assets/kenney/nature/flower_yellowB.glb',
  '/assets/kenney/nature/flower_redA.glb',
  '/assets/kenney/nature/flower_purpleA.glb',
  '/assets/kenney/nature/flower_purpleB.glb',
];

function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function loadGlb(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
  });
}

/** Spawn scattered trees + flowers in a radius around a center point */
export async function spawnNatureCluster(
  scene: THREE.Scene,
  center: THREE.Vector3,
  opts: { trees?: number; flowers?: number; interaction?: InteractionManager } = {}
): Promise<void> {
  const { trees = 8, flowers = 12, interaction } = opts;

  // Trees
  for (let i = 0; i < trees; i++) {
    const url = pick(TREE_MODELS);
    try {
      const model = await loadGlb(url);
      const angle = rnd(0, Math.PI * 2);
      const dist = rnd(8, 35);
      model.position.set(
        center.x + Math.cos(angle) * dist,
        center.y,
        center.z + Math.sin(angle) * dist
      );
      const s = rnd(0.8, 1.6);
      model.scale.setScalar(s);
      model.rotation.y = rnd(0, Math.PI * 2);
      scene.add(model);

      if (interaction) {
        interaction.register(model, {
          id: `tree-${i}`,
          name: '公园大树',
          description: '郁郁葱葱的树木为公园提供天然遮阴。',
          type: 'nature',
        });
      }
    } catch { /* skip failed load */ }
  }

  // Flowers
  for (let i = 0; i < flowers; i++) {
    const url = pick(FLOWER_MODELS);
    try {
      const model = await loadGlb(url);
      const angle = rnd(0, Math.PI * 2);
      const dist = rnd(5, 25);
      model.position.set(
        center.x + Math.cos(angle) * dist,
        center.y,
        center.z + Math.sin(angle) * dist
      );
      model.scale.setScalar(rnd(1.2, 2.0));
      model.rotation.y = rnd(0, Math.PI * 2);
      scene.add(model);
    } catch { /* skip */ }
  }
}

/** Spawn fountain at position */
export async function spawnFountain(
  scene: THREE.Scene,
  position: THREE.Vector3,
  interaction?: InteractionManager
): Promise<void> {
  try {
    const base = await loadGlb('/assets/kenney/fountain/fountain-round.glb');
    base.position.copy(position);
    base.scale.setScalar(3);
    scene.add(base);

    if (interaction) {
      interaction.register(base, {
        id: 'fountain-main',
        name: '中心喷泉',
        description: '公园中心的音乐喷泉，每小时整点表演水舞。',
        type: 'park',
        detail: '表演时间：每小时 :00',
      });
    }
  } catch { /* skip */ }
}

/** Spawn bush hedge row along X axis */
export async function spawnBushRow(
  scene: THREE.Scene,
  start: THREE.Vector3,
  count = 6,
  spacing = 5
): Promise<void> {
  for (let i = 0; i < count; i++) {
    try {
      const model = await loadGlb('/assets/kenney/nature/plant_bush.glb');
      model.position.set(start.x + i * spacing, start.y, start.z);
      model.scale.setScalar(rnd(1.0, 1.5));
      scene.add(model);
    } catch { /* skip */ }
  }
}
