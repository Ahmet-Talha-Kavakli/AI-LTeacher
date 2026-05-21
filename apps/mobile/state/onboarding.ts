import { create } from "zustand";
import type { LanguageCode, AccentCode, PlacementAnswer } from "@ailt/shared";

interface OnboardingState {
  language: LanguageCode | null;
  accent: AccentCode | null;
  answers: PlacementAnswer[];
  setLanguage: (l: LanguageCode) => void;
  setAccent: (a: AccentCode) => void;
  setAnswers: (a: PlacementAnswer[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  language: null,
  accent: null,
  answers: [],
  setLanguage: (language) => set({ language }),
  setAccent: (accent) => set({ accent }),
  setAnswers: (answers) => set({ answers }),
  reset: () => set({ language: null, accent: null, answers: [] }),
}));
