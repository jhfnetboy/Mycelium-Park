import * as THREE from 'three';

interface BirdState {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  orbitHeight: number;
  orbitDir: number;
  phaseOffset: number;
  t: number;
}

export class BirdFlock {
  private birds: BirdState[] = [];
  private swans: BirdState[] = [];
  private t = 0;

  constructor(scene: THREE.Scene, center: THREE.Vector3) {
    // Regular birds — 12 birds in a loose flock
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });

    for (let i = 0; i < 12; i++) {
      const state = this.makeBird(scene, center, bodyMat, wingMat, {
        bodyRadius: 0.22,
        bodyLen: 0.7,
        wingW: 1.8,
        wingH: 0.5,
        orbitRadius: 55 + (i % 3) * 12,
        orbitSpeed: 0.25 + Math.random() * 0.15,
        orbitHeight: center.y + 35 + Math.random() * 15,
        orbitDir: i % 2 === 0 ? 1 : -1,
        phaseOffset: (i / 12) * Math.PI * 2,
      });
      this.birds.push(state);
    }

    // Swans — 4 large white birds, lower, near the lake
    const swanBodyMat = new THREE.MeshStandardMaterial({ color: 0xfafafa });
    const swanWingMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, side: THREE.DoubleSide });
    const swanCenter = new THREE.Vector3(center.x + 60, center.y, center.z + 30);

    for (let i = 0; i < 4; i++) {
      const state = this.makeBird(scene, swanCenter, swanBodyMat, swanWingMat, {
        bodyRadius: 0.6,
        bodyLen: 1.8,
        wingW: 3.5,
        wingH: 1.0,
        orbitRadius: 20 + i * 5,
        orbitSpeed: 0.15 + Math.random() * 0.08,
        orbitHeight: swanCenter.y + 8 + Math.random() * 5,
        orbitDir: i % 2 === 0 ? 1 : -1,
        phaseOffset: (i / 4) * Math.PI * 2,
      });
      this.swans.push(state);
    }
  }

  private makeBird(
    scene: THREE.Scene,
    center: THREE.Vector3,
    bodyMat: THREE.MeshStandardMaterial,
    wingMat: THREE.MeshStandardMaterial,
    opts: {
      bodyRadius: number; bodyLen: number; wingW: number; wingH: number;
      orbitRadius: number; orbitSpeed: number; orbitHeight: number; orbitDir: number; phaseOffset: number;
    }
  ): BirdState {
    const group = new THREE.Group();
    group.position.copy(center);
    scene.add(group);

    // Body (capsule rotated to face forward)
    const bodyGeo = new THREE.CapsuleGeometry(opts.bodyRadius, opts.bodyLen, 4, 8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // Tail
    const tailGeo = new THREE.ConeGeometry(opts.bodyRadius * 0.5, opts.bodyLen * 0.5, 5);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -(opts.bodyLen / 2 + opts.bodyLen * 0.25);
    group.add(tail);

    // Wings (triangular planes that flap)
    const leftWingGeo = new THREE.PlaneGeometry(opts.wingW, opts.wingH);
    const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
    leftWing.position.z = opts.wingW / 2;
    group.add(leftWing);

    const rightWingGeo = new THREE.PlaneGeometry(opts.wingW, opts.wingH);
    const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
    rightWing.position.z = -opts.wingW / 2;
    group.add(rightWing);

    return {
      group,
      leftWing,
      rightWing,
      orbitRadius: opts.orbitRadius,
      orbitSpeed: opts.orbitSpeed,
      orbitHeight: opts.orbitHeight,
      orbitDir: opts.orbitDir,
      phaseOffset: opts.phaseOffset,
      t: opts.phaseOffset,
    };
  }

  update(delta: number): void {
    this.t += delta;
    this.updateFlock(this.birds, delta, 5.5);
    this.updateFlock(this.swans, delta, 3.0);
  }

  private updateFlock(flock: BirdState[], delta: number, flapSpeed: number): void {
    for (const bird of flock) {
      bird.t += delta * bird.orbitSpeed;
      const angle = bird.t * bird.orbitDir;

      bird.group.position.x = Math.cos(angle) * bird.orbitRadius;
      bird.group.position.z = Math.sin(angle) * bird.orbitRadius;
      bird.group.position.y = bird.orbitHeight + Math.sin(this.t * 0.6 + bird.phaseOffset) * 2;

      // Face direction of travel
      bird.group.rotation.y = -angle * bird.orbitDir + Math.PI / 2;

      // Wing flap (rotate around x-axis)
      const flapAngle = Math.sin(this.t * flapSpeed + bird.phaseOffset) * 0.6;
      bird.leftWing.rotation.x = flapAngle;
      bird.rightWing.rotation.x = -flapAngle;
    }
  }
}
