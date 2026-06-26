import * as THREE from 'three';
import { Renderer } from './Renderer';
import type { IObject } from '../interfaces/IObject';
import { GVar } from '../utils/GVar';
import { AppScene } from './AppScene';
import { BinLoader } from '../loader/BinLoader';
import { BlockLoaded } from '../loader/BlockLoader';
import { CityChunkTbl, type ChunkData } from './CityChunkTbl';
import { CameraController } from '../constrol/CameraController';
import { InputMgr } from '../constrol/InputMgr';
import { SceneMoveController } from '../constrol/SceneMoveController';
import { EventMgr } from '../utils/EventMgr';
import { LightProbeLoader } from '../loader/LightProbeLoader';
import { EXRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { MobileCar } from '../objects/MobileCar';
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

export class SceneManager {
    public scene: THREE.Scene;
    public cameraController: CameraController;
    public renderer: Renderer;
    private objects: IObject[] = [];
    private clock: THREE.Clock;

    //
    //! 输出与相机控制类，与ChunkScene关联，从而场景可以无限循环：
    protected inputMgr: InputMgr = new InputMgr();
    protected smController: SceneMoveController | null = null;
    // ChunkInstance核心数据类:
    protected cityChkTbl: CityChunkTbl | null = null;
    // ChunkScene场景核心组织类：
    protected chunkScene: AppScene | null = null;

    // 
    // 网格坐标,无限循环场景的核心算法类：
    protected gridCoords: THREE.Vector2 = new THREE.Vector2(0, 0);

    //! Environment Llighting:
    protected envLightProbe: LightProbeLoader = LightProbeLoader.getins();
    protected dirLight: THREE.DirectionalLight | null = null;

    protected resizeHandler: any = null;

    // 是否初始化:
    protected bInited: boolean = false;
    //! 记录上一次中心位置，减少无效处理:
    protected iLastCx: number = -100000000;
    protected iLastCy: number = -100000000;

    //! 跟随物品:
    protected followMobile: MobileCar | null = null;
    protected lerpVal : number = 0.01;
    protected interactionMgr: InteractionManager | null = null;
    protected miniTrain: MiniTrain | null = null;
    protected lake: Lake | null = null;
    protected ferrisWheel: FerrisWheel | null = null;
    protected editMode: EditMode | null = null;
    protected carousel: Carousel | null = null;
    protected hotAirBalloon: HotAirBalloon | null = null;
    protected birdFlock: BirdFlock | null = null;
    protected dock: Dock | null = null;
    protected bumperBoats: BumperBoats | null = null;

    constructor(container: HTMLElement) {

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(GVar.FOG_COLOR, GVar.FOG_NEAR, GVar.FOG_FAR);
        this.scene.background = new THREE.Color(GVar.FOG_COLOR);

        // 创建相机控制器
        this.cameraController = new CameraController(container);
        container.addEventListener('contextmenu', function (e) { e.preventDefault(); });

        // 初始化 InfoBubble (CSS2DRenderer)
        InfoBubble.init(container);

        // 
        // 用简版环境光还是复杂版本的环境光:
        if (GVar.bUseProbe) {
            this.envLightProbe.initLightProbe("./assets/environments/envProbe/irradiance.json",
                (light: THREE.LightProbe) => {
                    this.scene.add(light);
                    this.scene.environment = light as any;
                });
        } else {
            this.loadEnvMapLighting();
        }

        // 创建渲染器
        this.renderer = new Renderer(container);
        this.renderer.setSaturation(1.15);
        this.renderer.renderer.setClearColor(GVar.FOG_COLOR);


        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0xcccccc, 0.8);
        this.scene.add(ambientLight);

        // 添加坐标轴
        //const axesHelper = new THREE.AxesHelper(5);
        //this.scene.add(axesHelper);

        // 添加网格
        //const gridHelper = new THREE.GridHelper(20, 20);
        //(gridHelper.material as THREE.Material).opacity = 0.2;
        //(gridHelper.material as THREE.Material).transparent = true;
        //this.scene.add(gridHelper);

        // 初始化时钟
        this.clock = new THREE.Clock();


        // 添加窗口大小调整监听
        this.resizeHandler = () => this.onWindowResize(container);
        window.addEventListener('resize', this.resizeHandler);


        let asce: AppScene = new AppScene();
        asce.initChunks();

        BinLoader.loadBin("./assets/scenes/data/main.bin", (data: ArrayBuffer) => {
            let bl: BlockLoaded = new BlockLoaded(data);
            bl.loadBlock("./assets/scenes/main.json", (obj: any) => {

                if (!obj) return;
                // 下一步需要创建Chunk数据了:
                let arrBlocks: Array<any> = obj.getObjectByName("blocks").children;
                let arrLanes: Array<any> = obj.getObjectByName("lanes").children;
                let arrIntersections: Array<any> = obj.getObjectByName("intersections").children;
                let arrCars: Array<any> = obj.getObjectByName("cars").children;
                let arrClouds: Array<any> = obj.getObjectByName("clouds").children;

                let lenarr: Array<number> = [arrBlocks.length, arrLanes.length, arrIntersections.length, arrCars.length, arrClouds.length];
                console.log("The lenth is:" + JSON.stringify(lenarr));

                this.cityChkTbl = new CityChunkTbl(arrBlocks, arrLanes, arrIntersections, arrCars, arrClouds);
                this.chunkScene = new AppScene();
                this.chunkScene.initChunks();
                this.scene.add(this.chunkScene);


                // 初始化方向光：
                this.dirLight = this.renderer.initDirLight();
                this._resizeShadowMapFrustum(window.innerWidth, window.innerHeight);
                this.chunkScene.add(this.dirLight);
                this.chunkScene.add(this.dirLight.target);

                // 初始化keyEvent:
                this.initKeyEvent();

                // 
                // 处理smController:
                this.smController = new SceneMoveController(this.inputMgr, this.chunkScene, this.cameraController);

                // 第一次刷新测试效果：
                this.refreshChunkScene();

                // 响应chunkMove的消息处理与刷新：
                EventMgr.getins().on("chunkmove", (xoff: number, yoff: number) => {

                    this.iLastCx = xoff;
                    this.iLastCy = yoff;
                    this.gridCoords.x += xoff;
                    this.gridCoords.y += yoff;

                    this.refreshChunkScene();
                });
                this.cameraController.setCameraHeight(200);

                this.bInited = true;
                this.inputMgr.on("mousewheel", (value: any) => {
                    if (value.shiftKey && !GVar.bCameraAnimState)
                        this.cameraController.updateHeight(value.deltaY * .05);
                });

                // 处理点击效果（原有车辆点击保留）：
                this.inputMgr.on("startdrag", (evt: any) => {
                    this.onMousePickCar(evt);
                });

                // 初始化点击交互系统
                this.interactionMgr = new InteractionManager(
                    this.cameraController.camera, this.scene, container
                );
                this.spawnDemoInteractables();
                this.spawnParkNature();
                this.miniTrain = new MiniTrain(this.scene, this.interactionMgr ?? undefined);
                this.lake = new Lake(this.scene, new THREE.Vector3(60, 0, 30), 28);
                this.ferrisWheel = new FerrisWheel(
                    this.scene,
                    new THREE.Vector3(30, 0, 0),
                    this.interactionMgr ?? undefined
                );
                this.editMode = new EditMode(this.scene, this.cameraController.camera, container);
                this.spawnActivities();
            });

        });
    }
    protected mTw: any = null;

    /**
     * 处理鼠标选择场景内物品:
     * @param evt 
     */
    protected onMousePickCar(evt: any): void {
        // 找出Ray，并与场景的Mob物品做相交测试:
        let raycaster = new THREE.Raycaster();
        // 将鼠标点击位置转换为 WebGL 坐标系 (-1 到 1)
        let tmpVec2 = new THREE.Vector2((evt.x / GVar.gWidth) * 2 - 1, -(evt.y / GVar.gHeight) * 2 + 1);

        // WORK START: 此处的算法有问题，必须解决鼠标选取的逻辑：
        raycaster.setFromCamera(tmpVec2, this.cameraController.camera);

        var intersectors = raycaster.intersectObjects(this.chunkScene!.getPickables());
        if (intersectors.length > 0) {
            let insectObj = intersectors[0].object;

            // 
            // 是否显示调试信息:
            /*
            if (GVar.bVisDebug) {
                let arr: Array<any> = this.chunkScene!.getPickables();
                for (let ti: number = 0; ti < arr.length; ti++)
                    arr[ti].visible = false;
                insectObj.visible = true;
            }*/

            let cx: number = (insectObj as any).userData["centeredX"];
            let cy: number = (insectObj as any).userData["centeredY"];

            let ckContainer: any = this.chunkScene?.getChunkContainer(cx, cy);
            let chunkIns: any = ckContainer.getObjectByName("chunk");
            let bFollow : boolean = false;

            if (chunkIns && chunkIns.children.length > 0) {
                // 找到当前的模块与相邻模块上所有的小汽车,做相交测试:
                const neighboringCars: Array<MobileCar> = this.cityChkTbl!.getNeighboringCars(chunkIns.children[0]);

                // 所有的碰撞Car切换颜色：
                let meshArr: Array<any> = [];
                for (let ti: number = 0; ti < neighboringCars.length; ti++) {
                    neighboringCars[ti].setDebugBoxColor(0x00ff33, true);
                    meshArr.push(neighboringCars[ti].getMeshObj());
                }
                tmpVec2 = new THREE.Vector2((evt.x / GVar.gWidth) * 2 - 1, -(evt.y / GVar.gHeight) * 2 + 1);
                raycaster.setFromCamera(tmpVec2, this.cameraController.camera);
                intersectors = raycaster.intersectObjects(meshArr, true);
                if (intersectors.length > 0) {
                    for (let ti: number = 0; ti < intersectors.length; ti++) {
                        if (intersectors[ti].object.parent && (intersectors[ti].object.parent?.userData['type'] == "mobileCar")) {
                            let car: MobileCar = intersectors[ti].object.parent as MobileCar;
                            car.setDebugBoxColor(0xff00ff, true);
                            this.followMobile = car;
                            // 
                            // 顺便旋转相机的方向:
                            this.cameraController.lookAtFront( car );
                            
                            bFollow = true;
                        }
                    }
                }
                // 
                //　点击空白地面，切换自动跟随模式：
                if( !bFollow ) 
                    this.followMobile = null;
            }
        }

    }

    protected updateFollow(): void {
        if (!this.followMobile) return;

        let wpos: THREE.Vector3 = new THREE.Vector3();
        let orbit: OrbitControls = this.cameraController.controls as OrbitControls;
        let offset: THREE.Vector3 = this.cameraController.camera!.position.clone().sub(orbit.target);
        this.followMobile.getWorldPosition(wpos);

        //orbit.target.copy(wpos);
        orbit.target.lerp( wpos,this.lerpVal );
        const newPos: THREE.Vector3 = orbit.target.clone().add(offset);
        this.cameraController.camera!.position.copy(newPos);
    }

    /**
     * 加载全局的环境光数据:
     */
    protected loadEnvMapLighting(): void {
        // ⚙️ 创建环境贴图生成器
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer.renderer);
        pmremGenerator.compileEquirectangularShader();
        // 🔧 加载 .exr 文件
        new EXRLoader()
            .load('./assets/environments/DayStreet.exr', (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;

                // 生成环境贴图
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;

                // 应用到场景
                this.scene.environment = envMap;
                //this.scene.background = envMap; // 如果想让它作为背景

                texture.dispose();
                pmremGenerator.dispose();
            });
    }

    /**
     * 窗口大小变化时，阴影贴图需要重新计算：
     * window.innerWidth, window.innerHeight
     * @param wid 
     * @param hei 
     */
    protected _resizeShadowMapFrustum(wid: number, hei: number): void {
        var start = 1.25;
        var childStartView2 = Math.max(wid / hei, start);
        var halfHeight = 75 * childStartView2;
        this.dirLight!.shadow.camera.left = .9 * -halfHeight;
        this.dirLight!.shadow.camera.right = 1.3 * halfHeight;
        this.dirLight!.shadow.camera.top = halfHeight;
        this.dirLight!.shadow.camera.bottom = -halfHeight;
        this.dirLight!.shadow.camera.updateProjectionMatrix();
    }



    // 
    // 最核心的场景可视化函数：检测需要删除和重新安装的chunk数据，第一次初始化的时候，
    // remove的空，但会add上去一个新的结点,需要确认 v 是如何获取的，results
    protected refreshChunkScene(): void {

        this.chunkScene!.forEachChunk((chunkContainer: any, xOffset: number, yOffset: number) => {
            var xcor = this.gridCoords.x + xOffset;
            var ycor = this.gridCoords.y + yOffset;
            var v: ChunkData | null = this.cityChkTbl!.getChunkData(xcor, ycor);
            if (!v) return;
            chunkContainer.remove(chunkContainer.getObjectByName("chunk"));
            chunkContainer.add(v.node);
        });
    }

    /**
     * 从碰撞Mesh获取对应的ChunkInstances.
     * @param x 
     * @param y 
     * @returns 
     */
    public getChunkInsFromColMesh(x: number, y: number): any {
        let chunkIns: any = null;
        this.chunkScene!.forEachChunk((chunkContainer: any, xOffset: number, yOffset: number) => {
            if (x != xOffset && y != yOffset)
                return;
            chunkIns = chunkContainer.getObjectByName("chunk");
        });

        return chunkIns;
    }

    public addObject(object: IObject): void {
        this.objects.push(object);
        this.scene.add(object.mesh);
    }

    public removeObject(object: IObject): void {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.scene.remove(object.mesh);
            this.objects.splice(index, 1);
        }
    }

    public removeAllObjects(): void {
        this.objects.forEach(obj => {
            this.scene.remove(obj.mesh);
            if (obj.dispose) obj.dispose();
        });
        this.objects = [];
        this.followMobile = null;
    }

    public update(): void {
        const delta: number = this.clock.getDelta();
        const elapsed: number = this.clock.getElapsedTime();


        // 更新所有对象
        this.objects.forEach(obj => {
            obj.update(delta);
        });

        // 更新相机跟限：
        this.updateFollow();

        // 更新相机控制器
        this.cameraController.update();

        //! SceneMoveController:
        if (this.bInited)
            this.smController?.update();

        // 
        // CityTable内可移动元素更新：
        this.cityChkTbl?.update({ delta: delta, elapsed: elapsed });


        // 更新小火车 & 湖泊 & 摩天轮 & 活动设施
        this.miniTrain?.update(delta);
        this.lake?.update(delta);
        this.ferrisWheel?.update(delta);
        this.carousel?.update(delta);
        this.hotAirBalloon?.update(delta);
        this.birdFlock?.update(delta);
        this.dock?.update(delta);
        this.bumperBoats?.update(delta);

        // 渲染场景
        this.renderer.render(this.scene, this.cameraController.camera);
        // CSS2D 气泡叠加渲染
        InfoBubble.getins().update(this.scene, this.cameraController.camera);
    }

    private onWindowResize(container: HTMLElement): void {
        this.cameraController.onWindowResize(container);
        this.renderer.onWindowResize(container);
    }

    protected mRotY: number = 0;
    protected initKeyEvent(): void {
        window.addEventListener("keydown", (event) => {
            if (event.key === 'z') {
                this.cameraController.lookAtFront( this.followMobile as MobileCar );
            }
        });
    }

    /** 异步加载 Kenney 自然素材，散布树木/花朵/喷泉 */
    private spawnParkNature(): void {
        const center = new THREE.Vector3(0, 0, 0);
        spawnNatureCluster(this.scene, center, {
            trees: 10, flowers: 18, interaction: this.interactionMgr ?? undefined
        });
        spawnFountain(this.scene, new THREE.Vector3(0, 0, 0), this.interactionMgr ?? undefined);
        spawnBushRow(this.scene, new THREE.Vector3(-40, 0, 20), 8, 6);
        spawnBushRow(this.scene, new THREE.Vector3(-40, 0, -20), 8, 6);
    }

    /** 生成公园活动设施：旋转木马、热气球、鸟群、码头、碰碰船 */
    private spawnActivities(): void {
        const im = this.interactionMgr ?? undefined;
        const lakeCenter = new THREE.Vector3(60, 0, 30);

        // 旋转木马 — 公园东南角
        this.carousel = new Carousel(this.scene, new THREE.Vector3(0, 0, 80), im);

        // 热气球 — 公园正上方悬浮
        this.hotAirBalloon = new HotAirBalloon(this.scene, new THREE.Vector3(20, 55, -20), im);

        // 鸟群 + 天鹅（构造函数内创建，以湖中心为天鹅基点）
        this.birdFlock = new BirdFlock(this.scene, new THREE.Vector3(0, 0, 0));

        // 码头 — 湖南侧边缘
        this.dock = new Dock(this.scene, new THREE.Vector3(lakeCenter.x, 0, lakeCenter.z + 30), im);

        // 碰碰船 — 在湖中心区域巡逻
        this.bumperBoats = new BumperBoats(this.scene, lakeCenter, 6, im);
    }

    /** 放置静态标志物：公园入口 + 咖啡厅（摩天轮已迁移到 FerrisWheel 类） */
    private spawnDemoInteractables(): void {
        // 公园入口牌
        const gate = new THREE.Mesh(
            new THREE.BoxGeometry(6, 8, 1),
            new THREE.MeshStandardMaterial({ color: 0x2d6a4f })
        );
        gate.position.set(-20, 4, 0);
        this.scene.add(gate);
        this.interactionMgr!.register(gate, {
            id: 'park-entrance',
            name: 'Mycelium Park 入口',
            description: '欢迎来到菌丝公园！点击各设施了解更多。',
            type: 'park',
        });

        // 咖啡厅占位
        const cafe = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 8),
            new THREE.MeshStandardMaterial({ color: 0xa8dadc })
        );
        cafe.position.set(0, 2.5, -30);
        this.scene.add(cafe);
        this.interactionMgr!.register(cafe, {
            id: 'cafe-01',
            name: '树荫咖啡厅',
            description: '提供手冲咖啡、甜点和轻食。',
            type: 'food',
            detail: '营业时间 8:00–20:00',
        });
    }

    public dispose(): void {
        this.removeAllObjects();
        this.renderer.dispose();

        // 
        // 移除事件监听：
        window.removeEventListener('resize', this.resizeHandler);
        this.renderer.renderer.domElement.removeEventListener('mousemove', () => { });
    }
}

/*
import { CityLoader } from './CityLoader';
import { MiscFunc } from '../utils/MiscFunc';

        // 加载City:
        // const cityLoader = new CityLoader(this.scene);
        // cityLoader.loadClusters();

let images: any = obj.userData["images"];
let arrtex: any = obj.userData["textures"];
                    
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({ map: arrtex['0E12E1AB-1D22-4642-BFB5-BC955808BB55'] });
const cube = new THREE.Mesh(geometry, material);
this.scene.add(cube);

let tmesh : any = arrBlocks[0];
tmesh.position.set(0, 0, 0);
this.scene.add(tmesh);*/



 //(this.cameraController.controls as OrbitControls).target.copy(car.position);
 // 创建 Tween 对象
 // 
 // WORK START: 处理好TWEEN对象.
 /*
 let wpos: THREE.Vector3 = new THREE.Vector3();
 let orbit: OrbitControls = this.cameraController.controls as OrbitControls;
 let offset: THREE.Vector3 = this.cameraController.camera!.position.clone().sub(orbit.target);
 car.getWorldPosition(wpos);*/
 /*
 new TWEEN.Tween(orbit.target) // 起始值
     .to({ x: wpos.x, z: wpos.z }, 800) // 结束值和动画时间（毫秒）
     .onUpdate( ()=>{
         orbit.update();
         const newPos : THREE.Vector3 = orbit.target.clone().add(offset);
         this.cameraController.camera!.position.copy(newPos);
     }).start();
 this.followMobile = car;
 orbit.target.lerp( wpos,this.lerpVal );
 const newPos: THREE.Vector3 = orbit.target.clone().add(offset);
 this.cameraController.camera!.position.copy(newPos);
 */
