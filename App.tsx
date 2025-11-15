import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ReportForm from './components/ReportForm';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import MaintenanceLock from './components/MaintenanceLock';
import { UserRole, WebsiteSettings } from './types';
import { getSettings } from './utils/storage';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('none');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');
  const [settings, setSettings] = useState<WebsiteSettings>(getSettings());
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const savedSettings = getSettings();
    setSettings(savedSettings);
    const unlocked = sessionStorage.getItem('siteUnlocked') === 'true';
    if (savedSettings.isMaintenanceLockEnabled && !unlocked) {
      setIsLocked(true);
    }
  }, []);
  
  const handleSettingsChange = (newSettings: WebsiteSettings) => {
    setSettings(newSettings);
    // Re-evaluate lock status if maintenance mode was just turned off
    const unlocked = sessionStorage.getItem('siteUnlocked') === 'true';
    if (!newSettings.isMaintenanceLockEnabled) {
        setIsLocked(false);
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
    <div className="min-h-screen bg-[#F8F4EF] text-[#3D405B] font-sans">
      <Header 
        userRole={userRole}
        onLoginClick={() => setShowLoginModal(true)}
        onDashboardClick={navigateToDashboard}
        onHomeClick={navigateToHome}
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

      <footer className="text-center p-4 text-xs text-gray-500">
        <p>© 2025 KitaBUDDY:#JOMCEGAHBULI. Hak Cipta Terpelihara. Dikuasakan oleh Teknologi Anonim AI.</p>
      </footer>
    </div>
  );
};

export default App;
