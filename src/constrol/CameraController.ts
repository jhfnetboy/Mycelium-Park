import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import CameraControls from 'camera-controls';
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import type { MobileCar } from '../objects/MobileCar';
import { GVar } from '../utils/GVar';

export class CameraController {
    public camera: THREE.PerspectiveCamera;
    public controls: OrbitControls | CameraControls;
    //private container : HTMLElement;
    public targetHeight: number = 140;
    private originalMinPolarAngle: number = 0;
    private originalMaxPolarAngle: number = Math.PI;
    private bPolarAdj: boolean = false;

    protected vec3CamTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    protected bUseCC: boolean = false;
    protected minHeight : number = 35;
    protected maxHeight : number = 120;


    constructor(container: HTMLElement) {
        //this.container = container;

        if (this.bUseCC)
            CameraControls.install({ THREE: THREE });

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            30,
            container.clientWidth / container.clientHeight,
            10,
            400
        );
        //this.camera.position.set(80, 140, 80); //initCamera
        this.camera.position.set(70, 120, 70); //initCamera
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));


        // 创建轨道控制器
        if (this.bUseCC) {
            this.controls = new CameraControls(this.camera, container);
            this.controls.minPolarAngle = 0.08;
            this.controls.maxPolarAngle = Math.PI * 0.46;
            this.bPolarAdj = false;
        }
        else {
            this.controls = new OrbitControls(this.camera, container);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enablePan = true;
            this.controls.enableZoom = true;
            this.controls.zoomSpeed = 1.2;
            this.controls.minDistance = 30;
            this.controls.maxDistance = 350;
            this.controls.screenSpacePanning = false;
            // 解锁垂直旋转：从俯视(5°)到接近水平(83°)
            this.controls.minPolarAngle = 0.08;
            this.controls.maxPolarAngle = Math.PI * 0.46;
            this.bPolarAdj = false;
        }
    }

    /**
     * 使相机绕物体旋转到其前方（沿物体前进方向）
     * @param object - 目标物体
     * @param controls - OrbitControls 实例
     * @param camera - 相机
     * @param distance - 相机与物体的距离（默认 10）
     */
    public lookAtFront(object: MobileCar ) {

        this.completePolarAdj();
        
        let controls : OrbitControls = this.controls  as OrbitControls;
        let camera : THREE.Camera = this.camera;
        // 禁用 OrbitControls 以避免动画冲突
        controls.enabled = false;

        let distance : number = this.camera.position.distanceTo( controls.target );

        // 获取当前相机角度
        const currentTheta = controls.getAzimuthalAngle();
        const currentPhi = controls.getPolarAngle();
        const currentDistance = camera.position.distanceTo(controls.target);

        // 获取物体前进方向
        const objectForward = new THREE.Vector3();
        object.getDirection(objectForward);
        objectForward.negate();

        // 计算目标角度
        const desiredTheta = Math.atan2(objectForward.x, objectForward.z);
        const desiredPhi = Math.acos(Math.max(-1, Math.min(1, objectForward.y)));

        // 规范化方位角差到 [-π, π]
        let deltaTheta = desiredTheta - currentTheta;
        if (deltaTheta > Math.PI) deltaTheta -= 2 * Math.PI;
        if (deltaTheta < -Math.PI) deltaTheta += 2 * Math.PI;

        // 创建 Tween 动画对象
        const tweenObject = { theta: currentTheta, phi: currentPhi, distance: currentDistance };

        // 设置 Tween 动画
        new TWEEN.Tween(tweenObject)
            .to({ theta: currentTheta + deltaTheta, phi: desiredPhi, distance }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                // 计算球面坐标到笛卡尔坐标
                const x = distance * Math.sin(tweenObject.phi) * Math.sin(tweenObject.theta);
                const y = distance * Math.cos(tweenObject.phi);
                const z = distance * Math.sin(tweenObject.phi) * Math.cos(tweenObject.theta);

                // 设置相机位置
                camera.position.copy(controls.target).add(new THREE.Vector3(x, y, z));
                camera.lookAt(controls.target);
            })
            .onComplete(() => {
                // 动画完成后重新启用 OrbitControls
                controls.enabled = true;
                GVar.bCameraAnimState = false;  
                controls.update();
                
            })
            .start();
            GVar.bCameraAnimState = true;
    }


    protected tmpVec3: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    public getLookAtTarget(): THREE.Vector3 {
        if (this.bUseCC) {
            (this.controls as CameraControls).getTarget(this.tmpVec3);
            return this.tmpVec3;
        } else
            return (this.controls as OrbitControls).target;
    }

    public setCameraHeight(height: number): void {
        this.camera.position.y = height;

        this.unlockVerticalRotation();
    }

    public updateHeight(value: number): void {
        // Height control now drives zoom distance via OrbitControls
        const controls = this.controls as OrbitControls;
        const dir = this.camera.position.clone().sub(controls.target).normalize();
        const dist = this.camera.position.distanceTo(controls.target);
        const newDist = Math.max(this.minHeight, Math.min(this.maxHeight * 2.5, dist + value));
        this.camera.position.copy(controls.target.clone().add(dir.multiplyScalar(newDist)));
    }

    // 锁定垂直旋转
    private lockVerticalRotation(): void {
        let currentAngle: number = 0;
        if (this.bUseCC)
            currentAngle = (this.controls as CameraControls).polarAngle;
        else
            currentAngle = (this.controls as OrbitControls).getPolarAngle();
        this.controls.minPolarAngle = currentAngle;
        this.controls.maxPolarAngle = currentAngle;
        this.bPolarAdj = false;
        this.controls.enabled = true;
    }

    // 解除垂直旋转限制
    private unlockVerticalRotation(): void {
        this.controls.minPolarAngle = this.originalMinPolarAngle;
        this.controls.maxPolarAngle = this.originalMaxPolarAngle;
        this.bPolarAdj = true;
        this.controls.enabled = false;
    }

    /**
     * 完成垂直旋转调整，为其它动画做准备.
     */
    protected completePolarAdj() : void{
        if( this.bPolarAdj ){
            this.camera.position.y - this.targetHeight;
            this.camera.lookAt( (this.controls as OrbitControls).target );
            this.lockVerticalRotation();
        }
    }

    public update(): void {
        TWEEN.update();
        if (this.bUseCC)
            (this.controls as CameraControls).update(0.01);
        else
            (this.controls as OrbitControls).update();
    }

    /**
     * 获取旋转角度，根据旋转角度移动场景：
     * @returns 
     */
    public getRotationAngle(): number {
        if (this.bUseCC)
            return (this.controls as CameraControls).polarAngle;
        else
            return (this.controls as OrbitControls).getPolarAngle();
    }

    public getAzimuthalAngle(): number {
        if (this.bUseCC)
            return (this.controls as CameraControls).azimuthAngle;
        else
            return (this.controls as OrbitControls).getAzimuthalAngle();
    }


    public onWindowResize(container: HTMLElement): void {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
    }
}