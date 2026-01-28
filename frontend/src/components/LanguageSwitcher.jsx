import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon, CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

const languages = [
  {
    code: 'fr',
    name: 'Français',
    flag: 'https://flagcdn.com/fr.svg',
    flagAlt: 'French flag',
    dir: 'ltr'
  },
  {
    code: 'en',
    name: 'English',
    flag: 'https://flagcdn.com/gb.svg',
    flagAlt: 'British flag',
    dir: 'ltr'
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: 'https://flagcdn.com/sa.svg',
    flagAlt: 'Saudi Arabian flag',
    dir: 'rtl'
  },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode) => {
    const selectedLang = languages.find(lang => lang.code === langCode)

    // Change language
    i18n.changeLanguage(langCode)

    // Update document direction and lang attribute
    document.documentElement.dir = selectedLang.dir
    document.documentElement.lang = langCode

    // Store in localStorage (handled by i18next-browser-languagedetector)
    localStorage.setItem('i18nextLng', langCode)
  }

  return (
    <Menu as="div" className="relative inline-block">
      <Menu.Button className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-neutral-charcoal border border-white/70 bg-white/80 shadow-sm backdrop-blur hover:-translate-y-0.5 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/30">
        <span className="relative inline-flex h-6 w-9 items-center justify-center overflow-hidden rounded-full border border-neutral-medium/60 bg-gradient-to-r from-neutral-light via-white to-neutral-light shadow-inner">
          <img
            src={currentLanguage.flag}
            alt={currentLanguage.flagAlt}
            className="h-5 w-5 rounded object-cover"
          />
        </span>
        <span className="hidden md:inline text-sm font-medium">{currentLanguage.name}</span>
        <ChevronDownIcon className="h-4 w-4 text-neutral-dark" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-xl bg-white/95 shadow-2xl ring-1 ring-black/5 border border-neutral-medium/40 focus:outline-none overflow-hidden backdrop-blur">
          <div className="px-4 py-3 bg-neutral-light/60 border-b border-neutral-medium/50 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-charcoal">
            <GlobeAltIcon className="h-4 w-4 text-primary" />
            {i18n.t('nav.languageSelector', { defaultValue: 'Select Language' })}
          </div>
          <div className="p-1.5 space-y-1">
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => {
                  const isActiveLang = currentLanguage.code === language.code
                  return (
                    <button
                      onClick={() => changeLanguage(language.code)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${active ? 'bg-neutral-light/80' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-7 w-10 items-center justify-center rounded-md border border-neutral-medium/60 bg-white shadow-inner">
                          <img
                            src={language.flag}
                            alt={language.flagAlt}
                            className="h-5 w-5 rounded object-cover"
                          />
                        </span>
                        <span className={`font-medium ${isActiveLang ? 'text-primary' : 'text-neutral-charcoal'}`}>
                          {language.name}
                        </span>
                      </div>
                      {isActiveLang && (
                        <CheckIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                      )}
                    </button>
                  )
                }}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
