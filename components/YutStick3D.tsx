"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface YutStickProps {
  position: [number, number, number];
  isFlat: boolean;
  isRolling: boolean;
}

export function YutStick({ position, isFlat, isRolling }: YutStickProps) {
  const meshRef = useRef<THREE.Group>(null);
  const targetRotationZ = isFlat ? Math.PI : 0;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (isRolling) {
      meshRef.current.rotation.x += delta * 14;
      meshRef.current.rotation.y += delta * 10;
      meshRef.current.rotation.z += delta * 12;
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.015) * 0.4 + 0.4;
    } else {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, delta * 10);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, delta * 10);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotationZ, delta * 10);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], delta * 10);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* 둥근 등 (갈색 반원 기둥) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 2.2, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.4} />
      </mesh>
      {/* 평평한 배 (밝은 나무색 판) */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.02, 2.2, 0.5]} />
        <meshStandardMaterial color="#F5DEB3" roughness={0.3} />
      </mesh>
      {/* 배 표면 표식점 */}
      <mesh position={[0.02, 0.5, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#3A200B" />
      </mesh>
      <mesh position={[0.02, -0.5, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#3A200B" />
      </mesh>
    </group>
  );
}
