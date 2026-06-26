import * as THREE from 'three';
import { InfoBubble, type FacilityInfo } from './InfoBubble';

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.Camera;
  private pickables: THREE.Object3D[] = [];
  private hoveredObj: THREE.Object3D | null = null;

  constructor(camera: THREE.Camera, _scene: THREE.Scene, container: HTMLElement) {
    this.camera = camera;

    container.addEventListener('click', (e) => this.onClick(e, container));
    container.addEventListener('mousemove', (e) => this.onHover(e, container));
  }

  public register(obj: THREE.Object3D, info: FacilityInfo): void {
    obj.userData['facilityInfo'] = info;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData['facilityInfo'] = info;
        child.userData['pickableRoot'] = obj;
      }
    });
    this.pickables.push(obj);
  }

  private onClick(e: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes: THREE.Object3D[] = [];
    this.pickables.forEach(p => p.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); }));

    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const root: THREE.Object3D = hits[0].object.userData['pickableRoot'] ?? hits[0].object;
      const info: FacilityInfo = hits[0].object.userData['facilityInfo'];
      if (info) {
        InfoBubble.getins().show(root, info);
        return;
      }
    }
    // click on empty space → close bubble
    InfoBubble.getins().hide();
  }

  private onHover(e: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes: THREE.Object3D[] = [];
    this.pickables.forEach(p => p.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); }));

    const hits = this.raycaster.intersectObjects(meshes, false);
    const hit = hits.length > 0 ? (hits[0].object.userData['pickableRoot'] ?? hits[0].object) : null;

    if (hit !== this.hoveredObj) {
      if (this.hoveredObj) this.setHighlight(this.hoveredObj, false);
      if (hit) this.setHighlight(hit, true);
      this.hoveredObj = hit;
      container.style.cursor = hit ? 'pointer' : 'default';
    }
  }

  private setHighlight(obj: THREE.Object3D, on: boolean): void {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (on && !(mesh as any)._matCloned) {
        mesh.material = (mesh.material as THREE.Material).clone();
        (mesh as any)._matCloned = true;
      }
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.emissive) return;
      if (on) {
        (mesh as any)._origEmissive = mat.emissive.clone();
        mat.emissive.set(0x224422);
      } else {
        if ((mesh as any)._origEmissive) mat.emissive.copy((mesh as any)._origEmissive);
      }
    });
  }
}
