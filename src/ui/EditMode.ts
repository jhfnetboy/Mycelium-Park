import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type ParkItemType = 'tree' | 'flower' | 'bush' | 'bench' | 'lamp';

const ITEM_CATALOG: Record<ParkItemType, { url: string; label: string; scale: number }> = {
  tree:   { url: '/assets/kenney/nature/tree_pineRoundB.glb', label: '🌳 树', scale: 1.2 },
  flower: { url: '/assets/kenney/nature/flower_yellowA.glb',  label: '🌼 花', scale: 1.5 },
  bush:   { url: '/assets/kenney/nature/plant_bush.glb',      label: '🌿 灌木', scale: 1.2 },
  bench:  { url: '/assets/kenney/nature/path_stone.glb',      label: '🪨 小径石', scale: 1.0 },
  lamp:   { url: '/assets/kenney/nature/grass.glb',           label: '🌱 草丛', scale: 1.0 },
};

const loader = new GLTFLoader();

function loadGlb(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => loader.load(url, g => resolve(g.scene), undefined, reject));
}

export class EditMode {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private container: HTMLElement;
  private active = false;
  private selectedType: ParkItemType = 'tree';
  private ghost: THREE.Group | null = null;
  private placed: THREE.Group[] = [];
  private ground: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-9999, -9999);
  private toolbar: HTMLElement;

  constructor(scene: THREE.Scene, camera: THREE.Camera, container: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    this.ground = this.makeGround();
    this.toolbar = this.buildToolbar();
    document.body.appendChild(this.toolbar);
    this.toggleToolbar(false);

    container.addEventListener('pointermove', e => this.onMove(e));
    container.addEventListener('click', e => this.onClick(e));
    window.addEventListener('keydown', e => { if (e.key === 'e' || e.key === 'E') this.toggle(); });
  }

  private makeGround(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(500, 500);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'edit-ground';
    mesh.position.y = 0.01;
    this.scene.add(mesh);
    return mesh;
  }

  private buildToolbar(): HTMLElement {
    const bar = document.createElement('div');
    bar.id = 'edit-toolbar';
    bar.innerHTML = `
      <div class="edit-header">✏️ 编辑模式 <kbd>E</kbd> 退出</div>
      <div class="edit-items"></div>
      <div class="edit-hint">点击放置 · 右键移除</div>
    `;
    const itemsDiv = bar.querySelector('.edit-items')!;
    (Object.keys(ITEM_CATALOG) as ParkItemType[]).forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'edit-btn';
      btn.dataset['type'] = type;
      btn.textContent = ITEM_CATALOG[type].label;
      btn.addEventListener('click', () => this.selectType(type));
      itemsDiv.appendChild(btn);
    });
    return bar;
  }

  private toggleToolbar(show: boolean): void {
    this.toolbar.style.display = show ? 'flex' : 'none';
  }

  public toggle(): void {
    this.active = !this.active;
    this.toggleToolbar(this.active);
    this.container.style.cursor = this.active ? 'crosshair' : 'default';
    if (!this.active && this.ghost) {
      this.scene.remove(this.ghost);
      this.ghost = null;
    }
    if (this.active) this.loadGhost(this.selectedType);
  }

  public get isActive(): boolean { return this.active; }

  private selectType(type: ParkItemType): void {
    this.selectedType = type;
    this.toolbar.querySelectorAll('.edit-btn').forEach(b => b.classList.remove('selected'));
    this.toolbar.querySelector(`[data-type="${type}"]`)?.classList.add('selected');
    if (this.ghost) this.scene.remove(this.ghost);
    this.ghost = null;
    this.loadGhost(type);
  }

  private async loadGhost(type: ParkItemType): Promise<void> {
    const { url, scale } = ITEM_CATALOG[type];
    try {
      const model = await loadGlb(url);
      model.scale.setScalar(scale);
      model.traverse(c => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          const mat = (m.material as THREE.MeshStandardMaterial).clone();
          mat.transparent = true;
          mat.opacity = 0.55;
          m.material = mat;
        }
      });
      if (this.ghost) this.scene.remove(this.ghost);
      this.ghost = model;
      this.scene.add(model);
    } catch { /* skip */ }
  }

  private hitGround(e: PointerEvent): THREE.Vector3 | null {
    const rect = this.container.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.ground);
    return hits.length > 0 ? hits[0].point.clone() : null;
  }

  private onMove(e: PointerEvent): void {
    if (!this.active || !this.ghost) return;
    const pt = this.hitGround(e);
    if (pt) this.ghost.position.copy(pt);
  }

  private onClick(e: MouseEvent): void {
    if (!this.active) return;
    if (e.button === 2) return; // right-click handled below
    const pt = this.hitGround(e as PointerEvent);
    if (!pt) return;
    this.placeItem(this.selectedType, pt);
  }

  private async placeItem(type: ParkItemType, position: THREE.Vector3): Promise<void> {
    const { url, scale } = ITEM_CATALOG[type];
    try {
      const model = await loadGlb(url);
      model.scale.setScalar(scale);
      model.position.copy(position);
      model.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(model);
      this.placed.push(model);
    } catch { /* skip */ }
  }

  public removeNearest(worldPos: THREE.Vector3, threshold = 5): void {
    let nearest: THREE.Group | null = null;
    let minDist = Infinity;
    for (const obj of this.placed) {
      const d = obj.position.distanceTo(worldPos);
      if (d < minDist) { minDist = d; nearest = obj; }
    }
    if (nearest && minDist < threshold) {
      this.scene.remove(nearest);
      this.placed.splice(this.placed.indexOf(nearest), 1);
    }
  }

  public update(): void {
    // ghost tracks mouse — driven by pointermove, nothing extra needed
  }
}
