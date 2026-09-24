import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  ArrowLeft, ArrowUpRight, BarChart3, BookOpen, BrainCircuit, Check, ChevronLeft, ChevronRight,
  ClipboardCheck, Clock3, Copy, FileText, GraduationCap, Home as HomeIcon, LayoutDashboard, Lightbulb,
  ListChecks, LockKeyhole, LogIn, Menu, PenLine, Plus, ReceiptText, Search, Settings2,
  Camera, Languages, ShieldCheck, Sparkles, Target, Trash2, Upload, Users, Volume2, X, Zap,
} from 'lucide-react';
import {
  getGetCatalogQueryKey, getGetLessonQueryKey, getGetSessionQueryKey, getGetSettingsQueryKey,
  getHealthCheckQueryKey,
  getGetSubscriptionQueryKey, getGetAdminOverviewQueryKey, getGetAdminSubscriptionsQueryKey,
  getGetAdminCatalogQueryKey, getGetAdminUsersQueryKey,
  useCreateCatalogItem, useDeleteAdminUser, useDeleteCatalogItem, useGenerateAiContent,
  useGetAdminCatalog, useGetAdminOverview, useGetAdminSubscriptions, useGetAdminUsers,
  useGetCatalog, useGetLesson, useGetSession, useGetSettings, useGetSubscription, useHealthCheck, useLogin,
  useRegister, useSubmitSubscription, useUpdateAdminUser, useUpdateCatalogItem, useUpdateSettings, useUpdateSubscriptionStatus,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import qiyasGuideUrl from '@/assets/qiyas-guide.pdf?url';
import lettersVisual from '@/assets/interactive-letters.svg';
import numbersVisual from '@/assets/interactive-numbers.svg';
import operationsVisual from '@/assets/interactive-operations.svg';
import lettersVideo from '@/assets/interactive-letters.mp4';
import numbersVideo from '@/assets/interactive-numbers.mp4';
import operationsVideo from '@/assets/interactive-operations.mp4';

const queryClient = new QueryClient();

const demoCatalog = {
  stages: [
    { id: 'primary', name: 'المرحلة الابتدائية', description: 'أساس قوي يبدأ من الفضول وينمو بالثقة.', color: '#e6a536', grades: [
      { id: 'p1', name: 'الصف الأول الابتدائي', subjects: [
        { id: 'letters-p1', name: 'الحروف', icon: 'أ', lessonCount: 28, sections: [
          { id: 'p1-letters', type: 'explanations', title: 'دروس الحروف', count: 28 },
          { id: 'p1-letters-practice', type: 'exams', title: 'تدريب الحروف', count: 28 },
        ] },
        { id: 'math-p1', name: 'الرياضيات', icon: '∑', lessonCount: 31, sections: [
          { id: 'p1-numbers', type: 'explanations', title: 'الأرقام', count: 11 },
          { id: 'p1-addition', type: 'explanations', title: 'الجمع', count: 10 },
          { id: 'p1-subtraction', type: 'explanations', title: 'الطرح', count: 10 },
        ] },
      ] },
      { id: 'p4', name: 'الصف الرابع', subjects: [{ id: 'math-p4', name: 'الرياضيات', icon: '∑', lessonCount: 24, sections: [
        { id: 'e1', type: 'explanations', title: 'شرح الدروس', count: 24 }, { id: 'h1', type: 'homework', title: 'الواجبات', count: 18 }, { id: 'x1', type: 'exams', title: 'اختبارات قصيرة', count: 12 }, { id: 'q1', type: 'qiyas', title: 'تدريب قياس', count: 8 },
      ] }, { id: 'arabic-p4', name: 'لغتي الجميلة', icon: 'ع', lessonCount: 19, sections: [] }] },
      { id: 'p6', name: 'الصف السادس', subjects: [{ id: 'science-p6', name: 'العلوم', icon: 'ع', lessonCount: 28, sections: [] }, { id: 'math-p6', name: 'الرياضيات', icon: 'م', lessonCount: 31, sections: [] }] },
    ] },
    { id: 'middle', name: 'المرحلة المتوسطة', description: 'فهم أعمق، أسئلة أذكى، وخطوة أقرب لهدفك.', color: '#2e8a78', grades: [
      { id: 'm1', name: 'الأول المتوسط', subjects: [{ id: 'math-m1', name: 'الرياضيات', icon: '∑', lessonCount: 34, sections: [] }, { id: 'science-m1', name: 'العلوم', icon: 'ع', lessonCount: 27, sections: [] }] },
      { id: 'm3', name: 'الثالث المتوسط', subjects: [{ id: 'math-m3', name: 'الرياضيات', icon: '∑', lessonCount: 42, sections: [] }, { id: 'english-m3', name: 'اللغة الإنجليزية', icon: 'A', lessonCount: 22, sections: [] }] },
    ] },
    { id: 'secondary', name: 'المرحلة الثانوية', description: 'استعداد مركز للمدرسة والقدرات والجامعة.', color: '#36738a', grades: [
      { id: 's2', name: 'الثاني الثانوي', subjects: [{ id: 'math-s2', name: 'رياضيات 2', icon: '∑', lessonCount: 46, sections: [] }, { id: 'physics-s2', name: 'الفيزياء', icon: 'ف', lessonCount: 29, sections: [] }] },
      { id: 's3', name: 'الثالث الثانوي', subjects: [{ id: 'qiyas-s3', name: 'القدرات والتحصيلي', icon: 'ق', lessonCount: 55, sections: [] }, { id: 'chem-s3', name: 'الكيمياء', icon: 'ك', lessonCount: 38, sections: [] }] },
    ] },
  ],
};

type InteractiveQuestion = { prompt: string; options: string[]; answer: string; hint: string };
type InteractiveLesson = {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: 'letters' | 'numbers' | 'addition' | 'subtraction';
  title: string;
  symbol: string;
  kind: 'letter' | 'number' | 'addition' | 'subtraction';
  description: string;
  questions: InteractiveQuestion[];
};

const arabicNumber = (value: number) => value.toString().replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
const shuffleOptions = (answer: string, distractors: string[]) => [answer, ...distractors].slice(0, 3);

const letterLessons: InteractiveLesson[] = [
  ['ا', 'ألف', 'أسد'], ['ب', 'باء', 'باب'], ['ت', 'تاء', 'تفاحة'], ['ث', 'ثاء', 'ثعلب'],
  ['ج', 'جيم', 'جمل'], ['ح', 'حاء', 'حوت'], ['خ', 'خاء', 'خبز'], ['د', 'دال', 'دب'],
  ['ذ', 'ذال', 'ذهب'], ['ر', 'راء', 'رمان'], ['ز', 'زاي', 'زرافة'], ['س', 'سين', 'سمكة'],
  ['ش', 'شين', 'شمس'], ['ص', 'صاد', 'صقر'], ['ض', 'ضاد', 'ضفدع'], ['ط', 'طاء', 'طائرة'],
  ['ظ', 'ظاء', 'ظرف'], ['ع', 'عين', 'عنب'], ['غ', 'غين', 'غيمة'], ['ف', 'فاء', 'فراشة'],
  ['ق', 'قاف', 'قمر'], ['ك', 'كاف', 'كتاب'], ['ل', 'لام', 'ليمون'], ['م', 'ميم', 'موز'],
  ['ن', 'نون', 'نحلة'], ['ه', 'هاء', 'هلال'], ['و', 'واو', 'وردة'], ['ي', 'ياء', 'يد'],
].map(([letter, name, word], index, all) => {
  const distractors = [all[(index + 1) % all.length][0], all[(index + 2) % all.length][0]];
  const wordDistractors = [all[(index + 3) % all.length][2], all[(index + 4) % all.length][2]];
  return {
    id: `letter-${index + 1}`,
    subjectId: 'letters-p1',
    subjectName: 'الحروف',
    topic: 'letters',
    title: `حرف ${name}`,
    symbol: letter,
    kind: 'letter',
    description: `نتعرف على حرف ${name} ونربطه بكلمة «${word}».`,
    questions: [
      { prompt: `ما الحرف الذي تبدأ به كلمة «${word}»؟`, options: shuffleOptions(letter, distractors), answer: letter, hint: `تبدأ كلمة «${word}» بحرف ${name}.` },
      { prompt: `اختر شكل حرف ${name} الصحيح.`, options: shuffleOptions(letter, distractors), answer: letter, hint: `هذا هو حرف ${name}: ${letter}.` },
      { prompt: `أي كلمة تحتوي على حرف ${letter}؟`, options: shuffleOptions(word, wordDistractors), answer: word, hint: `الكلمة «${word}» تحتوي على حرف ${letter}.` },
    ],
  };
});

const numberLessons: InteractiveLesson[] = Array.from({ length: 11 }, (_, number) => {
  const value = arabicNumber(number);
  const distractors = [arabicNumber((number + 1) % 11), arabicNumber((number + 2) % 11)];
  return {
    id: `number-${number}`,
    subjectId: 'math-p1',
    subjectName: 'الرياضيات',
    topic: 'numbers',
    title: `الرقم ${value}`,
    symbol: value,
    kind: 'number',
    description: `نتعرف على الرقم ${value} ونربطه بعدد الأشياء من حولنا.`,
    questions: [
      { prompt: `أي رقم يساوي عدد الدوائر: ${'●'.repeat(Math.max(1, number))}؟`, options: shuffleOptions(value, distractors), answer: value, hint: `عدد الدوائر هو ${value}.` },
      { prompt: `ما الرقم الذي يأتي بعد ${value}؟`, options: shuffleOptions(arabicNumber((number + 1) % 11), [arabicNumber((number + 2) % 11), arabicNumber(Math.max(0, number - 1))]), answer: arabicNumber((number + 1) % 11), hint: `بعد ${value} يأتي ${arabicNumber((number + 1) % 11)}.` },
      { prompt: `اختر بطاقة الرقم ${value}.`, options: shuffleOptions(value, distractors), answer: value, hint: `ابحث عن الرمز ${value}.` },
    ],
  };
});

const arithmeticLessons = (kind: 'addition' | 'subtraction') => Array.from({ length: 10 }, (_, index) => {
  const left = kind === 'addition' ? index + 1 : index + 2;
  const right = kind === 'addition' ? (index % 4) + 1 : (index % Math.max(1, left - 1)) + 1;
  const result = kind === 'addition' ? left + right : left - right;
  const answer = arabicNumber(result);
  const operation = `${arabicNumber(left)} ${kind === 'addition' ? '+' : '−'} ${arabicNumber(right)}`;
  const distractors = [arabicNumber(result + 1), arabicNumber(Math.max(0, result - 1))];
  return {
    id: `${kind}-${index + 1}`,
    subjectId: 'math-p1',
    subjectName: 'الرياضيات',
    topic: kind,
    title: `${kind === 'addition' ? 'الجمع' : 'الطرح'} ${index + 1}`,
    symbol: kind === 'addition' ? '+' : '−',
    kind,
    description: kind === 'addition' ? 'نجمع مجموعتين لنجد العدد الكلي.' : 'نطرح جزءاً من مجموعة لنعرف ما تبقى.',
    questions: [
      { prompt: `${operation} = ؟`, options: shuffleOptions(answer, distractors), answer, hint: `احسب العملية ${operation} خطوة خطوة.` },
      { prompt: kind === 'addition' ? `لديك ${arabicNumber(left)} تفاحات وأضفت ${arabicNumber(right)}. كم تفاحة لديك؟` : `لديك ${arabicNumber(left)} أقلام وأعطيت ${arabicNumber(right)}. كم قلماً بقي؟`, options: shuffleOptions(answer, distractors), answer, hint: `الإجابة هي ${answer}.` },
      { prompt: `أي عملية نتيجتها ${answer}؟`, options: shuffleOptions(operation, [`${arabicNumber(left)} ${kind === 'addition' ? '−' : '+'} ${arabicNumber(right)}`, `${arabicNumber(right)} ${kind === 'addition' ? '+' : '−'} ${arabicNumber(left)}`]), answer: operation, hint: `العملية الصحيحة هي ${operation}.` },
    ],
  };
});

const interactiveLessons = [...letterLessons, ...numberLessons, ...arithmeticLessons('addition'), ...arithmeticLessons('subtraction')];
const interactiveLessonMap = new Map(interactiveLessons.map((lesson) => [lesson.id, lesson]));
const lessonsForSubject = (subjectId: string) => interactiveLessons.filter((lesson) => lesson.subjectId === subjectId);

type EnglishQuestion = { prompt: string; options: string[]; answer: string; hint: string };
type EnglishLesson = {
  id: string;
  kind: 'letter' | 'word' | 'grammar';
  title: string;
  symbol: string;
  description: string;
  explanation: string;
  questions: EnglishQuestion[];
  word?: string;
  meaning?: string;
  sentence?: string;
  writingAnswer?: string;
};

const englishAlphabet = [
  ['A', 'أَي', 'Apple', 'تفاحة'], ['B', 'بِي', 'Book', 'كتاب'], ['C', 'سِي', 'Cat', 'قطة'],
  ['D', 'دِي', 'Dog', 'كلب'], ['E', 'إِي', 'Egg', 'بيضة'], ['F', 'إف', 'Fish', 'سمكة'],
  ['G', 'جِي', 'Grapes', 'عنب'], ['H', 'إيتش', 'Hat', 'قبعة'], ['I', 'آي', 'Ice cream', 'مثلجات'],
  ['J', 'جَيْ', 'Juice', 'عصير'], ['K', 'كَيْ', 'Kite', 'طائرة ورقية'], ['L', 'إل', 'Lion', 'أسد'],
  ['M', 'إم', 'Moon', 'قمر'], ['N', 'إن', 'Nose', 'أنف'], ['O', 'أو', 'Orange', 'برتقالة'],
  ['P', 'بِي', 'Pencil', 'قلم رصاص'], ['Q', 'كْيُو', 'Queen', 'ملكة'], ['R', 'آر', 'Rabbit', 'أرنب'],
  ['S', 'إس', 'Sun', 'شمس'], ['T', 'تِي', 'Tree', 'شجرة'], ['U', 'يُو', 'Umbrella', 'مظلة'],
  ['V', 'فِي', 'Van', 'حافلة صغيرة'], ['W', 'دَبْلْيُو', 'Water', 'ماء'], ['X', 'إكْس', 'X-ray', 'أشعة'],
  ['Y', 'وَاي', 'Yacht', 'يخت'], ['Z', 'زِي', 'Zebra', 'حمار وحشي'],
] as const;

const englishLetterLessons: EnglishLesson[] = englishAlphabet.map(([letter, pronunciation, word, meaning], index, all) => {
  const otherLetters = [all[(index + 1) % all.length][0], all[(index + 2) % all.length][0]];
  const otherWords = [all[(index + 3) % all.length][2], all[(index + 4) % all.length][2]];
  return {
    id: `english-letter-${letter.toLowerCase()}`,
    kind: 'letter',
    title: `الحرف ${letter}`,
    symbol: letter,
    description: `نتعلم شكل الحرف ${letter} ونطقه ونربطه بكلمة ${word}.`,
    explanation: `حرف ${letter} ينطق «${pronunciation}». كلمة ${word} تعني «${meaning}» وتبدأ بالحرف ${letter}.`,
    questions: [
      { prompt: `أي حرف تبدأ به كلمة ${word}؟`, options: shuffleOptions(letter, otherLetters), answer: letter, hint: `تبدأ كلمة ${word} بالحرف ${letter}.` },
      { prompt: `اختر الكلمة التي تبدأ بالحرف ${letter}.`, options: shuffleOptions(word, otherWords), answer: word, hint: `${word} تبدأ بالحرف ${letter}.` },
      { prompt: `كيف ننطق الحرف ${letter}؟`, options: shuffleOptions(pronunciation, [all[(index + 1) % all.length][1], all[(index + 2) % all.length][1]]), answer: pronunciation, hint: `نطق ${letter} هو «${pronunciation}».` },
    ],
  };
});

const englishWordSeed = [
  ['apple', 'أَبُل', 'تفاحة', 'This is an apple.'],
  ['book', 'بُك', 'كتاب', 'I read a book.'],
  ['school', 'سْكُول', 'مدرسة', 'I go to school.'],
  ['house', 'هَاوْس', 'منزل', 'This is my house.'],
  ['water', 'وُوتَر', 'ماء', 'I drink water.'],
  ['sun', 'سَن', 'شمس', 'The sun is bright.'],
  ['cat', 'كَات', 'قطة', 'The cat is small.'],
  ['friend', 'فْرِند', 'صديق', 'My friend is kind.'],
  ['mother', 'مَذَر', 'أم', 'My mother is kind.'],
  ['happy', 'هَابِي', 'سعيد', 'I am happy.'],
] as const;

const englishWordLessons: EnglishLesson[] = englishWordSeed.map(([word, reading, meaning, sentence], index, all) => {
  const otherWords = [all[(index + 1) % all.length][0], all[(index + 2) % all.length][0]];
  const otherMeanings = [all[(index + 3) % all.length][2], all[(index + 4) % all.length][2]];
  return {
    id: `english-word-${index + 1}`,
    kind: 'word',
    title: `الكلمة ${word}`,
    symbol: word,
    description: `نقرأ كلمة ${word} ونكتبها ونستعملها في جملة قصيرة.`,
    explanation: `كلمة ${word} تنطق «${reading}» وتعني «${meaning}». نقرأها في الجملة: ${sentence}`,
    word,
    meaning,
    sentence,
    writingAnswer: word,
    questions: [
      { prompt: `اختر الكلمة التي تعني «${meaning}».`, options: shuffleOptions(word, otherWords), answer: word, hint: `${word} تعني «${meaning}».` },
      { prompt: `ما معنى كلمة ${word}؟`, options: shuffleOptions(meaning, otherMeanings), answer: meaning, hint: `${word} تعني «${meaning}».` },
      { prompt: `أي كلمة نسمعها في بداية الجملة: ${sentence}`, options: shuffleOptions(word, otherWords), answer: word, hint: `الكلمة المستهدفة هي ${word}.` },
    ],
  };
});

const englishGrammarLessons: EnglishLesson[] = [
  {
    id: 'english-grammar-nouns',
    kind: 'grammar',
    title: 'الأسماء Nouns',
    symbol: 'N',
    description: 'نعرف الاسم: شخص أو مكان أو شيء.',
    explanation: 'الاسم Noun كلمة تسمّي شخصاً أو مكاناً أو شيئاً، مثل teacher و school و book.',
    questions: [
      { prompt: 'أي كلمة اسم لشيء؟', options: ['book', 'run', 'happy'], answer: 'book', hint: 'book اسم شيء، أي كتاب.' },
      { prompt: 'أي كلمة اسم لمكان؟', options: ['school', 'jump', 'blue'], answer: 'school', hint: 'school تعني مدرسة، وهي مكان.' },
    ],
  },
  {
    id: 'english-grammar-pronouns',
    kind: 'grammar',
    title: 'الضمائر Pronouns',
    symbol: 'I',
    description: 'نستعمل I و you و he و she و it و we و they.',
    explanation: 'الضمير يحل محل الاسم. نقول I للمتكلم، you للمخاطب، he للولد، she للبنت، و they للجمع.',
    questions: [
      { prompt: 'أي ضمير يعني «أنا»؟', options: ['I', 'he', 'they'], answer: 'I', hint: 'I تعني أنا.' },
      { prompt: 'أي ضمير نستعمله مع Sara؟', options: ['she', 'he', 'it'], answer: 'she', hint: 'Sara بنت، لذلك نستعمل she.' },
    ],
  },
  {
    id: 'english-grammar-be',
    kind: 'grammar',
    title: 'فعل الكينونة be',
    symbol: 'be',
    description: 'نتعلم am و is و are في الجمل البسيطة.',
    explanation: 'نستعمل am مع I، و is مع he و she و it، و are مع you و we و they.',
    questions: [
      { prompt: 'I ___ happy.', options: ['am', 'is', 'are'], answer: 'am', hint: 'مع I نستخدم am.' },
      { prompt: 'They ___ students.', options: ['are', 'am', 'is'], answer: 'are', hint: 'مع they نستخدم are.' },
    ],
  },
  {
    id: 'english-grammar-articles',
    kind: 'grammar',
    title: 'أدوات التنكير a و an',
    symbol: 'a/an',
    description: 'نختار a أو an قبل الاسم المفرد.',
    explanation: 'نستعمل a قبل الصوت الساكن مثل a book، و an قبل صوت حرف علة مثل an apple.',
    questions: [
      { prompt: 'اختر الأداة الصحيحة: ___ apple', options: ['an', 'a', 'are'], answer: 'an', hint: 'apple تبدأ بصوت حرف علة، فنقول an apple.' },
      { prompt: 'اختر الأداة الصحيحة: ___ book', options: ['a', 'an', 'am'], answer: 'a', hint: 'book تبدأ بصوت ساكن، فنقول a book.' },
    ],
  },
  {
    id: 'english-grammar-plurals',
    kind: 'grammar',
    title: 'المفرد والجمع Plurals',
    symbol: 's',
    description: 'نضيف s غالباً لنجعل الاسم جمعاً.',
    explanation: 'عندما نريد أكثر من شيء نضيف s في كثير من الكلمات: one cat، two cats.',
    questions: [
      { prompt: 'ما جمع كلمة cat؟', options: ['cats', 'cat', 'cates'], answer: 'cats', hint: 'نضيف s إلى cat فتصبح cats.' },
      { prompt: 'اختر الجملة الصحيحة لكتابين.', options: ['two books', 'two book', 'two bookes'], answer: 'two books', hint: 'نستخدم books مع العدد two.' },
    ],
  },
  {
    id: 'english-grammar-present',
    kind: 'grammar',
    title: 'المضارع البسيط Present Simple',
    symbol: 'go',
    description: 'نتحدث عن العادات والأفعال المتكررة.',
    explanation: 'نستعمل المضارع البسيط للعادات: I play every day. ومع he و she نضيف s غالباً: She plays.',
    questions: [
      { prompt: 'اختر الجملة الصحيحة: أنا ألعب كل يوم.', options: ['I play every day.', 'I plays every day.', 'I playing every day.'], answer: 'I play every day.', hint: 'مع I نقول play بلا s.' },
      { prompt: 'اختر الجملة الصحيحة: هي تقرأ.', options: ['She reads.', 'She read.', 'She reading.'], answer: 'She reads.', hint: 'مع she نضيف s إلى read.' },
    ],
  },
  {
    id: 'english-grammar-questions',
    kind: 'grammar',
    title: 'أسئلة بسيطة',
    symbol: '?',
    description: 'نستعمل What و Where و Who للسؤال.',
    explanation: 'What للسؤال عن الشيء، Where عن المكان، و Who عن الشخص.',
    questions: [
      { prompt: '___ is your name?', options: ['What', 'Where', 'Who'], answer: 'What', hint: 'نسأل عن الاسم باستخدام What.' },
      { prompt: '___ is the school?', options: ['Where', 'What', 'Who'], answer: 'Where', hint: 'نسأل عن المكان باستخدام Where.' },
    ],
  },
  {
    id: 'english-grammar-prepositions',
    kind: 'grammar',
    title: 'حروف المكان',
    symbol: 'in',
    description: 'نتعلم in و on و under لوصف مكان الشيء.',
    explanation: 'in تعني داخل، on تعني فوق سطح، و under تعني تحت.',
    questions: [
      { prompt: 'The pencil is ___ the box. القلم داخل الصندوق.', options: ['in', 'on', 'under'], answer: 'in', hint: 'داخل تعني in.' },
      { prompt: 'The book is ___ the table. الكتاب فوق الطاولة.', options: ['on', 'in', 'under'], answer: 'on', hint: 'فوق السطح تعني on.' },
    ],
  },
];

const arabicFoundationLessons: EnglishLesson[] = [
  {
    id: 'arabic-writing-shapes',
    kind: 'grammar',
    title: 'أشكال الحروف',
    symbol: 'ب',
    description: 'نتعلم شكل الحرف في أول الكلمة ووسطها وآخرها.',
    explanation: 'يتغير شكل بعض الحروف العربية بحسب موقعها في الكلمة. حرف ب يظهر في بداية «بيت»، ووسط «حبل»، ونهاية «كتب».',
    questions: [
      { prompt: 'أين يأتي هذا الشكل غالباً: «ـبـ»؟', options: ['وسط الكلمة', 'أول الكلمة', 'آخر الكلمة'], answer: 'وسط الكلمة', hint: 'الشكل المتصل من الجهتين يكون في وسط الكلمة.' },
      { prompt: 'أي كلمة تبدأ بحرف ب؟', options: ['بيت', 'حبل', 'كتب'], answer: 'بيت', hint: 'بيت تبدأ بحرف ب.' },
    ],
  },
  {
    id: 'arabic-short-vowels',
    kind: 'grammar',
    title: 'الحركات القصيرة',
    symbol: 'َ ِ ُ',
    description: 'نقرأ الفتحة والكسرة والضمة لننطق الكلمة بشكل صحيح.',
    explanation: 'الفتحة تُسمع مثل a، والكسرة مثل i، والضمة مثل u. هذه الحركات تساعدنا على نطق المقاطع القصيرة.',
    questions: [
      { prompt: 'ما الحركة في «بِ»؟', options: ['الكسرة', 'الفتحة', 'الضمة'], answer: 'الكسرة', hint: 'الكسرة تكون تحت الحرف.' },
      { prompt: 'ما الحركة في «مُ»؟', options: ['الضمة', 'الكسرة', 'الفتحة'], answer: 'الضمة', hint: 'الضمة تكون فوق الحرف وتشبه واواً صغيرة.' },
    ],
  },
  {
    id: 'arabic-long-vowels',
    kind: 'grammar',
    title: 'حروف المد',
    symbol: 'ا و ي',
    description: 'نمد الصوت باستخدام الألف والواو والياء.',
    explanation: 'حروف المد ثلاثة: الألف بعد الفتحة مثل «قال»، والواو بعد الضمة مثل «يقول»، والياء بعد الكسرة مثل «قيل».',
    questions: [
      { prompt: 'أي حرف مد في كلمة «باب»؟', options: ['الألف', 'الواو', 'الياء'], answer: 'الألف', hint: 'الصوت الطويل في باب سببه الألف.' },
      { prompt: 'أي حرف مد في كلمة «نور»؟', options: ['الواو', 'الألف', 'الياء'], answer: 'الواو', hint: 'الصوت الطويل في نور سببه الواو.' },
    ],
  },
  {
    id: 'arabic-tanween',
    kind: 'grammar',
    title: 'التنوين',
    symbol: 'ٌ ٍ ً',
    description: 'نقرأ تنوين الضم والفتح والكسر في آخر الاسم.',
    explanation: 'التنوين صوت نون ساكنة في آخر الاسم: كتابٌ، كتاباً، كتابٍ. ننتبه إلى الحركة الأخيرة عند القراءة.',
    questions: [
      { prompt: 'أي كلمة فيها تنوين ضم؟', options: ['قلمٌ', 'قلمٍ', 'قلماً'], answer: 'قلمٌ', hint: 'الضمتان في قلمٌ هما تنوين الضم.' },
      { prompt: 'أي كلمة فيها تنوين كسر؟', options: ['بيتٍ', 'بيتٌ', 'بيتاً'], answer: 'بيتٍ', hint: 'الكسرتان في بيتٍ هما تنوين الكسر.' },
    ],
  },
  {
    id: 'arabic-sun-moon',
    kind: 'grammar',
    title: 'اللام الشمسية والقمرية',
    symbol: 'ال',
    description: 'نميز نطق اللام في الكلمات المعرفة.',
    explanation: 'في اللام القمرية نسمع اللام مثل «القمر»، وفي اللام الشمسية لا نسمع اللام وتُشدد الحروف بعدها مثل «الشمس».',
    questions: [
      { prompt: 'أي كلمة فيها لام قمرية؟', options: ['القمر', 'الشمس', 'الناس'], answer: 'القمر', hint: 'نسمع اللام في القمر.' },
      { prompt: 'أي كلمة فيها لام شمسية؟', options: ['الشمس', 'الكتاب', 'الباب'], answer: 'الشمس', hint: 'لا نسمع اللام في الشمس، ويُشدد الشين.' },
    ],
  },
  {
    id: 'arabic-sentence',
    kind: 'grammar',
    title: 'الجملة الاسمية والفعلية',
    symbol: 'ج',
    description: 'نفرق بين الجملة التي تبدأ باسم والجملة التي تبدأ بفعل.',
    explanation: 'الجملة الاسمية تبدأ باسم مثل «الولدُ نشيطٌ»، والجملة الفعلية تبدأ بفعل مثل «كتبَ الطالبُ».',
    questions: [
      { prompt: 'أي جملة اسمية؟', options: ['الولدُ نشيطٌ', 'كتبَ الطالبُ', 'يلعبُ الطفلُ'], answer: 'الولدُ نشيطٌ', hint: 'تبدأ الجملة الاسمية باسم.' },
      { prompt: 'أي جملة فعلية؟', options: ['قرأَ خالدٌ', 'السماءُ صافيةٌ', 'الكتابُ مفيدٌ'], answer: 'قرأَ خالدٌ', hint: 'تبدأ الجملة الفعلية بفعل.' },
    ],
  },
];

const arabicLetterLessons: EnglishLesson[] = letterLessons.map((lesson) => ({
  id: `arabic-${lesson.id}`,
  kind: 'letter',
  title: lesson.title,
  symbol: lesson.symbol,
  description: lesson.description,
  explanation: lesson.description,
  questions: lesson.questions,
}));

const arabicWordSeed = [
  ['بيت', 'بَيْت', 'house', 'هذا بيتٌ جميل.'],
  ['باب', 'بَاب', 'door', 'هذا بابٌ كبير.'],
  ['كتاب', 'كِتَاب', 'book', 'هذا كتابٌ مفيد.'],
  ['قلم', 'قَلَم', 'pen', 'هذا قلمٌ أزرق.'],
  ['ماء', 'مَاء', 'water', 'أشرب الماء.'],
  ['شمس', 'شَمْس', 'sun', 'الشمس مشرقة.'],
  ['قمر', 'قَمَر', 'moon', 'القمر جميل.'],
  ['مدرسة', 'مَدْرَسَة', 'school', 'أذهب إلى المدرسة.'],
  ['أم', 'أُمّ', 'mother', 'أمي حنونة.'],
  ['صديق', 'صَدِيق', 'friend', 'صديقي متعاون.'],
] as const;

const arabicWordLessons: EnglishLesson[] = arabicWordSeed.map(([word, reading, meaning, sentence], index, all) => {
  const otherWords = [all[(index + 1) % all.length][0], all[(index + 2) % all.length][0]];
  const otherMeanings = [all[(index + 3) % all.length][2], all[(index + 4) % all.length][2]];
  return {
    id: `arabic-word-${index + 1}`,
    kind: 'word',
    title: `كلمة ${word}`,
    symbol: word,
    description: `نقرأ كلمة ${word} ونكتبها ونستعملها في جملة قصيرة.`,
    explanation: `كلمة ${word} تنطق «${reading}» وتعني ${meaning}. نقرأها في الجملة: ${sentence}`,
    word,
    meaning,
    sentence,
    writingAnswer: word,
    questions: [
      { prompt: `اختر الكلمة التي تعني ${meaning}.`, options: shuffleOptions(word, otherWords), answer: word, hint: `${word} تعني ${meaning}.` },
      { prompt: `ما معنى كلمة ${word}؟`, options: shuffleOptions(meaning, otherMeanings), answer: meaning, hint: `${word} تعني ${meaning}.` },
      { prompt: `أي كلمة نسمعها في بداية الجملة: ${sentence}`, options: shuffleOptions(word, otherWords), answer: word, hint: `الكلمة المستهدفة هي ${word}.` },
    ],
  };
});

const arabicLessons = [...arabicLetterLessons, ...arabicWordLessons, ...arabicFoundationLessons];
const englishLessons = [...englishLetterLessons, ...englishWordLessons, ...englishGrammarLessons];
const englishLessonMap = new Map(englishLessons.map((lesson) => [lesson.id, lesson]));
const arabicFoundationMap = new Map(arabicLessons.map((lesson) => [lesson.id, lesson]));
const createLetterVisual = (symbol: string, label: string, language: 'english' | 'arabic') => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420"><rect width="960" height="420" rx="40" fill="${language === 'english' ? '#e7f1f4' : '#fff8e8'}"/><circle cx="130" cy="90" r="80" fill="#f6b233" opacity=".45"/><circle cx="850" cy="340" r="120" fill="#2e8a78" opacity=".18"/><rect x="300" y="45" width="360" height="280" rx="36" fill="#214c43"/><text x="480" y="245" text-anchor="middle" font-size="180" font-family="Arial,sans-serif" font-weight="700" fill="#fff8e8">${symbol}</text><text x="480" y="370" text-anchor="middle" font-size="34" font-family="Arial,sans-serif" font-weight="700" fill="#214c43">${label}</text></svg>`)}`;

const cn = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');
const money = (value: number) => `${new Intl.NumberFormat('ar-SA').format(value)} ر.س`;

function Button({ children, variant = 'primary', className, ...props }: { children: React.ReactNode; variant?: 'primary' | 'outline' | 'ghost' | 'danger'; className?: string; [key: string]: unknown }) {
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45', variant === 'primary' && 'bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90', variant === 'outline' && 'border border-border bg-card text-foreground hover:bg-secondary', variant === 'ghost' && 'text-muted-foreground hover:bg-secondary hover:text-foreground', variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90', className)} {...props}>{children}</button>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-lg font-black text-accent-foreground shadow-sm">ل</span>
    {!compact && <span className="font-display text-xl font-extrabold tracking-tight text-foreground">لنتعلم</span>}
  </Link>;
}

function SpinnerLine({ label = 'جار التحميل' }: { label?: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground" data-testid="status-loading"><span className="h-4 w-4 animate-pulse rounded-full bg-accent" /><span>{label}</span></div>;
}

function ErrorState({ title = 'تعذر تحميل هذه الصفحة', onRetry }: { title?: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center" data-testid="status-error"><p className="font-bold text-destructive">{title}</p><p className="mt-1 text-sm text-muted-foreground">تحقق من اتصالك وحاول مرة أخرى.</p>{onRetry && <Button variant="outline" className="mt-4" onClick={onRetry} data-testid="button-retry">إعادة المحاولة</Button>}</div>;
}

function SubscriptionRequired({ session, adminOnly = false }: { session?: any; adminOnly?: boolean }) {
  const signedIn = Boolean(session?.user);
  const title = adminOnly ? 'هذه الصفحة للمشرفين والمدير فقط' : 'اشترك أولاً لبدء التعلم';
  const description = adminOnly
    ? signedIn ? 'حسابك لا يملك صلاحية لوحة الإدارة. تواصل مع مدير المنصة إذا كنت تحتاج هذه الصلاحية.' : 'سجّل الدخول بحساب المشرف أو المدير للوصول إلى لوحة الإدارة.'
    : signedIn ? 'حسابك مسجل، لكن المحتوى والأدوات التعليمية تفتح بعد تفعيل الاشتراك.' : 'أنشئ حساباً أو سجّل الدخول، ثم أرسل طلب الاشتراك للوصول إلى الدروس والاختبارات ومختبر الذكاء.';
  return <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-16 md:px-8"><div className="w-full rounded-[2rem] border border-accent/30 bg-accent/10 p-8 text-center md:p-12" data-testid={adminOnly ? 'status-admin-forbidden' : 'status-subscription-required'}><span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-accent text-accent-foreground"><LockKeyhole size={28} /></span><p className="mt-6 text-xs font-extrabold uppercase tracking-[.2em] text-accent-foreground">{adminOnly ? 'صلاحية مقيدة' : 'الوصول للمشتركين'}</p><h1 className="mt-3 font-display text-3xl font-extrabold">{title}</h1><p className="mx-auto mt-3 max-w-md leading-8 text-muted-foreground">{description}</p><div className="mt-7 flex flex-wrap justify-center gap-3">{adminOnly ? <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" data-testid="link-admin-forbidden-home">العودة للرئيسية <ArrowLeft size={17} /></Link> : signedIn ? <Link href="/subscribe" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" data-testid="link-required-subscribe">افتح صفحة الاشتراك <ArrowLeft size={17} /></Link> : <><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" data-testid="link-required-login">تسجيل الدخول <LogIn size={17} /></Link><Link href="/register" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-bold" data-testid="link-required-register">إنشاء حساب</Link></>}</div></div></div>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const sessionQuery = useGetSession({ query: { queryKey: getGetSessionQueryKey(), retry: false } });
  const { data: session } = sessionQuery;
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.isAdmin;
  const requiresSubscription = location.startsWith('/stage/') || location.startsWith('/grade/') || location.startsWith('/lesson/') || location.startsWith('/interactive/') || location.startsWith('/english') || location.startsWith('/arabic') || location.startsWith('/ai-lab') || location.startsWith('/admin');
  const requiresAdmin = location.startsWith('/admin');
  const hasAccess = requiresAdmin
    ? Boolean(session?.user?.isAdmin)
    : Boolean(session?.user && (session.user.isAdmin || session.user.subscriptionStatus === 'active'));
  const protectedContent = requiresSubscription
    ? sessionQuery.isLoading
      ? <div className="mx-auto flex min-h-[65vh] max-w-[1380px] items-center justify-center px-4"><SpinnerLine label="نتحقق من حالة الاشتراك..." /></div>
      : hasAccess ? children : <SubscriptionRequired session={session} adminOnly={requiresAdmin} />
    : children;
  const navItems = [{ href: '/', label: 'الرئيسية', icon: HomeIcon }, { href: '/ai-lab', label: 'مختبر الذكاء', icon: BrainCircuit }, ...(isAdmin ? [{ href: '/admin', label: 'لوحة الإدارة', icon: LayoutDashboard }] : [])];
  return <div className="min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-7"><Button variant="ghost" className="md:hidden !px-2" onClick={() => setOpen(!open)} data-testid="button-open-menu"><Menu size={21} /></Button><Brand /><nav className="hidden items-center gap-1 md:flex">{navItems.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground" data-testid={`link-nav-${item.label}`}>{item.label}</Link>)}</nav></div>
        <div className="flex items-center gap-2">{session?.user ? <><span className="hidden text-sm font-semibold text-muted-foreground sm:block" data-testid="text-user-name">مرحباً، {session.user.name}</span><button className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground" onClick={() => navigate('/subscribe')} data-testid="button-user-profile">{session.user.name?.slice(0, 1) || 'ط'}</button></> : <><Link href="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary" data-testid="link-login">دخول</Link><Link href="/register" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90" data-testid="link-register">ابدأ الآن</Link></>}</div>
      </div>
      {open && <nav className="space-y-1 border-t border-border px-4 py-3 md:hidden">{navItems.map((item) => <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold hover:bg-secondary" data-testid={`link-mobile-${item.label}`}><item.icon size={17} />{item.label}</Link>)}</nav>}
    </header>
    <main>{protectedContent}</main>
    <footer className="mt-20 border-t border-border bg-primary text-primary-foreground"><div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8"><Brand /><p className="text-sm text-primary-foreground/65">تعلم واضح. تقدم ملموس. مستقبل يبدأ اليوم.</p><div className="flex gap-4 text-sm text-primary-foreground/70"><Link href="/ai-lab" data-testid="link-footer-ai">مختبر الذكاء</Link><Link href="/subscribe" data-testid="link-footer-subscribe">الاشتراك</Link></div></div></footer>
  </div>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mb-2 text-xs font-extrabold uppercase tracking-[.22em] text-accent">{eyebrow}</div><h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl" data-testid="text-page-title">{title}</h1>{description && <p className="mt-3 max-w-2xl text-base leading-8 text-muted-foreground" data-testid="text-page-description">{description}</p>}</div>{action}</div>;
}

function Home() {
  useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false, staleTime: 30000 } });
  const { data, isLoading, isError, refetch } = useGetCatalog({ query: { queryKey: getGetCatalogQueryKey() } });
  const catalog = data || demoCatalog;
  return <AppShell><section className="surface-grid relative overflow-hidden"><div className="mx-auto grid max-w-[1380px] gap-10 px-4 pb-16 pt-14 md:grid-cols-[1.08fr_.92fr] md:items-center md:px-8 md:pb-24 md:pt-24"><div className="animate-enter"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent-foreground"><span className="h-2 w-2 rounded-full bg-accent" />منصة الطالب السعودي</div><h1 className="font-display max-w-3xl text-5xl font-extrabold leading-[1.16] tracking-[-.04em] text-primary md:text-7xl" data-testid="text-home-hero">طريقك للتعلم<br /><span className="text-accent">أوضح مما تتخيل.</span></h1><p className="mt-6 max-w-xl text-lg leading-9 text-muted-foreground" data-testid="text-home-intro">منهجك مرتب، شرحك قريب، واستعدادك للاختبار يبدأ بخطوة صغيرة كل يوم.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5" data-testid="link-hero-start">ابدأ رحلة التعلم <ArrowLeft size={18} /></Link><Link href="/ai-lab" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-bold text-foreground transition hover:bg-secondary" data-testid="link-hero-ai">جرّب مختبر الذكاء <Sparkles size={17} /></Link></div><div className="mt-10 flex flex-wrap items-center gap-5 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Check size={16} className="text-accent" />شرح مبسط</span><span className="flex items-center gap-2"><Check size={16} className="text-accent" />تدريب مستمر</span><span className="flex items-center gap-2"><Check size={16} className="text-accent" />قياس بثقة</span></div></div><div className="animate-enter animate-enter-delay-2 relative"><div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-2xl shadow-primary/20"><div className="absolute -left-10 -top-10 h-36 w-36 rounded-full border-[20px] border-accent/20" /><div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full border-[28px] border-primary-foreground/5" /><div className="relative"><div className="flex items-center justify-between border-b border-primary-foreground/15 pb-5"><div><p className="text-xs text-primary-foreground/55">مسارك اليوم</p><p className="mt-1 text-xl font-bold">الثاني الثانوي</p></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary"><Target size={21} /></div></div><div className="py-8"><div className="mb-3 flex items-end justify-between"><span className="text-sm text-primary-foreground/65">إنجاز الأسبوع</span><strong className="font-display text-4xl text-accent">68%</strong></div><div className="h-3 overflow-hidden rounded-full bg-primary-foreground/10"><div className="h-full w-[68%] rounded-full bg-accent" /></div></div><div className="grid gap-3"><div className="flex items-center gap-3 rounded-2xl bg-primary-foreground/8 p-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-chart-3/20 text-chart-3"><BookOpen size={19} /></div><div className="flex-1"><p className="text-sm font-bold">المتجهات في المستوى</p><p className="mt-0.5 text-xs text-primary-foreground/50">رياضيات 2 · الدرس 08</p></div><Check size={18} className="text-accent" /></div><div className="flex items-center gap-3 rounded-2xl bg-primary-foreground/8 p-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-chart-4/20 text-chart-4"><ClipboardCheck size={19} /></div><div className="flex-1"><p className="text-sm font-bold">تدريب سريع</p><p className="mt-0.5 text-xs text-primary-foreground/50">8 أسئلة · 12 دقيقة</p></div><ChevronLeft size={18} className="text-primary-foreground/40" /></div></div></div></div></div></div></section><AiToolsSection /><EnglishLearningSection /><section className="mx-auto max-w-[1380px] px-4 py-16 md:px-8 md:py-24"><div className="mb-9 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-accent">مسارات المدرسة</p><h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl" data-testid="text-stages-title">تعلم على مسارك، لا ضدّه</h2></div><Link href="/stage/secondary" className="hidden items-center gap-1 text-sm font-bold text-primary hover:text-accent sm:flex" data-testid="link-all-stages">استكشف المراحل <ArrowLeft size={16} /></Link></div>{isLoading ? <div className="grid gap-4 md:grid-cols-3"><SpinnerLine /><SpinnerLine /><SpinnerLine /></div> : isError && !data ? <ErrorState onRetry={() => refetch()} /> : <div className="grid gap-4 md:grid-cols-3">{catalog.stages.map((stage: any, index: number) => <Link href={`/stage/${stage.id}`} key={stage.id} className={cn('group relative min-h-[255px] overflow-hidden rounded-[1.75rem] border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg', index === 1 && 'md:translate-y-8')} data-testid={`card-stage-${stage.id}`}><div className="absolute -left-10 -top-12 h-44 w-44 rounded-full opacity-20 transition group-hover:scale-125" style={{ background: stage.color }} /><div className="relative flex h-full flex-col justify-between"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl text-xl font-extrabold text-primary" style={{ background: `${stage.color}22` }}>{index + 1}</span><ArrowUpRight className="text-muted-foreground transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" size={21} /></div><div><h3 className="font-display text-2xl font-extrabold">{stage.name}</h3><p className="mt-2 max-w-[235px] text-sm leading-7 text-muted-foreground">{stage.description}</p><p className="mt-5 text-xs font-bold text-muted-foreground">{stage.grades.length} صفوف دراسية <span className="mx-1 text-border">·</span> {stage.grades.reduce((sum: number, g: any) => sum + g.subjects.length, 0)} مواد</p></div></div></Link>)}</div>}</section><section className="bg-secondary/55"><div className="mx-auto grid max-w-[1380px] gap-10 px-4 py-16 md:grid-cols-[.8fr_1.2fr] md:px-8 md:py-24"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-accent">لماذا لنتعلم؟</p><h2 className="mt-3 max-w-md font-display text-3xl font-extrabold leading-tight md:text-5xl">كل ما تحتاجه، في مكان يعرف طريقك.</h2><p className="mt-5 max-w-md leading-8 text-muted-foreground">لا نضيف ضجيجاً جديداً إلى يومك. نرتب المحتوى الذي تعرفه في خطوات تستطيع إنجازها.</p><Link href="/subscribe" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-home-subscribe">شاهد خطط الاشتراك <ArrowLeft size={16} /></Link></div><div className="grid gap-3 sm:grid-cols-2"><Feature icon={BookOpen} title="مناهج مرتبة" text="من المرحلة إلى الدرس، كل شيء في مكانه." /><Feature icon={Lightbulb} title="شرح يوضح الفكرة" text="أمثلة قريبة ولغة تفكك الصعب." /><Feature icon={ClipboardCheck} title="تدريب قبل الاختبار" text="أسئلة قصيرة تقيس فهمك، لا حفظك." /><Feature icon={BrainCircuit} title="مساعد يجيبك" text="فسر، حل، أو اختبر نفسك مع الذكاء." /></div></div></section></AppShell>;
}

function Feature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return <div className="rounded-2xl border border-border/80 bg-card p-5" data-testid={`feature-${title}`}><div className="mb-7 grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent-foreground"><Icon size={19} /></div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p></div>;
}

function AiToolsSection() {
  return <section className="border-y border-border bg-card"><div className="mx-auto max-w-[1380px] px-4 py-10 md:px-8 md:py-14"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-accent">أدوات الذكاء</p><h2 className="mt-2 font-display text-2xl font-extrabold md:text-3xl">حل، اختبر، واستعد بطريقة أذكى</h2></div><Link href="/ai-lab" className="text-sm font-bold text-primary hover:text-accent" data-testid="link-ai-tools-all">فتح مختبر الذكاء <ArrowLeft className="mr-1 inline" size={15} /></Link></div><div className="grid gap-4 md:grid-cols-3"><Link href="/ai-lab?type=exam&topic=اختبار شامل لجميع المواد" className="group rounded-2xl border border-border bg-secondary/45 p-5 transition hover:-translate-y-1 hover:border-accent hover:shadow-md" data-testid="link-home-ai-exam"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-accent"><ClipboardCheck size={20} /></span><h3 className="mt-5 font-display text-xl font-extrabold">مولد اختبار شامل لجميع المواد</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">ينشئ الذكاء الاصطناعي اختباراً متنوعاً من موادك كلها، مع الإجابات والشرح.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">ابدأ التوليد <ArrowLeft size={15} /></span></Link><Link href="/ai-lab?type=homework&camera=1" className="group rounded-2xl border border-border bg-secondary/45 p-5 transition hover:-translate-y-1 hover:border-accent hover:shadow-md" data-testid="link-home-camera"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-foreground"><Camera size={20} /></span><h3 className="mt-5 font-display text-xl font-extrabold">حل واجب بالكاميرا</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">صوّر المسألة أو ارفعها، وسيقرأها الذكاء الاصطناعي ويشرح الحل خطوة بخطوة.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">افتح الكاميرا <ArrowLeft size={15} /></span></Link><div className="rounded-2xl border border-primary/15 bg-primary p-5 text-primary-foreground" data-testid="card-home-qiyas"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary"><Target size={20} /></span><h3 className="mt-5 font-display text-xl font-extrabold">قياس: قدرات وتحصيلي</h3><p className="mt-2 text-sm leading-7 text-primary-foreground/65">اختر قدرات أو تحصيلي، ثم ولّد أسئلة جديدة بالذكاء الاصطناعي.</p><div className="mt-5 flex gap-2"><Link href="/ai-lab?type=qiyas&qiyas=aptitude" className="rounded-xl bg-accent px-3 py-2 text-xs font-extrabold text-accent-foreground" data-testid="link-home-qiyas-aptitude">قدرات</Link><Link href="/ai-lab?type=qiyas&qiyas=achievement" className="rounded-xl border border-primary-foreground/20 px-3 py-2 text-xs font-extrabold text-primary-foreground hover:bg-primary-foreground/10" data-testid="link-home-qiyas-achievement">تحصيلي</Link></div></div></div></div></section>;
}

function EnglishLearningSection() {
  return <section className="bg-primary text-primary-foreground"><div className="mx-auto grid max-w-[1380px] gap-8 px-4 py-12 md:grid-cols-[.8fr_1.2fr] md:items-center md:px-8 md:py-16"><div><span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><Languages size={28} /></span><p className="mt-6 text-xs font-extrabold uppercase tracking-[.22em] text-accent">مسار جديد</p><h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">تعلم الإنجليزية خطوة بخطوة</h2><p className="mt-4 max-w-md leading-8 text-primary-foreground/70">تعرّف على كل حرف، انطق الكلمات، ثم طبّق القواعد الأساسية بتدريبات قصيرة وتصحيح فوري.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/english" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-extrabold text-accent-foreground transition hover:-translate-y-0.5" data-testid="link-home-english">افتح دروس الإنجليزية <ArrowLeft size={17} /></Link><Link href="/arabic" className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/20 px-5 py-3 font-extrabold text-primary-foreground transition hover:bg-primary-foreground/10" data-testid="link-home-arabic">أساسيات العربية <ArrowLeft size={17} /></Link></div></div><div className="rounded-[1.75rem] border border-primary-foreground/15 bg-primary-foreground/8 p-5 md:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">الحروف الإنجليزية</p><p className="mt-1 text-xs text-primary-foreground/55">26 درساً تفاعلياً</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-xl font-black text-primary">A</span></div><div className="mt-6 grid grid-cols-7 gap-2 sm:grid-cols-13">{englishLetterLessons.map((lesson) => <Link href={`/english/${lesson.id}`} key={lesson.id} className="grid h-9 place-items-center rounded-lg border border-primary-foreground/15 text-xs font-extrabold text-primary-foreground/80 transition hover:border-accent hover:bg-accent hover:text-primary" data-testid={`link-home-english-${lesson.symbol}`}>{lesson.symbol}</Link>)}</div><div className="mt-6 flex items-center justify-between rounded-xl bg-primary-foreground/8 px-4 py-3"><span className="flex items-center gap-2 text-sm font-bold"><ListChecks size={17} className="text-accent" />قواعد أساسية</span><span className="text-xs text-primary-foreground/60">{englishGrammarLessons.length} وحدات</span></div><Link href="/arabic" className="mt-3 flex items-center justify-between rounded-xl bg-primary-foreground/8 px-4 py-3 transition hover:bg-primary-foreground/12" data-testid="card-home-arabic"><span className="flex items-center gap-2 text-sm font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm font-black text-primary">ع</span>قواعد القراءة والكتابة العربية</span><span className="text-xs text-primary-foreground/60">{arabicFoundationLessons.length} وحدات</span></Link></div></div></section>;
}

function EnglishPage() {
  return <CatalogShell><PageIntro eyebrow="مسار الإنجليزية" title="ابدأ الإنجليزية من الحرف والكلمة" description="دروس قصيرة للحروف والكلمات الأساسية، ثم قواعد تساعدك على القراءة والكتابة وبناء جمل صحيحة." action={<span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><Languages size={27} /></span>} /><div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm md:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-extrabold">حروف اللغة الإنجليزية</h2><p className="mt-1 text-sm text-muted-foreground">استمع للنطق وتعلّم كلمة جديدة مع كل حرف.</p></div><span className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-extrabold text-accent-foreground">26 درساً</span></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{englishLetterLessons.map((lesson) => <Link href={`/english/${lesson.id}`} key={lesson.id} className="group rounded-2xl border border-border bg-secondary/35 p-4 transition hover:-translate-y-1 hover:border-accent hover:bg-accent/10" data-testid={`card-english-letter-${lesson.symbol}`}><div className="flex items-center justify-between"><span className="font-display text-3xl font-black text-primary">{lesson.symbol}</span><ArrowUpRight size={16} className="text-muted-foreground transition group-hover:text-accent" /></div><p className="mt-3 text-sm font-bold">{lesson.title}</p><p className="mt-1 text-xs text-muted-foreground">{lesson.questions.length} تمارين</p></Link>)}</div></section><section className="rounded-[1.75rem] border border-border bg-secondary/45 p-5 md:p-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-accent"><ListChecks size={20} /></span><div><h2 className="font-display text-2xl font-extrabold">قواعد أساسية</h2><p className="mt-1 text-sm text-muted-foreground">ابنِ جملة صحيحة بالتدريج.</p></div></div><div className="mt-6 space-y-3">{englishGrammarLessons.map((lesson, index) => <Link href={`/english/${lesson.id}`} key={lesson.id} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-accent" data-testid={`card-english-grammar-${index}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 font-black text-accent-foreground">{lesson.symbol}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{lesson.title}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{lesson.description}</span></span><ChevronLeft size={17} className="text-muted-foreground transition group-hover:text-accent" /></Link>)}</div></section></div><WordLessonsSection language="english" /></CatalogShell>;
}

function ArabicPage() {
  return <CatalogShell><PageIntro eyebrow="أساسيات العربية" title="اقرأ واكتب العربية بثقة" description="دروس تفاعلية لكل حرف وكلمة عربية أساسية، ثم قواعد مبسطة للحركات والمدود وبناء الجملة." action={<span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-xl font-black text-accent-foreground">ع</span>} /><section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm md:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-extrabold">الحروف العربية</h2><p className="mt-1 text-sm text-muted-foreground">صورة وفيديو ونطق وتدريب تفاعلي لكل حرف.</p></div><span className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-extrabold text-accent-foreground">28 حرفاً</span></div><div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-7 md:grid-cols-10">{arabicLetterLessons.map((lesson, index) => <Link href={`/arabic/${lesson.id}`} key={lesson.id} className="group grid min-h-20 place-items-center rounded-2xl border border-border bg-secondary/35 p-3 transition hover:-translate-y-1 hover:border-accent hover:bg-accent/10" data-testid={`card-arabic-letter-${index}`}><span className="font-display text-3xl font-black text-primary">{lesson.symbol}</span><span className="text-[11px] font-bold text-muted-foreground">{lesson.questions[0].answer}</span></Link>)}</div></section><WordLessonsSection language="arabic" /><section className="mt-8"><div className="mb-5"><h2 className="font-display text-2xl font-extrabold">قواعد القراءة والكتابة</h2><p className="mt-1 text-sm text-muted-foreground">تدرب على الحركات والمدود والتنوين وبناء الجملة.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{arabicFoundationLessons.map((lesson, index) => <Link href={`/arabic/${lesson.id}`} key={lesson.id} className="group rounded-[1.5rem] border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-accent hover:shadow-md" data-testid={`card-arabic-foundation-${index}`}><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 font-display text-xl font-black text-accent-foreground">{lesson.symbol}</span><ArrowUpRight size={17} className="text-muted-foreground transition group-hover:text-accent" /></div><h2 className="mt-5 font-display text-xl font-extrabold">{lesson.title}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{lesson.description}</p><p className="mt-4 text-xs font-bold text-accent-foreground">{lesson.questions.length} تمارين تفاعلية</p></Link>)}</div></section></CatalogShell>;
}

function WordLessonsSection({ language }: { language: 'english' | 'arabic' }) {
  const lessons = language === 'arabic' ? arabicWordLessons : englishWordLessons;
  const label = language === 'arabic' ? 'كلمات عربية أساسية' : 'كلمات إنجليزية أساسية';
  return <section className="mt-8 rounded-[1.75rem] border border-border bg-secondary/35 p-5 md:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-accent">{language === 'arabic' ? 'اقرأ واكتب' : 'Read & Write'}</p><h2 className="mt-2 font-display text-2xl font-extrabold">{label}</h2><p className="mt-1 text-sm text-muted-foreground">استمع إلى الكلمة والجملة، ثم اكتبها من ذاكرتك.</p></div><span className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-extrabold text-accent-foreground">{lessons.length} كلمات</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{lessons.map((lesson, index) => <Link href={`/${language}/${lesson.id}`} key={lesson.id} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-1 hover:border-accent hover:shadow-sm" data-testid={`card-${language}-word-${index}`}><div className="flex items-center justify-between gap-2"><span className="font-display text-xl font-black text-primary">{lesson.word}</span><Volume2 size={16} className="text-accent transition group-hover:scale-110" /></div><p className="mt-2 text-xs font-bold text-muted-foreground">{lesson.meaning}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{lesson.sentence}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-accent-foreground">ابدأ الدرس <ArrowLeft size={13} /></span></Link>)}</div></section>;
}

const normalizeWriting = (value: string) => value.trim().toLocaleLowerCase('ar-SA').replace(/[\u064B-\u065F\u0670]/g, '').replace(/\s+/g, ' ');

function WordWritingPractice({ lesson, language }: { lesson: EnglishLesson; language: 'english' | 'arabic' }) {
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    setValue('');
    setChecked(false);
  }, [lesson.id]);
  const expected = lesson.writingAnswer || lesson.word || '';
  const correct = normalizeWriting(value) === normalizeWriting(expected);
  return <section className="mt-6 rounded-2xl border border-accent/25 bg-accent/5 p-5" data-testid={`writing-practice-${language}`}><div className="flex items-center gap-3"><PenLine size={19} className="text-accent" /><div><h3 className="font-display text-lg font-extrabold">اكتب الكلمة</h3><p className="mt-1 text-xs text-muted-foreground">اكتب الكلمة التي سمعتها كما هي.</p></div></div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={value} onChange={(event) => { setValue(event.target.value); setChecked(false); }} dir={language === 'arabic' ? 'rtl' : 'ltr'} className="min-h-12 flex-1 rounded-xl border border-border bg-card px-4 text-base font-bold outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" placeholder={language === 'arabic' ? 'اكتب الكلمة بالعربية' : 'Type the word in English'} aria-label="إجابة كتابة الكلمة" data-testid={`input-writing-${language}`} /><Button type="button" onClick={() => setChecked(true)} disabled={!value.trim()} data-testid={`button-check-writing-${language}`}>تحقق <Check size={16} /></Button></div>{checked && <div className={cn('mt-3 rounded-xl p-3 text-sm font-bold', correct ? 'bg-accent/10 text-accent-foreground' : 'bg-destructive/10 text-destructive')} data-testid={`status-writing-${language}`}>{correct ? 'إجابة صحيحة، أحسنت!' : `الإجابة الصحيحة: ${expected}`}</div>}</section>;
}

function EnglishLessonPage() {
  return <LanguageLessonPage language="english" />;
}

function ArabicLessonPage() {
  return <LanguageLessonPage language="arabic" />;
}

function LanguageLessonPage({ language }: { language: 'english' | 'arabic' }) {
  const { englishLessonId = '', arabicLessonId = '' } = useParams<{ englishLessonId?: string; arabicLessonId?: string }>();
  const isArabic = language === 'arabic';
  const lessonId = isArabic ? arabicLessonId : englishLessonId;
  const lesson = (isArabic ? arabicFoundationMap : englishLessonMap).get(lessonId);
  const basePath = isArabic ? '/arabic' : '/english';
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  useEffect(() => {
    setQuestionIndex(0);
    setSelected('');
    setCompleted(false);
    setScore(0);
  }, [lessonId]);
  if (!lesson) return <CatalogShell><ErrorState title={isArabic ? 'درس العربية غير موجود' : 'درس الإنجليزية غير موجود'} /></CatalogShell>;
  const currentQuestion = lesson.questions[questionIndex];
  const isCorrect = selected === currentQuestion.answer;
  const englishWord = englishAlphabet.find(([letter]) => letter === lesson.symbol)?.[2] || lesson.symbol;
  const letterVisual = lesson.kind === 'letter' ? createLetterVisual(lesson.symbol, isArabic ? lesson.title : englishWord, language) : lettersVisual;
  const chooseAnswer = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    if (answer === currentQuestion.answer) setScore((value) => value + 1);
  };
  const nextQuestion = () => {
    if (!isCorrect) return;
    if (questionIndex === lesson.questions.length - 1) setCompleted(true);
    else {
      setQuestionIndex((value) => value + 1);
      setSelected('');
    }
  };
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = isArabic ? 'ar-SA' : 'en-US';
    speech.rate = 0.8;
    window.speechSynthesis.speak(speech);
  };
  const speakLesson = () => speakText(lesson.kind === 'word' ? `${lesson.word}. ${lesson.sentence}` : isArabic ? `${lesson.symbol}. ${lesson.explanation}` : `${lesson.symbol}. ${englishWord}`);
  const speakWord = () => speakText(lesson.word || lesson.symbol);
  const speakSentence = () => speakText(lesson.sentence || lesson.explanation);
  return <CatalogShell>
    <Link href={basePath} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid={`link-${language}-back`}><ChevronRight size={17} />كل دروس {isArabic ? 'العربية' : 'الإنجليزية'}</Link>
    <PageIntro eyebrow={lesson.kind === 'letter' ? (isArabic ? 'حرف عربي' : 'حرف إنجليزي') : lesson.kind === 'word' ? (isArabic ? 'كلمة عربية' : 'كلمة إنجليزية') : (isArabic ? 'قاعدة عربية' : 'قاعدة إنجليزية')} title={lesson.title} description={lesson.description} action={<div className="flex flex-wrap gap-2">{lesson.kind === 'word' && <><Button variant="outline" onClick={speakWord} data-testid={`button-speak-word-${language}`}><Volume2 size={17} />استمع للكلمة</Button><Button variant="outline" onClick={speakSentence} data-testid={`button-speak-sentence-${language}`}><Volume2 size={17} />استمع للجملة</Button></>}<Button variant="outline" onClick={speakLesson} data-testid={`button-speak-${language}`}><Volume2 size={17} />استمع للدرس</Button><span className="grid h-12 min-w-12 place-items-center rounded-xl bg-accent px-3 text-xl font-black text-accent-foreground">{lesson.symbol}</span></div>} />
    <div className="grid gap-7 lg:grid-cols-[1fr_330px]">
      <main className="space-y-6">
        {lesson.kind === 'letter' && <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm"><img src={letterVisual} alt={`صورة تعليمية للحرف ${lesson.symbol}`} className="h-auto w-full bg-secondary object-cover" data-testid={`img-${language}-letter`} /><div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4"><div><p className="text-sm font-bold">صورة الحرف</p><p className="mt-1 text-xs text-muted-foreground">شاهد الشكل ثم استمع إلى النطق.</p></div><span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent-foreground">{isArabic ? lesson.title : englishWord}</span></div><video controls playsInline preload="metadata" poster={letterVisual} className="w-full bg-primary" data-testid={`video-${language}-letter`}><source src={lettersVideo} type="video/mp4" />متصفحك لا يدعم تشغيل الفيديو.</video></section>}
        <section className="rounded-[1.75rem] border border-border bg-primary p-6 text-primary-foreground md:p-8"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-accent">شرح مبسط</p><p className="mt-4 text-lg leading-9">{lesson.explanation}</p></section>
        <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-accent">تدريب تفاعلي</p><h2 className="mt-2 font-display text-2xl font-extrabold">{completed ? 'أحسنت! أنهيت الدرس' : currentQuestion.prompt}</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground">سؤال {questionIndex + 1} من {lesson.questions.length}</span></div>{completed ? <div className="mt-7 rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center" data-testid={`status-${language}-complete`}><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><Check size={26} /></span><p className="mt-4 font-display text-3xl font-extrabold text-primary">{score} / {lesson.questions.length}</p><p className="mt-2 text-sm leading-7 text-muted-foreground">أكملت التدريب. انتقل إلى درس آخر لتثبيت اللغة.</p><Button className="mt-5" onClick={() => { setQuestionIndex(0); setSelected(''); setCompleted(false); setScore(0); }} data-testid={`button-restart-${language}`}>أعد التدريب <Zap size={16} /></Button></div> : <><div className="mt-6 grid gap-3 sm:grid-cols-3">{currentQuestion.options.map((option) => <button type="button" key={option} onClick={() => chooseAnswer(option)} aria-pressed={selected === option} className={cn('min-h-16 rounded-2xl border px-4 py-4 text-center text-base font-extrabold transition', selected === option && isCorrect && 'border-accent bg-accent/15 text-accent-foreground', selected === option && !isCorrect && 'border-destructive bg-destructive/10 text-destructive', !selected && 'border-border bg-secondary/35 hover:-translate-y-0.5 hover:border-accent', selected && selected !== option && 'border-border bg-card')}>{option}</button>)}</div>{selected && <div className={cn('mt-5 rounded-2xl p-4 text-sm leading-7', isCorrect ? 'bg-accent/10 text-accent-foreground' : 'bg-destructive/10 text-destructive')} data-testid={`status-${language}-answer`}><p className="font-extrabold">{isCorrect ? 'إجابة صحيحة!' : 'حاول مرة أخرى'}</p><p className="mt-1">{isCorrect ? currentQuestion.hint : 'راجع الشرح ثم اختر إجابة أخرى.'}</p></div>}<div className="mt-6 flex justify-end"><Button onClick={nextQuestion} disabled={!isCorrect} data-testid={`button-next-${language}`}>{questionIndex === lesson.questions.length - 1 ? 'إنهاء الدرس' : 'السؤال التالي'} <ArrowLeft size={17} /></Button></div></>}</section>
        {lesson.kind === 'word' && <WordWritingPractice lesson={lesson} language={language} />}
      </main>
      <aside className="h-fit rounded-[1.5rem] border border-border bg-card p-5"><p className="font-bold">دروس قريبة</p><div className="mt-4 grid grid-cols-4 gap-2">{(isArabic ? arabicLessons : englishLessons).map((item) => <Link href={`${basePath}/${item.id}`} key={item.id} className={cn('grid h-9 place-items-center rounded-lg border text-xs font-bold transition hover:border-accent hover:bg-accent/10', item.id === lesson.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/45')} data-testid={`link-related-${language}-${item.symbol}`}>{item.symbol}</Link>)}</div><Link href={basePath} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs font-extrabold text-primary">عرض كل الوحدات <ArrowLeft size={14} /></Link></aside>
    </div>
  </CatalogShell>;
}

function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[.9fr_1.1fr]"><div className="hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><Brand /><div className="relative"><div className="absolute -right-8 -top-14 h-40 w-40 rounded-full border-[22px] border-accent/25" /><p className="relative text-sm font-bold text-accent">لنتعلم بثقة</p><h2 className="relative mt-5 max-w-md font-display text-5xl font-extrabold leading-tight">المعلومة حين ترتب، تصبح أقرب.</h2><p className="relative mt-5 max-w-sm leading-8 text-primary-foreground/65">خطوة يومية واضحة تصنع فرقاً كبيراً قبل نهاية الفصل.</p></div><p className="text-xs text-primary-foreground/45">منصة تعليمية للطلاب في المملكة العربية السعودية</p></div><div className="flex items-center justify-center p-5 md:p-12"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><Brand /></div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-accent">أهلاً بك</p><h1 className="mt-3 font-display text-4xl font-extrabold" data-testid="text-auth-title">{title}</h1><p className="mt-3 text-muted-foreground">{subtitle}</p>{children}</div></div></div>;
}

function Login() {
  const [, navigate] = useLocation();
  const loginMutation = useLogin();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  return <AuthLayout title="سجّل دخولك" subtitle="أكمل من حيث توقفت، فمسارك ما زال ينتظرك."><form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); loginMutation.mutate({ data: { email, password } }, { onSuccess: () => navigate('/') }); }} data-testid="form-login"><Field label="البريد الإلكتروني" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="name@example.com" testId="input-login-email" /><Field label="كلمة المرور" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="ثمانية أحرف على الأقل" testId="input-login-password" /><div className="flex justify-end"><button type="button" className="text-xs font-bold text-accent-foreground hover:underline" onClick={() => alert('سيتم تفعيل استعادة كلمة المرور قريباً')} data-testid="button-forgot-password">نسيت كلمة المرور؟</button></div>{loginMutation.isError && <p className="rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive" data-testid="status-login-error">بيانات الدخول غير صحيحة. حاول مرة أخرى.</p>}<Button type="submit" className="w-full py-3.5" disabled={loginMutation.isPending} data-testid="button-submit-login">{loginMutation.isPending ? 'جار التحقق...' : 'دخول إلى حسابي'} <ArrowLeft size={17} /></Button></form><p className="mt-8 text-center text-sm text-muted-foreground">ليس لديك حساب؟ <Link href="/register" className="font-bold text-primary hover:text-accent" data-testid="link-to-register">أنشئ حساباً جديداً</Link></p></AuthLayout>;
}

function Register() {
  const [, navigate] = useLocation(); const mutation = useRegister();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  return <AuthLayout title="ابدأ من هنا" subtitle="حساب واحد يفتح لك طريق التعلم كله."><form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ data: { name, email, password } }, { onSuccess: () => navigate('/') }); }} data-testid="form-register"><Field label="الاسم الكامل" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="مثال: سارة العتيبي" testId="input-register-name" /><Field label="البريد الإلكتروني" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="name@example.com" testId="input-register-email" /><Field label="كلمة المرور" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="ثمانية أحرف على الأقل" testId="input-register-password" />{mutation.isError && <p className="rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive" data-testid="status-register-error">تعذر إنشاء الحساب. تأكد من البيانات وحاول ثانية.</p>}<Button type="submit" className="w-full py-3.5" disabled={mutation.isPending} data-testid="button-submit-register">{mutation.isPending ? 'جار إنشاء الحساب...' : 'أنشئ حسابي'} <ArrowLeft size={17} /></Button></form><p className="mt-8 text-center text-sm text-muted-foreground">لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-primary hover:text-accent" data-testid="link-to-login">سجّل الدخول</Link></p></AuthLayout>;
}

function Field({ label, testId, ...props }: { label: string; testId: string; [key: string]: unknown }) {
  return <label className="block" data-testid={`field-${testId}`}><span className="mb-2 block text-sm font-bold">{label}</span><input className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" data-testid={testId} {...props} /></label>;
}

function CatalogShell({ children }: { children: React.ReactNode }) {
  return <AppShell><div className="mx-auto max-w-[1380px] px-4 py-10 md:px-8 md:py-16">{children}</div></AppShell>;
}

function StagePage() {
  const { stageId } = useParams<{ stageId: string }>();
  const { data } = useGetCatalog({ query: { queryKey: getGetCatalogQueryKey() } });
  const catalog = data || demoCatalog; const stage = catalog.stages.find((item: any) => item.id === stageId) || catalog.stages[0];
  return <CatalogShell><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-stage-back"><ChevronRight size={17} />كل المراحل</Link><PageIntro eyebrow="مسارك الدراسي" title={stage.name} description={stage.description} action={<div className="rounded-2xl border border-border bg-card px-4 py-3 text-center"><p className="text-2xl font-extrabold text-primary">{stage.grades.length}</p><p className="text-xs text-muted-foreground">صفوف دراسية</p></div>} /><div className="grid gap-4 md:grid-cols-2">{stage.grades.map((grade: any, index: number) => <Link href={`/grade/${grade.id}`} key={grade.id} className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent hover:shadow-md" data-testid={`card-grade-${grade.id}`}><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-extrabold" style={{ background: `${stage.color}1c`, color: stage.color }}>{String(index + 1).padStart(2, '0')}</span><div><h2 className="font-display text-xl font-extrabold">{grade.name}</h2><p className="mt-1 text-sm text-muted-foreground">{grade.subjects.length} مواد متاحة للتعلم</p></div></div><ChevronLeft size={20} className="text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-accent" /></Link>)}</div></CatalogShell>;
}

function GradePage() {
  const { gradeId } = useParams<{ gradeId: string }>(); const { data } = useGetCatalog({ query: { queryKey: getGetCatalogQueryKey() } });
  const catalog = data || demoCatalog; const grade = catalog.stages.flatMap((s: any) => s.grades).find((g: any) => g.id === gradeId) || catalog.stages[0].grades[0];
  const subjects = grade.subjects;
  return <CatalogShell><Link href={`/stage/${catalog.stages.find((s: any) => s.grades.some((g: any) => g.id === grade.id))?.id || 'primary'}`} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-grade-back"><ChevronRight size={17} />المرحلة الدراسية</Link><PageIntro eyebrow="الصف الدراسي" title={grade.name} description={grade.id === 'p1' ? 'تعلم الحروف والرياضيات من خلال أنشطة قصيرة وتدريب تفاعلي.' : 'اختر المادة وابدأ بالشرح الذي يناسب خطوتك الحالية.'} action={<Link href="/ai-lab" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground shadow-sm" data-testid="link-grade-ai"><Sparkles size={17} />اسأل المساعد</Link>} /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((subject: any) => <SubjectCard key={subject.id} subject={subject} gradeId={grade.id} />)}</div>{grade.id !== 'p1' && <section className="mt-10 rounded-[1.75rem] bg-primary p-6 text-primary-foreground md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold text-accent">استعدادك للاختبار</p><h2 className="mt-2 font-display text-2xl font-extrabold">تدريب قياس، بتركيز أكبر</h2><p className="mt-2 max-w-xl text-sm leading-7 text-primary-foreground/65">أسئلة بوقت محدد، شرح للإجابة، وقياس لتقدمك في كل محاولة.</p></div><Link href="/ai-lab" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground" data-testid="link-qiyas-cta">ابدأ تدريب قياس <ArrowLeft size={17} /></Link></div></section>}</CatalogShell>;
}

function SubjectCard({ subject, gradeId }: { subject: any; gradeId?: string }) {
  const sections = subject.sections?.length ? subject.sections : [{ type: 'explanations', title: 'شرح الدروس', count: subject.lessonCount }, { type: 'homework', title: 'الواجبات', count: Math.max(5, Math.round(subject.lessonCount * .65)) }, { type: 'exams', title: 'اختبارات قصيرة', count: Math.max(3, Math.round(subject.lessonCount * .4)) }];
  const sectionHref = (section: any) => {
    if (gradeId === 'p1') {
      const topic = section.title === 'الأرقام' ? 'numbers' : section.title === 'الجمع' ? 'addition' : section.title === 'الطرح' ? 'subtraction' : 'letters';
      const firstLesson = lessonsForSubject(subject.id).find((lesson) => lesson.topic === topic) || lessonsForSubject(subject.id)[0];
      if (firstLesson) return `/interactive/${firstLesson.id}`;
    }
    if (section.type === 'qiyas') return `/ai-lab?type=qiyas&qiyas=aptitude&subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(`اختبار ${section.title}`)}`;
    if (section.type === 'homework') return `/ai-lab?type=homework&subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent('اختبار مشابه للواجب')}`;
    return `/ai-lab?type=exam&subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(`اختبار تدريبي من قسم ${section.title}`)}`;
  };
  return <div className="group rounded-[1.5rem] border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" data-testid={`card-subject-${subject.id}`}><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-xl font-extrabold text-primary">{subject.icon}</span><span className="rounded-full bg-accent/12 px-2.5 py-1 text-xs font-bold text-accent-foreground">{subject.lessonCount} درس</span></div><h2 className="mt-5 font-display text-2xl font-extrabold" data-testid={`text-subject-name-${subject.id}`}>{subject.name}</h2><div className="mt-5 space-y-2 border-t border-border pt-4">{sections.map((section: any) => <Link href={sectionHref(section)} key={section.type + section.title} className="flex items-center justify-between rounded-xl p-2 text-sm transition hover:bg-secondary" data-testid={`link-section-${subject.id}-${section.type}-${section.title}`}><span className="flex items-center gap-2 font-semibold text-muted-foreground"><SectionIcon type={section.type} size={15} />{section.title}</span><span className="text-xs font-bold text-accent-foreground">{gradeId === 'p1' ? 'ابدأ الدرس' : 'ولّد اختباراً'}</span></Link>)}</div>{gradeId === 'p1' && <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/10 p-4" data-testid={`card-interactive-${subject.id}`}><p className="text-xs font-extrabold text-accent-foreground">تعلم تفاعلي</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{subject.id === 'letters-p1' ? 'استمع للحرف، تعرّف عليه، ثم اختر الإجابة الصحيحة.' : 'تعلّم بالمحاولة مع أنشطة الأرقام والعمليات الحسابية.'}</p><Link href={sectionHref(sections[0])} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground" data-testid={`link-interactive-${subject.id}`}>ابدأ التعلم <ArrowLeft size={14} /></Link></div>}{subject.name.includes('قدرات') && <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/10 p-4" data-testid="card-qiyas-guide"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><FileText size={18} /></span><div><p className="text-xs font-extrabold text-accent-foreground">كتاب مرجعي</p><p className="mt-1 text-sm font-bold leading-6">الدليل الإرشادي لاختبار القدرات العامة</p><p className="mt-1 text-xs leading-5 text-muted-foreground">30 صفحة من هيئة تقويم التعليم والتدريب</p></div></div><Link href="/qiyas-guide" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-extrabold text-primary hover:bg-background" data-testid="link-qiyas-guide">فتح الكتاب <ArrowLeft size={14} /></Link></div>}<Link href={`/ai-lab?type=exam&subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(`اختبار شامل في ${subject.name}`)}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground" data-testid={`link-start-subject-${subject.id}`}>{gradeId === 'p1' ? 'تدرب مع المساعد' : 'ولّد اختبار المادة'} <Sparkles size={16} /></Link></div>;
}

function SectionIcon({ type, size = 17 }: { type: string; size?: number }) { const props = { size }; if (type === 'homework') return <PenLine {...props} />; if (type === 'exams') return <ClipboardCheck {...props} />; if (type === 'qiyas') return <Target {...props} />; return <BookOpen {...props} />; }

function QiyasGuidePage() {
  return <CatalogShell><Link href="/grade/s3" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-qiyas-guide-back"><ChevronRight size={17} />العودة إلى قسم القدرات</Link><PageIntro eyebrow="مرجع قسم القدرات" title="الدليل الإرشادي لاختبار القدرات العامة" description="مرجع بصري من 30 صفحة يساعدك على فهم طبيعة الاختبار والاستعداد له." action={<Link href="/ai-lab?type=qiyas&qiyas=aptitude" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground shadow-sm" data-testid="link-qiyas-guide-practice"><Target size={17} />تدرب على القدرات</Link>} /><div className="grid gap-7 lg:grid-cols-[1fr_330px]"><article className="overflow-hidden rounded-[1.75rem] border border-border bg-card p-3 shadow-sm md:p-5"><iframe src={qiyasGuideUrl} title="الدليل الإرشادي لاختبار القدرات العامة" className="h-[75vh] min-h-[620px] w-full rounded-2xl border border-border bg-secondary" data-testid="iframe-qiyas-guide" /></article><aside className="h-fit space-y-4"><div className="rounded-[1.5rem] bg-primary p-6 text-primary-foreground"><p className="text-xs font-bold text-accent">بيانات الكتاب</p><h2 className="mt-3 font-display text-2xl font-extrabold">دليل القدرات العامة</h2><div className="mt-5 space-y-3 text-sm text-primary-foreground/75"><p className="flex items-center justify-between gap-3"><span>عدد الصفحات</span><strong className="text-primary-foreground">30</strong></p><p className="flex items-center justify-between gap-3"><span>الجهة</span><strong className="text-primary-foreground">هيئة تقويم التعليم والتدريب</strong></p><p className="flex items-center justify-between gap-3"><span>نوع المحتوى</span><strong className="text-primary-foreground">دليل إرشادي</strong></p></div><a href={qiyasGuideUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-extrabold text-accent-foreground" data-testid="link-qiyas-guide-new-tab">فتح في نافذة جديدة <ArrowUpRight size={16} /></a></div><div className="rounded-[1.5rem] border border-border bg-card p-6"><p className="font-bold">كيف تستخدمه؟</p><ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground"><li className="flex gap-2"><Check className="mt-1 shrink-0 text-accent" size={15} />اقرأ الدليل قبل بدء التدريب.</li><li className="flex gap-2"><Check className="mt-1 shrink-0 text-accent" size={15} />راجع المهارة التي أخطأت فيها.</li><li className="flex gap-2"><Check className="mt-1 shrink-0 text-accent" size={15} />استخدم مولد القدرات لتطبيق ما تعلمته.</li></ul></div></aside></div></CatalogShell>;
}

const interactiveMedia = {
  letters: { image: lettersVisual, video: lettersVideo, label: 'الحروف' },
  numbers: { image: numbersVisual, video: numbersVideo, label: 'الأرقام' },
  addition: { image: operationsVisual, video: operationsVideo, label: 'الجمع' },
  subtraction: { image: operationsVisual, video: operationsVideo, label: 'الطرح' },
} as const;

const interactiveTopicLabels = { letters: 'الحروف', numbers: 'الأرقام', addition: 'الجمع', subtraction: 'الطرح' } as const;

function InteractiveLessonPage() {
  const { interactiveLessonId = '' } = useParams<{ interactiveLessonId: string }>();
  const lesson = interactiveLessonMap.get(interactiveLessonId);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  if (!lesson) return <CatalogShell><ErrorState title="لم نعثر على هذا الدرس التفاعلي" /></CatalogShell>;

  const media = interactiveMedia[lesson.topic];
  const currentQuestion = lesson.questions[questionIndex];
  const subjectLessons = lessonsForSubject(lesson.subjectId);
  const groupedTopics = Array.from(new Set(subjectLessons.map((item) => item.topic)));
  const isCorrect = selected === currentQuestion.answer;
  const chooseAnswer = (option: string) => {
    setSelected(option);
    if (option === currentQuestion.answer && selected !== currentQuestion.answer) setScore((value) => value + 1);
  };
  const nextQuestion = () => {
    if (!isCorrect) return;
    if (questionIndex === lesson.questions.length - 1) {
      setCompleted(true);
      return;
    }
    setQuestionIndex((value) => value + 1);
    setSelected('');
  };
  const restart = () => {
    setQuestionIndex(0);
    setSelected('');
    setScore(0);
    setCompleted(false);
  };
  const speakLesson = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(`${lesson.title}. ${lesson.description}`);
    speech.lang = 'ar-SA';
    speech.rate = 0.8;
    window.speechSynthesis.speak(speech);
  };
  return <CatalogShell><Link href="/grade/p1" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-interactive-back"><ChevronRight size={17} />العودة إلى الصف الأول</Link><PageIntro eyebrow={`درس تفاعلي · ${lesson.subjectName}`} title={lesson.title} description={lesson.description} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={speakLesson} data-testid="button-speak-lesson"><Volume2 size={17} />استمع للشرح</Button><span className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-extrabold text-accent-foreground">{lesson.symbol}</span></div>} /><div className="grid gap-7 lg:grid-cols-[1fr_330px]"><main className="space-y-6"><section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm"><button type="button" className="block w-full cursor-zoom-in bg-secondary text-right" onClick={() => setImageZoomed((value) => !value)} aria-label={imageZoomed ? 'تصغير الصورة' : 'تكبير الصورة'}><img src={media.image} alt={`صورة تعليمية عن ${media.label}`} className={cn('h-auto w-full object-cover transition duration-300', imageZoomed ? 'max-h-[720px]' : 'max-h-[360px]')} data-testid="img-interactive-lesson" /></button><div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4"><div><p className="text-sm font-bold">صورة الدرس</p><p className="mt-1 text-xs text-muted-foreground">اضغط على الصورة لتكبيرها</p></div><span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent-foreground">{media.label}</span></div></section><section className="rounded-[1.75rem] border border-border bg-card p-4 shadow-sm md:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-accent">مقطع قصير</p><h2 className="mt-1 font-display text-xl font-extrabold">شاهد الفكرة بصرياً</h2></div><span className="text-xs text-muted-foreground">يمكنك الإيقاف والإعادة</span></div><video key={media.video} controls playsInline preload="metadata" className="w-full rounded-2xl bg-primary" poster={media.image} data-testid="video-interactive-lesson"><source src={media.video} type="video/mp4" />متصفحك لا يدعم تشغيل الفيديو.</video></section><section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-accent">تحدي صغير</p><h2 className="mt-2 font-display text-2xl font-extrabold">{completed ? 'أحسنت! أنهيت النشاط' : currentQuestion.prompt}</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground">سؤال {questionIndex + 1} من {lesson.questions.length}</span></div>{completed ? <div className="mt-7 rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center" data-testid="status-interactive-complete"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><Check size={26} /></span><p className="mt-4 font-display text-3xl font-extrabold text-primary">{score} / {lesson.questions.length}</p><p className="mt-2 text-sm leading-7 text-muted-foreground">أكملت الدرس بنجاح. جرّب درساً آخر أو أعد النشاط لتثبيت المعلومة.</p><Button className="mt-5" onClick={restart} data-testid="button-restart-interactive">أعد النشاط <Zap size={16} /></Button></div> : <><div className="mt-6 grid gap-3 sm:grid-cols-3">{currentQuestion.options.map((option) => <button type="button" key={option} onClick={() => chooseAnswer(option)} aria-pressed={selected === option} className={cn('min-h-16 rounded-2xl border px-4 py-4 text-center text-lg font-extrabold transition', selected === option && isCorrect && 'border-accent bg-accent/15 text-accent-foreground', selected === option && !isCorrect && 'border-destructive bg-destructive/10 text-destructive', !selected && 'border-border bg-secondary/35 hover:-translate-y-0.5 hover:border-accent', selected && selected !== option && 'border-border bg-card')}>{option}</button>)}</div>{selected && <div className={cn('mt-5 rounded-2xl p-4 text-sm leading-7', isCorrect ? 'bg-accent/10 text-accent-foreground' : 'bg-destructive/10 text-destructive')} data-testid="status-interactive-answer"><p className="font-extrabold">{isCorrect ? 'إجابة صحيحة، ممتاز!' : 'حاول مرة أخرى'}</p><p className="mt-1">{isCorrect ? currentQuestion.hint : 'اختر بطاقة أخرى، وفكّر في الصورة أو المقطع قبل الإجابة.'}</p></div>}<div className="mt-6 flex justify-end"><Button onClick={nextQuestion} disabled={!isCorrect} data-testid="button-next-interactive">{questionIndex === lesson.questions.length - 1 ? 'إنهاء الدرس' : 'السؤال التالي'} <ArrowLeft size={17} /></Button></div></>}</section></main><aside className="h-fit space-y-4"><div className="rounded-[1.5rem] bg-primary p-6 text-primary-foreground"><p className="text-xs font-bold text-accent">مسار الصف الأول</p><h2 className="mt-3 font-display text-2xl font-extrabold">{lesson.subjectName}</h2><div className="mt-5 flex items-center justify-between text-sm text-primary-foreground/70"><span>تقدم الدرس</span><strong className="text-primary-foreground">{completed ? '100%' : `${Math.round((questionIndex / lesson.questions.length) * 100)}%`}</strong></div><div className="mt-3 h-2 rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${completed ? 100 : (questionIndex / lesson.questions.length) * 100}%` }} /></div></div><div className="rounded-[1.5rem] border border-border bg-card p-5"><p className="font-bold">دروس أخرى</p><div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1">{groupedTopics.map((topic) => <div key={topic}><p className="mb-2 text-xs font-extrabold text-accent-foreground">{interactiveTopicLabels[topic]}</p><div className="grid grid-cols-4 gap-2">{subjectLessons.filter((item) => item.topic === topic).map((item) => <Link href={`/interactive/${item.id}`} key={item.id} className={cn('grid h-9 place-items-center rounded-lg border text-xs font-bold transition hover:border-accent hover:bg-accent/10', item.id === lesson.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/45')} data-testid={`link-related-${item.id}`}>{item.symbol}</Link>)}</div></div>)}</div></div></aside></div></CatalogShell>;
}

function LessonPage() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  const { data, isLoading, isError, refetch } = useGetLesson(lessonId, { query: { queryKey: getGetLessonQueryKey(lessonId), enabled: Boolean(lessonId) } });
  const lesson: any = data || { id: lessonId, title: 'المتجهات في المستوى', subjectName: 'رياضيات 2', content: 'في هذا الدرس نتعرف على المتجهات وكيف نمثلها ونستخدمها في حل المسائل.', locked: true };
  return <CatalogShell><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-lesson-back"><ChevronRight size={17} />العودة للمسار</Link>{isLoading ? <SpinnerLine label="نجهز الدرس..." /> : isError && !data ? <ErrorState onRetry={() => refetch()} /> : <div className="grid gap-8 lg:grid-cols-[1fr_330px]"><article className="rounded-[1.75rem] border border-border bg-card p-6 md:p-10"><div className="flex items-center gap-2 text-sm font-bold text-accent"><BookOpen size={16} />{lesson.subjectName}</div><h1 className="mt-4 font-display text-4xl font-extrabold leading-tight" data-testid="text-lesson-title">{lesson.title}</h1><div className="mt-6 h-px bg-border" />{lesson.locked ? <div className="relative mt-8 overflow-hidden rounded-2xl bg-secondary p-7 text-center"><div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(hsl(var(--accent) / .17) 1px, transparent 1px)', backgroundSize: '18px 18px' }} /><div className="relative"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-card text-accent shadow-sm"><LockKeyhole size={24} /></span><h2 className="mt-5 font-display text-2xl font-extrabold">هذا الدرس ضمن اشتراكك القادم</h2><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">افتح الشرح الكامل، الأمثلة، والتدريب مع اشتراك لنتعلم.</p><Link href="/subscribe" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" data-testid="link-lesson-subscribe">اختر خطة مناسبة <ArrowLeft size={17} /></Link></div></div> : <div className="prose prose-lg mt-8 max-w-none leading-9" data-testid="text-lesson-content"><p>{lesson.content}</p></div>}</article><aside className="space-y-4"><div className="rounded-[1.5rem] border border-border bg-primary p-6 text-primary-foreground"><p className="text-xs font-bold text-accent">تقدمك في المادة</p><p className="mt-4 font-display text-4xl font-extrabold">12%</p><div className="mt-3 h-2 rounded-full bg-primary-foreground/15"><div className="h-full w-[12%] rounded-full bg-accent" /></div><p className="mt-3 text-xs text-primary-foreground/60">درس واحد من 8 مكتمل</p></div><div className="rounded-[1.5rem] border border-border bg-card p-6"><p className="font-bold">ماذا ستتعلم؟</p><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground"><li className="flex gap-2"><Check className="mt-1 shrink-0 text-accent" size={15} />فهم الفكرة من البداية</li><li className="flex gap-2"><Check className="mt-1 shrink-0 text-accent" size={15} />تطبيق على مثال واقعي</li><li className="flex gap-2"><Check className="mt-1 shrink-0 text-accent" size={15} />تدريب قصير بعد الشرح</li></ul></div></aside></div>}</CatalogShell>;
}

function Subscribe() {
  const subscription = useGetSubscription({ query: { queryKey: getGetSubscriptionQueryKey(), retry: false } });
  const settings = useGetSettings({ query: { queryKey: getGetSettingsQueryKey(), retry: false } });
  const submit = useSubmitSubscription(); const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly'); const [receiptName, setReceiptName] = useState(''); const [sent, setSent] = useState(false);
  const prices = settings.data || { monthlyPrice: 30, yearlyPrice: 299, bankName: 'Urpay', accountName: 'خالد العتيبي', iban: 'SA7280206153985222121018' };
  const current = subscription.data as any;
  const submitForm = (e: any) => { e.preventDefault(); if (!receiptName.trim()) return; submit.mutate({ data: { plan, receiptName: receiptName.trim() } }, { onSuccess: () => setSent(true) }); };
  return <CatalogShell><PageIntro eyebrow="اشتراك لنتعلم" title="افتح طريقاً أهدأ للتعلم" description="اشترك شهرياً أو سنوياً، وأكمل دروسك وتدريباتك بلا تشتت." />{(sent || current?.status === 'pending') ? <div className="mx-auto max-w-2xl rounded-[2rem] border border-accent/30 bg-accent/10 p-8 text-center md:p-12" data-testid="status-subscription-pending"><span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-accent text-accent-foreground"><Clock3 size={28} /></span><h2 className="mt-6 font-display text-3xl font-extrabold">طلبك قيد المراجعة</h2><p className="mx-auto mt-3 max-w-md leading-8 text-muted-foreground">وصلنا إيصالك. سنراجع التحويل ونفعّل حسابك خلال وقت قصير.</p><p className="mt-6 text-sm font-bold text-primary">يمكنك إغلاق الصفحة بأمان</p></div> : <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]"><div><div className="grid gap-4 sm:grid-cols-2"><PlanCard selected={plan === 'monthly'} onClick={() => setPlan('monthly')} title="شهري" price={prices.monthlyPrice} suffix="كل شهر" text="مرونة تبدأ بها الآن." testId="card-plan-monthly" /><PlanCard selected={plan === 'yearly'} onClick={() => setPlan('yearly')} title="سنوي" price={prices.yearlyPrice} suffix="كل سنة" text="وفر أكثر واستمر براحة." featured testId="card-plan-yearly" /></div><div className="mt-5 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">طريقة التحويل البنكي</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">حوّل قيمة الخطة إلى الحساب التالي، ثم أرفق صورة الإيصال.</p><div className="mt-5 grid gap-3 text-sm"><CopyRow label="اسم البنك" value={prices.bankName} /><CopyRow label="اسم الحساب" value={prices.accountName} /><CopyRow label="الآيبان" value={prices.iban} /></div></div></div><form onSubmit={submitForm} className="h-fit rounded-[1.75rem] border border-border bg-card p-6 shadow-sm" data-testid="form-subscription"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><ReceiptText size={19} /></span><div><h2 className="font-bold">إرسال الإيصال</h2><p className="text-xs text-muted-foreground">الخطة: {plan === 'yearly' ? 'سنوية' : 'شهرية'} · {money(plan === 'yearly' ? prices.yearlyPrice : prices.monthlyPrice)}</p></div></div><label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-secondary/45 p-8 text-center hover:border-accent" data-testid="label-upload-receipt"><Upload className="text-accent" size={25} /><span className="mt-3 text-sm font-bold">{receiptName || 'اختر صورة أو ملف الإيصال'}</span><span className="mt-1 text-xs text-muted-foreground">PNG, JPG أو PDF</span><input className="sr-only" type="file" accept="image/*,.pdf" onChange={(e: any) => setReceiptName(e.target.files?.[0]?.name || '')} data-testid="input-receipt" /></label>{!receiptName && <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">إرفاق الإيصال مطلوب قبل إرسال الطلب.</p>}{submit.isError && <p className="mt-4 text-sm font-semibold text-destructive" data-testid="status-subscription-error">تعذر إرسال الطلب، حاول مرة أخرى.</p>}<Button className="mt-5 w-full py-3.5" type="submit" disabled={submit.isPending || !receiptName.trim()} data-testid="button-submit-subscription">{submit.isPending ? 'جار الإرسال...' : 'أرسل طلب الاشتراك'} <ArrowLeft size={17} /></Button><p className="mt-4 text-center text-xs leading-6 text-muted-foreground">بإرسال الطلب، تؤكد أن بيانات التحويل صحيحة.</p></form></div>}</CatalogShell>;
}

function PlanCard({ selected, onClick, title, price, suffix, text, featured, testId }: any) {
  return <button type="button" onClick={onClick} className={cn('relative rounded-2xl border p-5 text-right transition', selected ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-card hover:border-accent')} data-testid={testId}>{featured && <span className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold text-accent-foreground">الأكثر اختياراً</span>}<div className="flex items-center justify-between"><span className="font-bold">{title}</span><span className={cn('grid h-5 w-5 place-items-center rounded-full border', selected ? 'border-accent bg-accent text-primary' : 'border-input')}>{selected && <Check size={13} />}</span></div><p className="mt-5 font-display text-3xl font-extrabold">{money(price)}</p><p className={cn('mt-1 text-xs', selected ? 'text-primary-foreground/60' : 'text-muted-foreground')}>{suffix} · {text}</p></button>;
}

function CopyRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/65 px-3 py-2.5"><span className="text-muted-foreground">{label}</span><button type="button" className="flex items-center gap-2 text-left font-bold" onClick={() => navigator.clipboard?.writeText(value)} data-testid={`button-copy-${label}`}>{value}<Copy size={14} className="text-accent" /></button></div>; }

function AiLab() {
  const params = new URLSearchParams(window.location.search);
  const queryType = params.get('type');
  const queryQiyas = params.get('qiyas');
  const querySubject = params.get('subject');
  const queryTopic = params.get('topic');
  const initialType = (queryType === 'homework' || queryType === 'exam' || queryType === 'qiyas' || queryType === 'lesson' ? queryType : 'lesson') as 'lesson' | 'homework' | 'exam' | 'qiyas';
  const initialQiyas = queryQiyas === 'achievement' ? 'achievement' : 'aptitude';
  const mutation = useGenerateAiContent();
  const [type, setType] = useState<'lesson' | 'homework' | 'exam' | 'qiyas'>(initialType);
  const [qiyasMode, setQiyasMode] = useState<'aptitude' | 'achievement'>(initialQiyas);
  const [subject, setSubject] = useState(initialType === 'qiyas' ? (initialQiyas === 'achievement' ? 'التحصيلي' : 'القدرات') : initialType === 'exam' ? 'جميع المواد' : querySubject || 'الرياضيات');
  const [grade, setGrade] = useState('الثاني الثانوي');
  const [topic, setTopic] = useState(initialType === 'exam' ? queryTopic || 'اختبار شامل لجميع المواد' : initialType === 'homework' ? queryTopic || 'اشرح الدرس أو المعادلة الظاهرة في الصورة' : initialType === 'qiyas' ? (initialQiyas === 'achievement' ? 'تدريب تحصيلي شامل' : 'تدريب قدرات شامل') : queryTopic || 'اختبار تدريبي من موضوع الدرس');
  const [imageData, setImageData] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageError, setImageError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [fallbackTestNumber, setFallbackTestNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const subjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الدراسات الاجتماعية', 'القدرات', 'التحصيلي', 'جميع المواد'];
  const typeItems = [{ value: 'lesson', label: 'اختبار الدرس', icon: Lightbulb }, { value: 'homework', label: 'شرح بالكاميرا', icon: Camera }, { value: 'exam', label: 'اختبار شامل', icon: ClipboardCheck }, { value: 'qiyas', label: 'اختبار قياس', icon: Target }];
  const chooseType = (nextType: 'lesson' | 'homework' | 'exam' | 'qiyas') => {
    setType(nextType);
    setImageError('');
    setResult(null);
    setAnswers({});
    setSubmitted(false);
    mutation.reset();
    if (nextType !== 'homework') {
      setImageData('');
      setImageName('');
    }
    if (nextType === 'exam') {
      setSubject('جميع المواد');
      setTopic('اختبار شامل لجميع المواد');
    } else if (nextType === 'qiyas') {
      setSubject(qiyasMode === 'achievement' ? 'التحصيلي' : 'القدرات');
      setTopic(qiyasMode === 'achievement' ? 'تدريب تحصيلي شامل' : 'تدريب قدرات شامل');
    }
  };
  const chooseQiyas = (mode: 'aptitude' | 'achievement') => {
    setQiyasMode(mode);
    setType('qiyas');
    setSubject(mode === 'achievement' ? 'التحصيلي' : 'القدرات');
    setTopic(mode === 'achievement' ? 'تدريب تحصيلي شامل' : 'تدريب قدرات شامل');
    setResult(null);
    setAnswers({});
    setSubmitted(false);
    mutation.reset();
  };
  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      setImageError('اختر صورة أصغر من 5 ميجابايت.');
      return;
    }
    setImageError('');
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result || ''));
    reader.readAsDataURL(file);
  };
  const generate = (requestedTestNumber = fallbackTestNumber) => mutation.mutate({ data: { type, subject, grade, topic, fallbackTestNumber: requestedTestNumber, ...(imageData ? { imageData } : {}) } }, { onSuccess: (data: any) => { setResult(data); setAnswers({}); setSubmitted(false); if (data.source === 'fallback') setFallbackTestNumber(data.testNumber >= 20 ? 1 : data.testNumber + 1); } });
  const apiError = mutation.error as { data?: { error?: string }; message?: string } | null;
  const errorMessage = apiError?.data?.error || 'تعذر توليد المحتوى من خدمة الذكاء الاصطناعي. حاول مرة أخرى.';
  const actionLabel = mutation.isPending
    ? 'جار توليد الاختبار...'
    : type === 'exam'
      ? 'ولّد الاختبار الشامل'
      : type === 'homework'
        ? 'اشرح الصورة وأنشئ تدريباً'
        : type === 'qiyas'
          ? 'ولّد اختبار القياس'
          : 'ولّد اختبار الدرس';
  const items = Array.isArray(result?.items) ? result.items : [];
  const score = items.filter((item: any, index: number) => answers[index] === item.answer).length;
  const finishQuiz = () => {
    if (items.length > 0) setSubmitted(true);
  };
  const resetResult = () => {
    setResult(null);
    setAnswers({});
    setSubmitted(false);
    mutation.reset();
  };
  return <AppShell><div className="mx-auto max-w-[1380px] px-4 py-10 md:px-8 md:py-16"><PageIntro eyebrow="مساعدك الدراسي" title="مولد الاختبارات الذكي" description="ولّد اختباراً من أي قسم، ثم أجب عن الأسئلة وأنهِ المحاولة لتظهر درجتك والحل المشروح." /><div className="grid gap-7 lg:grid-cols-[.75fr_1.25fr]"><section className="h-fit rounded-[1.75rem] border border-border bg-card p-5 shadow-sm md:p-7"><div className="grid grid-cols-2 gap-2">{typeItems.map((item) => <button type="button" key={item.value} onClick={() => chooseType(item.value as any)} className={cn('flex items-center gap-2 rounded-xl p-3 text-sm font-bold transition', type === item.value ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary')} data-testid={`button-ai-type-${item.value}`}><item.icon size={17} />{item.label}</button>)}</div>{type === 'qiyas' && <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/60 p-1.5"><button type="button" onClick={() => chooseQiyas('aptitude')} className={cn('rounded-xl py-2.5 text-sm font-bold', qiyasMode === 'aptitude' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')}>قدرات عامة</button><button type="button" onClick={() => chooseQiyas('achievement')} className={cn('rounded-xl py-2.5 text-sm font-bold', qiyasMode === 'achievement' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')}>تحصيلي</button></div>}<div className="mt-7 space-y-5"><label className="block"><span className="mb-2 block text-sm font-bold">المادة</span><select value={subject} disabled={type === 'exam' || type === 'qiyas'} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-accent" data-testid="select-ai-subject">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><Field label="الصف" value={grade} onChange={(e: any) => setGrade(e.target.value)} testId="input-ai-grade" /><label className="block"><span className="mb-2 block text-sm font-bold">الموضوع أو المهارة</span><textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-28 w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm leading-7 outline-none focus:border-accent" placeholder="اكتب موضوع الاختبار أو المهارة المطلوبة..." data-testid="textarea-ai-topic" /></label>{type === 'homework' && <label className="block cursor-pointer rounded-2xl border border-dashed border-accent/45 bg-accent/5 p-5"><input className="sr-only" type="file" accept="image/*" capture="environment" onChange={handleImage} data-testid="input-homework-camera" /><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-foreground"><Camera size={21} /></span><div><p className="font-bold">{imageName || 'صوّر الواجب أو ارفع صورة'}</p><p className="mt-1 text-xs text-muted-foreground">اختياري عند استخدام المخزون الجاهز</p></div></div>{imageData && <img src={imageData} alt="معاينة الواجب" className="mt-4 max-h-44 w-full rounded-xl object-contain" />}{imageError && <p className="mt-3 text-xs font-bold text-destructive">{imageError}</p>}</label>}</div><Button className="mt-6 w-full py-3.5" onClick={() => generate()} disabled={mutation.isPending || !topic.trim()} data-testid="button-generate-ai">{actionLabel} <Sparkles size={17} /></Button><p className="mt-4 text-center text-xs leading-6 text-muted-foreground">سيظهر الحل والشرح بعد إنهاء الإجابة، وليس قبل ذلك.</p></section><section className="min-h-[500px] rounded-[1.75rem] border border-border bg-secondary/40 p-5 md:p-8" data-testid="panel-ai-result">{mutation.isError ? <div className="flex min-h-[440px] flex-col items-center justify-center text-center"><span className="grid h-16 w-16 place-items-center rounded-3xl bg-destructive/10 text-destructive"><X size={27} /></span><h2 className="mt-6 font-display text-2xl font-extrabold">لم يتم توليد الاختبار</h2><p className="mt-3 max-w-md text-sm leading-8 text-muted-foreground">{errorMessage}</p><Button variant="outline" className="mt-6" onClick={() => generate()} disabled={mutation.isPending}>إعادة المحاولة <ArrowLeft size={16} /></Button></div> : !result && !mutation.isPending ? <div className="flex min-h-[440px] flex-col items-center justify-center text-center"><span className="grid h-16 w-16 place-items-center rounded-3xl bg-accent/20 text-accent-foreground"><ClipboardCheck size={27} /></span><h2 className="mt-6 font-display text-2xl font-extrabold">أنشئ اختبارك الآن</h2><p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">أجب عن كل سؤال، ثم اضغط إنهاء الاختبار لتظهر النتيجة والحل الكامل.</p></div> : mutation.isPending ? <div className="space-y-4 animate-pulse"><div className="h-8 w-2/3 rounded-lg bg-border" /><div className="h-4 w-full rounded bg-border" /><div className="h-4 w-5/6 rounded bg-border" /><div className="mt-8 h-28 rounded-2xl bg-border" /></div> : result && <div className="animate-enter"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">{result.source === 'fallback' ? 'اختبار جاهز من مخزون لنتعلم' : 'اختبار مولّد بالذكاء الاصطناعي'}</p><h2 className="mt-3 font-display text-3xl font-extrabold" data-testid="text-ai-result-title">{result.title}</h2><p className="mt-2 text-sm text-muted-foreground">{result.source === 'fallback' ? `النموذج ${result.testNumber} من ${result.testsAvailable} · ${result.questionsPerTest} سؤالاً` : `${items.length} سؤالاً`}</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-accent"><Sparkles size={19} /></span></div><p className="mt-5 max-w-2xl whitespace-pre-line leading-8 text-muted-foreground">{result.body}</p>{submitted && <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 p-5" data-testid="status-quiz-score"><p className="text-sm font-bold text-accent-foreground">نتيجة المحاولة</p><p className="mt-1 font-display text-4xl font-extrabold text-primary">{score} / {items.length}</p><p className="mt-1 text-sm text-muted-foreground">نسبة الإجابات الصحيحة: {items.length ? Math.round((score / items.length) * 100) : 0}%</p></div>}<div className="mt-8 space-y-4">{items.map((item: any, index: number) => <article className="rounded-2xl border border-border bg-card p-5" key={index} data-testid={`card-ai-item-${index}`}><div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-extrabold text-primary">{index + 1}</span><p className="pt-1 font-bold leading-7">{item.question}</p></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{(item.options || []).map((option: string, optionIndex: number) => { const selected = answers[index] === option; const correct = item.answer === option; return <button type="button" key={optionIndex} disabled={submitted} onClick={() => setAnswers((current) => ({ ...current, [index]: option }))} className={cn('rounded-xl border px-3 py-3 text-right text-sm transition', selected && !submitted && 'border-primary bg-primary/10 font-bold', submitted && correct && 'border-accent bg-accent/10 font-bold text-accent-foreground', submitted && selected && !correct && 'border-destructive bg-destructive/10 text-destructive', !selected && !submitted && 'border-border bg-secondary/35 hover:border-accent')}>{option}</button>; })}</div>{submitted && <div className="mt-4 grid gap-3 md:grid-cols-2"><div className={cn('rounded-xl p-3 text-sm', answers[index] === item.answer ? 'bg-accent/10' : 'bg-destructive/10')}><span className="font-bold">{answers[index] === item.answer ? 'إجابة صحيحة' : 'الإجابة الصحيحة'}</span><p className="mt-1 leading-7">{item.answer}</p></div><div className="rounded-xl bg-secondary p-3 text-sm"><span className="font-bold text-muted-foreground">شرح طريقة الحل</span><p className="mt-1 leading-7 text-muted-foreground">{item.explanation}</p></div></div>}</article>)}</div><div className="mt-7 flex flex-wrap gap-3">{!submitted && <Button onClick={finishQuiz} disabled={!items.length} data-testid="button-finish-quiz">إنهاء الاختبار <Check size={17} /></Button>}<Button variant="outline" onClick={resetResult} data-testid="button-ai-reset">اختبار جديد <X size={16} /></Button></div></div>}</section></div></div></AppShell>;
}

function AdminShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  const links = [{ href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard }, { href: '/admin/content', label: 'المحتوى', icon: BookOpen }, { href: '/admin/users', label: 'الطلاب والصلاحيات', icon: Users }, { href: '/admin/settings', label: 'الإعدادات', icon: Settings2 }, { href: '/ai-lab', label: 'الذكاء الاصطناعي', icon: Sparkles }];
  return <AppShell><div className="mx-auto max-w-[1380px] px-4 py-8 md:px-8 md:py-12"><div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-3">{links.map((link) => <Link href={link.href} key={link.href} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground" data-testid={`link-admin-${link.label}`}><link.icon size={16} />{link.label}</Link>)}</div><PageIntro eyebrow="مساحة الإدارة" title={title} description={description} />{children}</div></AppShell>;
}

function AdminOverviewPage() {
  const overview = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey(), retry: false } }); const requests = useGetAdminSubscriptions({ query: { queryKey: getGetAdminSubscriptionsQueryKey(), retry: false } }); const statusMutation = useUpdateSubscriptionStatus(); const query = useQueryClient(); const [, navigate] = useLocation();
  const summary: any = overview.data || { students: 1284, activeSubscriptions: 936, pendingRequests: 17, lessons: 684 };
  const list: any[] = requests.data || [{ id: 'req-1', user: { name: 'نورة المطيري', email: 'noura@example.com' }, plan: 'yearly', amount: 299, receiptName: 'receipt-noura.pdf', status: 'pending' }, { id: 'req-2', user: { name: 'عبدالله الحربي', email: 'abdullah@example.com' }, plan: 'monthly', amount: 30, receiptName: 'transfer-204.jpg', status: 'pending' }];
  const approve = (id: string, status: 'active' | 'rejected') => statusMutation.mutate({ subscriptionId: id, data: { status } }, { onSuccess: () => { query.invalidateQueries({ queryKey: getGetAdminSubscriptionsQueryKey() }); query.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }); } });
  return <AdminShell title="صباح الخير، فريق لنتعلم" description="هذه صورة سريعة عن حركة المنصة والطلبات التي تحتاج قرارك."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ label: 'الطلاب', value: summary.students, icon: Users, color: 'text-chart-3' }, { label: 'اشتراكات نشطة', value: summary.activeSubscriptions, icon: ShieldCheck, color: 'text-accent-foreground' }, { label: 'طلبات معلقة', value: summary.pendingRequests, icon: Clock3, color: 'text-chart-4' }, { label: 'درس منشور', value: summary.lessons, icon: BookOpen, color: 'text-primary' }].map((item) => <div className="rounded-2xl border border-border bg-card p-5" key={item.label} data-testid={`stat-${item.label}`}><div className="flex items-center justify-between"><span className="text-sm font-semibold text-muted-foreground">{item.label}</span><item.icon size={19} className={item.color} /></div><p className="mt-4 font-display text-3xl font-extrabold">{new Intl.NumberFormat('ar-SA').format(item.value)}</p><p className="mt-2 text-xs text-muted-foreground">مقارنة بالأسبوع الماضي <span className="font-bold text-accent">+8.4%</span></p></div>)}</div><div className="mt-8 grid gap-7 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-[1.5rem] border border-border bg-card p-5 md:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold">طلبات الاشتراك</h2><p className="mt-1 text-sm text-muted-foreground">راجع الإيصالات المرفقة ثم وافق أو ارفض الطلب.</p></div><Link href="/subscribe" className="text-sm font-bold text-accent-foreground" data-testid="link-preview-subscribe">صفحة الاشتراك</Link></div><div className="mt-6 space-y-3">{requests.isLoading ? <SpinnerLine /> : requests.isError && !requests.data ? <ErrorState /> : list.map((request) => <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4" key={request.id} data-testid={`row-request-${request.id}`}><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-bold text-primary">{request.user.name.slice(0, 1)}</span><div><p className="text-sm font-bold">{request.user.name}</p><p className="text-xs text-muted-foreground">{request.user.email} · {request.plan === 'yearly' ? 'سنوي' : 'شهري'}</p><p className="mt-1 text-xs font-semibold text-accent-foreground">الإيصال: {request.receiptName || 'غير مرفق'}</p></div></div><div className="flex items-center gap-2">{request.status === 'pending' ? <><Button variant="outline" className="!px-3 !py-2 text-xs" onClick={() => approve(request.id, 'rejected')} disabled={statusMutation.isPending} data-testid={`button-reject-${request.id}`} title="رفض الطلب"><X size={15} />رفض</Button><Button className="!px-3 !py-2 text-xs" onClick={() => approve(request.id, 'active')} disabled={statusMutation.isPending} data-testid={`button-approve-${request.id}`} title="الموافقة على الطلب"><Check size={15} />موافقة</Button></> : <span className="text-xs font-bold text-muted-foreground">{request.status}</span>}</div></div>)}</div></section><section className="rounded-[1.5rem] bg-primary p-6 text-primary-foreground"><p className="text-xs font-bold text-accent">نبض المنصة</p><h2 className="mt-3 font-display text-2xl font-extrabold">المحتوى ينمو بثبات</h2><p className="mt-3 text-sm leading-7 text-primary-foreground/65">أضف درساً جديداً أو راجع أكثر المواد نشاطاً لتبقى تجربة الطالب مركزة.</p><div className="mt-9 space-y-4"><div className="flex items-center justify-between text-sm"><span className="text-primary-foreground/65">اكتمال مكتبة الدروس</span><strong>72%</strong></div><div className="h-2 rounded-full bg-primary-foreground/15"><div className="h-full w-[72%] rounded-full bg-accent" /></div><Button variant="outline" className="mt-3 w-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate('/admin/content')} data-testid="button-admin-content">إدارة المحتوى <ArrowLeft size={16} /></Button></div></section></div></AdminShell>;
}

function AdminContent() {
  const create = useCreateCatalogItem();
  const remove = useDeleteCatalogItem();
  const update = useUpdateCatalogItem();
  const ai = useGenerateAiContent();
  const query = useQueryClient();
  const catalogQuery = useGetAdminCatalog({ query: { queryKey: getGetAdminCatalogQueryKey(), retry: false } });
  const rows: any[] = catalogQuery.data || [];
  const [type, setType] = useState<'stage' | 'grade' | 'subject' | 'lesson'>('lesson');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const visibleRows = rows.filter((row) => `${row.name} ${row.id} ${row.type}`.includes(search));
  const invalidate = () => {
    query.invalidateQueries({ queryKey: getGetAdminCatalogQueryKey() });
    query.invalidateQueries({ queryKey: getGetCatalogQueryKey() });
  };
  const add = (e: any) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ data: { type, name: name.trim(), parentId: parentId || null } }, { onSuccess: () => { setName(''); setParentId(''); invalidate(); } });
  };
  const removeItem = (id: string) => {
    if (!window.confirm('هل تريد حذف هذا العنصر؟ سيحذف المرحلة أو الصف وكل ما بداخله.')) return;
    remove.mutate({ catalogItemId: id }, { onSuccess: invalidate });
  };
  const saveEdit = (e: any) => {
    e.preventDefault();
    if (!editing || !name.trim()) return;
    update.mutate({ catalogItemId: editing.id, data: { type: editing.type, name: name.trim(), parentId: editing.parentId } }, { onSuccess: () => { setEditing(null); setName(''); invalidate(); } });
  };
  const askAiForTitle = () => {
    ai.mutate({ data: { type: 'lesson', subject: 'محتوى المنصة', grade: 'مختلف الصفوف', topic: 'اقترح عنوان درس تعليمي عربي أصلي وقصير', fallbackTestNumber: 1 } }, { onSuccess: (result: any) => setName(result.title) });
  };
  return <AdminShell title="مكتبة المحتوى" description="أضف وعدّل واحذف عناصر الكتالوج مباشرة، أو استخدم الذكاء الاصطناعي لاقتراح بداية جديدة."><div className="grid gap-7 lg:grid-cols-[.75fr_1.25fr]"><form onSubmit={editing ? saveEdit : add} className="h-fit rounded-[1.5rem] border border-border bg-card p-6" data-testid="form-add-content"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent-foreground">{editing ? <PenLine size={19} /> : <Plus size={19} />}</span><h2 className="font-display text-xl font-extrabold">{editing ? 'تعديل عنصر' : 'إضافة عنصر'}</h2></div><div className="mt-6 space-y-5">{!editing && <label className="block"><span className="mb-2 block text-sm font-bold">نوع العنصر</span><select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-accent" data-testid="select-content-type"><option value="lesson">درس</option><option value="subject">مادة</option><option value="grade">صف</option><option value="stage">مرحلة</option></select></label>}<Field label="اسم العنصر" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="مثال: قوانين نيوتن" testId="input-content-name" />{!editing && <Field label="المعرّف الأب (اختياري)" value={parentId} onChange={(e: any) => setParentId(e.target.value)} placeholder="ID" testId="input-content-parent" />}</div><div className="mt-6 flex gap-2"><Button type="submit" className="flex-1" disabled={create.isPending || update.isPending}>{editing ? 'حفظ التعديل' : 'حفظ العنصر'} {editing ? <Check size={17} /> : <Plus size={17} />}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setName(''); }}>إلغاء</Button>}</div>{!editing && <Button type="button" variant="outline" className="mt-3 w-full" onClick={askAiForTitle} disabled={ai.isPending}>{ai.isPending ? 'جار اقتراح عنوان...' : 'اقترح عنواناً بالذكاء الاصطناعي'} <Sparkles size={17} /></Button>}{ai.data && <p className="mt-3 rounded-xl bg-accent/10 p-3 text-xs leading-6 text-muted-foreground">تم ربط الذكاء بالمحتوى: {ai.data.title}</p>}</form><section className="rounded-[1.5rem] border border-border bg-card p-5 md:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold">كل عناصر المحتوى</h2><p className="mt-1 text-sm text-muted-foreground">{visibleRows.length} عنصراً قابلاً للإدارة</p></div><div className="relative"><Search size={16} className="absolute right-3 top-3 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-36 rounded-xl border border-input bg-background py-2.5 pl-3 pr-9 text-xs outline-none focus:border-accent sm:w-48" placeholder="ابحث..." data-testid="input-search-content" /></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[600px] text-right text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="pb-3 font-semibold">العنصر</th><th className="pb-3 font-semibold">النوع</th><th className="pb-3 font-semibold">الأب</th><th className="pb-3 font-semibold">إجراء</th></tr></thead><tbody>{visibleRows.map((row: any) => <tr className="border-b border-border/70" key={row.id} data-testid={`row-content-${row.id}`}><td className="py-4 font-bold">{row.name}</td><td className="py-4 text-muted-foreground">{row.type}</td><td className="py-4 text-xs text-muted-foreground">{row.parentId || '—'}</td><td className="py-4"><div className="flex items-center gap-1"><button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary" onClick={() => { setEditing(row); setName(row.name); }} data-testid={`button-edit-content-${row.id}`}><PenLine size={16} /></button><button className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removeItem(row.id)} disabled={remove.isPending} data-testid={`button-delete-content-${row.id}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div></section></div></AdminShell>;
}

function AdminUsers() {
  const query = useQueryClient();
  const usersQuery = useGetAdminUsers({ query: { queryKey: getGetAdminUsersQueryKey(), retry: false } });
  const update = useUpdateAdminUser();
  const remove = useDeleteAdminUser();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState('');
  const [draftName, setDraftName] = useState('');
  const users: any[] = (usersQuery.data || []).filter((user: any) => `${user.name} ${user.email}`.includes(search));
  const saveUser = (user: any) => {
    update.mutate({ userId: user.id, data: { name: draftName.trim() || user.name } }, { onSuccess: () => { setEditingId(''); query.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() }); } });
  };
  const toggleAdmin = (user: any) => {
    update.mutate({ userId: user.id, data: { isAdmin: !user.isAdmin } }, { onSuccess: () => query.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() }) });
  };
  const deleteUser = (user: any) => {
    if (!window.confirm(`حذف حساب ${user.name}؟`)) return;
    remove.mutate({ userId: user.id }, { onSuccess: () => query.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() }) });
  };
  return <AdminShell title="الطلاب والصلاحيات" description="للمدير صلاحية كاملة لإضافة أدوار الحسابات وتعديلها وحذفها، مع حماية حسابه من الإزالة أو خفض الصلاحية بالخطأ."><section className="rounded-[1.5rem] border border-border bg-card p-5 md:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-xl font-extrabold">كل المستخدمين</h2><p className="mt-1 text-sm text-muted-foreground">{users.length} حسابات في العرض الحالي</p></div><div className="relative"><Search size={16} className="absolute right-3 top-3 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 rounded-xl border border-input bg-background py-2.5 pl-3 pr-9 text-sm outline-none focus:border-accent" placeholder="ابحث بالاسم أو البريد" data-testid="input-search-users" /></div></div><div className="mt-7 space-y-2">{users.map((user) => <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 p-4" key={user.id} data-testid={`row-user-${user.id}`}><div className="flex items-center gap-3">{editingId === user.id ? <input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveUser(user); }} className="w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent" data-testid={`input-edit-user-${user.id}`} /> : <><span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-bold text-primary">{user.name.slice(0, 1)}</span><div><p className="font-bold">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></>}</div><div className="flex flex-wrap items-center gap-2"><span className={cn('rounded-full px-3 py-1 text-xs font-bold', user.isAdmin ? 'bg-accent/15 text-accent-foreground' : 'bg-secondary')}>{user.isAdmin ? 'مدير كامل' : 'طالب'}</span><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{user.subscriptionStatus}</span>{editingId === user.id ? <Button className="!px-3 !py-2 text-xs" onClick={() => saveUser(user)} disabled={update.isPending}>حفظ</Button> : <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" data-testid={`button-edit-user-${user.id}`} onClick={() => { setEditingId(user.id); setDraftName(user.name); }}><PenLine size={16} /></button>}<Button variant="outline" className="!px-3 !py-2 text-xs" onClick={() => toggleAdmin(user)} disabled={update.isPending}>{user.isAdmin ? 'سحب الإدارة' : 'منح الإدارة'}</Button><button className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteUser(user)} disabled={remove.isPending} data-testid={`button-delete-user-${user.id}`}><Trash2 size={16} /></button></div></div>)}</div></section></AdminShell>;
}

function AdminSettings() {
  const query = useQueryClient(); const remote = useGetSettings({ query: { queryKey: getGetSettingsQueryKey(), retry: false } }); const update = useUpdateSettings(); const initial: any = remote.data || { monthlyPrice: 30, yearlyPrice: 299, bankName: 'Urpay', accountName: 'خالد العتيبي', iban: 'SA7280206153985222121018' }; const [form, setForm] = useState(initial); const change = (key: string, value: string | number) => setForm((old: any) => ({ ...old, [key]: value })); const save = (e: any) => { e.preventDefault(); update.mutate({ data: { ...form, monthlyPrice: Number(form.monthlyPrice), yearlyPrice: Number(form.yearlyPrice) } }, { onSuccess: () => query.invalidateQueries({ queryKey: getGetSettingsQueryKey() }) }); };
  return <AdminShell title="إعدادات المنصة" description="غيّر الأسعار وبيانات التحويل التي تظهر للطلاب في صفحة الاشتراك."><form onSubmit={save} className="max-w-3xl rounded-[1.5rem] border border-border bg-card p-6 md:p-8" data-testid="form-admin-settings"><div className="grid gap-5 sm:grid-cols-2"><Field label="السعر الشهري (ر.س)" type="number" value={form.monthlyPrice} onChange={(e: any) => change('monthlyPrice', e.target.value)} testId="input-monthly-price" /><Field label="السعر السنوي (ر.س)" type="number" value={form.yearlyPrice} onChange={(e: any) => change('yearlyPrice', e.target.value)} testId="input-yearly-price" /></div><div className="mt-8 border-t border-border pt-7"><h2 className="font-display text-xl font-extrabold">بيانات الحساب البنكي</h2><div className="mt-5 space-y-5"><Field label="اسم البنك" value={form.bankName} onChange={(e: any) => change('bankName', e.target.value)} testId="input-bank-name" /><Field label="اسم الحساب" value={form.accountName} onChange={(e: any) => change('accountName', e.target.value)} testId="input-account-name" /><Field label="الآيبان" value={form.iban} onChange={(e: any) => change('iban', e.target.value)} testId="input-iban" /></div></div>{update.isError && <p className="mt-5 text-sm font-semibold text-destructive" data-testid="status-settings-error">تعذر حفظ الإعدادات.</p>}{update.isSuccess && <p className="mt-5 text-sm font-semibold text-accent-foreground" data-testid="status-settings-success">تم حفظ الإعدادات بنجاح.</p>}<Button type="submit" className="mt-7" disabled={update.isPending} data-testid="button-save-settings">{update.isPending ? 'جار الحفظ...' : 'حفظ التغييرات'} <Check size={17} /></Button></form></AdminShell>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/login" component={Login} /><Route path="/register" component={Register} /><Route path="/subscribe" component={Subscribe} /><Route path="/stage/:stageId" component={StagePage} /><Route path="/grade/:gradeId" component={GradePage} /><Route path="/interactive/:interactiveLessonId" component={InteractiveLessonPage} /><Route path="/lesson/:lessonId" component={LessonPage} /><Route path="/english" component={EnglishPage} /><Route path="/english/:englishLessonId" component={EnglishLessonPage} /><Route path="/arabic" component={ArabicPage} /><Route path="/arabic/:arabicLessonId" component={ArabicLessonPage} /><Route path="/qiyas-guide" component={QiyasGuidePage} /><Route path="/ai-lab" component={AiLab} /><Route path="/admin" component={AdminOverviewPage} /><Route path="/admin/content" component={AdminContent} /><Route path="/admin/users" component={AdminUsers} /><Route path="/admin/settings" component={AdminSettings} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}