import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { createMMKV } from "react-native-mmkv";
import i18n, { type AppLanguage, getDeviceLanguage } from "@/lib/i18n";

const storage = createMMKV({ id: "suno-locale" });

const mmkvStringStorage: StateStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => {
    storage.set(key, value);
  },
  removeItem: (key) => {
    storage.remove(key);
  },
};

interface LocaleState {
  appLanguage: AppLanguage | null;
  hasPicked: boolean;
  setAppLanguage: (lang: AppLanguage) => void;
  resetLanguage: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      appLanguage: null,
      hasPicked: false,
      setAppLanguage: (lang) => {
        i18n.changeLanguage(lang).catch(() => {});
        set({ appLanguage: lang, hasPicked: true });
      },
      resetLanguage: () => {
        const device = getDeviceLanguage();
        i18n.changeLanguage(device).catch(() => {});
        set({ appLanguage: null, hasPicked: false });
      },
    }),
    {
      name: "suno-locale-v1",
      storage: createJSONStorage(() => mmkvStringStorage),
    },
  ),
);

export function resolveActiveLanguage(state: LocaleState): AppLanguage {
  return state.appLanguage ?? getDeviceLanguage();
}
