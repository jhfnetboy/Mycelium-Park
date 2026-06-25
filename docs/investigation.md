# Investigation: 卡通风格交互式公园/花园 Three.js 开源方案调研

> 调研日期：2026-06-25
> 目标：构建一个可交互的公园/花园网页，场景含小火车、摩天轮、湖水、树木、道路、天空、人群、商店、餐厅等设施，每个设施可点击获取信息。
> 项目仓库：https://github.com/jhfnetboy/Mycelium-Park

## 零、结论（先读这里）

- **InfiniTown 无法购买**，原版 Little Workshop 未开源也未授权（联系邮件：hello@littleworkshop.fr）
- **开源可行**：2025 年 6 月 [osoker/InfiniTownTS](https://github.com/osoker/InfiniTownTS) 发布了 TypeScript + Three.js 完整重现版
- **已启动**：`jhfnetboy/Mycelium-Park` 基于 InfiniTownTS 底座建立，dev server 验证可用，已推送 GitHub

---

## 一、GitHub 开源仓库调研

### 第一梯队：高度相关（风格 + 交互 + 场景元素最匹配）

**1. brunosimon/folio-2019**
- 链接：https://github.com/brunosimon/folio-2019
- Stars：**4703**
- 描述：Bruno Simon 的经典个人作品集，用户驾驶小车在 3D 世界中漫游，场景包含树木、建筑、物理碰撞体。这是卡通低多边形交互场景的标杆作品
- 技术栈：Three.js + Cannon.js（物理引擎）+ Webpack，Vanilla JS
- 风格：低多边形 / 卡通 / 俯视驾驶视角
- 动画：小车行驶、物体碰撞动画
- 可交互：是（WASD 驾驶，碰撞互动）
- Demo：https://bruno-simon.com/

**2. brunosimon/my-room-in-3d**
- 链接：https://github.com/brunosimon/my-room-in-3d
- Stars：**4433**
- 描述：Bruno Simon 的 3D 房间场景，可点击房间内各种物件触发信息/动画，同 folio 风格，是构建"可点击 3D 场景"的最佳参考
- 技术栈：Three.js + React Three Fiber + Drei
- 风格：低多边形 / 卡通 / 室内场景
- 动画：物件点击动画、摄像机过渡
- 可交互：是（Raycasting 点击对象）
- Demo：https://my-room-in-3d.vercel.app/

**3. lo-th/3d.city**
- 链接：https://github.com/lo-th/3d.city
- Stars：**1720**
- 描述：3D 城市建造游戏，可自由放置/移除建筑，实时渲染城市场景，风格接近等距视角低多边形城市
- 技术栈：Three.js，Vanilla JS
- 风格：低多边形 / 俯视城市
- 动画：建筑放置动画、场景变化
- 可交互：是（点击放置/删除建筑）
- Demo：http://lo-th.github.io/3d.city/index.html

**4. swift502/Sketchbook**
- 链接：https://github.com/swift502/Sketchbook
- Stars：**1737**
- 描述：基于 Three.js + Cannon.js 的 3D 游乐场，包含可控角色、车辆、飞机，开放世界场景，适合作为公园互动场景底座
- 技术栈：Three.js + Cannon.js，TypeScript
- 风格：写实低多边形 / 开放世界
- 动画：角色行走、车辆驾驶、跳跃等
- 可交互：是（键盘控制角色/车辆）
- Demo：https://jblaha.art/sketchbook/latest

**5. dragonir/3d**
- 链接：https://github.com/dragonir/3d
- Stars：**2859**
- 描述：Three.js 多场景集合，包含数字城市、冰墩墩、赛车等多个卡通风格 3D 场景 Demo，中文社区活跃
- 技术栈：Three.js + React，JavaScript/CSS
- 风格：卡通 / 低多边形 / 多种风格混合
- 动画：各场景均有动画
- 可交互：是（点击、漫游）
- Demo：https://dragonir.github.io/3d/

**6. kkhanhluu/infinitown**
- 链接：https://github.com/kkhanhluu/infinitown
- Stars：**52**
- 描述：无限延伸的 3D 卡通小镇，灵感来自 Little Workshop 的 InfiniTown WebGL 实验，场景含建筑、道路、车辆持续生成滚动
- 技术栈：Three.js，JavaScript
- 风格：卡通城市 / 低多边形 / 无限滚动
- 动画：城市街区不断生成、车辆行驶
- 可交互：否（观赏型）
- Demo：https://kkhanhluu.github.io/infinitown/

**7. HongPong/infinitown**（原版 InfiniTown 资产捕获）
- 链接：https://github.com/HongPong/infinitown
- Stars：23
- 描述：Little Workshop 制作的原版无限卡通城市 WebGL 静态文件镜像，非官方源码，无许可证
- 技术栈：WebGL（Unity 导出静态文件）
- 风格：卡通城市 / 低多边形
- Demo：https://demos.littleworkshop.fr/infinitown

**8. mauriciopoppe/Three.js-City**
- 链接：https://github.com/mauriciopoppe/Three.js-City
- Stars：**230**
- 描述：Three.js 构建的 3D 可驾驶城市，WASD 控制汽车在城市街道中穿行，含建筑、路面、后处理效果（速度模糊）
- 技术栈：Three.js，JavaScript
- 风格：低多边形城市
- 动画：汽车行驶
- 可交互：是（WASD 驾驶）
- Demo：http://mauriciopoppe.github.io/Three.js-City/T3/

---

### 第二梯队：中度相关（有用的元素/工具）

**9. 1391819/interactive-low-poly-environment**
- 链接：https://github.com/1391819/interactive-low-poly-environment
- Stars：15
- 描述：交互式低多边形环境，含岛屿地形、湖水（displacementMap）、松树、路灯（日夜切换），场景元素与目标公园场景高度吻合
- 技术栈：Three.js + GLSL + glTF，JavaScript
- 风格：低多边形 / 自然场景
- 动画：灯光日夜循环、路灯点亮
- 可交互：是（场景漫游）

**10. brunosimon/infinite-world**
- 链接：https://github.com/brunosimon/infinite-world
- Stars：**605**
- 描述：Bruno Simon 的无限程序化生成世界，Three.js 驱动，含地形、树木、无限延伸的低多边形世界
- 技术栈：Three.js，JavaScript
- 风格：低多边形 / 程序化生成
- 动画：地形实时生成、树木随机分布
- 可交互：是（第一/三人称漫游）
- Demo：https://infinite-world.vercel.app

**11. jstrait/city-tour**
- 链接：https://github.com/jstrait/city-tour
- Stars：86
- 描述：程序化生成城市漫游，Three.js + WebGL，自动飞越城市街道
- 技术栈：Three.js + WebGL，JavaScript
- 风格：低多边形城市
- 动画：摄像机自动巡游城市
- 可交互：是（触摸/鼠标控制视角）
- Demo：https://www.joelstrait.com/citytour/

**12. jeromeetienne/threex.proceduralcity**
- 链接：https://github.com/jeromeetienne/threex.proceduralcity
- Stars：145
- 描述：基于 Three.js 的程序化城市生成器（mrdoob 演示衍生版），可快速生成城市楼块布局
- 技术栈：Three.js，JavaScript
- 风格：低多边形程序化城市
- 动画：无
- 可交互：否（生成演示）
- Demo：http://jeromeetienne.github.io/threex.proceduralcity/examples/demo.html

**13. mayacoda/toon-shader**
- 链接：https://github.com/mayacoda/toon-shader
- Stars：81
- 描述：Three.js Toon Shader 实现（渐变映射 Cel Shading + 边缘描边后处理），可直接集成到任何 Three.js 场景中实现卡通风格
- 技术栈：Three.js，TypeScript，GLSL
- 风格：卡通 Cel Shading / 描边风格
- 动画：无（Shader 库）
- 可交互：否（工具库）

**14. markuslerner/THREE.Interactive**
- 链接：https://github.com/markuslerner/THREE.Interactive
- Stars：**203**
- 描述：Three.js 的鼠标/触摸事件交互管理器，支持 click/hover/mouseover 等事件绑定到 3D 对象，是构建"可点击 3D 场景"的基础工具库
- 技术栈：Three.js，TypeScript
- 风格：工具库（无具体风格）

**15. marty-mcgee/threed-garden**
- 链接：https://github.com/marty-mcgee/threed-garden
- Stars：38
- 描述：基于 Next.js + Three.js + React Three Fiber + FarmBot 的 3D 花园环境界面，集成了 Apollo GraphQL 和 WordPress API，是功能最完整的"可配置 3D 花园"项目
- 技术栈：Next.js + Three.js + R3F + TypeScript + Paper.js
- 风格：3D 花园 / 可视化
- 动画：植物、花园元素
- 可交互：是（可配置花园布局）

**16. corashina/Endless-City**
- 链接：https://github.com/corashina/Endless-City
- Stars：43
- 描述：受 InfiniTown 启发的 WebGL 无限城市场景
- 技术栈：Three.js，JavaScript
- 风格：卡通城市
- 动画：城市无限滚动
- 可交互：否（观赏型）

**17. jasonsturges/three-low-poly**
- 链接：https://github.com/jasonsturges/three-low-poly
- Stars：37
- 描述：Three.js 低多边形建模工具库，包含树木、山脉、岛屿等低多边形几何体工厂函数，可作为公园场景素材库
- 技术栈：Three.js，TypeScript
- 风格：低多边形工具库
- Demo：https://jasonsturges.com/three-low-poly/

---

### 补充参考（非 Three.js 但高度相关）

**18. Windland（Anderson Mancini）**
- 链接（作者主页）：https://github.com/ektogamat
- Stars：相关 boilerplate `ektogamat/threejs-andy-boilerplate` 有 **754 stars**
- 描述：Awwwards 获奖的 Three.js 互动微型城市，含建筑、后处理、微交互
- Demo：https://windland-neotix.vercel.app/
- 案例文章：https://tympanus.net/codrops/2022/04/25/case-study-windland-an-immersive-three-js-experience/

---

### 汇总对比表

| 排名 | 仓库 | Stars | 风格 | 有动画 | 可交互 | 最匹配元素 |
|------|------|-------|------|--------|--------|-----------|
| 1 | brunosimon/folio-2019 | 4703 | 低多边形卡通 | ✅ | ✅ | 小车/场景物件点击 |
| 2 | brunosimon/my-room-in-3d | 4433 | 低多边形卡通 | ✅ | ✅ | 可点击3D物件 |
| 3 | dragonir/3d | 2859 | 多风格卡通 | ✅ | ✅ | 数字城市/3D场景集合 |
| 4 | swift502/Sketchbook | 1737 | 低多边形开放世界 | ✅ | ✅ | 可控角色/车辆漫游 |
| 5 | lo-th/3d.city | 1720 | 低多边形城市 | ✅ | ✅ | 城市建造/点击放置 |
| 6 | brunosimon/infinite-world | 605 | 低多边形程序化 | ✅ | ✅ | 无限世界/树木地形 |
| 7 | mauriciopoppe/Three.js-City | 230 | 低多边形城市 | ✅ | ✅ | 驾驶城市 |
| 8 | markuslerner/THREE.Interactive | 203 | 工具库 | — | ✅ | Raycasting点击工具 |
| 9 | jeromeetienne/threex.proceduralcity | 145 | 程序化城市 | ❌ | ❌ | 快速生成城市楼块 |
| 10 | mayacoda/toon-shader | 81 | Cel Shading工具 | — | — | 卡通描边Shader |
| 11 | jstrait/city-tour | 86 | 低多边形城市 | ✅ | ✅ | 城市漫游 |
| 12 | kkhanhluu/infinitown | 52 | 卡通城市 | ✅ | ❌ | 无限卡通小镇 |
| 13 | corashina/Endless-City | 43 | 卡通城市 | ✅ | ❌ | 无限城市 |
| 14 | marty-mcgee/threed-garden | 38 | 3D花园 | ✅ | ✅ | 可配置花园 |
| 15 | jasonsturges/three-low-poly | 37 | 低多边形素材库 | — | — | 树木/地形几何体 |
| 16 | 1391819/interactive-low-poly-env | 15 | 低多边形自然 | ✅ | ✅ | 湖水/树木/路灯 |

---

## 二、InfiniTown 购买可行性调研

> 目标 Demo：https://demos.littleworkshop.fr/infinitown

### 结论：**无法购买，但有开源 TypeScript 重现版本**

**官方态度（Little Workshop）**

- InfiniTown 是 Little Workshop 的**自主发起项目**（Self-initiated Project），本质是一个技术展示 Demo，定位为 portfolio 作品
- 官方网站 `littleworkshop.fr/projects/infinitown/` 及 GitHub `github.com/littleworkshop` 上**均无任何出售源码或授权的信息**
- Little Workshop GitHub 仅有一个公开仓库（2011 年的 Firefox 4 太阳系演示），InfiniTown 从未开源

**流传的"源码"是什么**

GitHub 上 `HongPong/infinitown`、`kkhanhluu/infinitown` 等仓库均是**第三方镜像/捕获版本**（HTML + CSS 静态文件），并非 Little Workshop 官方源码，且无许可证，不可商用。

**Little Workshop 联系方式**

| 渠道 | 信息 |
|------|------|
| 邮件 | hello@littleworkshop.fr |
| Twitter/X | @glecollinet |
| LinkedIn | linkedin.com/company/littleworkshop.fr |
| 地址 | 5 rue de Charonne, 75011 Paris, France |

可发邮件询问是否愿意授权，但成功率极低——InfiniTown 是他们的招牌展示作品。

---

### 重要发现：2025 年新出的开源 TypeScript 重现版本

**`github.com/osoker/InfiniTownTS`**（2025 年 6 月发布）

- 作者受 InfiniTown 启发，用 **TypeScript + Three.js（最新版）+ TWEEN.js** 重新实现
- 功能：无限城市算法、动态加载/卸载街区、摄像机轨道控制
- 在线演示：https://osoker.github.io/InfiniTownTS/
- 20 stars、6 forks，含 gltf 模型和纹理资产
- **这是目前最接近原版 InfiniTown 的开源实现**

---

## 三、技术可行性评估

### 能否用开源方案达到 InfiniTown 效果？**可以，可行性：高**

InfiniTown 本身就是用 **Three.js** 构建的，核心技术栈与开源方案完全重叠。官方透露的实现原理：

> 生成**有限个随机街区组成的网格**，然后让视点在这个网格上循环（X-Y 坐标取模），制造出无限延伸的视觉错觉。

这个技术已被 osoker/InfiniTownTS 等开源项目完整复现。

### 各模块可行性分解

| 模块 | 可行性 | 说明 |
|------|--------|------|
| Three.js 渲染 | ✅ 直接可用 | InfiniTown 本身就是 Three.js |
| Toon Shader / Cel Shading | ✅ 内置支持 | `MeshToonMaterial` 开箱即用；进阶用 `mayacoda/toon-shader` |
| 描边（Outline） | ✅ 可实现 | Three.js `OutlinePass` 后处理 |
| 程序化无限城市/公园 | ✅ 算法已知 | 有限网格 + 坐标取模，InfiniTownTS 已验证 |
| Kenney CC0 资产 | ✅ 完整配套 | 提供 GLTF 格式，City Kit Roads/Suburban/Industrial 含建筑/道路/树木 |
| 车辆/小火车沿路行驶动画 | ⚠️ 中等难度 | 需预定义路径 + 插值动画（CatmullRomCurve3 + TWEEN.js） |
| 摩天轮旋转动画 | ✅ 简单 | `Object3D.rotation.z` 每帧递增 |
| 水面/湖泊 | ✅ 内置支持 | Three.js `examples/jsm/objects/Water2` 官方 Shader |
| 等距/俯视摄像机 | ✅ 简单 | `OrthographicCamera` 或 PerspectiveCamera 调角度 |
| 点击设施获取信息 | ✅ 工具完备 | `markuslerner/THREE.Interactive` + Raycasting |

### 最难实现的部分

1. **视觉统一性（最难）**：原版 InfiniTown 有极精细的美术调色和光照设置。Kenney 资产虽低多边形，颜色和比例需二次调整才能达到相近视觉质量。
2. **车辆/小火车路径系统**：需在程序化生成的道路网格中正确行驶，要保证道路拓扑连通。
3. **性能优化**：大量重复建筑/树木须用 `InstancedMesh` 合批，需从项目初期规划。

### 开发工作量（单人估算）

| 阶段 | 工作量 | 内容 |
|------|--------|------|
| 基础原型 | 2–3 周 | 网格系统 + Kenney 资产加载 + 摄像机 + 无限滚动 |
| 视觉优化 | 2–4 周 | Toon Shader、描边、光照、后处理 |
| 公园设施动画 | 1–2 周 | 小火车路径 + 摩天轮旋转 + 人群移动 |
| 点击交互系统 | 1 周 | THREE.Interactive + 信息弹窗 |
| 性能优化 | 1–2 周 | InstancedMesh、LOD、视锥剔除 |
| **合计** | **6–12 周** | 达到接近 InfiniTown 的质量 |

---

## 四、推荐实施方案

### 最优路径（开源拼合方案）

```
基础底座：   osoker/InfiniTownTS（Fork，TypeScript + Three.js 无限城市）
点击交互：   markuslerner/THREE.Interactive（3D对象事件绑定）
卡通风格：   MeshToonMaterial + mayacoda/toon-shader（OutlinePass描边）
公园素材：   Kenney.nl City Kit CC0 资产（建筑/道路/树木 GLTF）
水面效果：   Three.js 官方 Water2 Shader
小火车：     CatmullRomCurve3 轨道曲线 + TWEEN.js 插值
摩天轮：     Object3D.rotation.z 每帧递增
人群动画：   SkinnedMesh + AnimationMixer（Mixamo CC0 人物）
```

### 技术栈建议

```
渲染框架：  Three.js r160+ 或 React Three Fiber
语言：      TypeScript
构建工具：  Vite
物理（可选）：Rapier.js（轻量，适合公园碰撞）
状态管理：  Zustand（R3F 生态）
```

### Kenney 免费资产推荐

- [City Kit (Roads)](https://kenney.nl/assets/city-kit-roads) — 道路系统
- [City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban) — 住宅/公园建筑
- [City Kit (Commercial)](https://kenney.nl/assets/city-kit-commercial) — 商店/餐厅
- [Nature Kit](https://kenney.nl/assets/nature-kit) — 树木/水面/地形
- [Amusement Kit](https://kenney.nl/assets/amusement-kit) — 游乐设施（摩天轮等）

---

## 五、参考链接汇总

| 资源 | 链接 |
|------|------|
| InfiniTown Demo | https://demos.littleworkshop.fr/infinitown |
| Little Workshop 官网 | https://www.littleworkshop.fr/ |
| osoker/InfiniTownTS（最近似开源版） | https://github.com/osoker/InfiniTownTS |
| osoker InfiniTownTS Demo | https://osoker.github.io/InfiniTownTS/ |
| Three.js 论坛 InfiniTownTS 讨论 | https://discourse.threejs.org/t/open-source-ts-version-of-the-3d-cartoon-infinitown/84601 |
| Windland Case Study | https://tympanus.net/codrops/2022/04/25/case-study-windland-an-immersive-three-js-experience/ |
| Windland Demo | https://windland-neotix.vercel.app/ |
| Kenney City Kit Roads | https://kenney.nl/assets/city-kit-roads |
| Kenney Amusement Kit | https://kenney.nl/assets/amusement-kit |
| mayacoda/toon-shader | https://github.com/mayacoda/toon-shader |
| markuslerner/THREE.Interactive | https://github.com/markuslerner/THREE.Interactive |
| brunosimon/folio-2019 | https://github.com/brunosimon/folio-2019 |
| brunosimon/my-room-in-3d | https://github.com/brunosimon/my-room-in-3d |
