# Mycelium Park — 开发计划

## Phase 1：摄像机自由控制 🎥
> 当前问题：极角（上下）被锁死，只能水平旋转；滚轮只改高度不 zoom

- [x] 解锁极角——允许上下拖拽从俯视切到街道视角（minPolar=5°, maxPolar=82°）
- [ ] 右键拖拽 = 平移（pan），左键拖拽 = 旋转（orbit）
- [ ] 滚轮 = 真实 zoom（改距离），同时保留 Shift+滚轮 = 改高度
- [ ] 双击地面 → 摄像机飞到该位置的近景视角（TWEEN动画）
- [ ] 移动端双指捏合缩放

## Phase 2：点击交互系统 💬
> 当前：只有点击汽车才会触发 raycasting，且仅改变跟随状态

- [ ] 抽象 InteractionManager：统一管理 raycasting + hover + click
- [ ] 点击任意对象 → 读取 userData.info 弹出信息气泡
- [ ] InfoBubble 组件（CSS2DRenderer，HTML overlay 跟随 3D 位置）
  - 显示：名称、描述、图标
  - 点击其他地方关闭
- [ ] Hover 效果：鼠标悬停时对象轮廓高亮（OutlinePass）
- [ ] 点击人物 → 对话气泡（支持多行文字+头像占位）
- [ ] 点击建筑/设施 → 设施介绍气泡（营业时间、简介等）

## Phase 3：公园核心设施 🎡
> 用新的 park block 替换现有城市街区

- [ ] **摩天轮**：Eight 型几何体，每帧 rotation.z += speed，点击显示介绍
- [ ] **小火车**：CatmullRomCurve3 定义轨道，train.position 沿曲线插值
- [ ] **湖泊**：PlaneGeometry + Three.js Water2 Shader（waves + 反射）
- [ ] **人群**：简单胶囊体人形 + AnimationMixer（idle/walk 动画），随机路径游走
- [ ] **商店/餐厅**：复用现有 coffeeshop/fastfood/shops.gltf，挂 userData.info
- [ ] **树木**：three-low-poly 几何体或 Kenney Nature Kit gltf
- [ ] **天空**：Three.js Sky shader（太阳位置 + 散射）

## Phase 4：数据层 📊
- [ ] `src/data/facilities.json`：每个设施的 id、名称、描述、类型、坐标
- [ ] 设施类型枚举：food / ride / nature / info
- [ ] 点击 → 查 facilities.json → 渲染信息气泡
- [ ] 未来可对接后端 API（预留接口）

## Phase 5：视觉打磨 ✨
- [ ] MeshToonMaterial 全场景替换（卡通渐变光照）
- [ ] OutlinePass 描边后处理
- [ ] 昼夜循环（DirectionalLight 角度渐变 + 天空颜色变化）
- [ ] 雾效调优（近距离更清晰）
- [ ] 加载动画（进度条 + 城市生长效果）

---

## 当前进度

| Phase | 状态 | 备注 |
|-------|------|------|
| Phase 1 摄像机 | 🚧 进行中 | 解锁极角已实现 |
| Phase 2 交互 | ⬜ 待开始 | |
| Phase 3 设施 | ⬜ 待开始 | |
| Phase 4 数据 | ⬜ 待开始 | |
| Phase 5 视觉 | ⬜ 待开始 | |

---

## 技术笔记

### 摄像机坐标系
- 相机初始位置：(70, 120, 70)，lookAt (0,0,0)
- polarAngle = 0 → 正上方俯视；= π/2 → 水平；= π → 从下往上
- 合理范围：minPolar=0.08（约5°，接近俯视）, maxPolar=1.45（约83°，接近水平）
- 高度范围：35（街道层）~ 200（鸟瞰）

### Raycasting 注意事项
- chunkScene.getPickables() 当前只返回汽车碰撞盒
- 扩展时需要给每个可交互对象 set userData: { type, id, info }
- CSS2DRenderer 要叠加在 WebGL canvas 之上（position: absolute）

### 无限城市算法
- gridCoords 记录当前中心格坐标
- CityChunkTbl 维护所有 block 的循环复用池
- refreshChunkScene() 在 gridCoords 变化时重新分配 chunk 到视野内位置
