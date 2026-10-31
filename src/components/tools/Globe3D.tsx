"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/motion";
import type { Spin } from "./spin";
import { fibonacciSphere } from "./spin";

const RADIUS = 3.4;
type GlobeProps = { items: string[]; spin: React.RefObject<Spin>; onHover: (t: string | null) => void };
const FONT = '700 64px "Bricolage Grotesque Variable", system-ui, sans-serif';

function useLabelTexture(text: string, fontVersion: number) {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 128;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { canvas, texture };
  }, []);
  const draw = (hot: boolean) => {
    const c = canvas.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, 512, 128);
    c.font = FONT;
    const w = Math.min(500, c.measureText(text).width + 72), left = (512 - w) / 2;
    c.beginPath();
    c.roundRect(left, 16, w, 96, 48);
    c.fillStyle = hot ? PALETTE.lime : "rgba(241,243,234,.08)";
    c.fill();
    if (!hot) { c.strokeStyle = "rgba(241,243,234,.35)"; c.lineWidth = 3; c.stroke(); }
    c.fillStyle = hot ? PALETTE.ink : PALETTE.bone;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(text, 256, 68);
    texture.needsUpdate = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => draw(false), [fontVersion]);
  useEffect(() => () => texture.dispose(), [texture]);
  return { texture, draw };
}

function Label({ text, position, fontVersion, onHover }: { text: string; position: THREE.Vector3; fontVersion: number; onHover: (t: string | null) => void }) {
  const ref = useRef<THREE.Sprite>(null);
  const hot = useRef(false);
  const world = useMemo(() => new THREE.Vector3(), []);
  const { texture, draw } = useLabelTexture(text, fontVersion);

  useFrame(() => {
    const s = ref.current;
    if (!s) return;
    s.getWorldPosition(world);
    const depth = (world.z + RADIUS) / (2 * RADIUS);
    (s.material as THREE.SpriteMaterial).opacity = 0.22 + depth * 0.78;
    const k = (hot.current ? 1.25 : 1) * (0.75 + depth * 0.35);
    s.scale.x += (2 * k - s.scale.x) * 0.2;
    s.scale.y += (0.5 * k - s.scale.y) * 0.2;
  });

  return (
    <sprite
      ref={ref} position={position} scale={[2, 0.5, 1]}
      onPointerOver={(e) => { e.stopPropagation(); hot.current = true; draw(true); onHover(text); }}
      onPointerOut={() => { hot.current = false; draw(false); }}
      onClick={(e) => { e.stopPropagation(); onHover(text); }}
    >
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

function Globe({ items, spin, onHover }: GlobeProps) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const [fontVersion, setFontVersion] = useState(0);
  const positions = useMemo(
    () => fibonacciSphere(items.length).map((p) => new THREE.Vector3(p.x * RADIUS, p.y * RADIUS, p.z * RADIUS)),
    [items.length],
  );
  const shell = useMemo(() => new THREE.IcosahedronGeometry(2.1, 1), []);

  useEffect(() => { document.fonts?.ready.then(() => setFontVersion((v) => v + 1)); }, []);

  useFrame(() => {
    const g = group.current, s = spin.current;
    if (!g || !s) return;
    g.rotation.y += s.vx;
    g.rotation.x = Math.max(-0.6, Math.min(0.6, g.rotation.x + s.vy));
    if (!s.dragging) { s.vx += (0.0035 - s.vx) * 0.03; s.vy *= 0.92; }
    if (core.current) core.current.rotation.y -= 0.002;
  });

  return (
    <group ref={group}>
      <mesh ref={core} geometry={shell}>
        <meshBasicMaterial color={PALETTE.lilac} wireframe transparent opacity={0.35} />
      </mesh>
      <points geometry={shell}>
        <pointsMaterial color={PALETTE.lime} size={0.07} />
      </points>
      {items.map((t, i) => <Label key={t} text={t} position={positions[i]} fontVersion={fontVersion} onHover={onHover} />)}
    </group>
  );
}

/** Pull the camera back on tall, narrow screens so the outer labels stay in frame. */
function FitCamera() {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    // Labels reach ~4.6 units from the centre; keep that inside the horizontal field of view.
    const halfFov = ((40 / 2) * Math.PI) / 180;
    camera.position.z = Math.max(9.5, 4.7 / (Math.tan(halfFov) * aspect));
    camera.updateProjectionMatrix();
  }, [aspect, camera]);
  return null;
}

export default function Globe3D({ items, spin, onHover }: GlobeProps) {
  return (
    <Canvas camera={{ position: [0, 0, 9.5], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} frameloop="always">
      <FitCamera />
      <Globe items={items} spin={spin} onHover={onHover} />
    </Canvas>
  );
}
