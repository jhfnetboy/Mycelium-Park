import * as THREE from 'three';
import type { InteractionManager } from '../ui/InteractionManager';

const NUM_HORSES = 8;
const ARM_RADIUS = 7;
const HORSE_COLORS = [0xffffff, 0x8b4513, 0x2d6a4f, 0xe63946, 0xffd700, 0x6b35d4, 0xff6b35, 0x35b5ff];

export class Carousel {
  public root: THREE.Group;
  private spindle: THREE.Group;
  private horseGroups: Array<{ group: THREE.Group; phase: number }> = [];
  private t = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3, interaction?: InteractionManager) {
    this.root = new THREE.Group();
    this.root.position.copy(position);
    scene.add(this.root);

    this.spindle = new THREE.Group();
    this.root.add(this.spindle);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.5 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xe63946 });
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });

    // Base platform
    const platGeo = new THREE.CylinderGeometry(ARM_RADIUS + 1.5, ARM_RADIUS + 1.5, 0.6, 24);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.y = 0.3;
    this.spindle.add(plat);

    // Center pole
    const poleGeo = new THREE.CylinderGeometry(0.5, 0.7, 15, 10);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 7.5;
    this.spindle.add(pole);

    // Roof cone
    const roofGeo = new THREE.ConeGeometry(ARM_RADIUS + 2.5, 6, 16);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 18;
    this.spindle.add(roof);

    // Roof rim ring
    const rimGeo = new THREE.TorusGeometry(ARM_RADIUS + 2.5, 0.35, 6, 28);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 15;
    this.spindle.add(rim);

    // 8 horses
    for (let i = 0; i < NUM_HORSES; i++) {
      const angle = (i / NUM_HORSES) * Math.PI * 2;
      const armPivot = new THREE.Group();
      armPivot.rotation.y = angle;
      this.spindle.add(armPivot);

      // Radial arm strut
      const strutGeo = new THREE.CylinderGeometry(0.1, 0.1, ARM_RADIUS, 4);
      const strutMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.rotation.z = Math.PI / 2;
      strut.position.set(ARM_RADIUS / 2, 15, 0);
      armPivot.add(strut);

      // Vertical chain/pole
      const chainGeo = new THREE.CylinderGeometry(0.07, 0.07, 6, 4);
      const chain = new THREE.Mesh(chainGeo, chainMat);
      chain.position.set(ARM_RADIUS, 12, 0);
      armPivot.add(chain);

      // Horse group (bobs up/down)
      const horseGroup = new THREE.Group();
      horseGroup.position.set(ARM_RADIUS, 9, 0);
      armPivot.add(horseGroup);

      const color = HORSE_COLORS[i];
      const bodyMat = new THREE.MeshStandardMaterial({ color });
      const sadMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
      const maneMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });

      // Body
      const bodyGeo = new THREE.CapsuleGeometry(0.42, 1.4, 4, 8);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      horseGroup.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.38, 8, 6);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(1.1, 0.45, 0);
      horseGroup.add(head);

      // Mane
      const maneGeo = new THREE.CylinderGeometry(0.1, 0.04, 0.9, 5);
      const mane = new THREE.Mesh(maneGeo, maneMat);
      mane.position.set(0.6, 0.6, 0);
      mane.rotation.z = 0.4;
      horseGroup.add(mane);

      // Saddle
      const saddleGeo = new THREE.BoxGeometry(0.7, 0.18, 0.55);
      const saddle = new THREE.Mesh(saddleGeo, sadMat);
      saddle.position.set(0, 0.48, 0);
      horseGroup.add(saddle);

      // Front legs
      const legMat = new THREE.MeshStandardMaterial({ color });
      const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.9, 5);
      for (const [lx, lz] of [[0.5, 0.15], [0.5, -0.15], [-0.5, 0.15], [-0.5, -0.15]]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, -0.55, lz);
        horseGroup.add(leg);
      }

      this.horseGroups.push({ group: horseGroup, phase: i * (Math.PI * 2 / NUM_HORSES) });
    }

    if (interaction) {
      interaction.register(this.root, {
        id: 'carousel',
        name: '旋转木马',
        description: '8匹彩色木马随音乐旋转，老少皆宜的经典游乐设施。',
        type: 'ride',
        detail: '票价：¥15/次 · 建议身高 90cm+',
      });
    }
  }

  update(delta: number): void {
    this.t += delta;
    this.spindle.rotation.y += delta * 0.5;
    for (const { group, phase } of this.horseGroups) {
      group.position.y = 9 + Math.sin(this.t * 2.2 + phase) * 0.8;
    }
  }
}
