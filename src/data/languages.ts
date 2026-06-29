import type { Language, Level } from '../types'

/** Languages with a healthy Wikipedia + decent browser speech-recognition support. */
export const LANGUAGES: Language[] = [
  { code: 'es', speechTag: 'es-ES', name: 'Spanish', endonym: 'Español', flag: '🇪🇸' },
  { code: 'fr', speechTag: 'fr-FR', name: 'French', endonym: 'Français', flag: '🇫🇷' },
  { code: 'de', speechTag: 'de-DE', name: 'German', endonym: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', speechTag: 'it-IT', name: 'Italian', endonym: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', speechTag: 'pt-PT', name: 'Portuguese', endonym: 'Português', flag: '🇵🇹' },
  { code: 'nl', speechTag: 'nl-NL', name: 'Dutch', endonym: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', speechTag: 'en-US', name: 'English', endonym: 'English', flag: '🇬🇧' },
  { code: 'ru', speechTag: 'ru-RU', name: 'Russian', endonym: 'Русский', flag: '🇷🇺' },
  { code: 'ja', speechTag: 'ja-JP', name: 'Japanese', endonym: '日本語', flag: '🇯🇵' },
  { code: 'zh', speechTag: 'zh-CN', name: 'Chinese', endonym: '中文', flag: '🇨🇳' },
]

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Beginner', hint: 'Short, simple articles' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Everyday general knowledge' },
  { id: 'advanced', label: 'Advanced', hint: 'Longer, denser articles' },
]

export function languageByCode(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}
