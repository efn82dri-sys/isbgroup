import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  OrthographicCamera,
  PCFSoftShadowMap,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Texture,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMascotModel } from './MascotModel';
import { createMascotMotion, type MascotAction } from './MascotMotion';

type SceneState = {
  action: MascotAction;
  active: boolean;
  reduced: boolean;
  replay: number;
};

function createContactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const paint = canvas.getContext('2d');
  if (!paint) return null;
  const gradient = paint.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(4, 8, 19, .70)');
  gradient.addColorStop(0.45, 'rgba(4, 8, 19, .48)');
  gradient.addColorStop(1, 'rgba(4, 8, 19, 0)');
  paint.fillStyle = gradient;
  paint.fillRect(0, 0, 64, 64);
  const plane = new Mesh(
    new PlaneGeometry(1.6, 0.9),
    new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0.005, 0.04);
  return plane;
}

function disposeScene(scene: Scene) {
  const geometry = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometry.add(object.geometry);
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of meshMaterials) materials.add(material);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof Texture) textures.add(value);
    }
    material.dispose();
  }
  for (const item of geometry) item.dispose();
  for (const texture of textures) texture.dispose();
}

function createStudioReflection(renderer: WebGLRenderer) {
  const studio = new RoomEnvironment();
  const generator = new PMREMGenerator(renderer);
  try {
    return generator.fromScene(studio, .045, .1, 100, { size: 64 });
  } catch {
    return null;
  } finally {
    generator.dispose();
    studio.dispose();
  }
}

export default function MascotViewport({ action, active, reduced, replay, fallback }: SceneState & {
  fallback: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const state = useRef<SceneState>({ action, active, reduced, replay });
  const wake = useRef<() => void>(() => {});
  const [renderState, setRenderState] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    state.current = { action, active, reduced, replay };
    wake.current();
  }, [action, active, reduced, replay]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const panel = host.closest<HTMLElement>('.isb-mascot-panel');

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setRenderState('fallback');
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    const scene = new Scene();
    let environment = createStudioReflection(renderer);
    scene.environment = environment?.texture ?? null;
    scene.environmentIntensity = .44;

    const camera = new OrthographicCamera(-1.2, 1.2, 1.6, -1.6, 0.1, 20);
    camera.position.set(0, 1.87, 6);
    camera.lookAt(0, 1.54, 0);

    const key = new DirectionalLight('#fff4e7', 2.1);
    key.position.set(-3, 6, 5);
    key.target.position.set(0, 1.4, 0);
    key.castShadow = true;
    key.shadow.camera.left = key.shadow.camera.bottom = -1.8;
    key.shadow.camera.right = key.shadow.camera.top = 1.8;
    key.shadow.camera.far = 11;
    key.shadow.mapSize.set(512, 512);
    key.shadow.bias = -.0003;
    key.shadow.normalBias = .018;

    const fill = new DirectionalLight('#e2ebfa', .55);
    fill.position.set(4, 3, 3);
    const rim = new DirectionalLight('#d9e8ff', 1.1);
    rim.position.set(2, 4, -4);
    scene.add(new HemisphereLight('#e9f0ff', '#686770', .5), key, key.target, fill, rim);
    const shadow = createContactShadow();
    if (shadow) scene.add(shadow);

    const mascot = createMascotModel();
    mascot.root.traverse((part) => {
      if (part instanceof Mesh && !Array.isArray(part.material) && !part.material.transparent) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
    const motion = createMascotMotion(mascot);
    scene.add(mascot.root);
    host.prepend(renderer.domElement);
    setRenderState('ready');

    let frame = 0;
    let last = 0;
    let lost = false;
    let drawn = false;
    let lastAction: MascotAction = 'idle';
    let lastReplay = state.current.replay;
    let wasReduced = false;
    const crown = new Vector3();
    const helmetTop = new Vector3();
    let headTop = 0;
    let stageHeight = 0;
    let pointer: { x: number; y: number; time: number; speed: number } | undefined;

    function trackPointer(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || !state.current.active || state.current.reduced) return;
      const time = performance.now();
      const elapsed = pointer ? time - pointer.time : Infinity;
      const speed = pointer && elapsed < 160
        ? Math.min(1, Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) / (Math.max(12, elapsed) * 1.6))
        : 0;
      pointer = { x: event.clientX, y: event.clientY, time, speed };
    }

    function clearPointer() {
      pointer = undefined;
      motion.setPointer(0, 0, 0, 0);
    }

    function handlePointerOut(event: PointerEvent) {
      if (event.pointerType === 'mouse' && !event.relatedTarget) clearPointer();
    }

    function updatePointer(now: number) {
      if (!pointer) return;
      const bounds = host!.getBoundingClientRect();
      const x = pointer.x - (bounds.left + bounds.width * .5);
      const y = bounds.top + headTop + bounds.height * .12 - pointer.y;
      const distance = Math.hypot(x, y);
      const reach = Math.max(125, Math.min(280, bounds.width * 1.65));
      const sensitivity = Math.max(44, bounds.width * .57);
      const proximity = 1 - Math.min(1, distance / reach);
      const speed = pointer.speed * Math.exp(-Math.max(0, now - pointer.time) / 115);
      motion.setPointer(x / sensitivity, y / sensitivity, proximity, speed);
    }

    function renderPose() {
      const lift = Math.max(0, mascot.root.position.y);
      if (shadow) {
        shadow.scale.setScalar(1 + .8 * lift);
        shadow.material.opacity = 1 - Math.min(.55, 1.7 * lift);
      }
      mascot.head.localToWorld(crown.set(0, 1.06, .21));
      crown.project(camera);
      if (mascot.hat.visible && mascot.hat.position.y > 2.37) {
        mascot.hat.localToWorld(helmetTop.set(0, .36, 0));
        crown.y = Math.max(crown.y, helmetTop.project(camera).y);
      }
      const nextHeadTop = Math.round((1 - crown.y) * .5 * stageHeight);
      if (nextHeadTop !== headTop) {
        headTop = nextHeadTop;
        panel?.style.setProperty('--mascot-head-top', `${headTop}px`);
      }
      renderer.render(scene, camera);
    }

    function draw(now: number) {
      frame = 0;
      const next = state.current;
      if (lost || !next.active || document.hidden) {
        last = 0;
        return;
      }
      if (next.reduced) {
        if (!drawn || !wasReduced) {
          clearPointer();
          motion.reset();
          renderPose();
        }
        wasReduced = true;
        drawn = true;
        last = 0;
        return;
      }

      const animate = !last || now - last >= 1000 / 44;
      if (animate) {
        if (next.action !== lastAction || next.replay !== lastReplay || wasReduced) {
          motion.setAction(next.action, next.replay !== lastReplay || wasReduced);
          lastAction = next.action;
          lastReplay = next.replay;
          wasReduced = false;
        }
        updatePointer(now);
        motion.update(last ? (now - last) / 1000 : 0);
        renderPose();
        drawn = true;
        last = now;
      }
      schedule();
    }

    function schedule() {
      if (frame === 0 && !lost && state.current.active && !document.hidden) {
        frame = window.requestAnimationFrame(draw);
      }
    }

    function sync() {
      if (!state.current.active || document.hidden) {
        clearPointer();
        window.cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        return;
      }
      schedule();
    }

    function resize() {
      const { clientWidth: width, clientHeight: height } = host!;
      if (width === 0 || height === 0) return;
      stageHeight = height;
      const halfHeight = 1.72;
      const halfWidth = halfHeight * width / height;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      drawn = false;
      schedule();
    }

    function handleLoss(event: Event) {
      event.preventDefault();
      lost = true;
      window.cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      setRenderState('fallback');
    }

    function handleRestore() {
      environment?.dispose();
      environment = createStudioReflection(renderer);
      scene.environment = environment?.texture ?? null;
      lost = false;
      setRenderState('ready');
      resize();
    }

    const viewport = new ResizeObserver(resize);
    viewport.observe(host);
    renderer.domElement.addEventListener('webglcontextlost', handleLoss);
    renderer.domElement.addEventListener('webglcontextrestored', handleRestore);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', trackPointer, { passive: true });
    window.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('blur', clearPointer);
    wake.current = sync;
    resize();

    return () => {
      wake.current = () => {};
      viewport.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', trackPointer);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('blur', clearPointer);
      renderer.domElement.removeEventListener('webglcontextlost', handleLoss);
      renderer.domElement.removeEventListener('webglcontextrestored', handleRestore);
      window.cancelAnimationFrame(frame);
      disposeScene(scene);
      environment?.dispose();
      key.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      panel?.style.removeProperty('--mascot-head-top');
    };
  }, []);

  return <div className="isb-mascot-viewport" data-mascot-render={renderState}>
    <div className="isb-mascot-render-surface" ref={hostRef} />
    {renderState !== 'ready' && fallback}
  </div>;
}
