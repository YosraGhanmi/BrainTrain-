'use client';

import { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

// Static variant of components/3d/HeroScene.tsx's robot: same model and
// lighting, but no mouse-follow rotation and no walk/idle animation clip —
// just a gentle up/down float, no ground plane or shadow under it since it's
// meant to read as hovering, not standing on a pedestal.
const MODEL_URL = '/robot.glb';

function StaticRobotModel() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const { camera } = useThree();
  const baseY = useRef(0);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
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
    baseY.current = scene.position.y;

    const framedBox = new THREE.Box3().setFromObject(scene);
    const sphere = framedBox.getBoundingSphere(new THREE.Sphere());
    const perspective = camera as THREE.PerspectiveCamera;
    const fovRad = (perspective.fov * Math.PI) / 180;
    const distance = (sphere.radius / Math.sin(fovRad / 2)) * 1.14;
    const direction = new THREE.Vector3(0.9, 0.5, 1.15).normalize();
    camera.position.copy(sphere.center.clone().addScaledVector(direction, distance));
    const lookTarget = sphere.center.clone();
    lookTarget.y -= sphere.radius * 0.16;
    camera.lookAt(lookTarget);
    perspective.updateProjectionMatrix();
  }, [scene, camera]);

  // Slow vertical bob so the robot reads as hovering in place.
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = baseY.current + Math.sin(clock.elapsedTime * 1.2) * 0.12;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export default function CourseRobotModel() {
  return (
    <div className="h-full w-full">
      <Canvas dpr={[1, 2]} camera={{ position: [3.2, 2.1, 5], fov: 32 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.6} />
        <directionalLight position={[-4, 3, -4]} intensity={0.4} />
        <Suspense fallback={null}>
          <StaticRobotModel />
          {/* Procedural env map — no network fetch, same as HeroScene. */}
          <Environment resolution={64} background={false}>
            <Lightformer intensity={2} color="white" position={[0, 5, 0]} scale={[10, 10, 1]} />
            <Lightformer intensity={1} color="#b7c8ff" position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[10, 5, 1]} />
            <Lightformer intensity={1} color="#ffe6b7" position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 5, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}
