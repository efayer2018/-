import React, { useEffect, useState } from 'react';
import { CheckCircle2, HelpCircle, Lightbulb, Sparkles, XCircle } from 'lucide-react';
import { GRADE_LABELS, SUBJECT_LABELS } from '../data/questions';
import { QuizTriggerContext } from '../types/game';
import { soundEngine } from '../utils/sound';

interface QuestionModalProps {
  context: QuizTriggerContext;
  streak: number;
  onComplete: (correct: boolean) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({ context, streak, onComplete }) => {
  const { question, purpose, rewardText } = context;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const isAnswered = selectedIdx !== null;
  const isCorrect = selectedIdx === question.answerIndex;

  // Auto-trigger battle reward when answered correctly (no manual click needed!)
  useEffect(() => {
    if (!isAnswered || !isCorrect) return;
    const timer = window.setTimeout(() => {
      onComplete(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [isAnswered, isCorrect, onComplete]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    if (idx === question.answerIndex) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playWrong();
    }
  };

  const purposeTitleMap: Record<QuizTriggerContext['purpose'], string> = {
    auto_sun: '自动阳光补给题',
    sun_supply: '阳光补给挑战',
    zombie_shout: '僵尸喊题反击（答对直接击毙！）',
    plant_boost: '植物临时觉醒挑战',
    plant_evolve: '植物战斗充能进化',
    emergency_rescue: '植物危急救援行动',
    plant_unlock: '智慧种植检验',
    mistake_clear: '错题歼灭挑战',
  };

  const purposeTitle = purposeTitleMap[purpose];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="font-semibold text-emerald-800">{purposeTitle}</span>
              <span aria-hidden="true">·</span>
              <span>{SUBJECT_LABELS[question.subject]}</span>
              <span aria-hidden="true">·</span>
              <span>{GRADE_LABELS[question.grade]}</span>
              <span aria-hidden="true">·</span>
              <span>{question.topic}</span>
            </div>
            <h2 id="quiz-modal-title" className="text-base font-bold text-slate-900 mt-1">
              战斗效果：{rewardText}
            </h2>
          </div>

          {streak > 0 && (
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500">当前连对</div>
              <div className="text-base font-bold text-amber-600 font-mono-num">{streak} 题</div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          <p className="text-lg font-semibold leading-relaxed text-slate-900">{question.prompt}</p>

          {!isAnswered && (
            <div>
              {!showHint ? (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>需要解题思路提示？点击查看</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950 leading-relaxed">
                  <span className="font-semibold">思路提示：</span>
                  {question.hint}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isThisCorrect = idx === question.answerIndex;
              const isThisSelected = idx === selectedIdx;

              let btnStyle =
                'bg-slate-50 border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-300';
              if (isAnswered) {
                if (isThisCorrect) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                } else if (isThisSelected) {
                  btnStyle = 'bg-red-50 border-red-400 text-red-950';
                } else {
                  btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-70';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelect(idx)}
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border text-left text-sm transition-colors min-h-[48px] cursor-pointer disabled:cursor-default ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num font-bold text-xs w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>
                  {isAnswered && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {isAnswered && isThisSelected && !isThisCorrect && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div
              className={`p-4 rounded-xl border ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                {isCorrect ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>回答正确！正在自动触发战果：{rewardText}</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4 text-red-600" />
                    <span>
                      差一点点！正确答案是 {['A', 'B', 'C', 'D'][question.answerIndex]}，已自动收录进「错题本」
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm leading-relaxed opacity-90">{question.explanation}</p>
            </div>
          )}

          {isAnswered && !isCorrect && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">记住解析后点击下方按钮继续防守</span>
              <button
                type="button"
                onClick={() => onComplete(false)}
                className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                我明白了，继续战斗
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
