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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);

  // Keep track of animated coordinates for interpolation
  const animatedPiecePos = useRef<{ x: number; y: number }>({ x: piece.x, y: piece.y });
  const pulseAnim = useRef<number>(0);

  // Initialize animated position on mount or reset
  useEffect(() => {
    if (animatedPiecePos.current.x === undefined) {
      animatedPiecePos.current = { x: piece.x, y: piece.y };
    }
  }, [piece]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Clear canvas (unused here since we fill every square, but good default)
      ctx.fillStyle = '#1a0f0a'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const tileSize = canvas.width / boardSize;

      // 1. Draw Checkerboard Squares (Chess Board Color Theme)
      // Light squares: #eeeed2 (cream), Dark squares: #769656 (green)
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          const isLight = (row + col) % 2 === 0;
          ctx.fillStyle = isLight ? '#eeeed2' : '#769656';
          ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

          // Draw Rank numbers (10 to 1) on the left edge of column 0
          if (col === 0) {
            ctx.fillStyle = isLight ? '#769656' : '#eeeed2';
            ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText((boardSize - row).toString(), col * tileSize + 4, row * tileSize + 4);
          }

          // Draw File letters (a to j) on the bottom edge of the last row
          if (row === boardSize - 1) {
            ctx.fillStyle = isLight ? '#769656' : '#eeeed2';
            ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
            ctx.textBaseline = 'bottom';
            ctx.textAlign = 'right';
            const letter = String.fromCharCode(97 + col); // 97 is 'a'
            ctx.fillText(letter, (col + 1) * tileSize - 4, (row + 1) * tileSize - 4);
          }
        }
      }

      // 3. Update pulse animation values
      pulseAnim.current += 0.04;
      const pulseRate = Math.sin(pulseAnim.current);
      const pulseRadius = tileSize * 0.35 + pulseRate * 3;

      // 4. Draw Charging Circle (Target)
      const targetCenterX = target.x * tileSize + tileSize / 2;
      const targetCenterY = target.y * tileSize + tileSize / 2;

      // Draw semi-transparent dark backdrop for target so green glow is highly visible on light squares
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(targetCenterX, targetCenterY, tileSize * 0.43, 0, Math.PI * 2);
      ctx.fill();

      // Glowing outer ring
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15 + pulseRate * 5;
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.75 + pulseRate * 0.15})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(targetCenterX, targetCenterY, tileSize * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing target center
      const targetGrad = ctx.createRadialGradient(
        targetCenterX, targetCenterY, 2,
        targetCenterX, targetCenterY, pulseRadius
      );
      targetGrad.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
      targetGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.55)');
      targetGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      
      ctx.fillStyle = targetGrad;
      ctx.beginPath();
      ctx.arc(targetCenterX, targetCenterY, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw goal crosshairs on Target
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Horizontal cross
      ctx.moveTo(targetCenterX - tileSize * 0.2, targetCenterY);
      ctx.lineTo(targetCenterX - tileSize * 0.1, targetCenterY);
      ctx.moveTo(targetCenterX + tileSize * 0.1, targetCenterY);
      ctx.lineTo(targetCenterX + tileSize * 0.2, targetCenterY);
      // Vertical cross
      ctx.moveTo(targetCenterX, targetCenterY - tileSize * 0.2);
      ctx.lineTo(targetCenterX, targetCenterY - tileSize * 0.1);
      ctx.moveTo(targetCenterX, targetCenterY + tileSize * 0.1);
      ctx.lineTo(targetCenterX, targetCenterY + tileSize * 0.2);
      ctx.stroke();

      // 5. Interpolate Energy Orb (Piece) position
      const targetPixelX = piece.x * tileSize + tileSize / 2;
      const targetPixelY = piece.y * tileSize + tileSize / 2;

      animatedPiecePos.current.x += (targetPixelX - animatedPiecePos.current.x) * 0.12;
      animatedPiecePos.current.y += (targetPixelY - animatedPiecePos.current.y) * 0.12;

      // Draw 3D shadow for Energy Orb (stands out on board)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(animatedPiecePos.current.x + 3, animatedPiecePos.current.y + 4, tileSize * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Draw Energy Orb (Piece)
      ctx.shadowColor = '#f97316'; // Neon orange glow
      ctx.shadowBlur = 20;
      
      const orbGrad = ctx.createRadialGradient(
        animatedPiecePos.current.x, animatedPiecePos.current.y, 2,
        animatedPiecePos.current.x, animatedPiecePos.current.y, tileSize * 0.3
      );
      orbGrad.addColorStop(0, '#ffffff'); // Glowing white hot center
      orbGrad.addColorStop(0.3, '#ffedd5'); // Light cream
      orbGrad.addColorStop(0.7, '#f97316'); // Neon orange
      orbGrad.addColorStop(1, '#ea580c'); // Deep orange

      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(animatedPiecePos.current.x, animatedPiecePos.current.y, tileSize * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Draw subtle orbital rings around Energy Orb
      ctx.shadowBlur = 0; // Disable shadow for rings
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(animatedPiecePos.current.x, animatedPiecePos.current.y, tileSize * 0.36, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Draw Hover Tile Highlight
      if (hoverTile) {
        const isAdjacent = 
          Math.abs(hoverTile.x - piece.x) <= 1 && 
          Math.abs(hoverTile.y - piece.y) <= 1 && 
          (hoverTile.x !== piece.x || hoverTile.y !== piece.y);

        if (myTurn && isAdjacent) {
          // Highlight valid adjacent move (glowing gold/yellow, like chess square selection)
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        } else {
          // Highlight invalid move (red borders, no glow)
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        }
        
        ctx.beginPath();
        ctx.roundRect(hoverTile.x * tileSize + 2, hoverTile.y * tileSize + 2, tileSize - 4, tileSize - 4, 6);
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }

      // 7. Draw Visual Link from Orb to Active Target (darker dashed line on chess squares)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(animatedPiecePos.current.x, animatedPiecePos.current.y);
      ctx.lineTo(targetCenterX, targetCenterY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [piece, target, boardSize, myTurn, hoverTile]);

  // Click handler to emit movement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tileSize = rect.width / boardSize;
    const gridX = Math.floor(x / tileSize);
    const gridY = Math.floor(y / tileSize);

    if (gridX >= 0 && gridX < boardSize && gridY >= 0 && gridY < boardSize) {
      // Validate adjacent coordinates
      const isAdjacent =
        Math.abs(gridX - piece.x) <= 1 &&
        Math.abs(gridY - piece.y) <= 1 &&
        (gridX !== piece.x || gridY !== piece.y);

      if (myTurn && isAdjacent) {
        onMove(gridX, gridY);
      }
    }
  };

  // Mouse move handler for live grid hover highlighting
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tileSize = rect.width / boardSize;
    const gridX = Math.floor(x / tileSize);
    const gridY = Math.floor(y / tileSize);

    if (gridX >= 0 && gridX < boardSize && gridY >= 0 && gridY < boardSize) {
      if (!hoverTile || hoverTile.x !== gridX || hoverTile.y !== gridY) {
        setHoverTile({ x: gridX, y: gridY });
      }
    } else {
      setHoverTile(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverTile(null);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#3e2723]/60 bg-gradient-to-br from-[#2b1810] to-[#170e0a] p-5 shadow-2xl shadow-black/80">
      {/* Wood Grain Inlays for a Physical Chessboard Frame feel */}
      <div className="absolute top-2 left-2 right-2 bottom-2 border border-amber-500/10 pointer-events-none rounded-xl"></div>
      
      {/* Brass Corner screws */}
      <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-amber-500/35 border border-amber-600/30"></div>
      <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500/35 border border-amber-600/30"></div>
      <div className="absolute bottom-3 left-3 h-2 w-2 rounded-full bg-amber-500/35 border border-amber-600/30"></div>
      <div className="absolute bottom-3 right-3 h-2 w-2 rounded-full bg-amber-500/35 border border-amber-600/30"></div>

      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full max-w-[500px] aspect-square rounded-lg border-4 border-[#120a06] cursor-pointer shadow-2xl ${
          myTurn ? 'hover:shadow-lg hover:shadow-amber-500/10' : 'cursor-not-allowed opacity-95'
        }`}
      />
    </div>
  );
}
