'use client';

import { Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/robot.glb';
const MAX_YAW = 0.55; // radians either side of center

function RobotModel() {
  const group = useRef<THREE.Group>(null);
  const targetYaw = useRef(0);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, group);
  const { camera } = useThree();

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

  // Play whatever animation the model ships with, on loop.
  useEffect(() => {
    const clip = Object.values(actions)[0];
    clip?.reset().play();
    return () => {
      clip?.stop();
    };
  }, [actions]);

  // Track the mouse horizontally across the whole viewport and turn the
  // robot left/right to follow it, smoothly damped rather than snapping.
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      targetYaw.current = THREE.MathUtils.clamp(normalizedX, -1, 1) * MAX_YAW;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetYaw.current, 4.5, delta);
  });

  return <primitive ref={group} object={scene} />;
}

useGLTF.preload(MODEL_URL);

export default function HeroScene() {
  return (
    <div className="h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [3.2, 2.1, 5], fov: 32 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 3, -4]} intensity={0.4} />
        <Suspense fallback={null}>
          <RobotModel />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={8} blur={2.4} far={4} />
          {/* Procedural env map — no network fetch, unlike preset="city" which pulled
              an HDRI from a remote CDN and stalled the same Suspense boundary as the model. */}
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
