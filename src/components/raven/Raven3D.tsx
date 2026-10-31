"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RAVEN_BODY, RAVEN_DETAIL, RAVEN_SIZE } from "@/data/raven-shape";
import { PALETTE } from "@/lib/motion";

export type RavenControls = { flipAt: number; pointer: { x: number; y: number } };

function shapesFrom(d: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${d}"/></svg>`;
  return new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p));
}

function RavenModel({ controls, scroll }: { controls: React.RefObject<RavenControls>; scroll?: MotionValue<number> }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);

  const { body, detail } = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(shapesFrom(RAVEN_BODY), { depth: 60, bevelEnabled: true, bevelThickness: 10, bevelSize: 6, bevelSegments: 5, curveSegments: 6 });
    const detail = new THREE.ExtrudeGeometry(shapesFrom(RAVEN_DETAIL), { depth: 84, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.5, bevelSegments: 3, curveSegments: 6 });
    // Centre both on the silhouette's centre, and centre each extrusion on z so details poke out both faces.
    body.computeBoundingBox();
    const c = new THREE.Vector3();
    body.boundingBox!.getCenter(c);
    body.translate(-c.x, -c.y, -30);
    detail.translate(-c.x, -c.y, -42);
    return { body, detail };
  }, []);
  useEffect(() => () => { body.dispose(); detail.dispose(); }, [body, detail]);

  const scale = 3.6 / RAVEN_SIZE.width;

  useFrame((state, delta) => {
    const g = group.current, s = spin.current, c = controls.current;
    if (!g || !s || !c) return;
    const t = state.clock.elapsedTime;
    const sp = scroll ? scroll.get() : 0.5;
    // look toward the cursor, sway with scroll, bob gently
    const targetY = c.pointer.x * 0.75 + (sp - 0.5) * 1.2;
    const targetX = -c.pointer.y * 0.35;
    g.rotation.y += (targetY - g.rotation.y) * Math.min(1, delta * 4);
    g.rotation.x += (targetX - g.rotation.x) * Math.min(1, delta * 4);
    g.position.y = Math.sin(t * 1.2) * 0.12;
    // click flip: one full turn with a squash at the end
    const since = (performance.now() - c.flipAt) / 1000;
    if (since >= 0 && since < 1.1) {
      const u = since / 1.1;
      const e = 1 - Math.pow(1 - u, 3);
      s.rotation.y = e * Math.PI * 2;
      const squash = Math.sin(u * Math.PI) * 0.12;
      s.scale.set(1 + squash, 1 - squash, 1 + squash);
      s.position.y = Math.sin(u * Math.PI) * 0.6;
    } else {
      s.rotation.y = 0; s.scale.set(1, 1, 1); s.position.y = 0;
    }
  });

  return (
    <group ref={group}>
      <group ref={spin}>
        <group scale={[scale, -scale, scale]}>
          <mesh geometry={body} castShadow>
            <meshPhysicalMaterial color="#121a14" roughness={0.32} metalness={0.15} clearcoat={1} clearcoatRoughness={0.25} />
          </mesh>
          <mesh geometry={detail}>
            <meshStandardMaterial color={PALETTE.bone} roughness={0.4} emissive={PALETTE.lime} emissiveIntensity={0.18} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function Raven3D({ controls, scroll }: { controls: React.RefObject<RavenControls>; scroll?: MotionValue<number> }) {
  return (
    <Canvas camera={{ position: [0, 0, 7.2], fov: 35 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <pointLight position={[-4, -2, 3]} intensity={30} color={PALETTE.lime} />
      <pointLight position={[4, 2, -3]} intensity={40} color="#ffffff" />
      <RavenModel controls={controls} scroll={scroll} />
    </Canvas>
  );
}
