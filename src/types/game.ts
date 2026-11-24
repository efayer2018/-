export type TextbookEdition = '人教版同步章节';

export type SemesterName = '五年级上册' | '五年级下册' | '六年级上册' | '六年级下册';

export type CurriculumSubject = 'math' | 'english' | 'chinese' | 'history';

export type GradeLevel = 'grade5' | 'grade6';

export type DifficultyLevel = 1 | 2 | 3;

export type StudyMode = 'balanced' | 'quiz_plant';

export type AppView = 'lobby' | 'game' | 'mistakes' | 'almanac' | 'guide';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER';

export type PlantType = 'sunflower' | 'peashooter' | 'wallnut' | 'snowpea' | 'cherrybomb';

export type ZombieType = 'normal' | 'conehead' | 'buckethead' | 'scholar';

export interface KnowledgeNode {
  id: string;
  chapterId: string;
  textbook: TextbookEdition;
  semester: SemesterName;
  unitLabel: string;
  subject: CurriculumSubject;
  grade: GradeLevel;
  title: string;
  description: string;
}

export interface Question {
  id: string;
  chapterId: string; // specific chapterId or 'cross-grade5' / 'cross-grade6'
  subject: CurriculumSubject;
  grade: GradeLevel;
  difficulty: DifficultyLevel;
  topic: string;
  prompt: string;
  options: [string, string, string, string];
  answerIndex: number;
  hint: string;
  explanation: string;
  isGenerated?: boolean;
}

export interface PlantDefinition {
  type: PlantType;
  name: string;
  cost: number;
  cooldownMs: number;
  maxHp: number;
  subjectAffinity: string;
  role: string;
  description: string;
  boostEffect: string;
  evolveEffect: string;
}

export interface ZombieDefinition {
  type: ZombieType;
  name: string;
  maxHp: number;
  speedPerSec: number;
  damagePerSec: number;
  rewardScore: number;
  knowledgeTag: string;
  description: string;
}

export interface PlantInstance {
  id: string;
  type: PlantType;
  row: number;
  col: number;
  hp: number;
  maxHp: number;
  actionTimerMs: number;
  boostUntilMs: number;
  hitFlashUntilMs: number;
  energy: number;
  evolvedLevel: number;
}

export interface ZombieInstance {
  id: string;
  type: ZombieType;
  row: number;
  x: number;
  hp: number;
  maxHp: number;
  speedPerSec: number;
  slowUntilMs: number;
  hitFlashUntilMs: number;
  shoutQuestion?: Question;
}

export interface ProjectileInstance {
  id: string;
  row: number;
  x: number;
  damage: number;
  isFrozen: boolean;
  isResonant: boolean;
  speedPerSec: number;
}

export interface SunOrb {
  id: string;
  xPercent: number;
  yPercent: number;
  value: number;
  expiresAtMs: number;
}

export interface ExplosionEffect {
  id: string;
  row: number;
  col: number;
  kind?: 'fire' | 'snipe';
  createdAtMs: number;
}

export interface MistakeRecord {
  questionId: string;
  wrongCount: number;
  lastWrongAt: number;
  snapshot?: Question;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  rewardText: string;
  target: number;
  metric: 'totalSolved' | 'bestStreak' | 'levelsCleared' | 'mistakesCleared';
}

export interface PlayerProgress {
  totalPoints: number;
  totalSolved: number;
  totalAttempted: number;
  bestStreak: number;
  levelsCleared: number;
  mistakesCleared: number;
  clearedChapterIds: string[];
}

export interface LevelConfig {
  id: number;
  chapterId: string;
  textbook: TextbookEdition;
  semester: SemesterName;
  unitLabel: string;
  name: string;
  grade: GradeLevel;
  difficulty: DifficultyLevel;
  initialSun: number;
  zombieCount: number;
  spawnIntervalMs: number;
  autoQuizIntervalMs: number;
  knowledgePoints: string[];
  blendedTopics: string[];
  description: string;
}

export interface QuizTriggerContext {
  purpose:
    | 'auto_sun'
    | 'sun_supply'
    | 'zombie_shout'
    | 'plant_evolve'
    | 'emergency_rescue'
    | 'plant_boost'
    | 'plant_unlock'
    | 'mistake_clear';
  targetPlantId?: string;
  targetZombieId?: string;
  pendingPlant?: { type: PlantType; row: number; col: number };
  question: Question;
  rewardText: string;
}
