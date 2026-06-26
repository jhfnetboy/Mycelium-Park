import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export interface FacilityInfo {
  id: string;
  name: string;
  description: string;
  type: 'park' | 'food' | 'ride' | 'nature' | 'person';
  detail?: string;
}

export class InfoBubble {
  private static instance: InfoBubble;
  public labelRenderer: CSS2DRenderer;
  private currentLabel: CSS2DObject | null = null;
  private currentTarget: THREE.Object3D | null = null;

  private constructor(container: HTMLElement) {
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);
  }

  public static init(container: HTMLElement): InfoBubble {
    InfoBubble.instance = new InfoBubble(container);
    return InfoBubble.instance;
  }

  public static getins(): InfoBubble {
    return InfoBubble.instance;
  }

  public show(target: THREE.Object3D, info: FacilityInfo): void {
    this.hide();

    const inner = document.createElement('div');
    inner.className = 'bubble-inner';

    const icon = document.createElement('span');
    icon.className = 'bubble-type';
    icon.textContent = this.typeIcon(info.type);
    inner.appendChild(icon);

    const name = document.createElement('strong');
    name.textContent = info.name;
    inner.appendChild(name);

    const desc = document.createElement('p');
    desc.textContent = info.description;
    inner.appendChild(desc);

    if (info.detail) {
      const detail = document.createElement('small');
      detail.textContent = info.detail;
      inner.appendChild(detail);
    }

    const arrow = document.createElement('div');
    arrow.className = 'bubble-arrow';

    const div = document.createElement('div');
    div.className = 'info-bubble';
    div.appendChild(inner);
    div.appendChild(arrow);

    const label = new CSS2DObject(div);
    label.position.set(0, 8, 0);
    target.add(label);

    this.currentLabel = label;
    this.currentTarget = target;
  }

  public hide(): void {
    if (this.currentLabel && this.currentTarget) {
      this.currentTarget.remove(this.currentLabel);
      this.currentLabel = null;
      this.currentTarget = null;
    }
  }

  public isVisible(): boolean {
    return this.currentLabel !== null;
  }

  public update(scene: THREE.Scene, camera: THREE.Camera): void {
    this.labelRenderer.render(scene, camera);
  }

  public onResize(container: HTMLElement): void {
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
  }

  private typeIcon(type: FacilityInfo['type']): string {
    const icons: Record<string, string> = {
      park: '🌳', food: '🍔', ride: '🎡', nature: '🌸', person: '🧑'
    };
    return icons[type] ?? '📍';
  }
}
