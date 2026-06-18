import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MAP_LANDMARKS, MAP_ZONES, TBJ_STAKEHOLDER_PLOTS, percentToWorldPosition, treeToWorldPosition, worldToPercentPosition } from "../../data/gardenMap.js";
import { ROLE } from "../../models.js";
import { maskTreeForRole } from "../../services/mockTreeService.js";

const STATUS_COLORS = {
  healthy: 0x318653,
  monitor: 0xe49320,
  critical: 0xcf4035,
  public: 0x318653,
};

function makePath(points, color, radius = 0.35, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.42, z)), closed);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 52, radius, 6, closed),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
}

function makeZone(zone, selected = false) {
  const shape = new THREE.Shape();
  zone.polygon.forEach(([x, z], index) => index ? shape.lineTo(x, z) : shape.moveTo(x, z));
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: selected ? 0xd7a927 : zone.color, transparent: true, opacity: selected ? 0.94 : 0.76, roughness: 1 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = selected ? 0.24 : 0.18;
  mesh.userData.zone = zone;
  return mesh;
}

function addBuilding(scene, { x, z, width = 5, depth = 4, color = 0xd7ba87 }) {
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, 2.4, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.88 }),
  );
  building.position.set(x, 1.35, z);
  scene.add(building);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.73, 1.7, 4),
    new THREE.MeshStandardMaterial({ color: 0x8d5737, roughness: 0.9 }),
  );
  roof.position.set(x, 3.35, z);
  roof.rotation.y = Math.PI / 4;
  scene.add(roof);
}

function createTreeMeshes(color, scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * scale, 0.22 * scale, 1.7 * scale, 7),
    new THREE.MeshStandardMaterial({ color: 0x765238, roughness: 1 }),
  );
  trunk.position.y = 0.95 * scale;
  group.add(trunk);
  const canopy = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9 * scale, 1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.96 }),
  );
  canopy.position.y = 2.15 * scale;
  group.add(canopy);
  return group;
}

function isInsideLake(x, z) {
  const bukitBesi = ((x - 8) / 10) ** 2 + ((z + 10) / 15) ** 2 < 1.18;
  const bukitBelah = ((x - 8) / 20) ** 2 + ((z - 17) / 7) ** 2 < 1.2;
  return bukitBesi || bukitBelah;
}

export default function ThreeGardenScene({
  compact,
  controlAction,
  layer,
  onMapClick,
  onZoneClick,
  onProjectedPositions,
  proposedPoint,
  role,
  routePath = [],
  selectedZoneId,
  trees,
  visitorHeatmapAggregates = [],
  viewMode,
}) {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  const onZoneClickRef = useRef(onZoneClick);
  const onProjectedPositionsRef = useRef(onProjectedPositions);
  const controlActionRef = useRef(controlAction);
  const [fallback, setFallback] = useState(false);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onZoneClickRef.current = onZoneClick; }, [onZoneClick]);
  useEffect(() => { onProjectedPositionsRef.current = onProjectedPositions; }, [onProjectedPositions]);
  useEffect(() => { controlActionRef.current = controlAction; }, [controlAction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      setFallback(true);
      return undefined;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdfead8);
    scene.fog = new THREE.Fog(0xdfead8, 95, 155);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 240);
    camera.position.set(viewMode === "top" ? 0 : 52, viewMode === "top" ? 108 : 62, viewMode === "top" ? 0.01 : 73);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = !compact;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minPolarAngle = viewMode === "top" ? 0.01 : Math.PI * 0.18;
    controls.minDistance = compact ? 35 : 28;
    controls.maxDistance = 145;
    controls.target.set(0, 0, 0);
    const setCameraHome = () => {
      camera.position.set(viewMode === "top" ? 0 : 52, viewMode === "top" ? 108 : 62, viewMode === "top" ? 0.01 : 73);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    const zoomBy = (factor) => {
      const direction = camera.position.clone().sub(controls.target);
      const nextLength = Math.max(controls.minDistance, Math.min(controls.maxDistance, direction.length() * factor));
      camera.position.copy(controls.target).add(direction.setLength(nextLength));
      controls.update();
    };
    setCameraHome();
    let handledControlId = controlActionRef.current?.id;

    scene.add(new THREE.HemisphereLight(0xf6ffe9, 0x52704f, 2.25));
    const sun = new THREE.DirectionalLight(0xfff5d4, 2.6);
    sun.position.set(-35, 70, -40);
    sun.castShadow = true;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(94, 76),
      new THREE.MeshStandardMaterial({ color: 0xa7c88d, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const zoneMeshes = MAP_ZONES.map((zone) => makeZone(zone, zone.id === selectedZoneId));
    zoneMeshes.forEach((zone) => scene.add(zone));

    const lakeMaterial = new THREE.MeshStandardMaterial({ color: 0x4899bd, roughness: 0.2, metalness: 0.05 });
    const lakeOne = new THREE.Mesh(new THREE.CircleGeometry(1, 60), lakeMaterial);
    lakeOne.rotation.x = -Math.PI / 2;
    lakeOne.position.set(8, 0.48, -10);
    lakeOne.scale.set(10, 15, 1);
    scene.add(lakeOne);
    const lakeTwo = new THREE.Mesh(new THREE.CircleGeometry(1, 48), lakeMaterial);
    lakeTwo.rotation.x = -Math.PI / 2;
    lakeTwo.position.set(8, 0.48, 17);
    lakeTwo.scale.set(20, 7, 1);
    scene.add(lakeTwo);

    scene.add(makePath([[-45, -37], [-45, -19], [-44, 0], [-44, 19], [-44, 36]], 0xbba98c, 0.9));
    scene.add(makePath([[-42, 0], [-28, 1], [-15, 5], [-1, 8], [15, 11], [36, 12]], 0xe8dbb7, 0.75));
    scene.add(makePath([[-25, -8], [-10, -17], [4, -24], [18, -24], [31, -15]], 0xe8dbb7, 0.58));
    scene.add(makePath([[-18, 8], [-11, 18], [-2, 27], [12, 30]], 0xe8dbb7, 0.58));
    scene.add(makePath([[18, -9], [14, 2], [4, 6], [-4, 1], [-3, -12], [4, -23], [15, -21], [18, -9]], 0xa97952, 0.32, true));

    if (layer === "stakeholder" || layer === "collections") {
      TBJ_STAKEHOLDER_PLOTS.forEach((plot, index) => {
        const marker = new THREE.Mesh(
          new THREE.CylinderGeometry(layer === "collections" ? 1.55 : 1.15, layer === "collections" ? 1.55 : 1.15, 0.22, 24),
          new THREE.MeshStandardMaterial({ color: index % 2 ? 0xd7a927 : 0x2d7f67, transparent: true, opacity: 0.86, roughness: 0.82 }),
        );
        marker.position.set(plot.x, 0.84, plot.z);
        scene.add(marker);
      });
    }

    addBuilding(scene, { x: -35, z: -4, width: 6, depth: 4 });
    addBuilding(scene, { x: -28, z: -6, width: 4.5, depth: 3.6, color: 0xc7aa7e });
    addBuilding(scene, { x: -34, z: 5, width: 4.2, depth: 3.4, color: 0xd6c096 });

    const decorativeTrees = [];
    for (let index = 0; index < 115; index += 1) {
      const x = -42 + ((index * 37) % 85);
      const z = -33 + ((index * 53) % 67);
      if (isInsideLake(x, z) || (x < -17 && z < -15)) continue;
      const tree = createTreeMeshes(index % 5 === 0 ? 0x477f48 : 0x5b9653, 0.56 + (index % 4) * 0.08);
      tree.position.set(x, 0, z);
      scene.add(tree);
      decorativeTrees.push(tree);
    }

    const showMarkers = layer !== "visitors";
    const canSeeProtected = role === ROLE.ADMIN || role === ROLE.IT_SUPPORT;
    const visibleTrees = showMarkers ? trees.map((tree) => maskTreeForRole(tree, role)).filter((tree) => tree.x !== null || canSeeProtected) : [];
    visibleTrees.forEach((tree) => {
      const { x, z } = treeToWorldPosition(tree);
      const color = role === ROLE.VISITOR ? STATUS_COLORS.public : STATUS_COLORS[tree.status] || STATUS_COLORS.healthy;
      const treeMesh = createTreeMeshes(color, 1.05);
      treeMesh.position.set(x, 0, z);
      scene.add(treeMesh);
    });

    if (layer === "visitors") {
      visitorHeatmapAggregates.forEach((aggregate) => {
        const { x, z } = percentToWorldPosition({ x: aggregate.x, y: aggregate.y });
        const radius = aggregate.trafficLevel === "high" ? 11 : aggregate.trafficLevel === "medium" ? 8 : 5.5;
        const opacity = aggregate.trafficLevel === "high" ? 0.36 : aggregate.trafficLevel === "medium" ? 0.27 : 0.2;
        const heat = new THREE.Mesh(
          new THREE.CircleGeometry(radius, 48),
          new THREE.MeshBasicMaterial({ color: 0xef7338, transparent: true, opacity, depthWrite: false }),
        );
        heat.rotation.x = -Math.PI / 2;
        heat.position.set(x, 0.72, z);
        scene.add(heat);
      });
    }

    const routeWorldPoints = routePath
      .filter((point) => point.x !== null && point.y !== null)
      .map((point) => {
        const { x, z } = percentToWorldPosition(point);
        return [x, z];
      });
    if (routeWorldPoints.length > 1) {
      const routeLine = makePath(routeWorldPoints, 0xf2c94c, 0.42);
      routeLine.position.y = 0.56;
      scene.add(routeLine);
      routeWorldPoints.forEach(([x, z], index) => {
        if (index === 0) return;
        const marker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.85, 0.85, 0.28, 24),
          new THREE.MeshStandardMaterial({ color: 0x0e4b2a, emissive: 0x123b22, emissiveIntensity: 0.12 }),
        );
        marker.position.set(x, 0.92, z);
        scene.add(marker);
      });
    }

    if (proposedPoint) {
      const { x, z } = percentToWorldPosition(proposedPoint);
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.8, 10), new THREE.MeshStandardMaterial({ color: 0xe3ab24 }));
      pin.position.set(x, 2.1, z);
      scene.add(pin);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let projectionCache = "";
    const project = ({ x, z }) => {
      const position = new THREE.Vector3(x, 3.4, z).project(camera);
      return { left: `${((position.x + 1) * 50).toFixed(2)}%`, top: `${((1 - position.y) * 50).toFixed(2)}%` };
    };
    const projectPositions = () => {
      const next = { trees: {}, zones: {}, landmarks: {}, plots: {}, route: {}, heatmap: {} };
      visibleTrees.forEach((tree) => { next.trees[tree.id] = project(treeToWorldPosition(tree)); });
      MAP_ZONES.forEach((zone) => { next.zones[zone.id] = project({ x: zone.label[0], z: zone.label[1] }); });
      MAP_LANDMARKS.forEach((landmark) => { next.landmarks[landmark.id] = project(landmark); });
      TBJ_STAKEHOLDER_PLOTS.forEach((plot) => { next.plots[plot.id] = project(plot); });
      routePath.forEach((point) => {
        if (point.x !== null && point.y !== null) next.route[point.id] = project(percentToWorldPosition(point));
      });
      visitorHeatmapAggregates.forEach((aggregate) => {
        next.heatmap[aggregate.aggregateId] = project(percentToWorldPosition({ x: aggregate.x, y: aggregate.y }));
      });
      const serialized = JSON.stringify(next);
      if (serialized !== projectionCache) {
        projectionCache = serialized;
        onProjectedPositionsRef.current?.(next);
      }
    };
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      projectPositions();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const click = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const zoneHit = raycaster.intersectObjects(zoneMeshes)[0];
      if (zoneHit?.object?.userData?.zone && onZoneClickRef.current) {
        onZoneClickRef.current(zoneHit.object.userData.zone);
        return;
      }
      if (!onMapClickRef.current) return;
      const hit = raycaster.intersectObject(ground)[0];
      if (hit) onMapClickRef.current(worldToPercentPosition(hit.point));
    };
    canvas.addEventListener("click", click);

    let frame;
    const animate = () => {
      const action = controlActionRef.current;
      if (action?.id && action.id !== handledControlId) {
        handledControlId = action.id;
        if (action.type === "zoom-in") zoomBy(0.78);
        if (action.type === "zoom-out") zoomBy(1.28);
        if (action.type === "reset") setCameraHome();
      }
      controls.update();
      renderer.render(scene, camera);
      projectPositions();
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("click", click);
      resizeObserver.disconnect();
      controls.dispose();
      scene.traverse((item) => {
        item.geometry?.dispose();
        if (Array.isArray(item.material)) item.material.forEach((material) => material.dispose());
        else item.material?.dispose();
      });
      renderer.dispose();
    };
  }, [compact, layer, proposedPoint, role, routePath, selectedZoneId, trees, visitorHeatmapAggregates, viewMode]);

  return (
    <div className="three-map-host" ref={hostRef}>
      <canvas className="three-map-canvas" ref={canvasRef} />
      {fallback && <p className="three-map-fallback">3D rendering is unavailable in this browser.</p>}
    </div>
  );
}
