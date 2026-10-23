'use client';

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import useActiveWhileVisible from '@/lib/hooks/useActiveWhileVisible';
import WebGLBoundary from '@/components/3d/WebGLBoundary';

const MODEL_URL = '/robot.glb';
const MAX_YAW = 0.55; // radians either side of center

// Render quality tiers, chosen at runtime by PerformanceMonitor from the
// frame rate this device actually achieves, not guessed from the user agent.
// 'high' is the full look; 'low' drops to 1x pixels, no self-shadowing and a
// contact shadow baked once instead of re-rendered (3 extra passes) per frame.
type Tier = 'high' | 'low';
// Above 1.5x the extra pixels are barely visible on this soft-shaded model
// but cost up to ~1.8x the fill rate of 1.5x on 2x/3x screens.
const HIGH_DPR = 1.5;

if (typeof window !== 'undefined' && THREE.setConsoleFunction) {
  THREE.setConsoleFunction((type, message, ...params) => {
    if (
      type === 'warn' &&
      typeof message === 'string' &&
      (message.includes('Clock') || message.includes('PCFSoftShadowMap'))
    ) {
      return;
    }
    console[type](message, ...params);
  });
}

function RobotModel({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const targetYaw = useRef(0);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const { camera, invalidate } = useThree();

  // Ground and scale the model once, regardless of its authored units, so it
  // always stands on the platform — then fit the camera to whatever shape it
  // turns out to be (the frame is computed, not guessed).
  useLayoutEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const desiredHeight = 2.6;
    const scale = desiredHeight / (size.y || 1);
    scene.scale.setScalar(scale);

    const grounded = new THREE.Box3().setFromObject(scene);
    const center = grounded.getCenter(new THREE.Vector3());
    scene.position.x -= center.x;
    scene.position.z -= center.z;
    scene.position.y -= grounded.min.y;

    const framedBox = new THREE.Box3().setFromObject(scene);
    const sphere = framedBox.getBoundingSphere(new THREE.Sphere());
    const perspective = camera as THREE.PerspectiveCamera;
    const fovRad = (perspective.fov * Math.PI) / 180;
    const distance = (sphere.radius / Math.sin(fovRad / 2)) * 1.14;
    const direction = new THREE.Vector3(0.9, 0.5, 1.15).normalize();
    camera.position.copy(sphere.center.clone().addScaledVector(direction, distance));
    // Aim slightly below the model's true center so it sits a bit higher in
    // the frame, without pushing its top past the visible frustum.
    const lookTarget = sphere.center.clone();
    lookTarget.y -= sphere.radius * 0.16;
    camera.lookAt(lookTarget);
    perspective.updateProjectionMatrix();
  }, [scene, camera]);

  // Play whatever animation the model ships with, on loop, unless the
  // visitor asked for reduced motion (then it holds its rest pose).
  useEffect(() => {
    if (!animate) return;
    const clip = Object.values(actions)[0];
    clip?.reset().play();
    return () => {
      clip?.stop();
    };
  }, [actions, animate]);

  // Track the mouse horizontally across the whole viewport and turn the
  // robot left/right to follow it, smoothly damped rather than snapping.
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      targetYaw.current = THREE.MathUtils.clamp(normalizedX, -1, 1) * MAX_YAW;
      invalidate();
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [invalidate]);

  useFrame((_, delta) => {
    if (!group.current) return;
    // A resumed loop reports the whole paused span as one delta; clamp it so
    // the turn eases in instead of jumping.
    const dt = Math.min(delta, 0.1);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetYaw.current, 4.5, dt);
    // In on-demand mode (reduced motion), keep requesting frames only until
    // the turn has settled.
    if (!animate && Math.abs(group.current.rotation.y - targetYaw.current) > 1e-3) invalidate();
  });

  return <primitive ref={group} object={scene} />;
}

useGLTF.preload(MODEL_URL);

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = useActiveWhileVisible(containerRef);
  const reducedMotion = useReducedMotion();
  const [tier, setTier] = useState<Tier>('high');
  const high = tier === 'high';

  // Continuous rendering only while the robot is animating on screen. Off
  // screen or in a hidden tab nothing renders; with reduced motion the clip
  // is off, so frames are drawn on demand (cursor-follow turns) only.
  const frameloop = !visible ? 'never' : reducedMotion ? 'demand' : 'always';

  return (
    <div ref={containerRef} className="h-full w-full">
      <WebGLBoundary>
        <Canvas
          frameloop={frameloop}
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={high ? [1, HIGH_DPR] : 1}
          camera={{ position: [3.2, 2.1, 5], fov: 32 }}
          gl={{ alpha: true, antialias: true }}
        >
          <PerformanceMonitor onDecline={() => setTier('low')} onIncline={() => setTier('high')} flipflops={3} onFallback={() => setTier('low')} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.6} castShadow={high} shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-4, 3, -4]} intensity={0.4} />
          <Suspense fallback={null}>
            <RobotModel animate={!reducedMotion} />
            {/* The robot bobs, so on 'high' the shadow follows it every frame,
                at 256px with a single blur pass (it's a soft 2.4 blur either
                way; measured at ~75% of the per-frame shadow cost saved vs the
                512px double-pass default). Not remounted on tier changes (it
                never disposes its render targets): a new `frames` value
                re-renders it, which restarts its frame count, so 'low' bakes
                one fresh shadow. */}
            <ContactShadows frames={high && !reducedMotion ? Infinity : 1} resolution={256} smooth={false} position={[0, 0, 0]} opacity={0.4} scale={8} blur={2.4} far={4} />
            {/* Procedural env map — no network fetch, unlike preset="city" which pulled
                an HDRI from a remote CDN and stalled the same Suspense boundary as the model. */}
            <Environment resolution={64} background={false}>
              <Lightformer intensity={2} color="white" position={[0, 5, 0]} scale={[10, 10, 1]} />
              <Lightformer intensity={1} color="#b7c8ff" position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[10, 5, 1]} />
              <Lightformer intensity={1} color="#ffe6b7" position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 5, 1]} />
            </Environment>
          </Suspense>
        </Canvas>
      </WebGLBoundary>
    </div>
  );
}
