'use client';

import React, { useRef, useEffect, useState } from 'react';

interface GameGridProps {
  piece: { x: number; y: number };
  target: { x: number; y: number };
  boardSize: number;
  myTurn: boolean;
  onMove: (x: number, y: number) => void;
}

export default function GameGrid({ piece, target, boardSize = 10, myTurn, onMove }: GameGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState(500);

  const animatedPiecePos = useRef<{ x: number; y: number }>({ x: piece.x, y: piece.y });
  const pulseAnim = useRef<number>(0);

  useEffect(() => {
    if (animatedPiecePos.current.x === undefined) {
      animatedPiecePos.current = { x: piece.x, y: piece.y };
    }
  }, [piece]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const size = Math.min(container.clientWidth, container.clientHeight, 600);
      setCanvasSize(size);
    };

    const obs = new ResizeObserver(resize);
    obs.observe(container);
    resize();

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const tileSize = canvas.width / boardSize;
      const half = tileSize / 2;

      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          const isLight = (row + col) % 2 === 0;
          ctx.fillStyle = isLight ? '#1e293b' : '#0f172a';
          ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

          if (col === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = `${Math.max(9, tileSize * 0.22)}px system-ui, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText((boardSize - row).toString(), col * tileSize + 4, row * tileSize + 4);
          }

          if (row === boardSize - 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = `${Math.max(9, tileSize * 0.22)}px system-ui, sans-serif`;
            ctx.textBaseline = 'bottom';
            ctx.textAlign = 'right';
            ctx.fillText(String.fromCharCode(97 + col), (col + 1) * tileSize - 4, (row + 1) * tileSize - 4);
          }
        }
      }

      pulseAnim.current += 0.04;
      const pulseRate = Math.sin(pulseAnim.current);

      const tCx = target.x * tileSize + half;
      const tCy = target.y * tileSize + half;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(tCx, tCy, tileSize * 0.43, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15 + pulseRate * 5;
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.75 + pulseRate * 0.15})`;
      ctx.lineWidth = Math.max(2, tileSize * 0.045);
      ctx.beginPath();
      ctx.arc(tCx, tCy, tileSize * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      const pulseRadius = tileSize * 0.35 + pulseRate * 3;
      const tg = ctx.createRadialGradient(tCx, tCy, 2, tCx, tCy, pulseRadius);
      tg.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
      tg.addColorStop(0.5, 'rgba(16, 185, 129, 0.55)');
      tg.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = tg;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(tCx, tCy, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = Math.max(1, tileSize * 0.025);
      ctx.beginPath();
      ctx.moveTo(tCx - tileSize * 0.2, tCy); ctx.lineTo(tCx - tileSize * 0.1, tCy);
      ctx.moveTo(tCx + tileSize * 0.1, tCy); ctx.lineTo(tCx + tileSize * 0.2, tCy);
      ctx.moveTo(tCx, tCy - tileSize * 0.2); ctx.lineTo(tCx, tCy - tileSize * 0.1);
      ctx.moveTo(tCx, tCy + tileSize * 0.1); ctx.lineTo(tCx, tCy + tileSize * 0.2);
      ctx.stroke();

      const tPx = piece.x * tileSize + half;
      const tPy = piece.y * tileSize + half;

      animatedPiecePos.current = { x: tPx, y: tPy };

      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(animatedPiecePos.current.x + 3, animatedPiecePos.current.y + 4, tileSize * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 20;
      const og = ctx.createRadialGradient(
        animatedPiecePos.current.x, animatedPiecePos.current.y, 2,
        animatedPiecePos.current.x, animatedPiecePos.current.y, tileSize * 0.3
      );
      og.addColorStop(0, '#ffffff');
      og.addColorStop(0.3, '#ffedd5');
      og.addColorStop(0.7, '#f97316');
      og.addColorStop(1, '#ea580c');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(animatedPiecePos.current.x, animatedPiecePos.current.y, tileSize * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.lineWidth = Math.max(1, tileSize * 0.025);
      ctx.beginPath();
      ctx.arc(animatedPiecePos.current.x, animatedPiecePos.current.y, tileSize * 0.36, 0, Math.PI * 2);
      ctx.stroke();

      if (hoverTile) {
        const isAdjacent =
          Math.abs(hoverTile.x - piece.x) <= 1 &&
          Math.abs(hoverTile.y - piece.y) <= 1 &&
          (hoverTile.x !== piece.x || hoverTile.y !== piece.y);

        if (myTurn && isAdjacent) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = Math.max(2, tileSize * 0.04);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        } else {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = Math.max(1, tileSize * 0.025);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        }

        ctx.beginPath();
        ctx.roundRect(hoverTile.x * tileSize + 2, hoverTile.y * tileSize + 2, tileSize - 4, tileSize - 4, Math.max(4, tileSize * 0.08));
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = Math.max(1, tileSize * 0.025);
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(animatedPiecePos.current.x, animatedPiecePos.current.y);
      ctx.lineTo(tCx, tCy);
      ctx.stroke();
      ctx.setLineDash([]);

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [piece, target, boardSize, myTurn, hoverTile, canvasSize]);

  const getGridFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const tileSize = rect.width / boardSize;
    const gridX = Math.floor(x / tileSize);
    const gridY = Math.floor(y / tileSize);
    if (gridX >= 0 && gridX < boardSize && gridY >= 0 && gridY < boardSize) {
      return { x: gridX, y: gridY };
    }
    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const grid = getGridFromEvent(e.clientX, e.clientY);
    if (!grid) return;
    const isAdjacent = Math.abs(grid.x - piece.x) <= 1 && Math.abs(grid.y - piece.y) <= 1 && (grid.x !== piece.x || grid.y !== piece.y);
    if (myTurn && isAdjacent) onMove(grid.x, grid.y);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    const grid = getGridFromEvent(touch.clientX, touch.clientY);
    if (!grid) return;
    const isAdjacent = Math.abs(grid.x - piece.x) <= 1 && Math.abs(grid.y - piece.y) <= 1 && (grid.x !== piece.x || grid.y !== piece.y);
    if (myTurn && isAdjacent) onMove(grid.x, grid.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const grid = getGridFromEvent(e.clientX, e.clientY);
    if (grid) {
      if (!hoverTile || hoverTile.x !== grid.x || hoverTile.y !== grid.y) setHoverTile(grid);
    } else {
      setHoverTile(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const grid = getGridFromEvent(touch.clientX, touch.clientY);
    if (grid) {
      if (!hoverTile || hoverTile.x !== grid.x || hoverTile.y !== grid.y) setHoverTile(grid);
    } else {
      setHoverTile(null);
    }
  };

  const handleMouseLeave = () => setHoverTile(null);

  return (
    <div ref={containerRef} className="relative flex-1 flex items-center justify-center w-full h-full min-h-0 p-1 sm:p-2">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e0f13]/60 shadow-2xl shadow-black/80 backdrop-blur-md max-w-full max-h-full box-border">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onClick={handleCanvasClick}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onMouseLeave={handleMouseLeave}
          className={`block rounded-lg border border-zinc-800/80 shadow-2xl touch-none max-w-full max-h-full box-border ${
            myTurn ? 'cursor-pointer' : 'cursor-not-allowed opacity-95'
          }`}
        />
      </div>
    </div>
  );
}
