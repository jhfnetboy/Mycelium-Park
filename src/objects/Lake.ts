import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const WAVE_VERT = /* glsl */`
varying vec2 vUv;
uniform float uTime;

void main() {
  vUv = uv;
  vec3 pos = position;
  // gentle ripple
  float wave = sin(pos.x * 0.3 + uTime * 1.2) * 0.15
             + cos(pos.z * 0.4 + uTime * 0.9) * 0.12;
  pos.y += wave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const WAVE_FRAG = /* glsl */`
varying vec2 vUv;
uniform float uTime;

void main() {
  vec2 uv = vUv;
  // animated rings
  float dist = length(uv - 0.5) * 2.0;
  float ripple = sin(dist * 12.0 - uTime * 2.5) * 0.06;
  vec3 deepColor  = vec3(0.05, 0.35, 0.55);
  vec3 shallowColor = vec3(0.20, 0.65, 0.75);
  float t = clamp(dist + ripple, 0.0, 1.0);
  vec3 color = mix(deepColor, shallowColor, t);
  // specular glint
  float spec = pow(max(0.0, sin(dist * 20.0 - uTime * 4.0)), 6.0) * 0.25;
  color += spec;
  gl_FragColor = vec4(color, 0.80);
}
`;

export class Lake {
  private mesh: THREE.Mesh;
  private uniforms: { uTime: { value: number } };
  private elapsed = 0;

  constructor(scene: THREE.Scene, center: THREE.Vector3, radius = 30) {
    const geo = new THREE.CircleGeometry(radius, 64);
    // rotate flat onto XZ plane
    geo.rotateX(-Math.PI / 2);

    this.uniforms = { uTime: { value: 0 } };

    const mat = new THREE.ShaderMaterial({
      vertexShader: WAVE_VERT,
      fragmentShader: WAVE_FRAG,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(center);
    this.mesh.position.y += 0.05;  // slightly above ground
    scene.add(this.mesh);

    // decorative fountain on lake
    new GLTFLoader().load('/assets/kenney/fountain/fountain-center.glb', gltf => {
      gltf.scene.position.copy(center);
      gltf.scene.position.y += 0.1;
      gltf.scene.scale.setScalar(2.5);
      scene.add(gltf.scene);
    });

    // lily pads (small flat disks)
    const padMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44, side: THREE.DoubleSide });
    const padGeo = new THREE.CircleGeometry(2.5, 16);
    padGeo.rotateX(-Math.PI / 2);
    const padPositions = [
      new THREE.Vector3(12, 0.12, 8),
      new THREE.Vector3(-10, 0.12, 14),
      new THREE.Vector3(8, 0.12, -12),
      new THREE.Vector3(-16, 0.12, -6),
    ];
    for (const p of padPositions) {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.copy(center).add(p);
      scene.add(pad);
    }
  }

  public update(delta: number): void {
    this.elapsed += delta;
    this.uniforms.uTime.value = this.elapsed;
  }
}
