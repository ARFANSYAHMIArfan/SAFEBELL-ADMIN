import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ReportForm from './components/ReportForm';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import MaintenanceLock from './components/MaintenanceLock';
import { UserRole, WebsiteSettings } from './types';
import { getSettings, isUnlockValid, clearUnlockTimestamp, getDarkModePreference, saveDarkModePreference } from './utils/storage';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('none');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');
  const [settings, setSettings] = useState<WebsiteSettings>(getSettings());
  const [isLocked, setIsLocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getDarkModePreference());

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveDarkModePreference(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const savedSettings = getSettings();
    setSettings(savedSettings);
    const unlocked = isUnlockValid();
    if (savedSettings.isMaintenanceLockEnabled && !unlocked) {
      setIsLocked(true);
    }
  }, []);
  
  const handleSettingsChange = (newSettings: WebsiteSettings) => {
    setSettings(newSettings);
    const unlocked = isUnlockValid();
    if (!newSettings.isMaintenanceLockEnabled) {
        setIsLocked(false);
        clearUnlockTimestamp(); // If lock is disabled, clear any existing unlock timer.
    } else if (newSettings.isMaintenanceLockEnabled && !unlocked) {
        setIsLocked(true);
    }
  };

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    setShowLoginModal(false);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUserRole('none');
    setCurrentPage('home');
  };
  
  const navigateToDashboard = () => {
    if (userRole !== 'none') {
      setCurrentPage('dashboard');
    }
  };

  const navigateToHome = () => {
    setCurrentPage('home');
  };

  if (isLocked) {
    return <MaintenanceLock onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F4EF] dark:bg-gray-900 text-[#3D405B] dark:text-gray-300 font-sans transition-colors duration-300">
      <Header 
        userRole={userRole}
        onLoginClick={() => setShowLoginModal(true)}
        onDashboardClick={navigateToDashboard}
        onHomeClick={navigateToHome}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />
      
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {currentPage === 'home' && <ReportForm settings={settings} />}
          {currentPage === 'dashboard' && userRole !== 'none' && (
             <Dashboard 
                userRole={userRole} 
                onLogout={handleLogout} 
                onNavigateHome={navigateToHome} 
                onSettingsChange={handleSettingsChange}
             />
          )}
        </div>
      </main>

      <footer className="text-center p-4 text-xs text-gray-500 dark:text-gray-400">
        <p>© 2025 KitaBUDDY:#JOMCEGAHBULI. Hak Cipta Terpelihara. Dikuasakan oleh Teknologi Anonim AI.</p>
      </footer>
    </div>
  );
};

export default App;