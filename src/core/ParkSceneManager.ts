import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/Addons.js';
import { Renderer } from './Renderer';
import { InfoBubble } from '../ui/InfoBubble';
import { InteractionManager } from '../ui/InteractionManager';
import { spawnNatureCluster, spawnFountain, spawnBushRow } from '../objects/ParkBlock';
import { MiniTrain } from '../objects/MiniTrain';
import { Lake } from '../objects/Lake';
import { FerrisWheel } from '../objects/FerrisWheel';
import { EditMode } from '../ui/EditMode';
import { Carousel } from '../objects/Carousel';
import { HotAirBalloon } from '../objects/HotAirBalloon';
import { BirdFlock } from '../objects/BirdFlock';
import { Dock, BumperBoats } from '../objects/WaterActivities';

const GLTF = new GLTFLoader();

async function loadGlb(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => GLTF.load(url, g => resolve(g.scene), undefined, reject));
}

/** Pure park scene — no city grid */
export class ParkSceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public renderer: Renderer;
  private clock = new THREE.Clock();
  private interactionMgr: InteractionManager | null = null;
  private miniTrain: MiniTrain | null = null;
  private lake: Lake | null = null;
  private ferrisWheel: FerrisWheel | null = null;
  private editMode: EditMode | null = null;
  private carousel: Carousel | null = null;
  private hotAirBalloon: HotAirBalloon | null = null;
  private birdFlock: BirdFlock | null = null;
  private dock: Dock | null = null;
  private bumperBoats: BumperBoats | null = null;

  constructor(container: HTMLElement) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // sky blue
    this.scene.fog = new THREE.FogExp2(0xc9e8f0, 0.0018);

    // Camera — starts at bird's-eye, can tilt to near-horizontal
    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 2000);
    this.camera.position.set(0, 160, 180);
    this.camera.lookAt(0, 0, 0);

    // Controls — full vertical range: 5° (top-down) to 88° (street level)
    this.controls = new OrbitControls(this.camera, container);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.4;
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.0;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 800;
    this.controls.minPolarAngle = 0.08;           // ~5° — near top-down
    this.controls.maxPolarAngle = Math.PI * 0.495; // ~89° — near street level
    container.addEventListener('contextmenu', e => e.preventDefault());

    // Renderer
    this.renderer = new Renderer(container);
    this.renderer.setSaturation(1.2);
    this.renderer.renderer.setClearColor(0x87ceeb);
    this.renderer.renderer.shadowMap.enabled = true;
    this.renderer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambient = new THREE.AmbientLight(0xd0e8ff, 0.7);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfffbe0, 2.2);
    sun.position.set(80, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -250;
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Environment map for reflections
    new EXRLoader().load('./assets/environments/DayStreet.exr', (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(this.renderer.renderer);
      pmrem.compileEquirectangularShader();
      this.scene.environment = pmrem.fromEquirectangular(tex).texture;
      tex.dispose(); pmrem.dispose();
    });

    // Park ground
    this.buildGround();

    // InfoBubble CSS2D overlay
    InfoBubble.init(container);

    // Interaction
    this.interactionMgr = new InteractionManager(this.camera, this.scene, container);

    // Async park population
    this.populate(container);

    // Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.onWindowResize(container);
      InfoBubble.getins().onResize(container);
    });
  }

  // ─── Ground + Grid ──────────────────────────────────────────────────────────

  private buildGround(): void {
    // Grass plane (large)
    const groundGeo = new THREE.PlaneGeometry(600, 600, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5a9e4a,
      roughness: 0.95,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle grid overlay
    const grid = new THREE.GridHelper(600, 60, 0x3a7a30, 0x3a7a30);
    (grid.material as THREE.Material).opacity = 0.18;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Paths — pale sandy circles connecting facilities
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xd4bc8a, roughness: 0.9 });
    // Main circular path around lake
    const pathRingGeo = new THREE.TorusGeometry(52, 2.5, 4, 80);
    const pathRing = new THREE.Mesh(pathRingGeo, pathMat);
    pathRing.rotation.x = Math.PI / 2;
    pathRing.position.y = 0.03;
    this.scene.add(pathRing);

    // Radial spoke paths
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const spokeGeo = new THREE.PlaneGeometry(3, 55);
      const spoke = new THREE.Mesh(spokeGeo, pathMat);
      spoke.rotation.x = -Math.PI / 2;
      spoke.rotation.z = angle;
      spoke.position.set(Math.cos(angle) * 25, 0.03, Math.sin(angle) * 25);
      this.scene.add(spoke);
    }
  }

  // ─── Populate park ───────────────────────────────────────────────────────────

  private async populate(container: HTMLElement): Promise<void> {
    const im = this.interactionMgr!;
    const origin = new THREE.Vector3(0, 0, 0);

    // Lake at center — radius 35
    this.lake = new Lake(this.scene, origin, 35);

    // Fountain at center of lake
    spawnFountain(this.scene, new THREE.Vector3(0, 0, 0), im);

    // Nature cluster — ring around lake
    spawnNatureCluster(this.scene, origin, { trees: 16, flowers: 28, interaction: im });
    spawnBushRow(this.scene, new THREE.Vector3(-90, 0, -90), 12, 7);
    spawnBushRow(this.scene, new THREE.Vector3(90, 0, -90), 12, 7);
    spawnBushRow(this.scene, new THREE.Vector3(-90, 0, 90), 12, 7);

    // Mini-train — oval loop around lake (rx=70, rz=55)
    this.miniTrain = new MiniTrain(this.scene, im, 70, 55);

    // FerrisWheel — east  (real GLB from poly.pizza OR procedural fallback)
    await this.spawnFerrisWheelGlb(new THREE.Vector3(110, 0, 0), im);

    // Carousel — south-east
    this.carousel = new Carousel(this.scene, new THREE.Vector3(0, 0, 110), im);

    // Hot Air Balloon — real GLB, floating NW
    await this.spawnBalloonGlb(new THREE.Vector3(-30, 50, -50));

    // Birds + swans (swans orbit near lake center)
    this.birdFlock = new BirdFlock(this.scene, origin, origin);

    // Dock — south side of lake
    this.dock = new Dock(this.scene, new THREE.Vector3(0, 0, 52), im);

    // Bumper boats — ON the lake
    this.bumperBoats = new BumperBoats(this.scene, new THREE.Vector3(0, 0.3, 0), 6, im);

    // Benches around the path ring
    await this.spawnBenches();

    // Lamp posts along paths
    await this.spawnLampPosts();

    // Ducks on/near lake
    await this.spawnDucks();

    // Park entrance sign (west)
    this.spawnEntrance(im);

    // Edit mode (press E)
    this.editMode = new EditMode(this.scene, this.camera, container);
  }

  private async spawnFerrisWheelGlb(pos: THREE.Vector3, im: InteractionManager): Promise<void> {
    try {
      const model = await loadGlb('/assets/polypizza/ferris-wheel.glb');
      // Auto-scale: bounding box → target height ~35
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scale = 35 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.copy(pos);
      model.traverse(c => { (c as THREE.Mesh).castShadow = true; });
      this.scene.add(model);
      im.register(model, {
        id: 'ferris-wheel',
        name: '摩天轮',
        description: '公园地标，从顶端可俯瞰整个 Mycelium Park。',
        type: 'ride',
        detail: '票价：¥25/次 · 每圈约4分钟',
      });
      this.ferrisWheel = null; // GLB version — no procedural update needed
    } catch {
      // fallback to procedural
      this.ferrisWheel = new FerrisWheel(this.scene, pos, im);
    }
  }

  private async spawnBalloonGlb(pos: THREE.Vector3): Promise<void> {
    try {
      const model = await loadGlb('/assets/polypizza/hot-air-balloon.glb');
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scale = 25 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.copy(pos);
      this.scene.add(model);
      // Animate manually in update()
      (model as any)._baseY = pos.y;
      (model as any)._isParkBalloon = true;
      this.hotAirBalloon = null; // replaced by GLB
      // Store reference for animation
      (this as any)._balloonGlb = model;
      (this as any)._balloonT = 0;
    } catch {
      this.hotAirBalloon = new HotAirBalloon(this.scene, pos);
    }
  }

  private async spawnBenches(): Promise<void> {
    try {
      const template = await loadGlb('/assets/polypizza/bench.glb');
      const box = new THREE.Box3().setFromObject(template);
      const size = box.getSize(new THREE.Vector3());
      const scale = 5 / Math.max(size.x, size.z, 0.01);

      // 8 benches around the path ring
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = 58;
        const bench = template.clone();
        bench.scale.setScalar(scale);
        bench.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        bench.rotation.y = angle + Math.PI / 2;
        bench.traverse(c => { (c as THREE.Mesh).castShadow = true; });
        this.scene.add(bench);
      }
    } catch { /* skip */ }
  }

  private async spawnLampPosts(): Promise<void> {
    try {
      const template = await loadGlb('/assets/polypizza/lamp-post.glb');
      const box = new THREE.Box3().setFromObject(template);
      const size = box.getSize(new THREE.Vector3());
      const scale = 8 / Math.max(size.y, 0.01);

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r = 64;
        const lamp = template.clone();
        lamp.scale.setScalar(scale);
        lamp.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        lamp.traverse(c => { (c as THREE.Mesh).castShadow = true; });
        this.scene.add(lamp);

        // Point light at lamp top
        const light = new THREE.PointLight(0xffe8a0, 1.5, 30);
        light.position.set(Math.cos(angle) * r, 8, Math.sin(angle) * r);
        this.scene.add(light);
      }
    } catch { /* skip */ }
  }

  private async spawnDucks(): Promise<void> {
    try {
      const template = await loadGlb('/assets/polypizza/duck.glb');
      const box = new THREE.Box3().setFromObject(template);
      const size = box.getSize(new THREE.Vector3());
      const scale = 3 / Math.max(size.x, size.y, size.z, 0.01);

      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const r = 28 + Math.random() * 6;
        const duck = template.clone();
        duck.scale.setScalar(scale);
        duck.position.set(Math.cos(angle) * r, 0.15, Math.sin(angle) * r);
        duck.rotation.y = -angle + Math.PI;
        this.scene.add(duck);
        // Store for bob animation
        const d: any = duck;
        d._duckT = i * 1.2;
        (this as any)._ducks = (this as any)._ducks ?? [];
        (this as any)._ducks.push(duck);
      }
    } catch { /* skip */ }
  }

  private spawnEntrance(im: InteractionManager): void {
    const group = new THREE.Group();
    group.position.set(-90, 0, 0);

    // Gate posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, metalness: 0.2 });
    for (const x of [-5, 5]) {
      const postGeo = new THREE.CylinderGeometry(0.6, 0.8, 10, 8);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 5, 0);
      post.castShadow = true;
      group.add(post);
      // Cap ball
      const capGeo = new THREE.SphereGeometry(0.9, 8, 6);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 10.5, 0);
      group.add(cap);
    }
    // Arch
    const archGeo = new THREE.TorusGeometry(5, 0.5, 6, 20, Math.PI);
    const arch = new THREE.Mesh(archGeo, postMat);
    arch.position.set(0, 10, 0);
    arch.rotation.z = Math.PI;
    group.add(arch);

    // Sign board
    const signGeo = new THREE.BoxGeometry(8, 2, 0.3);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 8, 0);
    group.add(sign);

    this.scene.add(group);
    im.register(group, {
      id: 'entrance',
      name: 'Mycelium Park 入口',
      description: '欢迎来到菌丝公园！点击各设施了解更多。按 E 进入编辑模式。',
      type: 'park',
    });
  }

  // ─── Update loop ─────────────────────────────────────────────────────────────

  public update(): void {
    const delta = this.clock.getDelta();
    this.controls.update();

    this.miniTrain?.update(delta);
    this.lake?.update(delta);
    this.ferrisWheel?.update(delta);
    this.carousel?.update(delta);
    this.hotAirBalloon?.update(delta);
    this.birdFlock?.update(delta);
    this.dock?.update(delta);
    this.bumperBoats?.update(delta);

    // GLB balloon animation
    const balloon = (this as any)._balloonGlb as THREE.Group | undefined;
    if (balloon) {
      (this as any)._balloonT += delta;
      const t = (this as any)._balloonT;
      balloon.position.y = (balloon as any)._baseY + Math.sin(t * 0.28) * 6;
      balloon.rotation.y += delta * 0.05;
    }

    // Duck bobbing
    const ducks: THREE.Group[] = (this as any)._ducks ?? [];
    for (const duck of ducks) {
      const d = duck as any;
      d._duckT += delta;
      duck.position.y = 0.15 + Math.sin(d._duckT * 0.9) * 0.08;
      duck.rotation.y += delta * 0.3;
    }

    this.renderer.render(this.scene, this.camera);
    InfoBubble.getins().update(this.scene, this.camera);
  }

  public dispose(): void {
    this.editMode?.dispose();
  }
}
