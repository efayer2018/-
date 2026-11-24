import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  Flame,
  MessageSquareWarning,
  Music,
  Pause,
  Play,
  RotateCcw,
  Shovel,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { DIFFICULTY_LABELS, PLANTS, SUBJECT_LABELS, ZOMBIES } from '../data/questions';
import {
  ExplosionEffect,
  GameState,
  LevelConfig,
  PlantInstance,
  PlantType,
  ProjectileInstance,
  Question,
  QuizTriggerContext,
  StudyMode,
  SunOrb,
  ZombieInstance,
  ZombieType,
} from '../types/game';
import { generateQuestionForChapter } from '../utils/questionGenerator';
import { soundEngine } from '../utils/sound';
import { QuestionModal } from './QuestionModal';
import { PlantSprite, ZombieSprite } from './Sprites';

const ROWS = 5;
const COLS = 9;

interface GameBoardProps {
  level: LevelConfig;
  studyMode: StudyMode;
  bonusInitialSun: number;
  onRecordMistake: (question: Question) => void;
  onSolvedQuestion: (question: Question, currentStreak: number) => void;
  onLevelCleared: (chapterId: string, pointsEarned: number) => void;
  onExitToLobby: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  level,
  studyMode,
  bonusInitialSun,
  onRecordMistake,
  onSolvedQuestion,
  onLevelCleared,
  onExitToLobby,
}) => {
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [sun, setSun] = useState<number>(level.initialSun + bonusInitialSun);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [comboToast, setComboToast] = useState<{
    id: number;
    combo: number;
    title: string;
    subtitle: string;
    tier: 'normal' | 'combo3' | 'combo5';
  } | null>(null);
  const comboToastTimerRef = useRef<number | null>(null);
  const [solvedInMatch, setSolvedInMatch] = useState<number>(0);
  const [attemptedInMatch, setAttemptedInMatch] = useState<number>(0);
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>('sunflower');
  const [shovelActive, setShovelActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundEngine.enabled);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(soundEngine.bgmEnabled);
  const [autoQuizSec, setAutoQuizSec] = useState<number>(Math.round(level.autoQuizIntervalMs / 1000));
  const [cooldowns, setCooldowns] = useState<Record<PlantType, number>>({
    sunflower: 0,
    peashooter: 0,
    wallnut: 0,
    snowpea: 0,
    cherrybomb: 0,
  });

  const [plants, setPlants] = useState<PlantInstance[]>([]);
  const [zombies, setZombies] = useState<ZombieInstance[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileInstance[]>([]);
  const [sunOrbs, setSunOrbs] = useState<SunOrb[]>([]);
  const [explosions, setExplosions] = useState<ExplosionEffect[]>([]);
  const [lawnmowers, setLawnmowers] = useState<boolean[]>([true, true, true, true, true]);
  const [defeatedCount, setDefeatedCount] = useState<number>(0);
  const [statusBanner, setStatusBanner] = useState<string>(
    `【${level.unitLabel} ${level.name}】点选上方植物卡片再轻点草坪即可种植，点击阳光与僵尸直接互动！`
  );
  const [quizContext, setQuizContext] = useState<QuizTriggerContext | null>(null);
  const clearedReportedRef = useRef(false);

  const streakRef = useRef(0);
  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  // Manage background music lifecycle
  useEffect(() => {
    if (gameState === 'PLAYING' && soundEnabled && bgmEnabled) {
      soundEngine.unlock();
      soundEngine.startBgm();
    } else {
      soundEngine.stopBgm();
    }
    return () => {
      soundEngine.stopBgm();
    };
  }, [bgmEnabled, gameState, soundEnabled]);

  useEffect(() => {
    return () => {
      soundEngine.stopBgm();
      soundEngine.stopSpeech();
      if (comboToastTimerRef.current !== null) {
        window.clearTimeout(comboToastTimerRef.current);
      }
    };
  }, []);

  const showComboCelebration = useCallback(
    (combo: number, title: string, subtitle: string, tier: 'normal' | 'combo3' | 'combo5') => {
      if (comboToastTimerRef.current !== null) {
        window.clearTimeout(comboToastTimerRef.current);
      }
      setComboToast({ id: Date.now(), combo, title, subtitle, tier });
      comboToastTimerRef.current = window.setTimeout(() => {
        setComboToast(null);
      }, 2400);
    },
    []
  );

  const stateRef = useRef({
    plants: [] as PlantInstance[],
    zombies: [] as ZombieInstance[],
    projectiles: [] as ProjectileInstance[],
    sunOrbs: [] as SunOrb[],
    explosions: [] as ExplosionEffect[],
    lawnmowers: [true, true, true, true, true] as boolean[],
    cooldowns: {
      sunflower: 0,
      peashooter: 0,
      wallnut: 0,
      snowpea: 0,
      cherrybomb: 0,
    } as Record<PlantType, number>,
    spawnedCount: 0,
    defeatedCount: 0,
    spawnTimerMs: 2200,
    skySunTimerMs: 6500,
    autoQuizTimerMs: level.autoQuizIntervalMs,
    simTimeMs: 0,
    score: 0,
  });

  const usedQuestionIdsRef = useRef<Set<string>>(new Set());

  const pickChapterQuestion = useCallback((): Question => {
    const q = generateQuestionForChapter(level.chapterId, level.grade, usedQuestionIdsRef.current);
    usedQuestionIdsRef.current.add(q.id);
    if (usedQuestionIdsRef.current.size > 24) {
      usedQuestionIdsRef.current.clear();
    }
    return q;
  }, [level.chapterId, level.grade]);

  const resetMatch = useCallback(() => {
    clearedReportedRef.current = false;
    stateRef.current = {
      plants: [],
      zombies: [],
      projectiles: [],
      sunOrbs: [],
      explosions: [],
      lawnmowers: [true, true, true, true, true],
      cooldowns: {
        sunflower: 0,
        peashooter: 0,
        wallnut: 0,
        snowpea: 0,
        cherrybomb: 0,
      },
      spawnedCount: 0,
      defeatedCount: 0,
      spawnTimerMs: 2200,
      skySunTimerMs: 6500,
      autoQuizTimerMs: level.autoQuizIntervalMs,
      simTimeMs: 0,
      score: 0,
    };
    setPlants([]);
    setZombies([]);
    setProjectiles([]);
    setSunOrbs([]);
    setExplosions([]);
    setLawnmowers([true, true, true, true, true]);
    setCooldowns({
      sunflower: 0,
      peashooter: 0,
      wallnut: 0,
      snowpea: 0,
      cherrybomb: 0,
    });
    setSun(level.initialSun + bonusInitialSun);
    setScore(0);
    setStreak(0);
    setMaxCombo(0);
    setComboToast(null);
    setSolvedInMatch(0);
    setAttemptedInMatch(0);
    setDefeatedCount(0);
    setAutoQuizSec(Math.round(level.autoQuizIntervalMs / 1000));
    setSelectedPlant('sunflower');
    setShovelActive(false);
    setQuizContext(null);
    setStatusBanner(`【${level.unitLabel} ${level.name}】点选上方植物卡片再轻点草坪即可种植，点击阳光与僵尸直接互动！`);
    setGameState('PLAYING');
  }, [bonusInitialSun, level]);

  const triggerManualSunQuiz = useCallback(() => {
    soundEngine.unlock();
    if (gameState !== 'PLAYING' || quizContext) return;
    stateRef.current.autoQuizTimerMs = level.autoQuizIntervalMs;
    setAutoQuizSec(Math.round(level.autoQuizIntervalMs / 1000));
    const q = pickChapterQuestion();
    setQuizContext({
      purpose: 'sun_supply',
      question: q,
      rewardText: '+100 阳光 & 提升全队共鸣伤害',
    });
  }, [gameState, level.autoQuizIntervalMs, pickChapterQuestion, quizContext]);

  const triggerZombieShoutQuiz = useCallback(
    (z: ZombieInstance) => {
      soundEngine.unlock();
      if (gameState !== 'PLAYING' || quizContext) return;
      const q = z.shoutQuestion || pickChapterQuestion();
      const isBoss = z.type === 'scholar';
      setQuizContext({
        purpose: 'zombie_shout',
        targetZombieId: z.id,
        question: q,
        rewardText: isBoss
          ? '重创单元 Boss 340 生命值并击退 1 格 + 30 阳光'
          : '直接击毙这只喊题僵尸！并奖励 +25 阳光',
      });
    },
    [gameState, pickChapterQuestion, quizContext]
  );

  const triggerPlantInteractionQuiz = useCallback(
    (plant: PlantInstance) => {
      soundEngine.unlock();
      if (gameState !== 'PLAYING' || quizContext) return;
      if (plant.type === 'cherrybomb') return;
      const q = pickChapterQuestion();

      if (plant.hp < plant.maxHp * 0.45) {
        setQuizContext({
          purpose: 'emergency_rescue',
          targetPlantId: plant.id,
          question: q,
          rewardText: `${PLANTS[plant.type].name}紧急救援：回满生命并震退面前僵尸`,
        });
        return;
      }

      if (plant.energy >= 100 && plant.evolvedLevel === 0) {
        setQuizContext({
          purpose: 'plant_evolve',
          targetPlantId: plant.id,
          question: q,
          rewardText: PLANTS[plant.type].evolveEffect,
        });
        return;
      }

      setQuizContext({
        purpose: 'plant_boost',
        targetPlantId: plant.id,
        question: q,
        rewardText: `${PLANTS[plant.type].name}觉醒：${PLANTS[plant.type].boostEffect}`,
      });
    },
    [gameState, pickChapterQuestion, quizContext]
  );

  // Main simulation tick
  useEffect(() => {
    if (gameState !== 'PLAYING' || quizContext !== null) return;

    const TICK_MS = 50;
    const dtSec = TICK_MS / 1000;

    const timer = window.setInterval(() => {
      const s = stateRef.current;
      s.simTimeMs += TICK_MS;
      const now = s.simTimeMs;

      // 0. Automatic Sun Quiz Timer
      s.autoQuizTimerMs -= TICK_MS;
      setAutoQuizSec(Math.max(0, Math.ceil(s.autoQuizTimerMs / 1000)));
      if (s.autoQuizTimerMs <= 0) {
        s.autoQuizTimerMs = level.autoQuizIntervalMs;
        setAutoQuizSec(Math.round(level.autoQuizIntervalMs / 1000));
        const q = pickChapterQuestion();
        setQuizContext({
          purpose: 'auto_sun',
          question: q,
          rewardText: '+100 阳光补给 & 提升全队共鸣伤害',
        });
        return;
      }

      const curStreak = streakRef.current;
      const resonanceMultiplier = curStreak >= 5 ? 1.4 : curStreak >= 3 ? 1.25 : curStreak >= 2 ? 1.15 : 1;

      (Object.keys(s.cooldowns) as PlantType[]).forEach((pt) => {
        if (s.cooldowns[pt] > 0) {
          s.cooldowns[pt] = Math.max(0, s.cooldowns[pt] - TICK_MS);
        }
      });

      s.skySunTimerMs -= TICK_MS;
      if (s.skySunTimerMs <= 0) {
        s.skySunTimerMs = 7200;
        s.sunOrbs.push({
          id: `sun-${now}-${Math.random()}`,
          xPercent: 14 + Math.random() * 72,
          yPercent: 18 + Math.random() * 62,
          value: 25,
          expiresAtMs: now + 9500,
        });
      }
      s.sunOrbs = s.sunOrbs.filter((orb) => orb.expiresAtMs > now);

      // Spawn Zombies with audible voice shout callouts
      if (s.spawnedCount < level.zombieCount) {
        s.spawnTimerMs -= TICK_MS;
        if (s.spawnTimerMs <= 0) {
          const progress = s.spawnedCount / level.zombieCount;
          s.spawnTimerMs = Math.max(2400, level.spawnIntervalMs * (1 - progress * 0.28));

          let zType: ZombieType = 'normal';
          const roll = Math.random();
          if (s.spawnedCount === level.zombieCount - 1) {
            zType = 'scholar';
          } else if (progress > 0.55 && roll < 0.35) {
            zType = 'buckethead';
          } else if (progress > 0.2 && roll < 0.5) {
            zType = 'conehead';
          }

          const spec = ZOMBIES[zType];
          const row = Math.floor(Math.random() * ROWS);
          const shouldShout = zType !== 'normal' || Math.random() < 0.72;
          const shoutQ = shouldShout ? pickChapterQuestion() : undefined;

          if (shoutQ) {
            const voiceMap: Record<string, string> = {
              math: '数学僵尸喊题啦！',
              english: '英语僵尸喊题啦！',
              chinese: '语文僵尸喊题啦！',
              history: '历史僵尸喊题啦！',
            };
            soundEngine.playZombieShout(voiceMap[shoutQ.subject] || '僵尸喊题啦！');
          }

          s.zombies.push({
            id: `z-${now}-${Math.random()}`,
            type: zType,
            row,
            x: 8.95,
            hp: spec.maxHp,
            maxHp: spec.maxHp,
            speedPerSec: spec.speedPerSec,
            slowUntilMs: 0,
            hitFlashUntilMs: 0,
            shoutQuestion: shoutQ,
          });
          s.spawnedCount += 1;
        }
      }

      const plantsToRemove = new Set<string>();
      for (const plant of s.plants) {
        const isBoosted = plant.boostUntilMs > now;

        if (plant.type === 'cherrybomb') {
          plant.actionTimerMs -= TICK_MS;
          if (plant.actionTimerMs <= 0) {
            soundEngine.playExplosion();
            s.explosions.push({
              id: `exp-${now}-${plant.id}`,
              row: plant.row,
              col: plant.col,
              kind: 'fire',
              createdAtMs: now,
            });
            for (const z of s.zombies) {
              if (Math.abs(z.row - plant.row) <= 1 && Math.abs(z.x - (plant.col + 0.5)) <= 1.75) {
                z.hp -= 460;
                z.hitFlashUntilMs = now + 180;
              }
            }
            plantsToRemove.add(plant.id);
          }
          continue;
        }

        if (plant.type === 'sunflower') {
          plant.actionTimerMs -= TICK_MS;
          if (plant.actionTimerMs <= 0) {
            plant.actionTimerMs = 7000;
            plant.energy = Math.min(100, plant.energy + 35);
            s.sunOrbs.push({
              id: `psun-${now}-${plant.id}`,
              xPercent: ((plant.col + 0.5) / COLS) * 100,
              yPercent: ((plant.row + 0.45) / ROWS) * 100,
              value: plant.evolvedLevel > 0 ? 50 : 25,
              expiresAtMs: now + 9000,
            });
          }
          continue;
        }

        if (plant.type === 'peashooter' || plant.type === 'snowpea') {
          const hasTargetInRow = s.zombies.some((z) => z.row === plant.row && z.x >= plant.col);
          plant.actionTimerMs -= TICK_MS;
          if (hasTargetInRow && plant.actionTimerMs <= 0) {
            plant.actionTimerMs = isBoosted ? 480 : 1320;
            plant.energy = Math.min(100, plant.energy + 16);
            soundEngine.playShoot();

            const baseDmg = plant.type === 'peashooter' ? 24 : 21;
            const dmg = Math.round(baseDmg * resonanceMultiplier);

            s.projectiles.push({
              id: `proj-${now}-${plant.id}-${Math.random()}`,
              row: plant.row,
              x: plant.col + 0.72,
              damage: dmg,
              isFrozen: plant.type === 'snowpea',
              isResonant: resonanceMultiplier > 1,
              speedPerSec: 4.5,
            });

            if (plant.evolvedLevel > 0) {
              s.projectiles.push({
                id: `proj2-${now}-${plant.id}-${Math.random()}`,
                row: plant.row,
                x: plant.col + 0.42,
                damage: dmg,
                isFrozen: plant.type === 'snowpea',
                isResonant: resonanceMultiplier > 1,
                speedPerSec: 4.5,
              });
            }
          }
        }
      }
      if (plantsToRemove.size > 0) {
        s.plants = s.plants.filter((p) => !plantsToRemove.has(p.id));
      }

      const activeProjectiles: ProjectileInstance[] = [];
      for (const proj of s.projectiles) {
        proj.x += proj.speedPerSec * dtSec;
        if (proj.x > 9.3) continue;

        const candidates = s.zombies
          .filter((z) => z.row === proj.row && z.hp > 0 && Math.abs(z.x - proj.x) < 0.36)
          .sort((a, b) => a.x - b.x);

        if (candidates.length > 0) {
          const target = candidates[0];
          target.hp -= proj.damage;
          target.hitFlashUntilMs = now + 140;
          if (proj.isFrozen) {
            target.slowUntilMs = now + 4000;
          }
          soundEngine.playHit();
        } else {
          activeProjectiles.push(proj);
        }
      }
      s.projectiles = activeProjectiles;

      let reachedHouse = false;
      for (const z of s.zombies) {
        if (z.hp <= 0) continue;

        const blockingPlant = s.plants.find(
          (p) => p.row === z.row && z.x >= p.col + 0.15 && z.x <= p.col + 0.85
        );

        if (blockingPlant) {
          const dmg = ZOMBIES[z.type].damagePerSec * dtSec;
          blockingPlant.hp -= dmg;
          blockingPlant.hitFlashUntilMs = now + 120;
          blockingPlant.energy = Math.min(100, blockingPlant.energy + 18 * dtSec);

          if (blockingPlant.type === 'wallnut' && blockingPlant.evolvedLevel > 0) {
            z.hp -= 32 * dtSec;
            z.hitFlashUntilMs = now + 100;
          }
        } else {
          const slowFactor = z.slowUntilMs > now ? 0.55 : 1;
          z.x -= z.speedPerSec * slowFactor * dtSec;
        }

        if (z.x <= 0.1) {
          if (s.lawnmowers[z.row]) {
            s.lawnmowers[z.row] = false;
            soundEngine.playExplosion();
            setStatusBanner(`第 ${z.row + 1} 路小推车启动！已清空整行僵尸！`);
            s.zombies.forEach((rz) => {
              if (rz.row === z.row) rz.hp = 0;
            });
          } else {
            reachedHouse = true;
          }
        }
      }

      s.plants = s.plants.filter((p) => p.hp > 0);

      const survivingZombies: ZombieInstance[] = [];
      let newlyDefeated = 0;
      let scoreGain = 0;
      for (const z of s.zombies) {
        if (z.hp <= 0) {
          newlyDefeated += 1;
          scoreGain += ZOMBIES[z.type].rewardScore;
        } else {
          survivingZombies.push(z);
        }
      }
      s.zombies = survivingZombies;
      s.defeatedCount += newlyDefeated;
      s.score += scoreGain;

      s.explosions = s.explosions.filter((e) => now - e.createdAtMs < 650);

      setPlants([...s.plants]);
      setZombies([...s.zombies]);
      setProjectiles([...s.projectiles]);
      setSunOrbs([...s.sunOrbs]);
      setExplosions([...s.explosions]);
      setLawnmowers([...s.lawnmowers]);
      setCooldowns({ ...s.cooldowns });
      setDefeatedCount(s.defeatedCount);
      if (scoreGain > 0) setScore(s.score);

      if (reachedHouse) {
        setGameState('GAME_OVER');
        return;
      }

      if (s.spawnedCount >= level.zombieCount && s.zombies.length === 0) {
        soundEngine.playVictory();
        if (!clearedReportedRef.current) {
          clearedReportedRef.current = true;
          const mowerBonus = s.lawnmowers.filter(Boolean).length * 20;
          const totalClearedScore = s.score + mowerBonus;
          s.score = totalClearedScore;
          setScore(totalClearedScore);
          onLevelCleared(level.chapterId, totalClearedScore);
        }
        setGameState('ROUND_SUMMARY');
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [gameState, level, onLevelCleared, pickChapterQuestion, quizContext]);

  const placePlantOnCell = useCallback(
    (type: PlantType, row: number, col: number, sunBonusRefund = 0) => {
      const spec = PLANTS[type];
      const s = stateRef.current;
      const newPlant: PlantInstance = {
        id: `p-${Date.now()}-${Math.random()}`,
        type,
        row,
        col,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        actionTimerMs: type === 'cherrybomb' ? 800 : type === 'sunflower' ? 4500 : 600,
        boostUntilMs: 0,
        hitFlashUntilMs: 0,
        energy: 0,
        evolvedLevel: 0,
      };
      s.plants.push(newPlant);
      s.cooldowns[type] = spec.cooldownMs;
      setPlants([...s.plants]);
      setCooldowns({ ...s.cooldowns });
      setSun((prev) => prev - spec.cost + sunBonusRefund);
      soundEngine.playPlant();
    },
    []
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      soundEngine.unlock();
      if (gameState !== 'PLAYING' || quizContext) return;
      const s = stateRef.current;
      const existing = s.plants.find((p) => p.row === row && p.col === col);

      if (shovelActive) {
        if (existing) {
          s.plants = s.plants.filter((p) => p.id !== existing.id);
          setPlants([...s.plants]);
          setShovelActive(false);
          setStatusBanner(`已铲除 ${PLANTS[existing.type].name}，可重新布阵。`);
        } else {
          setShovelActive(false);
          setStatusBanner('已收起铲子，可继续点选植物种植。');
        }
        return;
      }

      if (existing) {
        if (existing.type !== 'cherrybomb') {
          triggerPlantInteractionQuiz(existing);
        }
        return;
      }

      if (!selectedPlant) return;
      const spec = PLANTS[selectedPlant];
      if (sun < spec.cost) {
        setStatusBanner('阳光不足！轻点草坪阳光收集，或点击喊题僵尸直接击毙赚 +25 阳光！');
        return;
      }
      if (s.cooldowns[selectedPlant] > 0) {
        setStatusBanner(`${spec.name} 正在冷却中，请稍等片刻。`);
        return;
      }

      if (studyMode === 'quiz_plant' && spec.cost >= 100) {
        const q = pickChapterQuestion();
        setQuizContext({
          purpose: 'plant_unlock',
          pendingPlant: { type: selectedPlant, row, col },
          question: q,
          rewardText: `成功种植 ${spec.name} 并返还 25 阳光`,
        });
        return;
      }

      placePlantOnCell(selectedPlant, row, col);
    },
    [
      gameState,
      pickChapterQuestion,
      placePlantOnCell,
      quizContext,
      selectedPlant,
      shovelActive,
      studyMode,
      sun,
      triggerPlantInteractionQuiz,
    ]
  );

  const handleCollectSun = useCallback(
    (orb: SunOrb) => {
      soundEngine.unlock();
      if (gameState !== 'PLAYING' || quizContext) return;
      const exists = stateRef.current.sunOrbs.some((o) => o.id === orb.id);
      if (!exists) return;
      stateRef.current.sunOrbs = stateRef.current.sunOrbs.filter((o) => o.id !== orb.id);
      setSunOrbs([...stateRef.current.sunOrbs]);
      soundEngine.playSun();
      setSun((prev) => prev + orb.value);
    },
    [gameState, quizContext]
  );

  const handleQuizComplete = useCallback(
    (correct: boolean) => {
      if (!quizContext) return;
      const ctx = quizContext;
      setQuizContext(null);
      setAttemptedInMatch((prev) => prev + 1);

      if (!correct) {
        setStreak(0);
        onRecordMistake(ctx.question);
        setStatusBanner('答错啦没关系，已收录进「错题本」，继续调整阵型或回应其他僵尸喊题！');
        return;
      }

      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setMaxCombo((prev) => Math.max(prev, nextStreak));
      setSolvedInMatch((prev) => prev + 1);
      onSolvedQuestion(ctx.question, nextStreak);

      const isCombo5 = nextStreak >= 5 && nextStreak % 5 === 0;
      const isCombo3 = nextStreak === 3;
      const streakBonus = nextStreak >= 5 ? 50 : nextStreak >= 3 ? 25 : 0;
      const comboScoreBonus = nextStreak >= 5 ? 40 : nextStreak >= 3 ? 20 : 0;
      const s = stateRef.current;

      if (isCombo5) {
        s.zombies.forEach((z) => {
          z.slowUntilMs = Math.max(z.slowUntilMs, s.simTimeMs + 2500);
        });
        setZombies([...s.zombies]);
        showComboCelebration(
          nextStreak,
          `Combo x${nextStreak} 五连超神！`,
          '全队火力 +40% · 额外 +50 阳光 · 全场僵尸冰缓 2.5 秒',
          'combo5'
        );
      } else if (isCombo3) {
        showComboCelebration(
          nextStreak,
          'Combo x3 三连节奏！',
          '全队火力 +25% · 额外奖励 +25 阳光',
          'combo3'
        );
      } else if (nextStreak >= 2) {
        showComboCelebration(
          nextStreak,
          `Combo x${nextStreak} 连击`,
          nextStreak >= 5
            ? '全队火力 +40% 持续生效'
            : nextStreak >= 3
              ? '全队火力 +25% 持续生效'
              : '全队火力 +15% 已激活',
          'normal'
        );
      }

      if (ctx.purpose === 'zombie_shout' && ctx.targetZombieId) {
        const targetZ = s.zombies.find((z) => z.id === ctx.targetZombieId);
        if (targetZ) {
          soundEngine.playExplosion();
          const isBoss = targetZ.type === 'scholar';
          s.explosions.push({
            id: `snipe-${s.simTimeMs}-${targetZ.id}`,
            row: targetZ.row,
            col: Math.min(8, Math.max(0, Math.floor(targetZ.x))),
            kind: 'snipe',
            createdAtMs: s.simTimeMs,
          });

          if (isBoss && targetZ.hp > 340) {
            targetZ.hp -= 340;
            targetZ.x = Math.min(8.8, targetZ.x + 1.1);
            targetZ.slowUntilMs = s.simTimeMs + 4000;
            targetZ.shoutQuestion = pickChapterQuestion();
            setSun((prev) => prev + 30 + streakBonus);
            setScore((prev) => {
              const next = prev + 30 + comboScoreBonus;
              s.score = next;
              return next;
            });
            setStatusBanner(
              streakBonus > 0
                ? `Combo x${nextStreak} 重创单元 Boss！额外获得 +${streakBonus} 连击阳光！`
                : '答对 Boss 喊题！对单元 Boss 造成 340 点重创并击退（+30 阳光）！'
            );
          } else {
            targetZ.hp = 0;
            s.zombies = s.zombies.filter((z) => z.id !== targetZ.id);
            s.defeatedCount += 1;
            const gainScore = ZOMBIES[targetZ.type].rewardScore + 25 + comboScoreBonus;
            s.score += gainScore;
            setZombies([...s.zombies]);
            setDefeatedCount(s.defeatedCount);
            setScore(s.score);
            setSun((prev) => prev + 25 + streakBonus);
            setStatusBanner(
              streakBonus > 0
                ? `Combo x${nextStreak} 精准击毙「${ZOMBIES[targetZ.type].name}」！共获得 +${25 + streakBonus} 阳光！`
                : `精准回应喊题！已自动击毙「${ZOMBIES[targetZ.type].name}」，奖励 +25 阳光！`
            );

            if (s.spawnedCount >= level.zombieCount && s.zombies.length === 0) {
              soundEngine.playVictory();
              if (!clearedReportedRef.current) {
                clearedReportedRef.current = true;
                const mowerBonus = s.lawnmowers.filter(Boolean).length * 20;
                const totalClearedScore = s.score + mowerBonus;
                s.score = totalClearedScore;
                setScore(totalClearedScore);
                onLevelCleared(level.chapterId, totalClearedScore);
              }
              setGameState('ROUND_SUMMARY');
            }
          }
        }
        return;
      }

      if (ctx.purpose === 'emergency_rescue' && ctx.targetPlantId) {
        const targetP = s.plants.find((p) => p.id === ctx.targetPlantId);
        if (targetP) {
          targetP.hp = targetP.maxHp;
          targetP.boostUntilMs = s.simTimeMs + 5000;
          s.zombies.forEach((z) => {
            if (z.row === targetP.row && Math.abs(z.x - targetP.col) < 1.8) {
              z.x = Math.min(8.8, z.x + 1.3);
              z.hp -= 80;
              z.slowUntilMs = s.simTimeMs + 3000;
            }
          });
          if (streakBonus > 0) setSun((prev) => prev + streakBonus);
          setPlants([...s.plants]);
          setZombies([...s.zombies]);
          setStatusBanner(
            streakBonus > 0
              ? `Combo x${nextStreak} 紧急救援！${PLANTS[targetP.type].name}满血复活并额外奖励 +${streakBonus} 阳光！`
              : `紧急救援成功！${PLANTS[targetP.type].name}已满血复活并震退面前僵尸！`
          );
        }
        return;
      }

      if (ctx.purpose === 'plant_evolve' && ctx.targetPlantId) {
        const targetP = s.plants.find((p) => p.id === ctx.targetPlantId);
        if (targetP) {
          targetP.evolvedLevel = 1;
          targetP.energy = 0;
          if (targetP.type === 'wallnut') {
            targetP.maxHp = 1800;
            targetP.hp = 1800;
          } else if (targetP.type === 'snowpea') {
            s.zombies.forEach((z) => {
              if (z.row === targetP.row) {
                z.slowUntilMs = s.simTimeMs + 6000;
                z.hp -= 60;
              }
            });
          }
          if (streakBonus > 0) setSun((prev) => prev + streakBonus);
          setPlants([...s.plants]);
          setStatusBanner(`进化成功！${PLANTS[targetP.type].name}已解锁高阶形态：${PLANTS[targetP.type].evolveEffect}`);
        }
        return;
      }

      if (ctx.purpose === 'auto_sun' || ctx.purpose === 'sun_supply') {
        const gain = 100 + streakBonus;
        setSun((prev) => prev + gain);
        setScore((prev) => {
          const next = prev + 30 + comboScoreBonus;
          s.score = next;
          return next;
        });
        setStatusBanner(
          streakBonus > 0
            ? `Combo x${nextStreak} 连击加成生效！已自动领取 +${gain} 阳光！`
            : '回答正确！已自动领取 +100 阳光补给！'
        );
        return;
      }

      if (ctx.purpose === 'plant_unlock' && ctx.pendingPlant) {
        const { type, row, col } = ctx.pendingPlant;
        const isOccupied = s.plants.some((p) => p.row === row && p.col === col);
        if (!isOccupied && sun >= PLANTS[type].cost) {
          placePlantOnCell(type, row, col, 25 + streakBonus);
          setStatusBanner(`答题成功！${PLANTS[type].name}已部署并返还 ${25 + streakBonus} 阳光！`);
        }
        return;
      }

      if (ctx.purpose === 'plant_boost' && ctx.targetPlantId) {
        const target = s.plants.find((p) => p.id === ctx.targetPlantId);
        if (target) {
          if (target.type === 'sunflower') {
            setSun((prev) => prev + 100 + streakBonus);
            (Object.keys(s.cooldowns) as PlantType[]).forEach((pt) => {
              s.cooldowns[pt] = 0;
            });
            setCooldowns({ ...s.cooldowns });
            setStatusBanner(`向日葵觉醒！产出 +${100 + streakBonus} 阳光并重置全部植物冷却！`);
          } else if (target.type === 'wallnut') {
            target.maxHp = 1700;
            target.hp = 1700;
            target.boostUntilMs = s.simTimeMs + 8000;
            if (streakBonus > 0) setSun((prev) => prev + streakBonus);
            setStatusBanner('坚果墙觉醒！生命值已回满并获得额外钢甲护盾！');
          } else if (target.type === 'snowpea') {
            target.boostUntilMs = s.simTimeMs + 6000;
            s.zombies.forEach((z) => {
              if (z.row === target.row) {
                z.slowUntilMs = s.simTimeMs + 6000;
                z.hp -= 45;
              }
            });
            if (streakBonus > 0) setSun((prev) => prev + streakBonus);
            setStatusBanner('寒冰射手觉醒！全排僵尸被深度冰冻并开启极速射击！');
          } else if (target.type === 'peashooter') {
            target.boostUntilMs = s.simTimeMs + 6000;
            if (streakBonus > 0) setSun((prev) => prev + streakBonus);
            setStatusBanner('豌豆射手觉醒！开启 6 秒极速连发火力压制！');
          }
          setPlants([...s.plants]);
        }
      }
    },
    [
      level.chapterId,
      level.zombieCount,
      onLevelCleared,
      onRecordMistake,
      onSolvedQuestion,
      pickChapterQuestion,
      placePlantOnCell,
      quizContext,
      showComboCelebration,
      streak,
      sun,
    ]
  );

  const shoutingZombies = useMemo(() => zombies.filter((z) => Boolean(z.shoutQuestion)), [zombies]);

  const waveProgressPct = useMemo(
    () => Math.min(100, Math.round((defeatedCount / level.zombieCount) * 100)),
    [defeatedCount, level.zombieCount]
  );

  const accuracyPct = useMemo(() => {
    if (attemptedInMatch === 0) return 100;
    return Math.round((solvedInMatch / attemptedInMatch) * 100);
  }, [attemptedInMatch, solvedInMatch]);

  const resonanceLabel =
    streak >= 5
      ? `Combo x${streak} · 超神 +40%火力`
      : streak >= 3
        ? `Combo x${streak} · 三连 +25%火力`
        : streak >= 2
          ? `Combo x${streak} · 连击 +15%火力`
          : 'Combo x0';

  const toggleSound = () => {
    const next = !soundEnabled;
    soundEngine.enabled = next;
    if (!next) {
      soundEngine.stopBgm();
      soundEngine.stopSpeech();
    } else {
      soundEngine.unlock();
      if (bgmEnabled && gameState === 'PLAYING') soundEngine.startBgm();
    }
    setSoundEnabled(next);
  };

  const toggleBgm = () => {
    const next = !bgmEnabled;
    soundEngine.bgmEnabled = next;
    if (!next) {
      soundEngine.stopBgm();
    } else if (soundEnabled && gameState === 'PLAYING') {
      soundEngine.unlock();
      soundEngine.startBgm();
    }
    setBgmEnabled(next);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
            <span className="font-bold text-sm text-slate-900">
              {level.unitLabel} · {level.name}
            </span>
            <span aria-hidden="true">·</span>
            <span>{DIFFICULTY_LABELS[level.difficulty]}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">
              击退 {defeatedCount} / {level.zombieCount}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-mono-num font-bold ${
                streak >= 5 ? 'text-red-600' : streak >= 3 ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {resonanceLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={triggerManualSunQuiz}
              disabled={gameState !== 'PLAYING'}
              title="倒计时归零会自动弹出阳光题，也可提前点击作答"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-mono-num">自动阳光题 {autoQuizSec}s</span>
            </button>

            {shoutingZombies.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const frontmost = [...shoutingZombies].sort((a, b) => a.x - b.x)[0];
                  if (frontmost) triggerZombieShoutQuiz(frontmost);
                }}
                disabled={gameState !== 'PLAYING'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg bg-sky-700 hover:bg-sky-800 active:scale-[0.98] text-white text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <MessageSquareWarning className="w-3.5 h-3.5" />
                <span>答僵尸喊题击毙 ({shoutingZombies.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleBgm}
              aria-label={bgmEnabled ? '关闭背景音乐' : '开启背景音乐'}
              title={bgmEnabled ? '关闭背景音乐' : '开启背景音乐'}
              className={`inline-flex items-center gap-1 px-2.5 py-2 min-h-[44px] rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                bgmEnabled && soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>音乐</span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? '全部静音' : '开启声音'}
              title={soundEnabled ? '全部静音' : '开启声音'}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() =>
                setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev))
              }
              className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{gameState === 'PAUSED' ? '继续' : '暂停'}</span>
            </button>

            <button
              type="button"
              onClick={onExitToLobby}
              className="px-3 py-2 min-h-[44px] rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              换章节
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 pt-2 border-t border-slate-100 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 shrink-0 min-h-[52px]">
            <Sun className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-[11px] text-amber-800 font-medium leading-none">当前阳光</div>
              <div className="text-base sm:text-lg font-extrabold text-amber-950 font-mono-num leading-tight">{sun}</div>
            </div>
          </div>

          {(Object.keys(PLANTS) as PlantType[]).map((type) => {
            const spec = PLANTS[type];
            const cd = cooldowns[type];
            const canAfford = sun >= spec.cost;
            const isSelected = !shovelActive && selectedPlant === type;
            const cdPct = Math.min(100, (cd / spec.cooldownMs) * 100);

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  setShovelActive(false);
                  setSelectedPlant(type);
                }}
                className={`relative overflow-hidden flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-xl border text-left transition-all min-h-[54px] shrink-0 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                    : canAfford && cd === 0
                      ? 'bg-white border-slate-200 hover:border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {cd > 0 && (
                  <div
                    className="absolute inset-x-0 bottom-0 bg-slate-900/15 pointer-events-none transition-all"
                    style={{ height: `${cdPct}%` }}
                  />
                )}
                <PlantSprite type={type} className="w-9 h-9 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 whitespace-nowrap">{spec.name}</div>
                  <div className="text-xs font-mono-num font-semibold text-amber-700">{spec.cost} 阳光</div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShovelActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold min-h-[52px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              shovelActive
                ? 'bg-red-50 border-red-500 text-red-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Shovel className="w-4 h-4" />
            <span>{shovelActive ? '点击植物铲除' : '铲子'}</span>
          </button>

          <div className="ml-auto hidden lg:flex flex-col gap-1 min-w-[160px]">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>单元防守进度</span>
              <span className="font-mono-num font-semibold text-slate-700">{waveProgressPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${waveProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guidance Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600">
        <span>{statusBanner}</span>
        <span className="text-slate-500">
          本关融合：{level.knowledgePoints[0]} · {level.blendedTopics.join(' · ')} · 正确率{' '}
          <strong className="font-mono-num text-emerald-700">{accuracyPct}%</strong>
        </span>
      </div>

      {/* Main 5x9 Lawn Arena — Direct iPad-style Touch Controls */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-950/30 shadow-lg bg-[#14532D] select-none">
        <div className="flex">
          <div className="w-9 sm:w-14 shrink-0 bg-[#57534E] border-r-2 border-stone-700 grid grid-rows-5">
            {lawnmowers.map((hasMower, rIdx) => (
              <div
                key={rIdx}
                className="h-16 sm:h-24 md:h-28 flex items-center justify-center border-b border-stone-600/40 last:border-b-0"
              >
                {hasMower ? (
                  <div
                    title={`第 ${rIdx + 1} 路小推车最后防线`}
                    className="w-6 sm:w-8 h-5 sm:h-6 rounded-md bg-red-600 border border-red-900 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-sm"
                  >
                    车
                  </div>
                ) : (
                  <span className="text-[9px] sm:text-[10px] text-stone-400">已用</span>
                )}
              </div>
            ))}
          </div>

          <div className="relative flex-1 grid grid-rows-5">
            {Array.from({ length: ROWS }).map((_, rIdx) => (
              <div key={rIdx} className="grid grid-cols-9 h-16 sm:h-24 md:h-28">
                {Array.from({ length: COLS }).map((__, cIdx) => {
                  const isDark = (rIdx + cIdx) % 2 === 0;
                  const plant = plants.find((p) => p.row === rIdx && p.col === cIdx);
                  const isBoosted = plant ? plant.boostUntilMs > stateRef.current.simTimeMs : false;
                  const isHit = plant ? plant.hitFlashUntilMs > stateRef.current.simTimeMs : false;
                  const canEvolve =
                    plant ? plant.energy >= 100 && plant.evolvedLevel === 0 && plant.type !== 'cherrybomb' : false;
                  const isDanger = plant ? plant.hp < plant.maxHp * 0.45 && plant.type !== 'cherrybomb' : false;

                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      aria-label={`草坪第${rIdx + 1}行第${cIdx + 1}列`}
                      className={`relative flex items-center justify-center border border-emerald-950/10 transition-all active:brightness-125 cursor-pointer ${
                        isDark ? 'bg-[#15803D]' : 'bg-[#16A34A]'
                      } hover:brightness-110`}
                    >
                      {plant && (
                        <div className={`relative flex flex-col items-center ${isHit ? 'opacity-75 scale-95' : ''}`}>
                          <PlantSprite
                            type={plant.type}
                            boosted={isBoosted}
                            evolvedLevel={plant.evolvedLevel}
                            hpRatio={plant.hp / plant.maxHp}
                            className="w-8 h-8 sm:w-12 sm:h-14"
                          />
                          {isDanger ? (
                            <span className="absolute -top-2 px-1 py-0.5 rounded bg-red-600 text-white text-[8px] sm:text-[9px] font-bold leading-none animate-pulse whitespace-nowrap">
                              救援
                            </span>
                          ) : canEvolve ? (
                            <span className="absolute -top-2 px-1 py-0.5 rounded bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-bold leading-none whitespace-nowrap">
                              进化
                            </span>
                          ) : isBoosted ? (
                            <span className="absolute -top-2 px-1 py-0.5 rounded bg-emerald-300 text-slate-950 text-[8px] sm:text-[9px] font-bold leading-none whitespace-nowrap">
                              觉醒
                            </span>
                          ) : plant.evolvedLevel > 0 ? (
                            <span className="absolute -top-2 px-1 py-0.5 rounded bg-slate-900/75 text-amber-300 text-[8px] sm:text-[9px] font-bold leading-none whitespace-nowrap">
                              双倍
                            </span>
                          ) : null}

                          <div className="flex flex-col gap-0.5 mt-0.5 w-7 sm:w-10">
                            {plant.hp < plant.maxHp && (
                              <div className="w-full h-1 bg-slate-900/50 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isDanger ? 'bg-red-400' : 'bg-emerald-300'}`}
                                  style={{ width: `${Math.max(0, (plant.hp / plant.maxHp) * 100)}%` }}
                                />
                              </div>
                            )}
                            {plant.evolvedLevel === 0 && plant.type !== 'cherrybomb' && (
                              <div className="w-full h-1 bg-slate-900/40 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-300 transition-all"
                                  style={{ width: `${Math.min(100, plant.energy)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {projectiles.map((proj) => (
              <div
                key={proj.id}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(proj.x / COLS) * 100}%`,
                  top: `${((proj.row + 0.45) / ROWS) * 100}%`,
                }}
              >
                <div
                  className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full border shadow-sm ${
                    proj.isFrozen
                      ? 'bg-sky-300 border-sky-700'
                      : proj.isResonant
                        ? 'bg-amber-300 border-amber-700'
                        : 'bg-lime-300 border-emerald-800'
                  }`}
                />
              </div>
            ))}

            {zombies.map((z) => {
              const isFrozen = z.slowUntilMs > stateRef.current.simTimeMs;
              const isHit = z.hitFlashUntilMs > stateRef.current.simTimeMs;
              const shoutPreview = z.shoutQuestion
                ? `[${SUBJECT_LABELS[z.shoutQuestion.subject].slice(0, 2)}] ${
                    z.shoutQuestion.prompt.length > 10
                      ? `${z.shoutQuestion.prompt.slice(0, 10)}…`
                      : z.shoutQuestion.prompt
                  }`
                : null;

              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerZombieShoutQuiz(z);
                  }}
                  title={z.shoutQuestion ? `僵尸喊题：${z.shoutQuestion.prompt}（点击作答直接击毙）` : '点击答题狙击僵尸'}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all active:scale-95 z-10 min-w-[44px] min-h-[44px] justify-center ${
                    isHit ? 'opacity-75' : 'opacity-100'
                  }`}
                  style={{
                    left: `${(z.x / COLS) * 100}%`,
                    top: `${((z.row + 0.5) / ROWS) * 100}%`,
                  }}
                >
                  {shoutPreview && (
                    <div className="mb-0.5 sm:mb-1 max-w-[82px] sm:max-w-[165px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white border border-slate-900/30 shadow-md text-[8px] sm:text-[10px] font-bold text-slate-900 leading-tight truncate group-hover:bg-amber-300 group-hover:border-amber-700 transition-colors">
                      {shoutPreview}
                    </div>
                  )}
                  <div className="w-7 sm:w-10 h-1 sm:h-1.5 bg-slate-900/55 rounded-full overflow-hidden mb-0.5">
                    <div
                      className={`h-full ${isFrozen ? 'bg-cyan-300' : 'bg-red-500'}`}
                      style={{ width: `${Math.max(0, (z.hp / z.maxHp) * 100)}%` }}
                    />
                  </div>
                  <ZombieSprite
                    type={z.type}
                    frozen={isFrozen}
                    hasKnowledgeShield={Boolean(z.shoutQuestion)}
                    className="w-9 h-11 sm:w-14 sm:h-16"
                  />
                </button>
              );
            })}

            {explosions.map((exp) => (
              <div
                key={exp.id}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center animate-hit-pulse z-20 ${
                  exp.kind === 'snipe'
                    ? 'w-24 h-24 bg-sky-400/75 border-4 border-amber-400'
                    : 'w-36 h-36 bg-amber-400/70 border-4 border-red-500'
                }`}
                style={{
                  left: `${((exp.col + 0.5) / COLS) * 100}%`,
                  top: `${((exp.row + 0.5) / ROWS) * 100}%`,
                }}
              >
                {exp.kind === 'snipe' ? (
                  <Zap className="w-10 h-10 text-amber-950" />
                ) : (
                  <Flame className="w-12 h-12 text-red-700" />
                )}
              </div>
            ))}

            {sunOrbs.map((orb) => (
              <button
                key={orb.id}
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleCollectSun(orb);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCollectSun(orb);
                }}
                title="点击收集阳光"
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-90 cursor-pointer animate-sun-float z-20 ${
                  orb.value >= 50
                    ? 'w-12 h-12 sm:w-14 sm:h-14 bg-amber-300 border-2 border-amber-600 text-amber-950'
                    : 'w-11 h-11 sm:w-13 sm:h-13 bg-yellow-300 border-2 border-amber-600 text-amber-950'
                }`}
                style={{
                  left: `${orb.xPercent}%`,
                  top: `${orb.yPercent}%`,
                }}
              >
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
                {orb.value >= 50 && <span className="text-[9px] sm:text-[10px] font-bold leading-none">50</span>}
              </button>
            ))}
          </div>
        </div>

        {comboToast && (
          <div
            key={comboToast.id}
            className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-25 animate-combo-pop"
          >
            <div
              className={`px-5 py-2.5 rounded-2xl border-2 shadow-xl text-center backdrop-blur-sm ${
                comboToast.tier === 'combo5'
                  ? 'bg-amber-400/95 border-red-600 text-slate-950'
                  : comboToast.tier === 'combo3'
                    ? 'bg-emerald-500/95 border-amber-300 text-white'
                    : 'bg-slate-900/90 border-emerald-400 text-white'
              }`}
            >
              <div className="text-sm sm:text-base font-extrabold tracking-tight font-mono-num">
                {comboToast.title}
              </div>
              <div className="text-[11px] font-medium opacity-95">{comboToast.subtitle}</div>
            </div>
          </div>
        )}

        {gameState === 'PAUSED' && !quizContext && (
          <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-7 max-w-sm w-full text-center space-y-4">
              <h2 className="text-xl font-bold text-slate-900">战局已暂停</h2>
              <p className="text-sm text-slate-600">休息一下眼睛，准备好后随时继续保卫本单元花园。</p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGameState('PLAYING')}
                  className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold cursor-pointer"
                >
                  继续战斗
                </button>
                <button
                  type="button"
                  onClick={resetMatch}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  重新开始
                </button>
              </div>
            </div>
          </div>
        )}

        {(gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER') && (
          <div className="absolute inset-0 z-30 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-amber-50 border border-amber-200">
                <Trophy
                  className={`w-7 h-7 ${
                    gameState === 'ROUND_SUMMARY' ? 'text-amber-600' : 'text-slate-500'
                  }`}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {gameState === 'ROUND_SUMMARY' ? `通关「${level.unitLabel}」` : '防线被突破了'}
                </h2>
                <p className="text-sm text-slate-600 mt-1.5">
                  {gameState === 'ROUND_SUMMARY'
                    ? `你已攻克本单元数学、英语、语文与历史融合题目，并抵挡了全部 ${level.zombieCount} 只僵尸！`
                    : '小技巧：听到僵尸喊题时点击它头顶的气泡，答对自动击毙僵尸并赚取阳光！'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">本局总分</div>
                  <div className="text-lg font-bold text-slate-900 font-mono-num">{score}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">击退僵尸</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono-num">
                    {defeatedCount} / {level.zombieCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">答题正确率</div>
                  <div className="text-lg font-bold text-amber-700 font-mono-num">{accuracyPct}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">最高连击</div>
                  <div className="text-lg font-bold text-red-600 font-mono-num">{maxCombo} Combo</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetMatch}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>再挑战一次</span>
                </button>
                <button
                  type="button"
                  onClick={onExitToLobby}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  选择下一章节
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {quizContext && (
        <QuestionModal context={quizContext} streak={streak} onComplete={handleQuizComplete} />
      )}
    </div>
  );
};
