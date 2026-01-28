import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import commonFr from './locales/fr/common.json'
import commonEn from './locales/en/common.json'
import commonAr from './locales/ar/common.json'
import attendanceFr from './locales/fr/attendance.json'
import attendanceEn from './locales/en/attendance.json'
import attendanceAr from './locales/ar/attendance.json'
import fingerprintFr from './locales/fr/fingerprint.json'
import fingerprintEn from './locales/en/fingerprint.json'
import fingerprintAr from './locales/ar/fingerprint.json'

// Configure i18n
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'fr',
    
    // Allowed languages
    supportedLngs: ['fr', 'en', 'ar'],
    
    // Disable loading from backend
    load: 'languageOnly',
    
    // Language detection configuration
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      
      // Keys to lookup language from
      lookupLocalStorage: 'i18nextLng',
      
      // Cache user language
      caches: ['localStorage'],
    },
    
    // Translation resources
    resources: {
      fr: {
        common: commonFr,
        attendance: attendanceFr,
        fingerprint: fingerprintFr,
      },
      en: {
        common: commonEn,
        attendance: attendanceEn,
        fingerprint: fingerprintEn,
      },
      ar: {
        common: commonAr,
        attendance: attendanceAr,
        fingerprint: fingerprintAr,
      },
    },
    
    // Default namespace
    defaultNS: 'common',
    
    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
    
    // React options
    react: {
      // Wait for translations before rendering
      useSuspense: true,
    },
  })

export default i18n
