export type Letter = 'A' | 'B' | 'C' | 'D';
export type Question = {
  prompt: string;
  options: { letter: Letter; text: string }[];
  correct: Letter;
  explanation: string;
};

export const questions: Question[] = [
  {
    prompt: 'Which organelle carries out oxidative phosphorylation and is the main source of ATP in eukaryotic cells?',
    options: [
      { letter: 'A', text: 'Golgi apparatus' },
      { letter: 'B', text: 'Rough endoplasmic reticulum' },
      { letter: 'C', text: 'Lysosome' },
      { letter: 'D', text: 'Mitochondrion' },
    ],
    correct: 'D',
    explanation: 'The mitochondrion houses the electron transport chain and ATP synthase on its inner membrane, making it the main site of oxidative phosphorylation.',
  },
  {
    prompt: 'A solution has a hydrogen ion concentration of 1 × 10⁻³ mol/L. What is its pH?',
    options: [
      { letter: 'A', text: '3' },
      { letter: 'B', text: '7' },
      { letter: 'C', text: '11' },
      { letter: 'D', text: '0.003' },
    ],
    correct: 'A',
    explanation: 'pH is defined as −log₁₀[H⁺], so −log₁₀(10⁻³) = 3.',
  },
];

export const maxScore = 10;
