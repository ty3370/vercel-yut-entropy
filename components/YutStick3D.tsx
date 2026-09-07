"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface YutStickProps {
  position: [number, number, number];
  isFlat: boolean; // true: 배(평평한 면이 위), false: 등(둥근 면이 위)
  isRolling: boolean;
}

export function YutStick({ position, isFlat, isRolling }: YutStickProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 배(평평한 면)가 위: Z축 180도 회전 (Math.PI)
  // 등(둥근 면)이 위: 0도
  const targetRotationZ = isFlat ? Math.PI : 0;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isRolling) {
      // 윷 던질 때 공중으로 튀어오르며 역동적 3축 회전
      groupRef.current.rotation.x += delta * 14;
      groupRef.current.rotation.y += delta * 11;
      groupRef.current.rotation.z += delta * 13;
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.015) * 0.4 + 0.5;
    } else {
      // 목표 각도로 부드럽게 안착
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 10);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 10);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotationZ, delta * 10);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], delta * 10);
    }
  });

  return (
    // @ts-ignore
    <group ref={groupRef} position={position}>
      {/* 
        윷가락 형태 (가로 길이 2.2, 반지름 0.26):
        - +Y 방향: 둥근 등 (짙은 나무색)
        - -Y 방향: 평평한 배 (밝은 나무색)
      */}
      <group>
        {/* 1. 둥근 등 (위로 볼록한 반원 기둥) */}
        {/* @ts-ignore */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* @ts-ignore */}
          <cylinderGeometry args={[0.26, 0.26, 2.2, 32, 1, false, -Math.PI / 2, Math.PI]} />
          {/* @ts-ignore */}
          <meshStandardMaterial color="#683d1e" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* 2. 평평한 배 (뚫려 있던 단면을 완벽히 밀봉하는 사각 상판) */}
        {/* @ts-ignore */}
        <mesh position={[0, -0.015, 0]}>
          {/* @ts-ignore */}
          <boxGeometry args={[0.52, 0.03, 2.2]} />
          {/* @ts-ignore */}
          <meshStandardMaterial color="#edd4a8" roughness={0.3} />
        </mesh>

        {/* 3. 배 표면의 전통 윷 표식점 3개 */}
        {/* @ts-ignore */}
        <mesh position={[0, -0.031, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          {/* @ts-ignore */}
          <cylinderGeometry args={[0.045, 0.045, 0.01, 16]} />
          {/* @ts-ignore */}
          <meshStandardMaterial color="#30190a" />
        </mesh>
        {/* @ts-ignore */}
        <mesh position={[0, -0.031, 0]} rotation={[Math.PI / 2, 0, 0]}>
          {/* @ts-ignore */}
          <cylinderGeometry args={[0.045, 0.045, 0.01, 16]} />
          {/* @ts-ignore */}
          <meshStandardMaterial color="#30190a" />
        </mesh>
        {/* @ts-ignore */}
        <mesh position={[0, -0.031, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
          {/* @ts-ignore */}
          <cylinderGeometry args={[0.045, 0.045, 0.01, 16]} />
          {/* @ts-ignore */}
          <meshStandardMaterial color="#30190a" />
        </mesh>
      </group>
    </group>
  );
}
