"use client";

import React, { useState } from "react";
import { Users, Award, RotateCcw, ArrowRight } from "lucide-react";

// 윷판 29개 점의 2D 평면 좌표 (SVG viewBox 0 0 400 400 기준)
export const BOARD_POINTS: { [key: number]: { x: number; y: number } } = {
  // 외곽선 (출발/골인: 0 ~ 20)
  0: { x: 350, y: 350 },  // 출발 대기 / 입구
  1: { x: 350, y: 280 },
  2: { x: 350, y: 210 },
  3: { x: 350, y: 140 },
  4: { x: 350, y: 70 },
  5: { x: 350, y: 50 },   // 우측 상단 모서리 (분기점 1)
  6: { x: 280, y: 50 },
  7: { x: 210, y: 50 },
  8: { x: 140, y: 50 },
  9: { x: 70, y: 50 },
  10: { x: 50, y: 50 },   // 좌측 상단 모서리 (분기점 2)
  11: { x: 50, y: 120 },
  12: { x: 50, y: 190 },
  13: { x: 50, y: 260 },
  14: { x: 50, y: 330 },
  15: { x: 50, y: 350 },   // 좌측 하단 모서리
  16: { x: 120, y: 350 },
  17: { x: 190, y: 350 },
  18: { x: 260, y: 350 },
  19: { x: 330, y: 350 },
  20: { x: 370, y: 370 },  // 완주(골인)
  // 대각선 1: 5번 모서리 -> 중심(23) -> 15번 모서리
  21: { x: 300, y: 100 },
  22: { x: 250, y: 150 },
  23: { x: 200, y: 200 },  // 중앙 '방' (분기점 3)
  24: { x: 150, y: 250 },
  25: { x: 100, y: 300 },
  // 대각선 2: 10번 모서리 -> 중심(23) -> 0번 모서리
  26: { x: 100, y: 100 },
  27: { x: 150, y: 150 },
  28: { x: 250, y: 250 },
  29: { x: 300, y: 300 },
};

const TEAM_COLORS = [
  { name: "청팀", bg: "bg-blue-600", text: "text-blue-400", hex: "#2563eb" },
  { name: "홍팀", bg: "bg-red-600", text: "text-red-400", hex: "#dc2626" },
  { name: "녹팀", bg: "bg-emerald-600", text: "text-emerald-400", hex: "#059669" },
  { name: "황팀", bg: "bg-amber-500", text: "text-amber-400", hex: "#d97706" },
];

interface Piece {
  id: number;
  pos: number; // -1: 대기실, 100: 완주(골인), 그 외: BOARD_POINTS 키
  groupCount: number; // 업힌 말 수
}

interface YutBoardProps {
  lastRoll: number | null; // 최근 윷 결과 (앞면 개수: 도=1, 개=2, 걸=3, 윷=4, 모=5 or 0)
}

export function YutBoard({ lastRoll }: YutBoardProps) {
  const [teamCount, setTeamCount] = useState<number>(2);
  const [pieceCount, setPieceCount] = useState<number>(3);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [winner, setWinner] = useState<number | null>(null);

  // 팀별 말 상태 초기화 함수
  const initTeams = (tCount: number, pCount: number) => {
    return Array.from({ length: tCount }, () =>
      Array.from({ length: pCount }, (_, id) => ({ id, pos: -1, groupCount: 1 }))
    );
  };

  const [pieces, setPieces] = useState<Piece[][]>(() => initTeams(2, 3));

  // 말 이동 계산 로직 (윷놀이 고유 경로 및 지름길)
  const getNextPosition = (startPos: number, steps: number): number => {
    let cur = startPos;
    for (let i = 0; i < steps; i++) {
      if (i === 0) {
        // 첫 발자국 뗄 때의 코너 지름길 분기
        if (cur === -1) { cur = 1; continue; }
        if (cur === 5) { cur = 21; continue; }
        if (cur === 10) { cur = 26; continue; }
        if (cur === 23) { cur = 28; continue; } // 중앙 방에서 출발 시 우하향
      }
      // 일반 진행 경로
      if (cur >= 1 && cur < 20) cur += 1;
      else if (cur === 20) return 100; // 골인
      else if (cur === 21) cur = 22;
      else if (cur === 22) cur = 23;
      else if (cur === 23) cur = 24;
      else if (cur === 24) cur = 25;
      else if (cur === 25) cur = 15;
      else if (cur === 26) cur = 27;
      else if (cur === 27) cur = 23;
      else if (cur === 28) cur = 29;
      else if (cur === 29) cur = 20;
    }
    return cur > 20 && cur < 21 ? 100 : cur;
  };

  // 말 선택 및 이동 핸들러
  const handleMovePiece = (pieceIdx: number) => {
    if (winner !== null || lastRoll === null) return;
    
    // 이동할 칸 수: 전통 윷(0개 배=모=5칸), 그 외엔 나온 배의 개수만큼 이동 (0칸이면 이동 불가)
    const steps = lastRoll === 0 ? 5 : lastRoll;
    if (steps <= 0) return;

    const currentPiece = pieces[currentTurn][pieceIdx];
    if (currentPiece.pos === 100) return; // 이미 완주한 말

    const nextPos = getNextPosition(currentPiece.pos, steps);
    const updated = pieces.map((team) => team.map((p) => ({ ...p })));

    // 같은 위치에 있던 아군 말(업힌 말) 함께 이동
    const movingGroup = updated[currentTurn].filter((p) => p.pos === currentPiece.pos);
    movingGroup.forEach((p) => (p.pos = nextPos));

    let caughtOther = false;

    // 도착한 위치가 골인이 아닌 일반 판 위라면
    if (nextPos !== 100) {
      // 1. 상대 말 잡기
      updated.forEach((team, tIdx) => {
        if (tIdx !== currentTurn) {
          team.forEach((p) => {
            if (p.pos === nextPos) {
              p.pos = -1; // 시작 대기실로 퇴장
              p.groupCount = 1;
              caughtOther = true;
            }
          });
        }
      });

      // 2. 아군 말 업기
      const alliesAtDest = updated[currentTurn].filter((p) => p.pos === nextPos);
      const totalGroup = alliesAtDest.length;
      alliesAtDest.forEach((p) => (p.groupCount = totalGroup));
    }

    // 완주 여부 확인
    const allFinished = updated[currentTurn].every((p) => p.pos === 100);
    setPieces(updated);

    if (allFinished) {
      setWinner(currentTurn);
      return;
    }

    // 윷(4)이나 모(5/0), 또는 상대를 잡았을 때 턴 유지 규칙 적용 가능
    // 기본적으로는 다음 팀에게 턴 넘기기
    if (!caughtOther && lastRoll !== 4 && lastRoll !== 0) {
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
      {/* 좌측: 실물 윷놀이 SVG 보드 */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-stone-200 flex items-center gap-1.5">
            전통 윷판 시스템
          </h2>
          <span className="text-xs px-2 py-0.5 rounded font-semibold text-white shadow-sm" style={{ backgroundColor: TEAM_COLORS[currentTurn].hex }}>
            현재 턴: {TEAM_COLORS[currentTurn].name}
          </span>
        </div>

        <div className="w-full max-w-[340px] aspect-square bg-stone-950 border border-stone-800 rounded-lg p-2 relative shadow-inner">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* 외곽선 및 대각선 경로 선 */}
            <rect x="50" y="50" width="300" height="300" fill="none" stroke="#44403c" strokeWidth="2" />
            <line x1="50" y1="50" x2="350" y2="350" stroke="#44403c" strokeWidth="2" />
            <line x1="350" y1="50" x2="50" y2="350" stroke="#44403c" strokeWidth="2" />

            {/* 윷판 29개 점 그리기 */}
            {Object.entries(BOARD_POINTS).map(([id, pt]) => {
              const isSpecial = [5, 10, 15, 20, 23].includes(Number(id));
              return (
                <circle
                  key={id}
                  cx={pt.x}
                  cy={pt.y}
                  r={isSpecial ? 9 : 6}
                  className={isSpecial ? "fill-amber-600/60 stroke-amber-400 stroke-2" : "fill-stone-800 stroke-stone-600 stroke-1"}
                />
              );
            })}

            {/* 판 위의 말(Piece) 렌더링 */}
            {pieces.map((team, tIdx) =>
              team.map((piece) => {
                if (piece.pos === -1 || piece.pos === 100) return null;
                const pt = BOARD_POINTS[piece.pos];
                if (!pt) return null;
                const offset = (tIdx - (teamCount - 1) / 2) * 8;
                return (
                  <g key={`${tIdx}-${piece.id}`}>
                    <circle
                      cx={pt.x + offset}
                      cy={pt.y}
                      r={7}
                      fill={TEAM_COLORS[tIdx].hex}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {piece.groupCount > 1 && (
                      <text
                        x={pt.x + offset}
                        y={pt.y + 3}
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

      {/* 우측: 팀/말 설정 및 게임 인터랙션 컨트롤러 */}
      <div className="w-full md:w-64 flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          {/* 환경설정: 팀 수 & 말 수 */}
          <div className="bg-stone-950/70 border border-stone-800/80 p-3 rounded-lg flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">참여 팀 수</span>
              <div className="flex gap-1">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setTeamCount(n); handleResetBoard(n, pieceCount); }}
                    className={`px-2 py-0.5 rounded text-[11px] ${teamCount === n ? "bg-amber-600 text-white font-bold" : "bg-stone-800 text-stone-400"}`}
                  >
                    {n}팀
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-400">팀당 말 개수</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setPieceCount(n); handleResetBoard(teamCount, n); }}
                    className={`px-2 py-0.5 rounded text-[11px] ${pieceCount === n ? "bg-amber-600 text-white font-bold" : "bg-stone-800 text-stone-400"}`}
                  >
                    {n}개
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 승리 알림 */}
          {winner !== null && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Award className="w-4 h-4 text-amber-400" />
              {TEAM_COLORS[winner].name}이 모든 말을 완주시켜 승리했습니다!
            </div>
          )}

          {/* 말 이동 조작 리스트 */}
          <div>
            <div className="text-xs text-stone-300 font-semibold mb-2 flex justify-between">
              <span>{TEAM_COLORS[currentTurn].name} 말 이동 선택</span>
              <span className="text-amber-400">
                {lastRoll === null ? "윷 던지기 대기" : lastRoll === 0 ? "모 (5칸)" : `${lastRoll}칸 전진`}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
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
                    <span>
                      말 #{idx + 1}{" "}
                      {p.groupCount > 1 && <strong className="text-amber-400">({p.groupCount}동)</strong>}
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
          className="mt-4 flex items-center justify-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 rounded text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 윷판 초기화
        </button>
      </div>
    </div>
  );
}
