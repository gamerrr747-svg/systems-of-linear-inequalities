import React, { createContext, useContext, useState } from 'react';

export type Language = 'kz' | 'ru' | 'en';

interface Translations {
  appName: string;
  appSubtitle: string;
  selectProblem: string;
  textbookExamples: string;
  textbookExercises: string;
  customInput: string;
  matrixInput: string;
  textInput: string;
  inputPlaceholder: string;
  solveButton: string;
  resetButton: string;
  eliminationOrder: string;
  eliminationOrderHelp: string;
  stepByStepSolution: string;
  step: string;
  initialSystem: string;
  equivalentSystem: string;
  companionSystem: string;
  simplifiedCompanionSystem: string;
  isolatedVar: string;
  formedPairs: string;
  contradiction: string;
  consistencyCheck: string;
  consistent: string;
  inconsistent: string;
  boundednessCheck: string;
  bounded: string;
  unbounded: string;
  particularSolution: string;
  backwardSubstitution: string;
  substitutingInto: string;
  validInterval: string;
  chosenValue: string;
  finalParticularSolution: string;
  verificationTitle: string;
  verificationPassed: string;
  verificationFailed: string;
  addInequality: string;
  removeInequality: string;
  addVariable: string;
  removeVariable: string;
  exportLatex: string;
  copiedLatex: string;
  theoryTitle: string;
  theoryDesc: string;
}

const translations: Record<Language, Translations> = {
  kz: {
    appName: 'Фурье-Моцкин әдісімен теңсіздіктер жүйесін шешу',
    appSubtitle: 'Сызықтық теңсіздіктер жүйесінің үйлесімділігін, шектелгендігін тексеру және дербес шешімін кезең-кезеңімен табу',
    selectProblem: 'Оқулық есебін таңдау немесе өз есебіңізді енгізу',
    textbookExamples: 'Оқулықтағы мысалдар (1–3)',
    textbookExercises: 'Оқулықтағы есептер (4–17)',
    customInput: 'Өз есебімді енгізу',
    matrixInput: 'Кестелік (коэффициенттер) енгізу',
    textInput: 'Мәтіндік енгізу',
    inputPlaceholder: 'Әр жолға бір теңсіздік жазыңыз, мысалы:\n2x1 + 2x2 + 3x3 - 1 >= 0\nx1 - x2 + 2 >= 0\n-x1 + 2x2 - x3 >= 0\n-8x2 + x3 - 2 >= 0',
    solveButton: 'Шешу жолын көрсету',
    resetButton: 'Бастапқы қалпына келтіру',
    eliminationOrder: 'Айнымалыларды жою реті',
    eliminationOrderHelp: 'Оқулықта көрсетілгендей ретпен немесе өз қалауыңызша айнымалыларды жоюға болады',
    stepByStepSolution: 'Шығару жолы (Қадам бойынша алгоритм)',
    step: 'Кезең',
    initialSystem: 'Берілген теңсіздіктер жүйесі',
    equivalentSystem: 'Мәндес жүйеге көшу (айнымалыны оқшаулау)',
    companionSystem: 'Ілеспе жүйе (сопутствующая система)',
    simplifiedCompanionSystem: 'Ұқсас мүшелерді біріктіргеннен кейінгі ілеспе жүйе',
    isolatedVar: 'жойылатын айнымалысы бойынша',
    formedPairs: 'Жоғарғы және төменгі шектерден түзілген жұптар',
    contradiction: 'Қайшылық анықталды!',
    consistencyCheck: 'Үйлесімділік (Совместность)',
    consistent: 'Жүйе үйлесімді (шешімдері бар)',
    inconsistent: 'Жүйе үйлесімсіз (шешімі жоқ)',
    boundednessCheck: 'Шектелгендік (Ограниченность)',
    bounded: 'Шешімдер жиыны шектелген',
    unbounded: 'Шешімдер жиыны шектелмеген',
    particularSolution: 'Дербес шешімді таңдау',
    backwardSubstitution: 'Кері жүріс (айнымалылардың мәнін ретімен анықтау)',
    substitutingInto: 'жүйесіне қою арқылы',
    validInterval: 'Мүмкін мәндер аралығы',
    chosenValue: 'Таңдалған мән',
    finalParticularSolution: 'Жүйенің дербес шешімі',
    verificationTitle: 'Тексеру (бастапқы теңсіздіктерге қою)',
    verificationPassed: 'Барлық теңсіздіктер толық қанағаттандырылды!',
    verificationFailed: 'Теңсіздік қанағаттандырылмады',
    addInequality: 'Теңсіздік қосу',
    removeInequality: 'Өшіру',
    addVariable: 'Айнымалы қосу',
    removeVariable: 'Айнымалыны азайту',
    exportLatex: 'LaTeX көшіру',
    copiedLatex: 'Көшірілді!',
    theoryTitle: 'Фурье-Моцкин әдісінің мәні',
    theoryDesc: 'Бұл әдіс Гаусс әдісінің теңсіздіктерге арналған аналогы. Әр қадамда бір айнымалы оқшауланып, оның барлық жоғарғы шектері төменгі шектерінен кем емес деген шартпен келесі ілеспе жүйе құрылады.',
  },
  ru: {
    appName: 'Метод исключения Фурье — Моцкина',
    appSubtitle: 'Пошаговое решение систем линейных неравенств, проверка совместности, ограниченности и нахождение частного решения',
    selectProblem: 'Выбрать задачу из книги или ввести свою',
    textbookExamples: 'Примеры из книги (1–3)',
    textbookExercises: 'Упражнения из книги (4–17)',
    customInput: 'Ввести свою систему',
    matrixInput: 'Табличный ввод (коэффициенты)',
    textInput: 'Текстовый ввод',
    inputPlaceholder: 'Введите по одному неравенству в строке, например:\n2x1 + 2x2 + 3x3 - 1 >= 0\nx1 - x2 + 2 >= 0\n-x1 + 2x2 - x3 >= 0\n-8x2 + x3 - 2 >= 0',
    solveButton: 'Решить по шагам',
    resetButton: 'Сбросить',
    eliminationOrder: 'Порядок исключения переменных',
    eliminationOrderHelp: 'Можно задать порядок исключения как в учебнике или стандартный',
    stepByStepSolution: 'Пошаговое решение (Метод сопутствующих систем)',
    step: 'Этап',
    initialSystem: 'Исходная система неравенств',
    equivalentSystem: 'Переход к равносильной системе',
    companionSystem: 'Сопутствующая система',
    simplifiedCompanionSystem: 'Сопутствующая система после приведения подобных членов',
    isolatedVar: 'по переменной',
    formedPairs: 'Пары неравенств верхних и нижних границ',
    contradiction: 'Получено противоречие!',
    consistencyCheck: 'Совместность',
    consistent: 'Система совместна',
    inconsistent: 'Система несовместна',
    boundednessCheck: 'Ограниченность',
    bounded: 'Множество решений ограничено',
    unbounded: 'Множество решений неограничено',
    particularSolution: 'Нахождение частного решения',
    backwardSubstitution: 'Обратный ход (нахождение неизвестных)',
    substitutingInto: 'подставляя в систему',
    validInterval: 'Допустимый интервал значений',
    chosenValue: 'Выбранное значение',
    finalParticularSolution: 'Частное решение системы',
    verificationTitle: 'Проверка подстановкой в исходную систему',
    verificationPassed: 'Все неравенства строго удовлетворяются!',
    verificationFailed: 'Неравенство не выполняется',
    addInequality: 'Добавить неравенство',
    removeInequality: 'Удалить',
    addVariable: 'Добавить переменную',
    removeVariable: 'Убрать переменную',
    exportLatex: 'Копировать LaTeX',
    copiedLatex: 'Скопировано!',
    theoryTitle: 'Теоретическая справка',
    theoryDesc: 'Метод исключения переменных Фурье-Моцкина позволяет исключать переменные одну за другой, формируя сопутствующие системы, пока не останется одна переменная или не возникнет числовое противоречие.',
  },
  en: {
    appName: 'Fourier-Motzkin Elimination Solver',
    appSubtitle: 'Step-by-step solver for systems of linear inequalities, checking consistency, boundedness, and finding a particular solution',
    selectProblem: 'Select textbook problem or enter custom system',
    textbookExamples: 'Textbook Examples (1–3)',
    textbookExercises: 'Textbook Exercises (4–17)',
    customInput: 'Custom Input',
    matrixInput: 'Matrix (Coefficients) Input',
    textInput: 'Text Input',
    inputPlaceholder: 'Enter one inequality per line, e.g.:\n2x1 + 2x2 + 3x3 - 1 >= 0\nx1 - x2 + 2 >= 0\n-x1 + 2x2 - x3 >= 0\n-8x2 + x3 - 2 >= 0',
    solveButton: 'Solve Step-by-Step',
    resetButton: 'Reset',
    eliminationOrder: 'Elimination Order',
    eliminationOrderHelp: 'Specify the variable elimination sequence as in the textbook',
    stepByStepSolution: 'Step-by-Step Solution (Companion Systems)',
    step: 'Step',
    initialSystem: 'Initial System of Inequalities',
    equivalentSystem: 'Equivalent System (Variable Isolation)',
    companionSystem: 'Companion System',
    simplifiedCompanionSystem: 'Simplified Companion System',
    isolatedVar: 'for variable',
    formedPairs: 'Pairs formed from upper and lower bounds',
    contradiction: 'Contradiction Found!',
    consistencyCheck: 'Consistency',
    consistent: 'System is consistent',
    inconsistent: 'System is inconsistent',
    boundednessCheck: 'Boundedness',
    bounded: 'Solution set is bounded',
    unbounded: 'Solution set is unbounded',
    particularSolution: 'Finding a Particular Solution',
    backwardSubstitution: 'Backward Substitution',
    substitutingInto: 'substituting into system',
    validInterval: 'Valid interval',
    chosenValue: 'Selected value',
    finalParticularSolution: 'Particular Solution',
    verificationTitle: 'Verification (Original Inequalities)',
    verificationPassed: 'All inequalities satisfied!',
    verificationFailed: 'Inequality failed',
    addInequality: 'Add Inequality',
    removeInequality: 'Delete',
    addVariable: 'Add Variable',
    removeVariable: 'Remove Variable',
    exportLatex: 'Copy LaTeX',
    copiedLatex: 'Copied!',
    theoryTitle: 'Fourier-Motzkin Elimination Theory',
    theoryDesc: 'Fourier-Motzkin elimination is the linear inequality equivalent of Gaussian elimination, projecting the solution space by pairing all upper and lower bounds until consistency and boundedness can be deduced.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('kz');

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
