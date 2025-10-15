"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number; // pixel square
  showWordmark?: boolean;
  className?: string;
}

export default function Logo({ size = 32, showWordmark = false, className }: LogoProps) {
  const box = `${size}px`;
  return (
    <div className={cn("flex items-center", className)}>
      <div
        style={{ width: box, height: box }}
        className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md relative overflow-hidden"
      >
        {/* Crystal layers */}
        <div className="absolute inset-1 bg-white/15 rounded-md rotate-45" />
        <div className="absolute inset-2 bg-white/25 rounded-md rotate-45" />
        {/* Monogram */}
        <span className="relative text-white font-bold" style={{ fontSize: Math.max(12, size * 0.45) }}>
          C
        </span>
      </div>
      {showWordmark && (
        <div className="ml-3 leading-tight">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Clarity
          </div>
          <div className="text-xs text-gray-500">CRM</div>
        </div>
      )}
    </div>
  );
}


