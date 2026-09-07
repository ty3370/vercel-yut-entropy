"use client";

import React, { useState } from "react";
import { Award, RotateCcw, ArrowRight, CheckCircle2 } from "lucide-react";

// 10개 팀 고유 색상 팔레트
const TEAM_COLORS = [
  { name: "1팀(청)", hex: "#2563eb" },
  { name: "2팀(홍)", hex: "#dc2626" },
  { name: "3팀(녹)", hex: "#16a34a" },
  { name: "4팀(황)", hex: "#ca8a04" },
  { name: "5팀(자)", hex: "#9333ea" },
  { name: "6팀(하)", hex: "#06b6d4" },
  { name: "7팀(분)", hex: "#ec4899" },
  { name: "8팀(주)", hex: "#ea580c" },
  { name: "9팀(라)", hex: "#84cc16" },
  { name: "10팀(회)", hex: "#64748b" },
];

// SVG ViewBox: 440 x 440
// 외곽 변 길이: 340 (x: 50 ~ 390, y: 50 ~ 390)
// 꼭짓점 사이 4칸씩: 한 칸 간격 = 340 / 5 = 68
// 대각선: 꼭짓점과 중심(220, 220) 사이에 정확히 2칸씩 균등 배치
export const BOARD_POINTS: { [key: number]: { x: number; y: number; label: string } } = {
  // --- 외곽 20개 점 (0 ~ 19) ---
  // 우측 변 (출발/참먹이 0번에서 위로 5번까지)
  0: { x: 390, y: 390, label: "0" },  // 우하단 꼭짓점 (출발 / 도착점)
  1: { x: 390, y: 322, label: "1" },
  2: { x: 390, y: 254, label: "2" },
  3: { x: 390, y: 186, label: "3" },
  4: { x: 390, y: 118, label: "4" },
  5: { x: 390, y: 50,  label: "5" },  // 우상단 꼭짓점 (분기 1)

  // 상단 변 (우상단 5번에서 좌상단 10번까지)
  6: { x: 322, y: 50,  label: "6" },
  7: { x: 254, y: 50,  label: "7" },
  8: { x: 186, y: 50,  label: "8" },
  9: { x: 118, y: 50,  label: "9" },
  10: { x: 50,  y: 50, label: "10" }, // 좌상단 꼭짓점 (분기 2)

  // 좌측 변 (좌상단 10번에서 좌하단 15번까지)
  11: { x: 50, y: 118, label: "11" },
  12: { x: 50, y: 186, label: "12" },
  13: { x: 50, y: 254, label: "13" },
  14: { x: 50, y: 322, label: "14" },
  15: { x: 50, y: 390, label: "15" }, // 좌하단 꼭짓점

  // 하단 변 (좌하단 15번에서 우하단 0번 전까지)
  16: { x: 118, y: 390, label: "16" },
  17: { x: 186, y: 390, label: "17" },
  18: { x: 254, y: 390, label: "18" },
  19: { x: 322, y: 390, label: "19" },

  // --- 대각선 9개 점 (20 ~ 28) ---
  // 대각선 1: 5번(우상단 390,50) -> 중심(220,220) [20, 21]
  20: { x: 333, y: 107, label: "20" },
  21: { x: 277, y: 163, label: "21" },

  // 정중앙 '방' (대각선 교차점)
  22: { x: 220, y: 220, label: "22" }, // 중앙 방

  // 대각선 1 계속: 중심(220,220) -> 15번(좌하단 50,390) [23, 24]
  23: { x: 163, y: 277, label: "23" },
  24: { x: 107, y: 333, label: "24" },

  // 대각선 2: 10번(좌상단 50,50) -> 중심(220,220) [25, 26]
  25: { x: 107, y: 107, label: "25" },
  26: { x: 163, y: 163, label: "26" },

  // 대각선 2 계속: 중심(220,220) -> 0번(우하단 390,390) [27, 28]
  27: { x: 277, y: 277, label: "27" },
  28: { x: 333, y: 333, label: "28" },
};

interface Piece {
  id: number;
  pos: number; // -1: 대기실, 100: 완주(골인), 0~28: 윷판 위치
  groupCount: number; // 업힌 말 개수
}

interface YutBoardProps {
  lastRoll: number | null; // 나온 앞면(배) 수: 1=도, 2=개, 3=걸, 4=윷, 0=모(5칸)
}

export function YutBoard({ lastRoll }: YutBoardProps) {
  const [teamCount, setTeamCount] = useState<number>(2);
  const [pieceCount, setPieceCount] = useState<number>(3);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [effectPos, setEffectPos] = useState<number | null>(null); // 말 착지 이펙트 위치

  const initTeams = (tCount: number, pCount: number): Piece[][] => {
    return Array.from({ length: tCount }, () =>
      Array.from({ length: pCount }, (_, id) => ({ id, pos: -1, groupCount: 1 }))
    );
  };

  const [pieces, setPieces] = useState<Piece[][]>(() => initTeams(2, 3));

  // 윷놀이 고유 경로 계산 로직
  const getNextPosition = (startPos: number, steps: number): number => {
    let cur = startPos;

    for (let s = 0; s < steps; s++) {
      if (s === 0) {
        // 첫 발자국 뗄 때의 모서리/중앙 분기
        if (cur === -1) { cur = 1; continue; }      // 대기실 출발 -> 1번
        if (cur === 5) { cur = 20; continue; }     // 우상단 -> 대각선 진입
        if (cur === 10) { cur = 25; continue; }    // 좌상단 -> 대각선 진입
        if (cur === 22) { cur = 27; continue; }    // 중앙 '방' -> 우하단 출구 방향 직통
      }

      // 외곽 경로 (0 ~ 19)
      if (cur >= 1 && cur <= 4) cur += 1;
      else if (cur === 5) cur = 6;
      else if (cur >= 6 && cur <= 9) cur += 1;
      else if (cur === 10) cur = 11;
      else if (cur >= 11 && cur <= 14) cur += 1;
      else if (cur === 15) cur = 16;
      else if (cur >= 16 && cur <= 19) cur += 1;
      else if (cur === 19) cur = 0;                // 0번 참 진입
      else if (cur === 0) return 100;              // 0번 참을 통과하면 완주(골인)

      // 대각선 1 경로 (5 -> 20 -> 21 -> 22(중앙) -> 23 -> 24 -> 15(좌하단))
      else if (cur === 20) cur = 21;
      else if (cur === 21) cur = 22;               // 중앙 '방'
      else if (cur === 22) cur = 23;
      else if (cur === 23) cur = 24;
      else if (cur === 24) cur = 15;               // 좌하단 꼭짓점으로 합류

      // 대각선 2 경로 (10 -> 25 -> 26 -> 22(중앙) -> 27 -> 28 -> 완주)
      else if (cur === 25) cur = 26;
      else if (cur === 26) cur = 22;               // 중앙 '방'
      else if (cur === 27) cur = 28;
      else if (cur === 28) return 100;             // 대각선 직통 완주(골인)
    }

    return cur;
  };

  // 말 이동 실행
  const handleMovePiece = (pieceIdx: number) => {
    if (winner !== null || lastRoll === null) return;

    // 0개 앞면(모) = 5칸, 1=도, 2=개, 3=걸, 4=윷
    const steps = lastRoll === 0 ? 5 : lastRoll;
    if (steps <= 0) return;

    const targetPiece = pieces[currentTurn][pieceIdx];
    if (targetPiece.pos === 100) return;

    const oldPos = targetPiece.pos;
    const nextPos = getNextPosition(oldPos, steps);

    const updated = pieces.map((team) => team.map((p) => ({ ...p })));

    // 판 위에 이미 올라와서 같은 위치에 있는 아군 말들만 함께 이동 (업기)
    const movingGroup = updated[currentTurn].filter((p) =>
      oldPos === -1 ? p.id === targetPiece.id : p.pos === oldPos
    );

    movingGroup.forEach((p) => {
      p.pos = nextPos;
    });

    // 착지 시각 이펙트 발동
    if (nextPos !== 100) {
      setEffectPos(nextPos);
      setTimeout(() => setEffectPos(null), 800);
    }

    let caughtOpponent = false;

    if (nextPos !== 100) {
      // 1. 상대 말 잡기
      updated.forEach((team, tIdx) => {
        if (tIdx !== currentTurn) {
          team.forEach((p) => {
            if (p.pos === nextPos) {
              p.pos = -1; // 잡힌 말은 대기실로 귀환
              p.groupCount = 1;
              caughtOpponent = true;
            }
          });
        }
      });

      // 2. 아군 말 업기
      const stackedAllies = updated[currentTurn].filter((p) => p.pos === nextPos);
      const totalCount = stackedAllies.length;
      stackedAllies.forEach((p) => {
        p.groupCount = totalCount;
      });
    }

    // 완주 검사
    const isTeamFinished = updated[currentTurn].every((p) => p.pos === 100);
    setPieces(updated);

    if (isTeamFinished) {
      setWinner(currentTurn);
      return;
    }

    // 윷(4)이나 모(0/5)가 아니거나 상대를 잡지 못했으면 다음 팀 턴으로 교체
    if (!caughtOpponent && lastRoll !== 4 && lastRoll !== 0) {
      setCurrentTurn((prev) => (prev + 1) % teamCount);
    }
  };

  const handleResetBoard = (t = teamCount, p = pieceCount) => {
    setPieces(initTeams(t, p));
    setCurrentTurn(0);
    setWinner(null);
    setEffectPos(null);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl flex flex-col md:flex-row gap-6 mt-6">
      {/* 좌측: 전통 윷판 SVG 시각화 */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-stone-200">정통 윷판 (29개 점)</h2>
          <span
            className="text-xs px-2.5 py-1 rounded font-semibold text-white shadow-sm transition-colors"
            style={{ backgroundColor: TEAM_COLORS[currentTurn].hex }}
          >
            현재 턴: {TEAM_COLORS[currentTurn].name}
          </span>
        </div>

        <div className="w-full max-w-[380px] aspect-square bg-stone-950 border border-stone-800 rounded-lg p-2.5 relative shadow-inner">
          <svg viewBox="0 0 440 440" className="w-full h-full select-none">
            {/* 외곽 정사각형 테두리 라인 */}
            <rect x="50" y="50" width="340" height="340" fill="none" stroke="#383533" strokeWidth="2.5" />
            {/* 2개 대각선 라인 */}
            <line x1="50" y1="50" x2="390" y2="390" stroke="#383533" strokeWidth="2.5" />
            <line x1="390" y1="50" x2="50" y2="390" stroke="#383533" strokeWidth="2.5" />

            {/* 착지 시 펄스 링 이펙트 */}
            {effectPos !== null && BOARD_POINTS[effectPos] && (
              <circle
                cx={BOARD_POINTS[effectPos].x}
                cy={BOARD_POINTS[effectPos].y}
                r={16}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                className="animate-ping origin-center"
              />
            )}

            {/* 윷판 29개 점 및 칸 번호 렌더링 */}
            {Object.entries(BOARD_POINTS).map(([idStr, pt]) => {
              const id = Number(idStr);
              const isLargePoint = [0, 5, 10, 15, 22].includes(id); // 4대 모서리 및 중앙 방
              const radius = isLargePoint ? 14 : 9.5;

              return (
                <g key={id}>
                  {/* 칸 바탕 원 */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={radius}
                    className={
                      isLargePoint
                        ? "fill-stone-900 stroke-amber-500 stroke-2"
                        : "fill-stone-900 stroke-stone-600 stroke-1"
                    }
                  />
                  {/* 칸 번호 텍스트 표기 */}
                  <text
                    x={pt.x}
                    y={pt.y + (isLargePoint ? 3.5 : 3)}
                    fontSize={isLargePoint ? "10" : "8"}
                    textAnchor="middle"
                    fill={isLargePoint ? "#fbbf24" : "#a8a29e"}
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}

            {/* 판 위의 말 렌더링 (방사형 오프셋 배치) */}
            {pieces.map((team, tIdx) =>
              team.map((piece) => {
                if (piece.pos === -1 || piece.pos === 100) return null;
                const pt = BOARD_POINTS[piece.pos];
                if (!pt) return null;

                const angle = (tIdx / teamCount) * 2 * Math.PI;
                const radiusOffset = teamCount > 4 ? 10 : 7;
                const offsetX = Math.cos(angle) * radiusOffset;
                const offsetY = Math.sin(angle) * radiusOffset;

                return (
                  <g key={`${tIdx}-${piece.id}`} className="transition-all duration-300">
                    <circle
                      cx={pt.x + offsetX}
                      cy={pt.y + offsetY}
                      r={6.5}
                      fill={TEAM_COLORS[tIdx].hex}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {piece.groupCount > 1 && (
                      <text
                        x={pt.x + offsetX}
                        y={pt.y + offsetY + 3}
                        fontSize="8"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontWeight="extrabold"
                      >
                        {piece.groupCount}
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>
      </div>

      {/* 우측 조작 및 완주 현황 패널 */}
      <div className="w-full md:w-80 flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          {/* 설정부: 팀 수 (최대 10팀) & 말 수 */}
          <div className="bg-stone-950/70 border border-stone-800/80 p-3 rounded-lg flex flex-col gap-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-stone-400 font-medium">참여 팀 수</span>
                <strong className="text-amber-400 font-bold">{teamCount}개 팀</strong>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={teamCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTeamCount(val);
                  handleResetBoard(val, pieceCount);
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-800">
              <span className="text-stone-400 font-medium">팀당 말 개수</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setPieceCount(n);
                      handleResetBoard(teamCount, n);
                    }}
                    className={`px-2.5 py-0.5 rounded text-xs transition ${
                      pieceCount === n ? "bg-amber-600 text-white font-bold" : "bg-stone-800 text-stone-400"
                    }`}
                  >
                    {n}개
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 실시간 각 팀별 완주(골인) 현황 바 */}
          <div className="bg-stone-950/70 border border-stone-800/80 p-2.5 rounded-lg flex flex-col gap-1.5 text-xs">
            <span className="text-stone-400 font-medium text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 팀별 완주(골인) 현황
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
              {pieces.slice(0, teamCount).map((team, idx) => {
                const finishedCount = team.filter((p) => p.pos === 100).length;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-2 py-1 rounded text-[11px] ${
                      currentTurn === idx ? "bg-stone-800 border border-stone-700" : "bg-stone-900/60"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-stone-300">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: TEAM_COLORS[idx].hex }}
                      />
                      {TEAM_COLORS[idx].name}
                    </span>
                    <span className="font-mono">
                      <strong className="text-emerald-400">{finishedCount}</strong>
                      <span className="text-stone-500">/{pieceCount}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 승리 배너 */}
          {winner !== null && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              {TEAM_COLORS[winner].name}이 모든 말을 완주시켜 승리했습니다!
            </div>
          )}

          {/* 말 이동 선택 컨트롤러 */}
          <div>
            <div className="text-xs text-stone-300 font-semibold mb-1.5 flex justify-between items-center">
              <span>{TEAM_COLORS[currentTurn].name} 말 이동</span>
              <span className="text-amber-400 font-mono text-xs">
                {lastRoll === null ? "윷 던지기 대기" : lastRoll === 0 ? "모 (5칸)" : `${lastRoll}칸 전진`}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
              {pieces[currentTurn].map((p, idx) => {
                const isFinished = p.pos === 100;
                const isWaiting = p.pos === -1;

                return (
                  <button
                    key={idx}
                    onClick={() => handleMovePiece(idx)}
                    disabled={isFinished || lastRoll === null}
                    className="flex justify-between items-center bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none px-3 py-2 rounded text-xs text-stone-200 transition active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: TEAM_COLORS[currentTurn].hex }}
                      />
                      <span>말 #{idx + 1}</span>
                      {p.groupCount > 1 && (
                        <span className="text-amber-400 text-[10px] font-bold">({p.groupCount}동)</span>
                      )}
                    </span>
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      {isFinished ? (
                        <span className="text-emerald-400 font-bold">완주 완료</span>
                      ) : isWaiting ? (
                        "대기실 (출발)"
                      ) : (
                        `${p.pos}번 칸`
                      )}
                      <ArrowRight className="w-3 h-3 text-amber-500" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 윷판 리셋 버튼 */}
        <button
          onClick={() => handleResetBoard()}
          className="mt-3 flex items-center justify-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 rounded text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 윷판 초기화
        </button>
      </div>
    </div>
  );
}
