import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'fr' | 'en' | 'ht';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.students': 'Étudiants',
    'nav.courses': 'Cours',
    'nav.grades': 'Notes',
    'nav.settings': 'Paramètres',
    'nav.back': 'Retour',
    'nav.logout': 'Déconnexion',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Configurez vos préférences et paramètres du système',
    'settings.profile': 'Profil',
    'settings.notifications': 'Notifications',
    'settings.appearance': 'Apparence',
    'settings.security': 'Sécurité',
    'settings.academic': 'Académique',
    'settings.data': 'Données',
    
    // Profile
    'profile.title': 'Informations du profil',
    'profile.firstName': 'Prénom',
    'profile.lastName': 'Nom',
    'profile.email': 'Email',
    'profile.phone': 'Téléphone',
    'profile.bio': 'Biographie',
    'profile.address': 'Adresse',
    'profile.birthDate': 'Date de naissance',
    'profile.department': 'Département',
    'profile.position': 'Poste/Fonction',
    'profile.changePhoto': 'Changer la photo',
    'profile.save': 'Sauvegarder le profil',
    
    // Common
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.search': 'Rechercher',
    'common.loading': 'Chargement...',
    'common.success': 'Succès',
    'common.error': 'Erreur',
    
    // Theme
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.system': 'Système',
    
    // Languages
    'language.french': 'Français',
    'language.english': 'English',
    'language.haitian': 'Krèyol Ayisyen',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Students',
    'nav.courses': 'Courses',
    'nav.grades': 'Grades',
    'nav.settings': 'Settings',
    'nav.back': 'Back',
    'nav.logout': 'Logout',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure your preferences and system settings',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.appearance': 'Appearance',
    'settings.security': 'Security',
    'settings.academic': 'Academic',
    'settings.data': 'Data',
    
    // Profile
    'profile.title': 'Profile Information',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.bio': 'Biography',
    'profile.address': 'Address',
    'profile.birthDate': 'Birth Date',
    'profile.department': 'Department',
    'profile.position': 'Position',
    'profile.changePhoto': 'Change Photo',
    'profile.save': 'Save Profile',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    
    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Languages
    'language.french': 'Français',
    'language.english': 'English',
    'language.haitian': 'Krèyol Ayisyen',
  },
  ht: {
    // Navigation
    'nav.dashboard': 'Tablo Jesyon',
    'nav.students': 'Elèv yo',
    'nav.courses': 'Kou yo',
    'nav.grades': 'Nòt yo',
    'nav.settings': 'Paramèt yo',
    'nav.back': 'Tounen',
    'nav.logout': 'Dekonekte',
    
    // Settings
    'settings.title': 'Paramèt yo',
    'settings.subtitle': 'Konfigire preferans ou yo ak paramèt sistèm yo',
    'settings.profile': 'Pwofil',
    'settings.notifications': 'Notifikasyon yo',
    'settings.appearance': 'Aparans',
    'settings.security': 'Sekirite',
    'settings.academic': 'Akademik',
    'settings.data': 'Done yo',
    
    // Profile
    'profile.title': 'Enfòmasyon Pwofil',
    'profile.firstName': 'Non',
    'profile.lastName': 'Siyati',
    'profile.email': 'Email',
    'profile.phone': 'Telefòn',
    'profile.bio': 'Byografi',
    'profile.address': 'Adrès',
    'profile.birthDate': 'Dat Nesans',
    'profile.department': 'Depatman',
    'profile.position': 'Pozisyon',
    'profile.changePhoto': 'Chanje Foto',
    'profile.save': 'Anrejistre Pwofil',
    
    // Common
    'common.save': 'Anrejistre',
    'common.cancel': 'Anile',
    'common.edit': 'Modifye',
    'common.delete': 'Efase',
    'common.search': 'Chèche',
    'common.loading': 'Ap chaje...',
    'common.success': 'Siksè',
    'common.error': 'Erè',
    
    // Theme
    'theme.light': 'Klè',
    'theme.dark': 'Fonse',
    'theme.system': 'Sistèm',
    
    // Languages
    'language.french': 'Français',
    'language.english': 'English',
    'language.haitian': 'Krèyol Ayisyen',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('fr');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};