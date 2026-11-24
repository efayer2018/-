import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  ACHIEVEMENTS,
  GRADE_LABELS,
  KNOWLEDGE_NODES,
  LEVELS,
  PLANTS,
  QUESTIONS,
  SUBJECT_LABELS,
  ZOMBIES,
} from '../data/questions';
import {
  CurriculumSubject,
  MistakeRecord,
  PlantType,
  PlayerProgress,
  Question,
  ZombieType,
} from '../types/game';
import { generateQuestionForChapter } from '../utils/questionGenerator';
import { PlantSprite, ZombieSprite } from './Sprites';

interface MistakeNotebookProps {
  mistakes: MistakeRecord[];
  bonusSun: number;
  onPracticeQuestion: (question: Question) => void;
  onRemoveMistake: (questionId: string) => void;
  onClearAll: () => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  mistakes,
  bonusSun,
  onPracticeQuestion,
  onRemoveMistake,
  onClearAll,
}) => {
  const [filterSubject, setFilterSubject] = useState<'all' | CurriculumSubject>('all');

  const mistakeItems = mistakes
    .map((m) => ({
      record: m,
      question: m.snapshot || QUESTIONS.find((q) => q.id === m.questionId),
    }))
    .filter((item): item is { record: MistakeRecord; question: Question } => Boolean(item.question))
    .filter((item) => filterSubject === 'all' || item.question.subject === filterSubject);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">智能错题本</h1>
          <p className="text-sm text-slate-600 mt-1">
            战斗中答错的数学、英语、语文、历史题会自动收录到这里。重做并答对，即可消灭错题并为下一局储备额外初始阳光（当前储备：
            <span className="font-mono-num font-bold text-amber-700">+{bonusSun}</span> 阳光）。
          </p>
        </div>

        {mistakes.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-red-700 bg-white border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空错题记录</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit">
        {(['all', 'math', 'english', 'chinese', 'history'] as const).map((subj) => (
          <button
            key={subj}
            type="button"
            onClick={() => setFilterSubject(subj)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterSubject === subj
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {subj === 'all' ? '全部学科' : SUBJECT_LABELS[subj]}
          </button>
        ))}
      </div>

      {mistakeItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">当前暂无错题记录</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            你在章节闯关中的表现很棒！如果遇到不熟练的知识点答错了，它们会集中存放在这里方便逐章巩固。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {mistakeItems.map(({ record, question }) => (
            <div
              key={question.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{SUBJECT_LABELS[question.subject]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{GRADE_LABELS[question.grade]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{question.topic}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-red-700 font-medium font-mono-num">累计答错 {record.wrongCount} 次</span>
                </div>
                <p className="text-base font-semibold text-slate-900 leading-relaxed">{question.prompt}</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">核心解析：</span>
                  {question.explanation}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onPracticeQuestion(question)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重做消灭错题</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveMistake(question.id)}
                  className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  已掌握移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface AlmanacAndRewardsViewProps {
  progress: PlayerProgress;
}

export const AlmanacAndRewardsView: React.FC<AlmanacAndRewardsViewProps> = ({ progress }) => {
  const plantList = Object.keys(PLANTS) as PlantType[];
  const zombieList = Object.keys(ZOMBIES) as ZombieType[];

  const leaderboardEntries = [
    { name: '五年一班 · 林思涵', points: 1680, badge: '全科小状元' },
    { name: '六年二班 · 陈浩宇', points: 1320, badge: '喊题秒杀王' },
    { name: '五年三班 · 张语桐', points: 940, badge: '诗词小达人' },
    { name: '你（当前花园守卫）', points: progress.totalPoints, badge: '守护者', isMe: true },
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">图鉴、成就与荣耀榜</h1>
          <p className="text-sm text-slate-600 mt-1">
            查看植物守卫进化形态、喊题僵尸特性、学习成就徽章与积分排名。
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-slate-500">累计学习积分</div>
            <div className="text-xl font-extrabold text-amber-700 font-mono-num">{progress.totalPoints}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">累计答对</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono-num">{progress.totalSolved} 题</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">已通关章节</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono-num">
              {progress.clearedChapterIds.length} / {LEVELS.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">学习与守护成就</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ACHIEVEMENTS.map((ach) => {
              const current = progress[ach.metric];
              const unlocked = current >= ach.target;
              const pct = Math.min(100, Math.round((current / ach.target) * 100));
              return (
                <div
                  key={ach.id}
                  className={`rounded-2xl border p-4 space-y-2.5 ${
                    unlocked ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{ach.title}</h3>
                    {unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ach.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-500">
                      <span>{ach.rewardText}</span>
                      <span>
                        {Math.min(current, ach.target)}/{ach.target}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full ${unlocked ? 'bg-emerald-600' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">本周守卫积分榜</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {leaderboardEntries.map((entry, idx) => (
              <div
                key={entry.name}
                className={`flex items-center justify-between px-4 py-3.5 border-b border-slate-100 last:border-b-0 ${
                  entry.isMe ? 'bg-emerald-50/80' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-md font-mono-num text-xs font-bold flex items-center justify-center ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{entry.name}</div>
                    <div className="text-xs text-slate-500">{entry.badge}</div>
                  </div>
                </div>
                <div className="font-mono-num text-sm font-bold text-slate-900">{entry.points} 分</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-bold text-slate-900">植物守卫军团（含战斗充能进化）</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantList.map((key) => {
            const p = PLANTS[key];
            return (
              <div key={key} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <PlantSprite type={key} evolvedLevel={1} className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono-num">
                      {p.cost} 阳光 · 耐久 {p.maxHp} · {p.role}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                  <div className="text-amber-800">
                    <span className="font-semibold">临时觉醒：</span>
                    {p.boostEffect}
                  </div>
                  <div className="text-emerald-800">
                    <span className="font-semibold">满充能进化：</span>
                    {p.evolveEffect}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">喊题僵尸档案（语音喊题 · 答对击毙）</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zombieList.map((key) => {
            const z = ZOMBIES[key];
            return (
              <div key={key} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <ZombieSprite type={key} hasKnowledgeShield={true} className="w-12 h-14" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">{z.name}</h3>
                  <div className="text-xs text-slate-500 font-mono-num">
                    生命值 {z.maxHp} · 弱点标签：{z.knowledgeTag}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{z.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export const PedagogyAndGeneratorView: React.FC = () => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(LEVELS[0].chapterId);
  const [sampleQuestion, setSampleQuestion] = useState<Question>(() =>
    generateQuestionForChapter(LEVELS[0].chapterId, LEVELS[0].grade)
  );

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const lvl = LEVELS.find((l) => l.chapterId === chapterId) || LEVELS[0];
    setSampleQuestion(generateQuestionForChapter(chapterId, lvl.grade));
  };

  const regenerateSample = () => {
    const lvl = LEVELS.find((l) => l.chapterId === selectedChapterId) || LEVELS[0];
    setSampleQuestion(generateQuestionForChapter(selectedChapterId, lvl.grade));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-900">人教版分章融合知识点库与出题测试</h1>
        <p className="text-sm text-slate-600 mt-1">
          每一关以人教版数学单章为主线，并有机融入同年级英语单词/短语、语文成语古诗词考点与历史知识，让闯关既有学科深度又生动多彩。
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">章节融合出题实时抽测</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedChapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
              aria-label="选择关卡章节"
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl.chapterId} value={lvl.chapterId}>
                  {lvl.semester} {lvl.unitLabel} · {lvl.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={regenerateSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-100 border border-amber-300 text-amber-950 hover:bg-amber-200 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>随机抽下一题（数/英/语/史）</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-[#FAF8F5] border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-800">{SUBJECT_LABELS[sampleQuestion.subject]}</span>
            <span aria-hidden="true">·</span>
            <span>{sampleQuestion.topic}</span>
            <span aria-hidden="true">·</span>
            <span>{sampleQuestion.isGenerated ? '动态参数化生成' : '精选考点题库'}</span>
          </div>
          <p className="text-base font-bold text-slate-900 leading-relaxed">{sampleQuestion.prompt}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {sampleQuestion.options.map((opt, idx) => (
              <div
                key={idx}
                className={`px-3.5 py-2.5 rounded-lg border ${
                  idx === sampleQuestion.answerIndex
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {['A', 'B', 'C', 'D'][idx]}. {opt}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200/70">
            <strong className="text-slate-800">核心解析：</strong>
            {sampleQuestion.explanation}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-700" />
          <h2 className="text-lg font-bold text-slate-900">全部 {KNOWLEDGE_NODES.length} 个章节融合关卡架构</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {KNOWLEDGE_NODES.map((node) => (
            <div key={node.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-emerald-800">{node.textbook}</span>
                <span aria-hidden="true"> · </span>
                <span>{node.semester}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{node.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{node.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
