# Mycelium Park

An interactive cartoon-style park/garden built with Three.js — featuring animated trains, a ferris wheel, lake, trees, shops, restaurants, and clickable facilities.

> Base engine: [osoker/InfiniTownTS](https://github.com/osoker/InfiniTownTS) — Three.js + TypeScript infinite city, inspired by [InfiniTown by Little Workshop](https://demos.littleworkshop.fr/infinitown)

## Planned Features

- [ ] Cartoon toon shader (MeshToonMaterial + OutlinePass)
- [ ] Clickable park facilities → info panel
- [ ] Animated mini-train on CatmullRomCurve3 track
- [ ] Ferris wheel rotation animation
- [ ] Lake / water surface (Three.js Water2 shader)
- [ ] Park blocks: shops, restaurants, lake area, trees, paths
- [ ] People / crowd movement

## Tech Stack

- Three.js r177 + TypeScript
- Vite 6
- TWEEN.js (animation interpolation)
- camera-controls (orbit/pan camera)

## Dev

```bash
pnpm install
pnpm dev
pnpm build
```

## Project Structure

```
Mycelium-Park/
├── src/
│   ├── core/         # Infinite city chunk system
│   ├── objects/      # Animated objects (cars, clouds, train, ferris wheel)
│   ├── constrol/     # Camera + input controllers
│   ├── loader/       # GLTF / binary asset loaders
│   ├── ui/           # HUD / info panels
│   └── utils/        # Event manager, global vars
├── public/assets/    # Textures, environments, scene data
├── gltf/             # City block GLTF models
└── docs/             # GitHub Pages build output
```

## Research

Full technology investigation: [research/garden/investigation.md](https://github.com/jhfnetboy/DSR-Research-Flow/blob/main/research/garden/investigation.md)
