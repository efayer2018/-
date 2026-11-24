import React from 'react';
import { PlantType, ZombieType } from '../types/game';

interface PlantSpriteProps {
  type: PlantType;
  boosted?: boolean;
  evolvedLevel?: number;
  hpRatio?: number;
  className?: string;
}

export const PlantSprite: React.FC<PlantSpriteProps> = ({
  type,
  boosted = false,
  evolvedLevel = 0,
  hpRatio = 1,
  className = 'w-11 h-11',
}) => {
  const ringClass = boosted
    ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]'
    : evolvedLevel > 0
      ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.75)]'
      : '';

  if (type === 'sunflower') {
    return (
      <svg viewBox="0 0 64 64" className={`${className} ${ringClass} animate-bob-gentle`} aria-hidden="true">
        <path d="M32 34 C32 45 31 54 32 58" stroke="#15803D" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M31 48 Q20 42 18 50 Q24 54 31 50" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
        <path d="M33 46 Q44 40 46 48 Q40 52 33 48" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <ellipse
            key={deg}
            cx="32"
            cy="11"
            rx="4.2"
            ry="8"
            fill={evolvedLevel > 0 ? '#FDE047' : '#FACC15'}
            stroke={evolvedLevel > 0 ? '#B45309' : '#CA8A04'}
            strokeWidth="1.3"
            transform={`rotate(${deg} 32 24)`}
          />
        ))}
        <circle cx="32" cy="24" r="11" fill="#92400E" stroke="#78350F" strokeWidth="1.8" />
        <circle cx="28.5" cy="22" r="1.6" fill="#FEF3C7" />
        <circle cx="35.5" cy="22" r="1.6" fill="#FEF3C7" />
        <path d="M27.5 26.5 Q32 30.5 36.5 26.5" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" fill="none" />
        {evolvedLevel > 0 && (
          <polygon points="24,6 28,2 32,6 36,2 40,6 38,11 26,11" fill="#F59E0B" stroke="#78350F" strokeWidth="1.2" />
        )}
      </svg>
    );
  }

  if (type === 'peashooter') {
    return (
      <svg viewBox="0 0 64 64" className={`${className} ${ringClass} animate-bob-gentle`} aria-hidden="true">
        <path d="M28 34 Q26 48 29 58" stroke="#15803D" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M28 50 Q16 46 14 54 Q22 57 28 53" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
        <path d="M30 48 Q42 44 44 52 Q36 55 30 51" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
        <path d="M18 17 Q12 12 10 18 Q15 22 20 20" fill="#16A34A" stroke="#14532D" strokeWidth="1.5" />
        <circle cx="28" cy="24" r="12" fill="#4ADE80" stroke="#14532D" strokeWidth="2" />
        {evolvedLevel > 0 ? (
          <>
            <rect x="35" y="15" width="17" height="8" rx="3" fill="#4ADE80" stroke="#14532D" strokeWidth="1.8" />
            <rect x="35" y="25" width="17" height="8" rx="3" fill="#22C55E" stroke="#14532D" strokeWidth="1.8" />
            <ellipse cx="52" cy="19" rx="2" ry="3.8" fill="#14532D" />
            <ellipse cx="52" cy="29" rx="2" ry="3.8" fill="#14532D" />
            <polygon points="22,11 28,6 34,11" fill="#F59E0B" stroke="#78350F" strokeWidth="1.2" />
          </>
        ) : (
          <>
            <rect x="35" y="19" width="16" height="10" rx="4" fill="#4ADE80" stroke="#14532D" strokeWidth="2" />
            <ellipse cx="51" cy="24" rx="2.5" ry="5" fill="#14532D" />
          </>
        )}
        <circle cx="31" cy="20" r="2.5" fill="#0F172A" />
        <circle cx="31.8" cy="19.2" r="0.9" fill="#FFFFFF" />
      </svg>
    );
  }

  if (type === 'snowpea') {
    return (
      <svg viewBox="0 0 64 64" className={`${className} ${ringClass} animate-bob-gentle`} aria-hidden="true">
        <path d="M28 34 Q26 48 29 58" stroke="#0E7490" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M28 50 Q16 46 14 54 Q22 57 28 53" fill="#22D3EE" stroke="#155E75" strokeWidth="1.5" />
        <path d="M30 48 Q42 44 44 52 Q36 55 30 51" fill="#22D3EE" stroke="#155E75" strokeWidth="1.5" />
        <polygon points="16,16 11,10 18,12 22,8 22,16" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.4" />
        <circle cx="28" cy="24" r="12" fill="#38BDF8" stroke="#0369A1" strokeWidth="2" />
        {evolvedLevel > 0 ? (
          <>
            <rect x="35" y="15" width="17" height="8" rx="3" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.8" />
            <rect x="35" y="25" width="17" height="8" rx="3" fill="#0EA5E9" stroke="#0369A1" strokeWidth="1.8" />
            <ellipse cx="52" cy="19" rx="2" ry="3.8" fill="#0C4A6E" />
            <ellipse cx="52" cy="29" rx="2" ry="3.8" fill="#0C4A6E" />
          </>
        ) : (
          <>
            <rect x="35" y="19" width="16" height="10" rx="4" fill="#38BDF8" stroke="#0369A1" strokeWidth="2" />
            <ellipse cx="51" cy="24" rx="2.5" ry="5" fill="#0C4A6E" />
          </>
        )}
        <circle cx="31" cy="20" r="2.5" fill="#0F172A" />
        <circle cx="31.8" cy="19.2" r="0.9" fill="#FFFFFF" />
      </svg>
    );
  }

  if (type === 'wallnut') {
    const isCracked = hpRatio < 0.65;
    const isCritical = hpRatio < 0.35;
    return (
      <svg viewBox="0 0 64 64" className={`${className} ${ringClass}`} aria-hidden="true">
        {evolvedLevel > 0 && (
          <>
            <polygon points="48,22 57,26 48,30" fill="#94A3B8" stroke="#334155" strokeWidth="1.4" />
            <polygon points="49,36 58,40 49,44" fill="#94A3B8" stroke="#334155" strokeWidth="1.4" />
          </>
        )}
        <ellipse
          cx="32"
          cy="34"
          rx="18"
          ry="22"
          fill={evolvedLevel > 0 ? '#B45309' : '#D97706'}
          stroke={evolvedLevel > 0 ? '#1E293B' : '#78350F'}
          strokeWidth={evolvedLevel > 0 ? '3' : '2.2'}
        />
        <ellipse cx="29" cy="28" rx="11" ry="14" fill="#F59E0B" opacity="0.45" />
        <circle cx="25" cy="29" r="3.2" fill="#FFFFFF" stroke="#451A03" strokeWidth="1.4" />
        <circle cx="39" cy="29" r="3.2" fill="#FFFFFF" stroke="#451A03" strokeWidth="1.4" />
        <circle cx="25.8" cy="29" r="1.4" fill="#1E293B" />
        <circle cx="39.8" cy="29" r="1.4" fill="#1E293B" />
        {isCritical ? (
          <path d="M26 42 Q32 37 38 42" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M26 40 Q32 44 38 40" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}
        {isCracked && (
          <path d="M22 16 L27 22 L24 27" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}
        {isCritical && (
          <path d="M44 22 L39 30 L43 36" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={`${className} ${ringClass} animate-hit-pulse`} aria-hidden="true">
      <path d="M22 26 Q32 10 34 12" stroke="#15803D" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M44 28 Q36 12 34 12" stroke="#15803D" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <ellipse cx="38" cy="11" rx="7" ry="3.5" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" transform="rotate(-15 38 11)" />
      <circle cx="21" cy="40" r="13" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" />
      <circle cx="44" cy="42" r="12" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2" />
      <path d="M15 35 L20 38 M26 35 L22 38" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      <path d="M39 37 L43 40 M49 37 L45 40" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 45 Q21 42 25 45" stroke="#450A0A" strokeWidth="2" fill="none" />
    </svg>
  );
};

interface ZombieSpriteProps {
  type: ZombieType;
  frozen?: boolean;
  hasKnowledgeShield?: boolean;
  className?: string;
}

export const ZombieSprite: React.FC<ZombieSpriteProps> = ({
  type,
  frozen = false,
  hasKnowledgeShield = false,
  className = 'w-12 h-14',
}) => {
  const skinColor = frozen ? '#93C5FD' : '#86EFAC';
  const skinStroke = frozen ? '#1D4ED8' : '#166534';

  return (
    <svg viewBox="0 0 64 72" className={`${className} animate-zombie-walk`} aria-hidden="true">
      {hasKnowledgeShield && (
        <ellipse
          cx="28"
          cy="38"
          rx="25"
          ry="28"
          fill="rgba(56, 189, 248, 0.16)"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeDasharray="5 3"
        />
      )}
      <rect x="24" y="52" width="6" height="14" rx="2" fill="#334155" />
      <rect x="35" y="52" width="6" height="14" rx="2" fill="#1E293B" />
      <rect x="20" y="32" width="24" height="23" rx="5" fill={type === 'scholar' ? '#4338CA' : '#475569'} stroke="#0F172A" strokeWidth="1.8" />
      <polygon points="32,33 29,43 32,46 35,43" fill="#DC2626" />
      {type === 'scholar' && (
        <rect x="10" y="37" width="12" height="14" rx="2" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" />
      )}
      <path d="M22 38 L8 36" stroke={skinColor} strokeWidth="6" strokeLinecap="round" />
      <path d="M22 38 L8 36" stroke={skinStroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <rect x="20" y="12" width="24" height="22" rx="8" fill={skinColor} stroke={skinStroke} strokeWidth="2" />
      <circle cx="27" cy="21" r="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
      <circle cx="36" cy="21" r="2.4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
      <circle cx="26.5" cy="21" r="1.2" fill="#0F172A" />
      <circle cx="35.5" cy="21" r="1.1" fill="#0F172A" />
      {type === 'scholar' && (
        <>
          <circle cx="27" cy="21" r="4.5" fill="none" stroke="#0F172A" strokeWidth="1.4" />
          <circle cx="36" cy="21" r="4.5" fill="none" stroke="#0F172A" strokeWidth="1.4" />
        </>
      )}
      <path d="M26 28 L37 28" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

      {type === 'conehead' && (
        <polygon points="32,1 20,16 44,16" fill="#F97316" stroke="#9A3412" strokeWidth="1.8" />
      )}
      {type === 'buckethead' && (
        <path d="M18 15 L21 3 L43 3 L46 15 Z" fill="#94A3B8" stroke="#334155" strokeWidth="2" />
      )}
      {type === 'scholar' && (
        <>
          <polygon points="32,2 14,9 32,15 50,9" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="46" y1="10" x2="48" y2="18" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};
