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
  const spacing = 0.8;

  return (
    <div className="w-full h-60 md:h-72 bg-stone-900 rounded-xl overflow-hidden relative border border-stone-800">
      <span className="absolute top-2 left-3 z-10 text-[10px] text-stone-500 select-none">
        드래그하여 시점 회전
      </span>
      <Canvas camera={{ position: [0, 4, 4], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 8, 4]} intensity={1.2} />
        <Center>
          <group>
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
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
    </div>
  );
}
