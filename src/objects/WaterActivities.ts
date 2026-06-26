import * as THREE from 'three';
import type { InteractionManager } from '../ui/InteractionManager';

// ─── Dock + Rowboats ────────────────────────────────────────────────────────

interface BoatState {
  group: THREE.Group;
  t: number;
  speed: number;
  bobAmp: number;
}

export class Dock {
  public root: THREE.Group;
  private rowboats: BoatState[] = [];
  private t = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3, interaction?: InteractionManager) {
    this.root = new THREE.Group();
    this.root.position.copy(position);
    scene.add(this.root);

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x9c7a3c, roughness: 0.85 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
    const boatMat = new THREE.MeshStandardMaterial({ color: 0xd4a017 });
    const oarMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c });

    // Main dock plank (extending over the lake)
    const deckGeo = new THREE.BoxGeometry(5, 0.3, 22);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 0.15, -8);
    this.root.add(deck);

    // Cross planks
    for (let z = 0; z > -20; z -= 2) {
      const plankGeo = new THREE.BoxGeometry(5.2, 0.1, 0.15);
      const plank = new THREE.Mesh(plankGeo, pillarMat);
      plank.position.set(0, 0.31, z);
      this.root.add(plank);
    }

    // Dock pillars
    for (let z = 0; z >= -18; z -= 6) {
      for (const x of [-2.5, 2.5]) {
        const pillarGeo = new THREE.CylinderGeometry(0.22, 0.22, 4, 8);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, -2, z);
        this.root.add(pillar);
      }
    }

    // Rope rail
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd4a017 });
    for (const x of [-2.5, 2.5]) {
      const railGeo = new THREE.CylinderGeometry(0.05, 0.05, 22, 4);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(x, 0.8, -8);
      this.root.add(rail);
    }

    // 3 rowboats moored at dock
    for (let i = 0; i < 3; i++) {
      const boatGroup = new THREE.Group();
      const wx = position.x + (i - 1) * 5;
      const wz = position.z - 5 - i * 2;
      boatGroup.position.set(wx, 0.15, wz);
      scene.add(boatGroup);

      // Hull
      const hullGeo = new THREE.CapsuleGeometry(1.1, 2.8, 4, 8);
      const hull = new THREE.Mesh(hullGeo, boatMat);
      hull.rotation.z = Math.PI / 2;
      hull.scale.y = 0.35;
      boatGroup.add(hull);

      // Seat
      const seatGeo = new THREE.BoxGeometry(2.0, 0.1, 0.6);
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.3;
      boatGroup.add(seat);

      // Oars
      for (const side of [-1, 1]) {
        const oarGeo = new THREE.CylinderGeometry(0.06, 0.04, 3.2, 5);
        const oar = new THREE.Mesh(oarGeo, oarMat);
        oar.position.set(side * 1.15, 0.35, 0);
        oar.rotation.x = Math.PI / 7;
        oar.rotation.z = side * -0.25;
        boatGroup.add(oar);

        // Paddle blade
        const bladeGeo = new THREE.BoxGeometry(0.4, 0.05, 0.6);
        const blade = new THREE.Mesh(bladeGeo, oarMat);
        blade.position.set(side * 1.15, 0.35 - 1.3, 1.4);
        boatGroup.add(blade);
      }

      this.rowboats.push({ group: boatGroup, t: i * 1.3, speed: 0.4 + i * 0.1, bobAmp: 0.08 });
    }

    if (interaction) {
      interaction.register(this.root, {
        id: 'dock',
        name: '湖边码头',
        description: '木制码头延伸入湖，可租借小船游湖。',
        type: 'park',
        detail: '租船：¥30/小时 · 开放时间 8:00-18:00',
      });
    }
  }

  update(delta: number): void {
    this.t += delta;
    for (const boat of this.rowboats) {
      boat.group.position.y = 0.15 + Math.sin(this.t * boat.speed + boat.t) * boat.bobAmp;
      boat.group.rotation.z = Math.sin(this.t * 0.6 + boat.t) * 0.04;
    }
  }
}

// ─── Bumper Boats ────────────────────────────────────────────────────────────

const BUMPER_COLORS = [0xe63946, 0x2a9d8f, 0xffd700, 0xf4a261, 0x8338ec, 0xff6b35];

interface BumperState {
  group: THREE.Group;
  t: number;
  radius: number;
  speed: number;
  dir: number;
  wobble: number;
}

export class BumperBoats {
  private boats: BumperState[] = [];
  private t = 0;

  constructor(scene: THREE.Scene, center: THREE.Vector3, count = 6, interaction?: InteractionManager) {
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const color = BUMPER_COLORS[i % BUMPER_COLORS.length];

      // Inflatable ring hull
      const hullGeo = new THREE.TorusGeometry(1.3, 0.55, 10, 22);
      const hullMat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.rotation.x = Math.PI / 2;
      group.add(hull);

      // White bumper edge
      const bumperGeo = new THREE.TorusGeometry(1.85, 0.2, 6, 22);
      const bumperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const bumper = new THREE.Mesh(bumperGeo, bumperMat);
      bumper.rotation.x = Math.PI / 2;
      group.add(bumper);

      // Seat
      const seatGeo = new THREE.CylinderGeometry(0.6, 0.55, 0.45, 10);
      const seatMat = new THREE.MeshStandardMaterial({ color: 0xfafafa });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.45;
      group.add(seat);

      // Antenna with ball
      const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 4);
      const antMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.y = 1.4;
      group.add(ant);
      const ballGeo = new THREE.SphereGeometry(0.12, 6, 6);
      const ballMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.y = 2.25;
      group.add(ball);

      group.position.copy(center);
      scene.add(group);

      this.boats.push({
        group,
        t: (i / count) * Math.PI * 2,
        radius: 7 + Math.random() * 12,
        speed: 0.3 + Math.random() * 0.35,
        dir: i % 2 === 0 ? 1 : -1,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    if (interaction && count > 0) {
      interaction.register(this.boats[0].group, {
        id: 'bumper-boats',
        name: '碰碰船',
        description: '6艘彩色碰碰船在湖上互相追逐，是最受孩子欢迎的水上项目！',
        type: 'ride',
        detail: '票价：¥20/次 · 开放时间 10:00-17:00',
      });
    }
  }

  update(delta: number): void {
    this.t += delta;
    for (const boat of this.boats) {
      boat.t += delta * boat.speed;
      const angle = boat.t * boat.dir;
      boat.group.position.x = Math.cos(angle) * boat.radius;
      boat.group.position.z = Math.sin(angle) * boat.radius;
      boat.group.position.y = Math.sin(this.t * 1.8 + boat.wobble) * 0.1 + 0.3;
      boat.group.rotation.y = -angle * boat.dir + Math.PI;
    }
  }
}
