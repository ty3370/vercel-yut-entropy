"use client";

import React, { useState } from "react";
import { Award, RotateCcw, ArrowRight } from "lucide-react";

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

// SVG 크기: 400 x 400, 외곽 꼭짓점: (60,60) ~ (340,340)
// 간격 d = 70. 모서리 및 대각선 교차점이 기하학적으로 완벽히 일치하도록 설정
export const BOARD_POINTS: { [key: number]: { x: number; y: number } } = {
  // 외곽 테두리 (0: 참먹이/출발모서리, 반시계방향 0 -> 20)
  0: { x: 340, y: 340 },  // 우하단 모서리 (출발/골인점)
  1: { x: 340, y: 270 },
  2: { x: 340, y: 200 },
  3: { x: 340, y: 130 },
  4: { x: 340, y: 60 },   // 우상단 모서리 (꺾임 1)
  5: { x: 270, y: 60 },
  6: { x: 200, y: 60 },
  7: { x: 130, y: 60 },
  8: { x: 60, y: 60 },    // 좌상단 모서리 (꺾임 2)
  9: { x: 60, y: 130 },
  10: { x: 60, y: 200 },
  11: { x: 60, y: 270 },
  12: { x: 60, y: 340 },  // 좌하단 모서리
  13: { x: 130, y: 340 },
  14: { x: 200, y: 340 },
  15: { x: 270, y: 340 },

  // 대각선 1: 4번 모서리(우상단) -> 중앙(방: 23) -> 12번 모서리(좌하단)
  16: { x: 293, y: 107 },
  17: { x: 247, y: 153 },
  18: { x: 200, y: 200 }, // 정중앙 '방' (대각선 교차점)
  19: { x: 153, y: 247 },
  20: { x: 107, y: 293 },

  // 대각선 2: 8번 모서리(좌상단) -> 중앙(방: 18) -> 0번 모서리(우하단)
  21: { x: 107, y: 107 },
  22: { x: 153, y: 153 },
  23: { x: 247, y: 247 },
  24: { x: 293, y: 293 },
};

interface Piece {
  id: number;
  pos: number; // -1: 대기실, 100: 완주(골인), 그 외: BOARD_POINTS 키
  groupCount: number; // 업힌 말 개수
}

interface YutBoardProps {
  lastRoll: number | null; // 나온 앞면(배) 개수: 1=도, 2=개, 3=걸, 4=윷, 0=모
}

export function YutBoard({ lastRoll }: YutBoardProps) {
  const [teamCount, setTeamCount] = useState<number>(2);
  const [pieceCount, setPieceCount] = useState<number>(3);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [winner, setWinner] = useState<number | null>(null);

  // 팀별 말 목록 초기화
  const initTeams = (tCount: number, pCount: number): Piece[][] => {
    return Array.from({ length: tCount }, () =>
      Array.from({ length: pCount }, (_, id) => ({ id, pos: -1, groupCount: 1 }))
    );
  };

  const [pieces, setPieces] = useState<Piece[][]>(() => initTeams(2, 3));

  // 정통 윷놀이 이동 경로 분기 규칙
  const getNextPosition = (startPos: number, steps: number): number => {
    let cur = startPos;

    for (let step = 0; step < steps; step++) {
      if (step === 0) {
        // 첫 발자국 출발 시 모서리 분기점 판별
        if (cur === -1) { cur = 1; continue; }       // 대기실에서 출발
        if (cur === 4) { cur = 16; continue; }      // 우상단 모서리에서 중앙으로 꺾임
        if (cur === 8) { cur = 21; continue; }      // 좌상단 모서리에서 중앙으로 꺾임
        if (cur === 18) { cur = 23; continue; }     // 중앙 '방'에서 우하단 출구 방향으로 진행
      }

      // 외곽 경로 진행
      if (cur >= 1 && cur <= 3) cur += 1;
      else if (cur === 4) cur = 5;
      else if (cur >= 5 && cur <= 7) cur += 1;
      else if (cur === 8) cur = 9;
      else if (cur >= 9 && cur <= 11) cur += 1;
      else if (cur === 12) cur = 13;
      else if (cur >= 13 && cur <= 15) cur += 1;
      else if (cur === 15) cur = 0;                 // 골인 직전 마지막 참(모서리)
      else if (cur === 0) return 100;               // 0번 참을 지나면 완주(골인)

      // 대각선 1 진행 (우상단 -> 좌하단)
      else if (cur === 16) cur = 17;
      else if (cur === 17) cur = 18;                // 중앙 방 진입
      else if (cur === 18) cur = 19;
      else if (cur === 19) cur = 20;
      else if (cur === 20) cur = 12;                // 좌하단 모서리로 합류

      // 대각선 2 진행 (좌상단 -> 중앙 -> 우하단)
      else if (cur === 21) cur = 22;
      else if (cur === 22) cur = 18;                // 중앙 방 진입
      else if (cur === 23) cur = 24;
      else if (cur === 24) return 100;              // 우하단 대각선 출구 직통 완주
    }

    return cur;
  };

  // 말 선택 및 이동 실행
  const handleMovePiece = (pieceIdx: number) => {
    if (winner !== null || lastRoll === null) return;

    // 0개 앞면(모) = 5칸, 윷 = 4칸, 걸 = 3칸, 개 = 2칸, 도 = 1칸
    const steps = lastRoll === 0 ? 5 : lastRoll;
    if (steps <= 0) return;

    const targetPiece = pieces[currentTurn][pieceIdx];
    if (targetPiece.pos === 100) return;

    const oldPos = targetPiece.pos;
    const nextPos = getNextPosition(oldPos, steps);

    const updated = pieces.map((team) => team.map((p) => ({ ...p })));

    // [버그 수정 핵심]: 대기실(-1)에 있는 말들은 각자 독립적이어야 함.
    // 판 위에 이미 올라와서 같은 위치(oldPos !== -1)에 있는 아군 말들만 함께 이동(업기).
    const movingPieces = updated[currentTurn].filter((p) =>
      oldPos === -1 ? p.id === targetPiece.id : p.pos === oldPos
    );

    movingPieces.forEach((p) => {
      p.pos = nextPos;
    });

    let caughtOpponent = false;

    if (nextPos !== 100) {
      // 1. 상대 말 잡기
      updated.forEach((team, tIdx) => {
        if (tIdx !== currentTurn) {
          team.forEach((p) => {
            if (p.pos === nextPos) {
              p.pos = -1; // 잡힌 상대 말은 대기실로 귀환
              p.groupCount = 1;
              caughtOpponent = true;
            }
          });
        }
      });

      // 2. 아군 말 업기
      const samePositionAllies = updated[currentTurn].filter((p) => p.pos === nextPos);
      const totalInStack = samePositionAllies.length;
      samePositionAllies.forEach((p) => {
        p.groupCount = totalInStack;
      });
    }

    // 완주 검사
    const isTeamFinished = updated[currentTurn].every((p) => p.pos === 100);
    setPieces(updated);

    if (isTeamFinished) {
      setWinner(currentTurn);
      return;
    }

    // 윷(4), 모(0/5)가 아니거나 상대를 잡지 않았으면 다음 팀으로 턴 넘기기
    if (!caughtOpponent && lastRoll !== 4 && lastRoll !== 0) {
      setCurrentTurn((prev) => (prev + 1) % teamCount);
    }
  };

  const handleResetBoard = (t = teamCount, p = pieceCount) => {
    setPieces(initTeams(t, p));
    setCurrentTurn(0);
    setWinner(null);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl flex flex-col md:flex-row gap-6 mt-6">
      {/* 윷판 SVG 시각화 뷰 */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-stone-200">정통 윷판 시스템</h2>
          <span
            className="text-xs px-2.5 py-1 rounded font-semibold text-white shadow-sm"
            style={{ backgroundColor: TEAM_COLORS[currentTurn].hex }}
          >
            현재 턴: {TEAM_COLORS[currentTurn].name}
          </span>
        </div>

        <div className="w-full max-w-[360px] aspect-square bg-stone-950 border border-stone-800 rounded-lg p-3 relative shadow-inner">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* 정사각 외곽 틀 */}
            <rect x="60" y="60" width="280" height="280" fill="none" stroke="#44403c" strokeWidth="2.5" />
            {/* 대각선 2개 */}
            <line x1="60" y1="60" x2="340" y2="340" stroke="#44403c" strokeWidth="2.5" />
            <line x1="340" y1="60" x2="60" y2="340" stroke="#44403c" strokeWidth="2.5" />

            {/* 윷판 29개 점 그리기 */}
            {Object.entries(BOARD_POINTS).map(([idStr, pt]) => {
              const id = Number(idStr);
              // 모서리 4점(0, 4, 8, 12)과 중앙 방(18)은 큰 점
              const isCornerOrCenter = [0, 4, 8, 12, 18].includes(id);

              return (
                <circle
                  key={id}
                  cx={pt.x}
                  cy={pt.y}
                  r={isCornerOrCenter ? 10 : 6}
                  className={
                    isCornerOrCenter
                      ? "fill-amber-600/60 stroke-amber-400 stroke-2"
                      : "fill-stone-800 stroke-stone-600 stroke-1"
                  }
                />
              );
            })}

            {/* 판 위의 말 렌더링 (겹치지 않게 팀별 방사형 오프셋 배치) */}
            {pieces.map((team, tIdx) =>
              team.map((piece) => {
                if (piece.pos === -1 || piece.pos === 100) return null;
                const pt = BOARD_POINTS[piece.pos];
                if (!pt) return null;

                // 10팀까지 겹쳐도 식별 가능하도록 각도 기반 오프셋 부여
                const angle = (tIdx / teamCount) * 2 * Math.PI;
                const radius = teamCount > 4 ? 9 : 6;
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;

                return (
                  <g key={`${tIdx}-${piece.id}`}>
                    <circle
                      cx={pt.x + offsetX}
                      cy={pt.y + offsetY}
                      r={6}
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
                        fontWeight="bold"
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

      {/* 우측 조작 및 설정 패널 */}
      <div className="w-full md:w-72 flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          {/* 설정부: 팀 수(최대 10팀) & 말 개수 */}
          <div className="bg-stone-950/70 border border-stone-800/80 p-3 rounded-lg flex flex-col gap-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-stone-400 font-medium">참여 팀 수 (최대 10팀)</span>
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

          {/* 승리 알림 */}
          {winner !== null && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              {TEAM_COLORS[winner].name}이 모든 말을 완주시켜 승리했습니다!
            </div>
          )}

          {/* 각 개별 말 조작 리스트 (독립 이동) */}
          <div>
            <div className="text-xs text-stone-300 font-semibold mb-2 flex justify-between">
              <span>{TEAM_COLORS[currentTurn].name} 말 선택</span>
              <span className="text-amber-400 font-mono">
                {lastRoll === null ? "윷 던지기 대기" : lastRoll === 0 ? "모 (5칸)" : `${lastRoll}칸 전진`}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
              {pieces[currentTurn].map((p, idx) => {
                const isFinished = p.pos === 100;
                const isWaiting = p.pos === -1;

                return (
                  <button
                    key={idx}
                    onClick={() => handleMovePiece(idx)}
                    disabled={isFinished || lastRoll === null}
                    className="flex justify-between items-center bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none px-3 py-2 rounded text-xs text-stone-200 transition"
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
                      {isFinished ? "완주(골인)" : isWaiting ? "대기실 (출발)" : `${p.pos}번 칸`}
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
          className="mt-4 flex items-center justify-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 rounded text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 윷판 초기화
        </button>
      </div>
    </div>
  );
}
