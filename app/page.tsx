"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, Play, FastForward, Info } from "lucide-react";

// 클라이언트 사이드에서만 Three.js 컴포넌트 렌더링
const YutScene = dynamic(
  () => import("@/components/YutScene").then((mod) => mod.YutScene),
  { ssr: false }
);

function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let res = 1;
  for (let i = 1; i <= r; i++) res = (res * (n - i + 1)) / i;
  return res;
}

export default function Home() {
  const [stickCount, setStickCount] = useState<number>(4);
  const [currentStates, setCurrentStates] = useState<boolean[]>(Array(4).fill(false));
  const [counts, setCounts] = useState<{ [key: number]: number }>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
  const [totalThrows, setTotalThrows] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const handleStickCountChange = (newCount: number) => {
    const val = Math.max(1, Math.min(8, newCount));
    setStickCount(val);
    setCurrentStates(Array(val).fill(false));
    const initCounts: { [key: number]: number } = {};
    for (let i = 0; i <= val; i++) initCounts[i] = 0;
    setCounts(initCounts);
    setTotalThrows(0);
  };

  const throwYut = (times = 1) => {
    if (isRolling) return;

    if (times === 1) {
      setIsRolling(true);
      setTimeout(() => {
        const newStates = Array.from({ length: stickCount }, () => Math.random() < 0.5);
        const flats = newStates.filter(Boolean).length;
        setCurrentStates(newStates);
        setCounts((prev) => ({ ...prev, [flats]: (prev[flats] || 0) + 1 }));
        setTotalThrows((prev) => prev + 1);
        setIsRolling(false);
      }, 400);
    } else {
      const nextCounts = { ...counts };
      let last = currentStates;
      for (let i = 0; i < times; i++) {
        const s = Array.from({ length: stickCount }, () => Math.random() < 0.5);
        const f = s.filter(Boolean).length;
        nextCounts[f] = (nextCounts[f] || 0) + 1;
        if (i === times - 1) last = s;
      }
      setCurrentStates(last);
      setCounts(nextCounts);
      setTotalThrows((prev) => prev + times);
    }
  };

  const handleReset = () => {
    const initCounts: { [key: number]: number } = {};
    for (let i = 0; i <= stickCount; i++) initCounts[i] = 0;
    setCounts(initCounts);
    setTotalThrows(0);
    setCurrentStates(Array(stickCount).fill(false));
  };

  const totalMicrostates = Math.pow(2, stickCount);
  const maxRecorded = useMemo(() => Math.max(...Object.values(counts), 1), [counts]);

  const getLabel = (k: number) => {
    if (stickCount !== 4) return `${k}개 앞면(배)`;
    const names = ["모 (0개)", "도 (1개)", "개 (2개)", "걸 (3개)", "윷 (4개)"];
    return names[k] || `${k}개`;
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-amber-500 mb-2">
          윷놀이 & 열역학 제2법칙 (엔트로피)
        </h1>
        <p className="text-stone-400 text-xs md:text-sm">
          거시상태를 구성하는 미시상태 수(Ω)가 클수록 엔트로피(S)가 높고 발생 확률이 극대화됩니다.
        </p>
      </header>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <YutScene states={currentStates} isRolling={isRolling} />

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300">
                윷가락 수: <strong className="text-amber-400 text-sm">{stickCount}</strong>개
              </span>
              <input
                type="range"
                min="1"
                max="8"
                value={stickCount}
                onChange={(e) => handleStickCountChange(Number(e.target.value))}
                className="w-28 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => throwYut(1)}
                disabled={isRolling}
                className="flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium py-2 rounded text-xs transition"
              >
                <Play className="w-3.5 h-3.5" /> 1회 던지기
              </button>
              <button
                onClick={() => throwYut(100)}
                disabled={isRolling}
                className="flex items-center justify-center gap-1 bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-white font-medium py-2 rounded text-xs transition"
              >
                <FastForward className="w-3.5 h-3.5" /> 100회 던지기
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/40 font-medium py-2 rounded text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 리셋
              </button>
            </div>
            <p className="text-[11px] text-stone-500 text-center">
              총 시도: <strong className="text-stone-300">{totalThrows}</strong>회
            </p>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-200 mb-1">상태별 관측 빈도 (막대그래프)</h2>
            <p className="text-[11px] text-stone-400 mb-3">
              막대: 실제 관측 누적치 | 점선: 볼츠만 미시상태 기반 이론 확률
            </p>

            <div className="flex flex-col gap-2">
              {Array.from({ length: stickCount + 1 }, (_, k) => {
                const count = counts[k] || 0;
                const pct = totalThrows > 0 ? ((count / totalThrows) * 100).toFixed(1) : "0.0";
                const omega = combinations(stickCount, k);
                const theoPct = ((omega / totalMicrostates) * 100).toFixed(1);
                const barWidth = totalThrows > 0 ? (count / maxRecorded) * 100 : 0;

                return (
                  <div key={k} className="text-xs">
                    <div className="flex justify-between text-stone-300 mb-0.5 text-[11px]">
                      <span>{getLabel(k)}</span>
                      <span>
                        {count}회 ({pct}%) · <span className="text-amber-400">Ω={omega}</span>
                      </span>
                    </div>
                    <div className="w-full bg-stone-800 rounded h-3 relative overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 border-r border-dashed border-amber-300 z-10"
                        style={{ left: `${theoPct}%` }}
                      />
                      <div
                        className="bg-amber-500 h-full transition-all duration-200"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-stone-950/70 border border-stone-800 rounded text-[11px] text-stone-400 flex gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-200 font-semibold">열역학적 평형 관점: </span>
              4개의 윷에서 ‘개(Ω=6)’가 ‘모(Ω=1)’나 ‘윷(Ω=1)’보다 훨씬 빈번하게 나타납니다. 
              던지는 횟수가 늘어날수록 계는 무질서도(미시상태의 가짓수)가 가장 큰 상태에 압도적으로 머물게 됩니다.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
