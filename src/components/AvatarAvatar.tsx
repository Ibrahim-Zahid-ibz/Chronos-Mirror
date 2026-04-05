'use client'

import { useState, useEffect, useMemo } from 'react'

interface AvatarProps {
  categoryStats: Record<string, number>
  totalLogs: number
  moodRatio: { positive: number; negative: number }
}

export default function AvatarAvatar({ categoryStats, totalLogs, moodRatio }: AvatarProps) {
  const [animPhase, setAnimPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setAnimPhase(p => (p + 1) % 60), 100)
    return () => clearInterval(interval)
  }, [])

  // Calculate trait values (0-1)
  const total = Object.values(categoryStats).reduce((a, b) => a + b, 0) || 1
  const health = (categoryStats.health || 0) / total
  const career = (categoryStats.career || 0) / total
  const finance = (categoryStats.finance || 0) / total
  const learning = (categoryStats.learning || 0) / total
  const relationships = (categoryStats.relationships || 0) / total
  const timeWaste = (categoryStats['time-waste'] || 0) / total

  const positiveRatio = moodRatio.positive / (moodRatio.positive + moodRatio.negative + 0.001)

  // Body type: health ↑ = fit, health ↓ = overweight
  const bodyWidth = 40 + (1 - health) * 20
  const bodyHeight = 50 + health * 10

  // Face expression: positive = smile, negative = frown
  const smileCurve = (positiveRatio - 0.5) * 12

  // Eyes: time-waste ↑ = half-closed/distracted, learning ↑ = wide/alert
  const eyeOpenness = 4 + learning * 3 - timeWaste * 3
  const eyeY = 38 - learning * 2

  // Glasses: learning ↑
  const hasGlasses = learning > 0.2

  // Mouth: mood + relationships
  const mouthY = 58 + (1 - positiveRatio) * 3

  // Hair: career ↑ = neat, time-waste ↑ = messy
  const hairMessiness = timeWaste * 8

  // Clothing: finance ↑ = suit/nice, career ↑ = professional
  const shirtColor = finance > 0.3 ? '#1e40af' : career > 0.3 ? '#374151' : '#6b7280'
  const hasTie = career > 0.25
  const hasWatch = finance > 0.25

  // Accessories: phone if time-waste high
  const hasPhone = timeWaste > 0.25

  // Posture: health ↑ = upright, health ↓ = slouched
  const postureTilt = (1 - health) * 5

  // Background glow based on overall activity
  const glowIntensity = Math.min(totalLogs / 20, 1)

  const breatheY = Math.sin(animPhase * 0.1) * 1.5
  const blinkPhase = animPhase % 120
  const isBlinking = blinkPhase > 115

  return (
    <div className="relative">
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle, rgba(99,102,241,${glowIntensity * 0.3}) 0%, transparent 70%)`,
        }}
      />

      <svg viewBox="0 0 100 120" className="w-32 h-32 md:w-40 md:h-40 relative z-10" style={{ transform: `rotate(${postureTilt - 2.5}deg) translateY(${breatheY}px)` }}>
        {/* Body */}
        <ellipse cx="50" cy={95 + breatheY * 0.5} rx={bodyWidth / 2} ry={bodyHeight / 2} fill={shirtColor} />

        {/* Tie */}
        {hasTie && (
          <polygon points="50,75 47,95 50,98 53,95" fill="#dc2626" />
        )}

        {/* Watch */}
        {hasWatch && (
          <circle cx="30" cy="90" r="4" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
        )}

        {/* Phone */}
        {hasPhone && (
          <rect x="68" y="78" width="10" height="16" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="0.5">
            <animate attributeName="y" values="78;76;78" dur="2s" repeatCount="indefinite" />
          </rect>
        )}

        {/* Neck */}
        <rect x="46" y="68" width="8" height="10" fill="#fbbf24" rx="2" />

        {/* Head */}
        <ellipse cx="50" cy="45" rx="22" ry="25" fill="#fcd34d" />

        {/* Hair */}
        <path
          d={`M 28 40 Q 28 20 50 18 Q 72 20 72 40 Q ${72 + hairMessiness} 25 ${50 + hairMessiness} 22 Q ${28 - hairMessiness} 25 28 40`}
          fill="#78350f"
        />
        {/* Messy hair strands */}
        {hairMessiness > 3 && (
          <>
            <line x1="65" y1="25" x2={70 + hairMessiness} y2={20 + hairMessiness} stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            <line x1="35" y1="22" x2={30 - hairMessiness * 0.5} y2={18 - hairMessiness} stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Eyes */}
        {!isBlinking ? (
          <>
            <ellipse cx="42" cy={eyeY} rx="3" ry={eyeOpenness / 2} fill="#1f2937" />
            <ellipse cx="58" cy={eyeY} rx="3" ry={eyeOpenness / 2} fill="#1f2937" />
            {/* Eye shine */}
            <circle cx="43" cy={eyeY - 1} r="1" fill="white" />
            <circle cx="59" cy={eyeY - 1} r="1" fill="white" />
          </>
        ) : (
          <>
            <line x1="39" y1={eyeY} x2="45" y2={eyeY} stroke="#1f2937" strokeWidth="2" />
            <line x1="55" y1={eyeY} x2="61" y2={eyeY} stroke="#1f2937" strokeWidth="2" />
          </>
        )}

        {/* Eyebrows */}
        <path d={`M 38 ${eyeY - 6} Q 42 ${eyeY - 8 - (1 - positiveRatio) * 3} 46 ${eyeY - 6}`} stroke="#78350f" strokeWidth="1.5" fill="none" />
        <path d={`M 54 ${eyeY - 6} Q 58 ${eyeY - 8 - (1 - positiveRatio) * 3} 62 ${eyeY - 6}`} stroke="#78350f" strokeWidth="1.5" fill="none" />

        {/* Glasses */}
        {hasGlasses && (
          <>
            <circle cx="42" cy={eyeY} r="6" fill="none" stroke="#374151" strokeWidth="1.5" />
            <circle cx="58" cy={eyeY} r="6" fill="none" stroke="#374151" strokeWidth="1.5" />
            <line x1="48" y1={eyeY} x2="52" y2={eyeY} stroke="#374151" strokeWidth="1.5" />
          </>
        )}

        {/* Mouth */}
        <path
          d={`M 42 ${mouthY} Q 50 ${mouthY + smileCurve} 58 ${mouthY}`}
          stroke="#92400e"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Cheeks */}
        {positiveRatio > 0.6 && (
          <>
            <circle cx="36" cy={mouthY - 4} r="3" fill="#fca5a5" opacity="0.5" />
            <circle cx="64" cy={mouthY - 4} r="3" fill="#fca5a5" opacity="0.5" />
          </>
        )}

        {/* Sweat drops if stressed (negative + career) */}
        {moodRatio.negative > moodRatio.positive && career > 0.2 && (
          <g>
            <path d="M 70 35 Q 72 40 70 42 Q 68 40 70 35" fill="#60a5fa">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {/* Zzz if time-waste is high */}
        {timeWaste > 0.3 && (
          <g>
            <text x="72" y="30" fontSize="8" fill="#9ca3af" opacity="0.7">
              <animate attributeName="y" values="30;25;30" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite" />
              Z
            </text>
            <text x="78" y="22" fontSize="6" fill="#9ca3af" opacity="0.5">
              <animate attributeName="y" values="22;17;22" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />
              z
            </text>
          </g>
        )}

        {/* Money symbols if finance is high */}
        {finance > 0.3 && (
          <text x="10" y="30" fontSize="10" fill="#22c55e" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
            $
          </text>
        )}

        {/* Book if learning is high */}
        {learning > 0.25 && (
          <rect x="65" y="85" width="12" height="15" rx="1" fill="#7c3aed" stroke="#5b21b6" strokeWidth="0.5">
            <animate attributeName="y" values="85;83;85" dur="4s" repeatCount="indefinite" />
          </rect>
        )}
      </svg>
    </div>
  )
}
