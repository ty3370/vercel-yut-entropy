"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import { YutStick } from "./YutStick3D";

interface YutSceneProps {
  states: boolean[];
  isRolling: boolean;
}

export function YutScene({ states, isRolling }: YutSceneProps) {
  const n = states.length;
  const spacing = 0.85;

  return (
    <div className="w-full h-64 md:h-76 bg-stone-900 rounded-xl overflow-hidden relative border border-stone-800 shadow-inner">
      <span className="absolute top-2 left-3 z-10 text-[11px] text-stone-400 select-none bg-stone-950/60 px-2 py-0.5 rounded">
        마우스 드래그로 3D 시점 회전
      </span>
      <Canvas camera={{ position: [0, 4.5, 3.8], fov: 42 }}>
        {/* @ts-ignore */}
        <ambientLight intensity={0.7} />
        {/* @ts-ignore */}
        <directionalLight position={[5, 9, 5]} intensity={1.3} />
        {/* @ts-ignore */}
        <directionalLight position={[-4, 6, -3]} intensity={0.4} />

        <Center>
          {/* @ts-ignore */}
          <group>
            {/* 바닥 매트 */}
            {/* @ts-ignore */}
            <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              {/* @ts-ignore */}
              <planeGeometry args={[8, 4.5]} />
              {/* @ts-ignore */}
              <meshStandardMaterial color="#1a1816" roughness={0.9} />
            </mesh>

            {/* 윷가락들 */}
            {states.map((isFlat, idx) => {
              const xOffset = (idx - (n - 1) / 2) * spacing;
              return (
                <YutStick
                  key={idx}
                  position={[xOffset, 0, 0]}
                  isFlat={isFlat}
                  isRolling={isRolling}
                />
              );
            })}
          </group>
        </Center>
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 6} />
      </Canvas>
    </div>
  );
}
