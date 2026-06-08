import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { pt } from './locales/pt';

const i18n = new I18n({ pt });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'pt';
i18n.enableFallback = true;
i18n.defaultLocale = 'pt';

export const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, options);
