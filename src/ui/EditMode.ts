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

function disposeGroup(group: THREE.Group): void {
  group.traverse(c => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mat = m.material;
    if (Array.isArray(mat)) mat.forEach(x => x.dispose());
    else (mat as THREE.Material)?.dispose();
  });
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
  private loadId = 0;

  // stored for dispose()
  private onMoveH: (e: PointerEvent) => void;
  private onClickH: (e: MouseEvent) => void;
  private onContextH: (e: MouseEvent) => void;
  private onKeyH: (e: KeyboardEvent) => void;

  constructor(scene: THREE.Scene, camera: THREE.Camera, container: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    this.ground = this.makeGround();
    this.toolbar = this.buildToolbar();
    document.body.appendChild(this.toolbar);
    this.toggleToolbar(false);

    this.onMoveH = (e) => this.onMove(e);
    this.onClickH = (e) => this.onClick(e);
    this.onContextH = (e) => this.onContextMenu(e);
    this.onKeyH = (e) => { if (e.key === 'e' || e.key === 'E') this.toggle(); };

    container.addEventListener('pointermove', this.onMoveH);
    container.addEventListener('click', this.onClickH);
    container.addEventListener('contextmenu', this.onContextH);
    window.addEventListener('keydown', this.onKeyH);
  }

  public dispose(): void {
    this.container.removeEventListener('pointermove', this.onMoveH);
    this.container.removeEventListener('click', this.onClickH);
    this.container.removeEventListener('contextmenu', this.onContextH);
    window.removeEventListener('keydown', this.onKeyH);
    if (this.ghost) { disposeGroup(this.ghost); this.scene.remove(this.ghost); }
    this.scene.remove(this.ground);
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();
    document.body.removeChild(this.toolbar);
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
      disposeGroup(this.ghost);
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
    this.loadGhost(type);
  }

  private async loadGhost(type: ParkItemType): Promise<void> {
    const id = ++this.loadId;
    const { url, scale } = ITEM_CATALOG[type];
    try {
      const model = await loadGlb(url);
      // stale load: a newer loadGhost was started while we awaited
      if (id !== this.loadId) { disposeGroup(model); return; }
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
      if (this.ghost) { disposeGroup(this.ghost); this.scene.remove(this.ghost); }
      this.ghost = model;
      this.scene.add(model);
    } catch { /* skip on load error */ }
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
    const pt = this.hitGround(e as PointerEvent);
    if (!pt) return;
    this.placeItem(this.selectedType, pt);
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    if (!this.active) return;
    const pt = this.hitGround(e as PointerEvent);
    if (pt) this.removeNearest(pt);
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
      disposeGroup(nearest);
      this.scene.remove(nearest);
      this.placed.splice(this.placed.indexOf(nearest), 1);
    }
  }

  public update(): void {
    // ghost tracks mouse — driven by pointermove, nothing extra needed
  }
}
