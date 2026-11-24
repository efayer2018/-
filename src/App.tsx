import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  Music,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { LEVELS } from './data/questions';
import { GameBoard } from './components/GameBoard';
import { QuestionModal } from './components/QuestionModal';
import {
  AlmanacAndRewardsView,
  MistakeNotebook,
  PedagogyAndGeneratorView,
} from './components/SecondaryViews';
import {
  AppView,
  LevelConfig,
  MistakeRecord,
  PlayerProgress,
  Question,
  QuizTriggerContext,
  StudyMode,
} from './types/game';
import { soundEngine } from './utils/sound';

const MISTAKES_STORAGE_KEY = 'pvz_grade5_mistakes_v3';
const PROGRESS_STORAGE_KEY = 'pvz_grade5_progress_v3';

type SemesterFilter = 'all' | '5a' | '5b' | '6';

const DEFAULT_PROGRESS: PlayerProgress = {
  totalPoints: 0,
  totalSolved: 0,
  totalAttempted: 0,
  bestStreak: 0,
  levelsCleared: 0,
  mistakesCleared: 0,
  clearedChapterIds: [],
};

export default function App() {
  const [view, setView] = useState<AppView>('lobby');
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(LEVELS[0]);
  const [semesterFilter, setSemesterFilter] = useState<SemesterFilter>('all');
  const [studyMode, setStudyMode] = useState<StudyMode>('balanced');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => {
    try {
      const raw = localStorage.getItem(MISTAKES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [progress, setProgress] = useState<PlayerProgress>(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : DEFAULT_PROGRESS;
    } catch {
      return DEFAULT_PROGRESS;
    }
  });

  const [practiceContext, setPracticeContext] = useState<QuizTriggerContext | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(mistakes));
    } catch {
      // ignore storage quota errors
    }
  }, [mistakes]);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage quota errors
    }
  }, [progress]);

  const bonusInitialSun = useMemo(
    () => Math.min(100, progress.mistakesCleared * 25),
    [progress.mistakesCleared]
  );

  const filteredLevels = useMemo(() => {
    return LEVELS.filter((lvl) => {
      if (semesterFilter === 'all') return true;
      if (semesterFilter === '5a') return lvl.semester === '五年级上册';
      if (semesterFilter === '5b') return lvl.semester === '五年级下册';
      if (semesterFilter === '6') return lvl.grade === 'grade6';
      return true;
    });
  }, [semesterFilter]);

  const enterGame = () => {
    soundEngine.unlock();
    setView('game');
  };

  const handleRecordMistake = (question: Question) => {
    setProgress((prev) => ({
      ...prev,
      totalAttempted: prev.totalAttempted + 1,
    }));
    setMistakes((prev) => {
      const existing = prev.find((m) => m.questionId === question.id);
      if (existing) {
        return prev.map((m) =>
          m.questionId === question.id
            ? { ...m, wrongCount: m.wrongCount + 1, lastWrongAt: Date.now(), snapshot: question }
            : m
        );
      }
      return [
        { questionId: question.id, wrongCount: 1, lastWrongAt: Date.now(), snapshot: question },
        ...prev,
      ];
    });
  };

  const handleSolvedQuestion = (_question: Question, currentStreak: number) => {
    setProgress((prev) => ({
      ...prev,
      totalAttempted: prev.totalAttempted + 1,
      totalSolved: prev.totalSolved + 1,
      totalPoints: prev.totalPoints + 25 + (currentStreak >= 3 ? 15 : 0),
      bestStreak: Math.max(prev.bestStreak, currentStreak),
    }));
  };

  const handleLevelCleared = (chapterId: string, pointsEarned: number) => {
    setProgress((prev) => {
      const cleared = prev.clearedChapterIds.includes(chapterId)
        ? prev.clearedChapterIds
        : [...prev.clearedChapterIds, chapterId];
      return {
        ...prev,
        levelsCleared: prev.levelsCleared + 1,
        clearedChapterIds: cleared,
        totalPoints: prev.totalPoints + pointsEarned,
      };
    });
  };

  const handleStartPracticeMistake = (q: Question) => {
    setPracticeContext({
      purpose: 'mistake_clear',
      question: q,
      rewardText: '消灭该错题并增加 +25 开局初始阳光储备',
    });
  };

  const handlePracticeComplete = (correct: boolean) => {
    if (!practiceContext) return;
    const qId = practiceContext.question.id;
    setPracticeContext(null);
    if (correct) {
      setMistakes((prev) => prev.filter((m) => m.questionId !== qId));
      setProgress((prev) => ({
        ...prev,
        mistakesCleared: prev.mistakesCleared + 1,
        totalSolved: prev.totalSolved + 1,
        totalAttempted: prev.totalAttempted + 1,
        totalPoints: prev.totalPoints + 40,
      }));
    } else {
      handleRecordMistake(practiceContext.question);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F0] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setView('lobby')}
            className="text-lg font-extrabold tracking-tight text-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            知识保卫战
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setView('lobby')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'lobby' ? 'text-emerald-800 font-semibold' : ''
              }`}
            >
              章节融合选关
            </button>
            <button
              type="button"
              onClick={() => setView('mistakes')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'mistakes' ? 'text-emerald-800 font-semibold' : ''
              }`}
            >
              错题本 ({mistakes.length})
            </button>
            <button
              type="button"
              onClick={() => setView('almanac')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'almanac' ? 'text-emerald-800 font-semibold' : ''
              }`}
            >
              图鉴与成就
            </button>
            <button
              type="button"
              onClick={() => setView('guide')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'guide' ? 'text-emerald-800 font-semibold' : ''
              }`}
            >
              章节题库室
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={enterGame}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {view === 'game' ? '正在守卫中' : '开始守卫'}
            </button>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-4 px-6 pb-2.5 overflow-x-auto text-xs font-medium text-slate-600">
          <button type="button" onClick={() => setView('lobby')} className="whitespace-nowrap shrink-0">
            章节融合选关
          </button>
          <button type="button" onClick={() => setView('mistakes')} className="whitespace-nowrap shrink-0">
            错题本 ({mistakes.length})
          </button>
          <button type="button" onClick={() => setView('almanac')} className="whitespace-nowrap shrink-0">
            图鉴与成就
          </button>
          <button type="button" onClick={() => setView('guide')} className="whitespace-nowrap shrink-0">
            章节题库室
          </button>
        </div>
      </header>

      <main className="flex-1">
        {view === 'lobby' && (
          <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
            {/* Hero Split */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-7 space-y-6">
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-emerald-800">
                    人教版同步章节 · 语数英史全融合
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight text-balance">
                    一章一关多科混战，答对自动爆发战果！
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    每一关紧扣人教版数学一个单元，同时巧妙融入同年级英语单词短语、语文古诗词/成语考点及历史知识。配合轻快背景音乐与僵尸语音喊题，答对立即自动触发击毙或阳光奖励！
                  </p>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>已选关卡</span>
                    <span className="font-bold text-slate-900">
                      {selectedLevel.unitLabel} · {selectedLevel.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>章节通关进度</span>
                    <span className="font-mono-num font-bold text-emerald-700">
                      {progress.clearedChapterIds.length} / {LEVELS.length} 关 · 积分 {progress.totalPoints}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={enterGame}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>立即开启战斗（含背景音乐与语音喊题）</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 bg-emerald-950 min-h-[280px] flex">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/garden_defense_hero_1795362201379.jpg"
                    alt="植物大战僵尸知识守卫草坪场景插画"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-emerald-100 bg-gradient-to-br from-emerald-900 to-emerald-950">
                    <Sparkles className="w-10 h-10 text-amber-400 mb-3" />
                    <div className="text-lg font-bold">知识花园防线已就绪</div>
                    <div className="text-xs text-emerald-200 mt-1">选择下方人教版章节即可开战</div>
                  </div>
                )}
              </div>
            </section>

            {/* 4-Column Highlights */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">数英语文历史混出</div>
                  <div className="text-xs text-slate-500 mt-0.5">每关数学一单元为主，穿插英语词组、古诗成语与历史</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">自动弹题 + 自动触发</div>
                  <div className="text-xs text-slate-500 mt-0.5">每 15 秒自动弹阳光题，答对自动释放战果不卡手</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <MessageSquareWarning className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">僵尸语音喊题击毙</div>
                  <div className="text-xs text-slate-500 mt-0.5">僵尸出场喊出语音并冒出题目，点它答对瞬间秒杀</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <Music className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">花园背景音乐陪伴</div>
                  <div className="text-xs text-slate-500 mt-0.5">内置轻快合成旋律与音效，支持一键开关调节</div>
                </div>
              </div>
            </section>

            {/* Chapter Level Grid */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">01. 选择人教版同步章节关卡</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    共 {LEVELS.length} 个独立章节关卡，每关聚焦一个数学单元，并融合同年级英语、语文与历史知识。
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setStudyMode('balanced')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      studyMode === 'balanced'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    标准节奏（自动阳光题 + 僵尸喊题）
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyMode('quiz_plant')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      studyMode === 'quiz_plant'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    学霸模式（高阶植物需答题种植）
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-fit">
                {(
                  [
                    { id: 'all', label: `全部章节 (${LEVELS.length})` },
                    { id: '5a', label: '五年级上册（第1–4关）' },
                    { id: '5b', label: '五年级下册（第5–7关）' },
                    { id: '6', label: '六年级上下册（第8–10关）' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSemesterFilter(tab.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      semesterFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLevels.map((lvl) => {
                  const active = selectedLevel.chapterId === lvl.chapterId;
                  const cleared = progress.clearedChapterIds.includes(lvl.chapterId);
                  return (
                    <button
                      key={lvl.chapterId}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`text-left rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        active
                          ? 'bg-emerald-50/75 border-emerald-600 ring-2 ring-emerald-500/15'
                          : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-emerald-800">{lvl.semester}</span>
                          {cleared ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              已通关
                            </span>
                          ) : (
                            <span className="font-mono-num">{lvl.zombieCount} 只僵尸</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {lvl.unitLabel} · {lvl.name}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{lvl.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                        <div>数学主线：{lvl.knowledgePoints.join(' · ')}</div>
                        <div className="text-emerald-800">跨科融合：{lvl.blendedTopics.join(' · ')}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    当前错题订正奖励：开局自动多携带 <strong className="font-mono-num text-amber-700">+{bonusInitialSun}</strong> 阳光
                  </span>
                </div>
                <button
                  type="button"
                  onClick={enterGame}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  立即挑战「{selectedLevel.unitLabel}」
                </button>
              </div>
            </section>
          </div>
        )}

        {view === 'game' && (
          <GameBoard
            level={selectedLevel}
            studyMode={studyMode}
            bonusInitialSun={bonusInitialSun}
            onRecordMistake={handleRecordMistake}
            onSolvedQuestion={handleSolvedQuestion}
            onLevelCleared={handleLevelCleared}
            onExitToLobby={() => setView('lobby')}
          />
        )}

        {view === 'mistakes' && (
          <MistakeNotebook
            mistakes={mistakes}
            bonusSun={bonusInitialSun}
            onPracticeQuestion={handleStartPracticeMistake}
            onRemoveMistake={(id) => setMistakes((prev) => prev.filter((m) => m.questionId !== id))}
            onClearAll={() => setMistakes([])}
          />
        )}

        {view === 'almanac' && <AlmanacAndRewardsView progress={progress} />}

        {view === 'guide' && <PedagogyAndGeneratorView />}
      </main>

      {practiceContext && (
        <QuestionModal context={practiceContext} streak={0} onComplete={handlePracticeComplete} />
      )}
    </div>
  );
}
