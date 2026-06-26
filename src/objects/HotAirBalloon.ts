import * as THREE from 'three';
import type { InteractionManager } from '../ui/InteractionManager';

const PANEL_COLORS = [0xe63946, 0xffd700, 0x2a9d8f, 0xf4a261, 0x8338ec, 0xff6b35, 0x35b5ff, 0xffffff];
const NUM_PANELS = 8;

export class HotAirBalloon {
  public root: THREE.Group;
  private baseY: number;
  private t = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3, interaction?: InteractionManager) {
    this.root = new THREE.Group();
    this.root.position.copy(position);
    this.baseY = position.y;
    scene.add(this.root);

    const ropesMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c });
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });

    // Balloon envelope — 8 colored panels forming a sphere (stretched Y)
    for (let i = 0; i < NUM_PANELS; i++) {
      const startAngle = (i / NUM_PANELS) * Math.PI * 2;
      const panelGeo = new THREE.SphereGeometry(7, 4, 14, startAngle, Math.PI * 2 / NUM_PANELS);
      const panelMat = new THREE.MeshStandardMaterial({
        color: PANEL_COLORS[i],
        side: THREE.FrontSide,
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.scale.set(1, 1.5, 1);
      panel.position.y = 18;
      this.root.add(panel);
    }

    // Balloon top cap sphere (darker)
    const capGeo = new THREE.SphereGeometry(1.5, 8, 6);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 28.5;
    this.root.add(cap);

    // Burner glow disk
    const burnerGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
    const burnerMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1.5 });
    const burner = new THREE.Mesh(burnerGeo, burnerMat);
    burner.position.y = 8.5;
    this.root.add(burner);

    // Basket
    const basketGeo = new THREE.BoxGeometry(3.5, 2.5, 3.5);
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = 6.5;
    this.root.add(basket);

    // Basket weave detail (horizontal rings)
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e });
    for (const y of [5.5, 6.5, 7.5]) {
      const ringGeo = new THREE.TorusGeometry(2.2, 0.1, 4, 20);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = y;
      this.root.add(ring);
    }

    // 4 ropes from basket corners to envelope bottom
    const ROPE_ATTACH = 10;
    const ROPE_LENGTH = ROPE_ATTACH - 7.5;
    for (const [rx, rz] of [[-1.5, -1.5], [-1.5, 1.5], [1.5, -1.5], [1.5, 1.5]]) {
      const ropeGeo = new THREE.CylinderGeometry(0.06, 0.06, ROPE_LENGTH, 4);
      const rope = new THREE.Mesh(ropeGeo, ropesMat);
      rope.position.set(rx * 0.7, (7.5 + ROPE_ATTACH) / 2, rz * 0.7);
      const targetX = rx * 2.5;
      const targetZ = rz * 2.5;
      rope.lookAt(new THREE.Vector3(targetX, 10, targetZ));
      this.root.add(rope);
    }

    if (interaction) {
      interaction.register(this.root, {
        id: 'hot-air-balloon',
        name: '热气球',
        description: '彩色热气球在空中悠然飘浮，俯瞰整个Mycelium Park。',
        type: 'ride',
        detail: '每日 9:00-17:00 开放载客体验',
      });
    }
  }

  update(delta: number): void {
    this.t += delta;
    this.root.position.y = this.baseY + Math.sin(this.t * 0.28) * 6;
    this.root.rotation.y += delta * 0.06;
  }
}
