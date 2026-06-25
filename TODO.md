# Mycelium Park — 开发计划

## Phase 1：摄像机自由控制 🎥 ✅
- [x] 解锁极角——允许上下拖拽从俯视切到街道视角（minPolar=5°, maxPolar=82°）
- [x] 滚轮 = 真实 zoom（改距离）Shift+滚轮 = 改高度
- [ ] 右键拖拽 = 平移（pan），左键拖拽 = 旋转（orbit）
- [ ] 双击地面 → 摄像机飞到该位置（TWEEN动画）
- [ ] 移动端双指捏合缩放

## Phase 2：点击交互系统 💬 ✅ — PR #1 merged
- [x] InteractionManager：raycasting + hover highlight + click
- [x] InfoBubble（CSS2DRenderer，HTML overlay 跟随 3D 位置）
- [x] 点击建筑/设施 → 气泡（名称、描述、图标、营业时间）
- [x] Hover 效果：emissive 高亮 + cursor:pointer
- [ ] 点击人物 → 对话气泡（多行文字+头像）

## Phase 3a：自然素材 🌳🌸 — PR #2
- [x] 31 个 Kenney CC0 GLB 入库（trees/flowers/fountain/train/commercial）
- [x] spawnNatureCluster()：随机散布 10 棵树 + 18 朵花
- [x] spawnFountain()：中心喷泉（可点击）
- [x] spawnBushRow()：灌木绿篱

## Phase 3b：小火车 🚂 — PR #3
- [x] CatmullRomCurve3 椭圆轨道（55×40）+ 可视棕色轨迹线
- [x] 3节车厢（engine + connector + car），沿轨道平滑移动并朝前
- [x] 点击火车头 → 气泡（免费乘坐，3分钟一圈）

## Phase 3c：湖泊水面 🏞️ — PR #4
- [x] 自定义 GLSL ShaderMaterial：顶点涟漪 + 动态环形纹理 + 高光
- [x] CircleGeometry 圆形湖，fountain-center.glb 居中
- [x] 4 个睡莲荷叶

## Phase 3d：摩天轮 🎡 — PR #5
- [x] 完整几何体（支撑腿+轴+轮毂+轮辋+辐条+10节车厢）
- [x] 车厢随轮旋转但逆补偿保持水平（重力效果）
- [x] 点击 → 气泡（高32m，10个车厢，营业时间）

## Phase 4：编辑模式 ✏️ — PR #6
- [x] 按 E 进入/退出编辑模式
- [x] 半透明 ghost 模型随鼠标移动预览
- [x] 左键点击地面 → 放置选中类型的公园元素
- [x] 5种物品（树/花/灌木/石/草）可选
- [x] 绿色 glassmorphism 工具栏 UI

## Phase 5：视觉打磨 ✨（待开始）
- [ ] MeshToonMaterial 卡通渐变光照
- [ ] OutlinePass 描边后处理
- [ ] 昼夜循环
- [ ] 天空 Shader（Three.js Sky）
- [ ] 加载动画

---

## 当前进度

| Phase | 状态 | PR |
|-------|------|----|
| Phase 1 摄像机 | ✅ 完成 | main tag v0.1.0-phase1 |
| Phase 2 交互 | ✅ 完成 | PR #1 |
| Phase 3a 自然素材 | ✅ 完成 | PR #2 |
| Phase 3b 小火车 | ✅ 完成 | PR #3 |
| Phase 3c 湖泊水面 | ✅ 完成 | PR #4 |
| Phase 3d 摩天轮 | ✅ 完成 | PR #5 |
| Phase 4 编辑模式 | ✅ 完成 | PR #6 |
| Phase 5 视觉打磨 | ⬜ 待开始 | — |

---

## Kenney Assets（public/assets/kenney/）

| 目录 | 文件数 | 用途 |
|------|--------|------|
| nature/ | 14 | 树×5、花×9、草、路石、灌木 |
| train/ | 7 | 火车头×2、连接节、轨道、弯道×2 |
| fountain/ | 4 | 喷泉各形态 + 绿篱门 |
| commercial/ | 3 | 建筑×2、遮阳伞 |

原始 zip/解压目录在 `kenney-assets/`（gitignored）。

---

## 技术笔记

### 摄像机坐标系
- 相机初始位置：(70, 120, 70)，lookAt (0,0,0)
- polarAngle = 0 → 正上方俯视；= π/2 → 水平；= π → 从下往上
- 合理范围：minPolar=0.08（约5°），maxPolar=1.45（约83°）
- 高度范围：35（街道层）~ 200（鸟瞰）

### 场景布局（世界坐标）
- 原点 (0,0,0)：城市主体 + 喷泉 + 树木/花朵区
- (30,0,0)：摩天轮
- (60,0,30)：湖泊（半径28）
- 椭圆轨道：rx=55, rz=40，绕原点

### 无限城市算法
- gridCoords 记录当前中心格坐标
- CityChunkTbl 维护所有 block 的循环复用池
- refreshChunkScene() 在 gridCoords 变化时重新分配 chunk 到视野内位置
