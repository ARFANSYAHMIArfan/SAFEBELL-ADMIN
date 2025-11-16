import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ReportForm from './components/ReportForm';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import MaintenanceLock from './components/MaintenanceLock';
import { UserRole, WebsiteSettings, Session } from './types';
import { isUnlockValid, clearUnlockTimestamp, getDarkModePreference, saveDarkModePreference } from './utils/storage';
import { fetchGlobalSettings, defaultSettings } from './services/settingsService';
import { createSession, validateSession, deleteSession } from './services/sessionService';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('none');
  const [session, setSession] = useState<Session | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');
  const [settings, setSettings] = useState<WebsiteSettings>({ isFormDisabled: false, isMaintenanceLockEnabled: false, maintenancePin: '' });
  const [isLocked, setIsLocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getDarkModePreference());
  const [isLoading, setIsLoading] = useState(true);

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
    // One-time session check on initial load
    const checkSession = async () => {
        const storedSessionId = localStorage.getItem('sessionId');
        if (storedSessionId) {
            const validSession = await validateSession(storedSessionId);
            if (validSession) {
                setSession(validSession);
                setUserRole(validSession.role);
                setCurrentPage('dashboard');
            } else {
                localStorage.removeItem('sessionId');
            }
        }
    };
    checkSession();

    // Real-time listener for global settings
    const settingsDocRef = doc(db, 'config', 'global-settings');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
        const globalSettings = docSnap.exists()
            ? { ...defaultSettings, ...(docSnap.data() as WebsiteSettings) }
            : defaultSettings;
        
        setSettings(globalSettings); // Keep settings state updated

        const unlocked = isUnlockValid();
        const shouldBeLocked = globalSettings.isMaintenanceLockEnabled && !unlocked;

        if (shouldBeLocked) {
            // If a lock is triggered, we should also clear any logged-in state
            // to prevent being logged in behind the lock screen.
            if (session) {
                // No need to hit DB, just clear client-side state
                localStorage.removeItem('sessionId');
                setSession(null);
                setUserRole('none');
                setCurrentPage('home');
            }
        } else if (!globalSettings.isMaintenanceLockEnabled) {
             // If lock is disabled globally, ensure any unlock timestamp is cleared.
            clearUnlockTimestamp();
        }
        
        setIsLocked(shouldBeLocked); // This is the single source of truth for the lock screen.

        // Make sure loading screen is removed
        if (isLoading) {
            setIsLoading(false);
        }

    }, (error) => {
        console.error("Firebase settings listener error:", error);
        // Fallback to a single fetch
        fetchGlobalSettings().then(fbSettings => {
            setSettings(fbSettings);
            const unlocked = isUnlockValid();
            setIsLocked(fbSettings.isMaintenanceLockEnabled && !unlocked);
        }).finally(() => {
            if (isLoading) setIsLoading(false);
        });
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [session, isLoading]);
  
  const handleSettingsChange = (newSettings: WebsiteSettings) => {
    setSettings(newSettings);
    const unlocked = isUnlockValid();
    if (!newSettings.isMaintenanceLockEnabled) {
        setIsLocked(false);
        clearUnlockTimestamp();
    } else if (newSettings.isMaintenanceLockEnabled && !unlocked) {
        setIsLocked(true);
    }
  };

  const handleLoginSuccess = async (role: UserRole, userId: string) => {
    if (role === 'admin' || role === 'teacher' || role === 'superadmin') {
        const newSession = await createSession(role, userId);
        localStorage.setItem('sessionId', newSession.id);
        setSession(newSession);
        setUserRole(role);
        setShowLoginModal(false);
        setCurrentPage('dashboard');
    }
  };

  const handleLogout = async () => {
    if (session) {
      await deleteSession(session.id);
    }
    localStorage.removeItem('sessionId');
    setSession(null);
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
  
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F4EF] dark:bg-gray-900 text-[#3D405B] dark:text-gray-300">
            <p>Memuatkan aplikasi...</p>
        </div>
    );
  }

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
                session={session}
                userRole={userRole} 
                onLogout={handleLogout} 
                onNavigateHome={navigateToHome} 
                onSettingsChange={handleSettingsChange}
             />
          )}
        </div>
      </main>

      <footer className="text-center p-4 text-xs text-gray-500 dark:text-gray-400">
        <p>© 2025 KitaBUDDY:#JOMCEGAHBULI. Hak Cipta Terpelihara. Dikuasakan Oleh Teknologi AI Anonim.</p>
      </footer>
    </div>
  );
};

export default App;