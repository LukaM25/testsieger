export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';
export const LOCALE_COOKIE = 'lang';

export function normalizeLocale(value?: string | null): Locale {
  const v = (value || '').toLowerCase();
  return v === 'en' ? 'en' : 'de';
}

type Messages = Record<string, string>;

const shared: Record<Locale, Messages> = {
  de: {
    'nav.services': 'Leistungen',
    'nav.overview': 'Übersicht',
    'nav.plans': 'Lizenzpläne',
    'nav.productTest': 'Produkt Test',
    'nav.trainingCheck': 'Ausbildungs Check',
    'nav.licensing': 'Lizenzverwaltung',
    'nav.company': 'Unternehmen',
    'nav.careers': 'Karriere',
    'nav.contact': 'Kontakt',
    'nav.portal': 'Kundenportal',
    'nav.login': 'Login',
    'nav.menu': 'Menü',
    'nav.menu.open': 'Menü öffnen',
    'nav.menu.close': 'Menü schließen',
    'search.placeholder': 'Suche auf der Seite...',
    'search.aria': 'Suche',
    'profile.loading': 'Lade...',
    'profile.admin': 'Admin',
    'profile.signin': 'Anmelden',
    'profile.loginTitle': 'Mit Kundenkonto anmelden',
    'profile.email': 'E-Mail',
    'profile.password': 'Passwort',
    'profile.loginButton': 'Einloggen',
    'profile.loginChecking': 'Wird geprüft…',
    'profile.classicLogin': 'Zum klassischen Login',
    'profile.adminHint': 'Admin? Tragen Sie im E-Mail-Feld „Admin“ ein und nutzen Sie das Admin-Passwort.',
    'profile.register': 'Registrieren',
    'profile.registering': 'Registriere…',
    'profile.backToLogin': 'Zurück zum Login',
    'profile.name': 'Name',
    'profile.logout': 'Logout',
    'profile.dashboard': 'Dashboard',
    'profile.adminDashboard': 'Admin Dashboard',
    'profile.adminTitle': 'Administrator',
    'lang.label': 'Sprache',
    'lang.de': 'Deutsch',
    'lang.en': 'Englisch',
    'notice.unverified': 'Hinweis: Translation not checked',
  },
  en: {
    'nav.services': 'Services',
    'nav.overview': 'Overview',
    'nav.plans': 'License plans',
    'nav.productTest': 'Product Test',
    'nav.trainingCheck': 'Training Check',
    'nav.licensing': 'License Management',
    'nav.company': 'Company',
    'nav.careers': 'Careers',
    'nav.contact': 'Contact',
    'nav.portal': 'Customer Portal',
    'nav.login': 'Login',
    'nav.menu': 'Menu',
    'nav.menu.open': 'Open menu',
    'nav.menu.close': 'Close menu',
    'search.placeholder': 'Search the site...',
    'search.aria': 'Search',
    'profile.loading': 'Loading...',
    'profile.admin': 'Admin',
    'profile.signin': 'Sign in',
    'profile.loginTitle': 'Sign in with your account',
    'profile.email': 'Email',
    'profile.password': 'Password',
    'profile.loginButton': 'Sign in',
    'profile.loginChecking': 'Checking…',
    'profile.classicLogin': 'Go to classic login',
    'profile.adminHint': 'Admin? Enter “Admin” as email and use the admin password.',
    'profile.register': 'Register',
    'profile.registering': 'Registering…',
    'profile.backToLogin': 'Back to login',
    'profile.name': 'Name',
    'profile.logout': 'Logout',
    'profile.dashboard': 'Dashboard',
    'profile.adminDashboard': 'Admin Dashboard',
    'profile.adminTitle': 'Administrator',
    'lang.label': 'Language',
    'lang.de': 'German',
    'lang.en': 'English',
    'notice.unverified': 'Notice: Translation not checked',
  },
};

export function translate(locale: Locale, key: string, fallback?: string) {
  return shared[locale]?.[key] ?? shared[DEFAULT_LOCALE][key] ?? fallback ?? key;
}
