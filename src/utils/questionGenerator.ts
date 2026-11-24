import { CurriculumSubject, GradeLevel, Question } from '../types/game';
import { QUESTIONS } from '../data/questions';

function shuffleOptions(
  correct: string,
  distractors: string[]
): { options: [string, string, string, string]; answerIndex: number } {
  const uniqueDistractors = Array.from(new Set(distractors.filter((d) => d !== correct))).slice(0, 3);
  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(
      `${Number(correct) ? Number(correct) + uniqueDistractors.length + 1 : `选项 ${uniqueDistractors.length + 1}`}`
    );
  }
  const pool = [correct, ...uniqueDistractors];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    options: [pool[0], pool[1], pool[2], pool[3]],
    answerIndex: pool.indexOf(correct),
  };
}

function fmtNum(n: number): string {
  return Number(n.toFixed(4)).toString();
}

// 1. Dynamic Math Generator scoped strictly to the selected 人教版 chapter
export function generateChapterDynamicMathQuestion(chapterId: string): Question | null {
  const uid = `gen-${chapterId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  if (chapterId === 'math-5a-u1') {
    const a = [12, 15, 18, 24, 25, 35][Math.floor(Math.random() * 6)];
    const b = [4, 6, 8, 12][Math.floor(Math.random() * 4)];
    const prod = a * b;
    const aDec = (a / 10).toFixed(1);
    const bDec = (b / 100).toFixed(2);
    const ans = fmtNum(prod / 1000);
    const { options, answerIndex } = shuffleOptions(ans, [
      fmtNum(prod / 100),
      fmtNum(prod / 10000),
      fmtNum(prod / 10),
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade5',
      difficulty: 1,
      topic: '五上第1单元 · 小数乘法',
      prompt: `已知 ${a} × ${b} = ${prod}，那么 ${aDec} × ${bDec} = ？`,
      options,
      answerIndex,
      hint: '数一数两个因数一共有几位小数，从积的右边起向左数出几位点小数点。',
      explanation: `${aDec}(1位小数) × ${bDec}(2位小数) 共有 3 位小数，所以 ${prod} 小数点左移 3 位得 ${ans}。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-5a-u3') {
    const q = [4, 5, 6, 8, 12, 15][Math.floor(Math.random() * 6)];
    const divisor = [0.4, 0.5, 0.6, 0.8, 1.2][Math.floor(Math.random() * 5)];
    const dividend = fmtNum(q * divisor);
    const { options, answerIndex } = shuffleOptions(`${q}`, [
      fmtNum(q / 10),
      fmtNum(q * 10),
      `${q + 2}`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade5',
      difficulty: 1,
      topic: '五上第3单元 · 小数除法',
      prompt: `计算小数除法：${dividend} ÷ ${divisor} = ？`,
      options,
      answerIndex,
      hint: '把除数和被除数的小数点同时向右移动相同的位数，变成整数除法再算！',
      explanation: `被除数和除数同时乘 10，转化为 ${fmtNum(Number(dividend) * 10)} ÷ ${fmtNum(divisor * 10)} = ${q}。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-5a-u5') {
    const x = [3, 4, 5, 6, 7, 8, 9][Math.floor(Math.random() * 7)];
    const a = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
    const b = [4, 6, 8, 10][Math.floor(Math.random() * 4)];
    const c = a * x - b;
    const { options, answerIndex } = shuffleOptions(`x = ${x}`, [
      `x = ${x + 2}`,
      `x = ${Math.max(1, x - 1)}`,
      `x = ${x + 3}`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade5',
      difficulty: 2,
      topic: '五上第5单元 · 简易方程',
      prompt: `解方程：${a}x - ${b} = ${c}，x 等于多少？`,
      options,
      answerIndex,
      hint: `方程两边同时加上 ${b}，再同时除以 ${a}。`,
      explanation: `${a}x = ${c} + ${b} = ${c + b}，两边同时除以 ${a} 得 x = ${x}。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-5a-u6') {
    const base = [6, 8, 10, 12, 14, 16][Math.floor(Math.random() * 6)];
    const height = [3, 4, 5, 7, 9][Math.floor(Math.random() * 5)];
    const area = (base * height) / 2;
    const { options, answerIndex } = shuffleOptions(`${area} 平方厘米`, [
      `${base * height} 平方厘米`,
      `${base + height} 平方厘米`,
      `${area + 6} 平方厘米`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade5',
      difficulty: 2,
      topic: '五上第6单元 · 多边形面积',
      prompt: `一个三角形的底是 ${base} 厘米，高是 ${height} 厘米，它的面积是多少？`,
      options,
      answerIndex,
      hint: '三角形面积 = 底 × 高 ÷ 2。',
      explanation: `${base} × ${height} ÷ 2 = ${area}（平方厘米）。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-5b-u2') {
    const candidates = [12, 15, 18, 24, 30, 36];
    const n = candidates[Math.floor(Math.random() * candidates.length)];
    const factors: number[] = [];
    for (let i = 1; i <= n; i++) {
      if (n % i === 0) factors.push(i);
    }
    const { options, answerIndex } = shuffleOptions(`${factors.length} 个`, [
      `${factors.length - 1} 个`,
      `${factors.length + 2} 个`,
      `${Math.max(2, factors.length - 2)} 个`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade5',
      difficulty: 2,
      topic: '五下第2单元 · 因数与倍数',
      prompt: `自然数 ${n} 一共有多少个因数？（包括 1 和它本身）`,
      options,
      answerIndex,
      hint: `一对一对地列举乘积等于 ${n} 的整数，注意别漏掉 1 和 ${n}。`,
      explanation: `${n} 的因数有 ${factors.join('、')}，一共 ${factors.length} 个。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-5b-u3') {
    const edge = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
    const vol = edge * edge * edge;
    const surf = edge * edge * 6;
    const { options, answerIndex } = shuffleOptions(`${vol} 立方厘米`, [
      `${surf} 立方厘米`,
      `${edge * 12} 立方厘米`,
      `${edge * edge} 立方厘米`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade5',
      difficulty: 2,
      topic: '五下第3单元 · 正方体体积',
      prompt: `一个正方体的棱长是 ${edge} 厘米，它的体积是多少立方厘米？`,
      options,
      answerIndex,
      hint: '正方体体积 V = 棱长 × 棱长 × 棱长（a³）。',
      explanation: `体积 = ${edge} × ${edge} × ${edge} = ${vol}（立方厘米）。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-5b-u4') {
    const gcf = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
    const a = gcf * 2;
    const b = gcf * 3;
    const lcm = gcf * 6;
    const { options, answerIndex } = shuffleOptions(`${lcm}`, [`${gcf}`, `${a * b}`, `${lcm + gcf}`]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade5',
      difficulty: 2,
      topic: '五下第4单元 · 最小公倍数',
      prompt: `求 ${a} 和 ${b} 的最小公倍数是多少？`,
      options,
      answerIndex,
      hint: `先用短除法找到最大公因数 ${gcf}，再乘各自独有的质因数。`,
      explanation: `${a}=${gcf}×2，${b}=${gcf}×3，最小公倍数 = ${gcf}×2×3 = ${lcm}。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-6a-u5') {
    const r = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
    const area = fmtNum(3.14 * r * r);
    const circ = fmtNum(2 * 3.14 * r);
    const { options, answerIndex } = shuffleOptions(`${area} 平方厘米`, [
      `${circ} 平方厘米`,
      `${fmtNum(3.14 * r)} 平方厘米`,
      `${fmtNum(3.14 * r * r * 2)} 平方厘米`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade6',
      difficulty: 2,
      topic: '六上第5单元 · 圆的面积',
      prompt: `一个圆形花坛的半径是 ${r} 厘米，它的面积是多少平方厘米？（π 取 3.14）`,
      options,
      answerIndex,
      hint: '圆的面积公式 S = πr²，先算 r × r，再乘 3.14！',
      explanation: `S = 3.14 × ${r}² = 3.14 × ${r * r} = ${area}（平方厘米）。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-6a-u6') {
    const orig = [200, 300, 400, 500][Math.floor(Math.random() * 4)];
    const pct = [15, 20, 25, 30][Math.floor(Math.random() * 4)];
    const ans = orig + (orig * pct) / 100;
    const { options, answerIndex } = shuffleOptions(`${ans} 棵`, [
      `${orig - (orig * pct) / 100} 棵`,
      `${orig + pct} 棵`,
      `${(orig * pct) / 100} 棵`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade6',
      difficulty: 3,
      topic: '六上第6单元 · 百分数应用',
      prompt: `花园去年种了 ${orig} 棵向日葵，今年比去年多种了 ${pct}%，今年种了多少棵？`,
      options,
      answerIndex,
      hint: `把去年看作单位“1”，今年是去年的 (1 + ${pct}%)。`,
      explanation: `${orig} × (1 + ${pct}%) = ${ans}（棵）。`,
      isGenerated: true,
    };
  }

  if (chapterId === 'math-6b-u3') {
    const baseArea = [12, 15, 18, 24][Math.floor(Math.random() * 4)];
    const h = [4, 5, 6][Math.floor(Math.random() * 3)];
    const coneVol = (baseArea * h) / 3;
    const cylVol = baseArea * h;
    const { options, answerIndex } = shuffleOptions(`${coneVol} 立方厘米`, [
      `${cylVol} 立方厘米`,
      `${(baseArea * h) / 2} 立方厘米`,
      `${coneVol + 6} 立方厘米`,
    ]);
    return {
      id: uid,
      chapterId,
      subject: 'math',
      grade: 'grade6',
      difficulty: 3,
      topic: '六下第3单元 · 圆锥体积',
      prompt: `一个圆锥的底面积是 ${baseArea} 平方厘米，高是 ${h} 厘米，它的体积是多少？`,
      options,
      answerIndex,
      hint: '圆锥体积 V = 1/3 × 底面积 × 高，别忘了除以 3！',
      explanation: `V = 1/3 × ${baseArea} × ${h} = ${coneVol}（立方厘米）。`,
      isGenerated: true,
    };
  }

  return null;
}

// 2. Dynamic English Words & Phrases Generator
const ENGLISH_WORD_BANK = [
  { word: 'strict', meaning: '严格的、严厉的', distractors: ['和蔼的', '有趣的', '害羞的'], grade: 'grade5' as GradeLevel },
  { word: 'hard-working', meaning: '工作努力的、辛勤的', distractors: ['粗心的', '懒惰的', '安静的'], grade: 'grade5' as GradeLevel },
  { word: 'play ping-pong', meaning: '打乒乓球', distractors: ['弹琵琶', '踢足球', '画漫画'], grade: 'grade5' as GradeLevel },
  { word: 'go on a picnic', meaning: '去野餐', distractors: ['去游泳', '堆雪人', '摘苹果'], grade: 'grade5' as GradeLevel },
  { word: 'keep to the right', meaning: '靠右行', distractors: ['保持安静', '靠左行', '小声说话'], grade: 'grade5' as GradeLevel },
  { word: 'science museum', meaning: '科学博物馆', distractors: ['邮政局', '电影院', '十字路口'], grade: 'grade6' as GradeLevel },
  { word: 'pay attention to', meaning: '注意……', distractors: ['寻找……', '来自……', '放弃……'], grade: 'grade6' as GradeLevel },
  { word: 'see a doctor', meaning: '看医生', distractors: ['数到十', '深呼吸', '穿暖和的衣服'], grade: 'grade6' as GradeLevel },
  { word: 'heavy → heavier', meaning: '更重的（比较级）', distractors: ['更强壮的', '更矮的', '更聪明的'], grade: 'grade6' as GradeLevel },
];

export function generateDynamicEnglishWordQuestion(grade: GradeLevel): Question {
  const pool = ENGLISH_WORD_BANK.filter((w) => (grade === 'grade5' ? w.grade === 'grade5' : true));
  const picked = pool[Math.floor(Math.random() * pool.length)] || ENGLISH_WORD_BANK[0];
  const { options, answerIndex } = shuffleOptions(picked.meaning, picked.distractors);
  return {
    id: `gen-eng-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    chapterId: `cross-${grade}`,
    subject: 'english',
    grade: picked.grade,
    difficulty: grade === 'grade5' ? 1 : 2,
    topic: '英语单词与短语',
    prompt: `英语词义速配：词组 “${picked.word}” 的正确中文意思是？`,
    options,
    answerIndex,
    hint: `结合课本日常交际或交通/校园话题回忆 “${picked.word}”。`,
    explanation: `“${picked.word}” 的中文意思是“${picked.meaning}”。`,
    isGenerated: true,
  };
}

// 3. Dynamic Chinese Poetry & Idiom Generator
const POETRY_TEMPLATES = [
  {
    poem: '《示儿》',
    author: '陆游',
    before: '死去元知万事空，',
    missing: '但悲不见九州同',
    distractors: ['家祭无忘告乃翁', '王师北定中原日', '青春作伴好还乡'],
    grade: 'grade5' as GradeLevel,
    hint: '诗人说死后万事皆空，唯一悲痛的是没能看到祖国统一。',
    explanation: '出自南宋陆游《示儿》：“死去元知万事空，但悲不见九州同。”',
  },
  {
    poem: '《己亥杂诗》',
    author: '龚自珍',
    before: '我劝天公重抖擞，',
    missing: '不拘一格降人才',
    distractors: ['九州生气恃风雷', '化作春泥更护花', '直挂云帆济沧海'],
    grade: 'grade5' as GradeLevel,
    hint: '诗人呼吁朝廷打破常规选拔各类有用之才。',
    explanation: '出自清代龚自珍《己亥杂诗》：“我劝天公重抖擞，不拘一格降人才。”',
  },
  {
    poem: '《石灰吟》',
    author: '于谦',
    before: '粉骨碎身浑不怕，',
    missing: '要留清白在人间',
    distractors: ['烈火焚烧若等闲', '任尔东西南北风', '只留清气满乾坤'],
    grade: 'grade6' as GradeLevel,
    hint: '借石灰自喻，表达宁死不屈、坚守高洁操守的志向。',
    explanation: '出自明代于谦《石灰吟》：“粉骨碎身浑不怕，要留清白在人间。”',
  },
  {
    poem: '《竹石》',
    author: '郑燮',
    before: '千磨万击还坚劲，',
    missing: '任尔东西南北风',
    distractors: ['咬定青山不放松', '立根原在破岩中', '要留清白在人间'],
    grade: 'grade6' as GradeLevel,
    hint: '不管刮来什么方向的风，竹子依然坚定挺拔！',
    explanation: '出自清代郑燮（郑板桥）《竹石》：“千磨万击还坚劲，任尔东西南北风。”',
  },
];

export function generateDynamicChinesePoetryQuestion(grade: GradeLevel): Question {
  const pool = POETRY_TEMPLATES.filter((p) => (grade === 'grade5' ? p.grade === 'grade5' : true));
  const picked = pool[Math.floor(Math.random() * pool.length)] || POETRY_TEMPLATES[0];
  const { options, answerIndex } = shuffleOptions(picked.missing, picked.distractors);
  return {
    id: `gen-chi-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    chapterId: `cross-${grade}`,
    subject: 'chinese',
    grade: picked.grade,
    difficulty: grade === 'grade5' ? 1 : 2,
    topic: `古诗词默写 · ${picked.poem}`,
    prompt: `请补全${picked.author}${picked.poem}中的名句：“${picked.before}__________。”`,
    options,
    answerIndex,
    hint: picked.hint,
    explanation: picked.explanation,
    isGenerated: true,
  };
}

// Blended Chapter Question Picker:
// ~45% Current Chapter Math + ~20% Grade-matched English + ~20% Grade-matched Chinese + ~15% History
export function generateQuestionForChapter(
  chapterId: string,
  grade: GradeLevel = 'grade5',
  excludeIds?: Set<string>
): Question {
  const roll = Math.random();

  let targetSubj: CurriculumSubject = 'math';
  if (roll < 0.45) {
    targetSubj = 'math';
  } else if (roll < 0.67) {
    targetSubj = 'english';
  } else if (roll < 0.87) {
    targetSubj = 'chinese';
  } else {
    targetSubj = 'history';
  }

  if (targetSubj === 'math') {
    if (Math.random() < 0.6) {
      const dynMath = generateChapterDynamicMathQuestion(chapterId);
      if (dynMath) return dynMath;
    }
    const mathPool = QUESTIONS.filter((q) => q.chapterId === chapterId && q.subject === 'math');
    if (mathPool.length > 0) {
      const fresh = excludeIds ? mathPool.filter((q) => !excludeIds.has(q.id)) : mathPool;
      const list = fresh.length > 0 ? fresh : mathPool;
      return list[Math.floor(Math.random() * list.length)];
    }
  }

  if (targetSubj === 'english' && Math.random() < 0.45) {
    return generateDynamicEnglishWordQuestion(grade);
  }

  if (targetSubj === 'chinese' && Math.random() < 0.4) {
    return generateDynamicChinesePoetryQuestion(grade);
  }

  let pool = QUESTIONS.filter(
    (q) =>
      q.subject === targetSubj &&
      (grade === 'grade5' ? q.grade === 'grade5' : true)
  );
  if (pool.length === 0) {
    pool = QUESTIONS.filter((q) => q.subject === targetSubj);
  }
  const fresh = excludeIds ? pool.filter((q) => !excludeIds.has(q.id)) : pool;
  const finalPool = fresh.length > 0 ? fresh : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
