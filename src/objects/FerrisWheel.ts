import * as THREE from 'three';
import type { InteractionManager } from '../ui/InteractionManager';

const GONDOLA_COUNT = 10;
const WHEEL_RADIUS = 14;
const SPOKE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.6, roughness: 0.3 });
const GONDOLA_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xe63946, metalness: 0.1, roughness: 0.6 });
const FRAME_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xf4a261, metalness: 0.7, roughness: 0.2 });

function makeSupportLegs(height: number): THREE.Group {
  const legs = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.4, 0.7, height, 6);

  const positions = [
    new THREE.Vector3(-6, 0, 3),
    new THREE.Vector3(6, 0, 3),
    new THREE.Vector3(0, 0, -3),
  ];
  for (const p of positions) {
    const leg = new THREE.Mesh(legGeo, FRAME_MATERIAL);
    leg.position.copy(p);
    leg.position.y = height / 2;
    legs.add(leg);
  }
  return legs;
}

function makeSpokes(wheelRadius: number, count: number): THREE.Group {
  const spokes = new THREE.Group();
  const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, wheelRadius * 2, 6);
  spokeGeo.rotateZ(Math.PI / 2); // lay horizontal

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI;
    const spoke = new THREE.Mesh(spokeGeo, SPOKE_MATERIAL);
    spoke.rotation.z = angle;
    spokes.add(spoke);
  }
  return spokes;
}

function makeGondola(): THREE.Group {
  const g = new THREE.Group();
  // cabin body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.8, 1.6),
    GONDOLA_MATERIAL
  );
  body.position.y = -0.9;
  // roof
  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 1.4, 0.8, 6),
    FRAME_MATERIAL
  );
  roof.position.y = 0;
  // arm connecting gondola to rim
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 2, 6),
    SPOKE_MATERIAL
  );
  arm.position.y = 1.0;
  g.add(body, roof, arm);
  return g;
}

export class FerrisWheel {
  public root: THREE.Group;
  private wheel: THREE.Group;
  private gondolas: THREE.Group[] = [];

  constructor(scene: THREE.Scene, position: THREE.Vector3, interaction?: InteractionManager) {
    this.root = new THREE.Group();
    this.root.name = 'ferris-wheel';

    const legHeight = WHEEL_RADIUS + 3;
    this.root.add(makeSupportLegs(legHeight));

    // axle
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 3, 12),
      FRAME_MATERIAL
    );
    axle.rotation.x = Math.PI / 2;
    axle.position.y = legHeight;
    this.root.add(axle);

    // outer rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(WHEEL_RADIUS, 0.5, 8, 40),
      SPOKE_MATERIAL
    );
    // inner rim
    const innerRim = new THREE.Mesh(
      new THREE.TorusGeometry(WHEEL_RADIUS * 0.25, 0.3, 6, 20),
      FRAME_MATERIAL
    );

    this.wheel = new THREE.Group();
    this.wheel.add(rim, innerRim, makeSpokes(WHEEL_RADIUS, 5));
    this.wheel.position.y = legHeight;
    this.root.add(this.wheel);

    // gondolas — pivot at rim, hang down freely
    for (let i = 0; i < GONDOLA_COUNT; i++) {
      const angle = (i / GONDOLA_COUNT) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.position.set(
        Math.cos(angle) * WHEEL_RADIUS,
        Math.sin(angle) * WHEEL_RADIUS,
        0
      );
      const gondola = makeGondola();
      gondola.position.y = -1.8;
      pivot.add(gondola);
      this.wheel.add(pivot);
      this.gondolas.push(pivot);
    }

    this.root.position.copy(position);
    scene.add(this.root);

    if (interaction) {
      interaction.register(this.root, {
        id: 'ferris-wheel',
        name: '摩天轮',
        description: `高 ${WHEEL_RADIUS * 2 + 4}m，10 个彩色车厢，可俯瞰整个公园全景。`,
        type: 'ride',
        detail: '开放时间 9:00–21:00 · 每圈约 4 分钟',
      });
    }
  }

  public update(delta: number): void {
    // wheel rotates
    this.wheel.rotation.z += delta * 0.25;

    // gondolas counter-rotate to stay upright (gravity pendulum)
    for (const pivot of this.gondolas) {
      pivot.rotation.z -= delta * 0.25;
    }
  }
}
