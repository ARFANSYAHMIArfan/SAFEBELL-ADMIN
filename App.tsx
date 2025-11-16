import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ReportForm from './components/ReportForm';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import MaintenanceLock from './components/MaintenanceLock';
import KioskPinModal from './components/KioskPinModal';
import KioskLockoutScreen from './components/KioskLockoutScreen';
import { UserRole, WebsiteSettings, Session } from './types';
import { isUnlockValid, clearUnlockTimestamp, getDarkModePreference, saveDarkModePreference } from './utils/storage';
import { fetchGlobalSettings, defaultSettings } from './services/settingsService';
import { createSession, validateSession, deleteSession } from './services/sessionService';
// FIX: Updated firebase/firestore import to use the scoped package @firebase/firestore
import { onSnapshot, doc } from '@firebase/firestore';
import { db } from './services/firebaseConfig';
import { lockUser, unlockUser } from './services/userService';
import { sendSecurityAlert } from './services/telegramService';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('none');
  const [session, setSession] = useState<Session | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showKioskPinModal, setShowKioskPinModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');
  const [settings, setSettings] = useState<WebsiteSettings>({ isFormDisabled: false, isMaintenanceLockEnabled: false, maintenancePin: '' });
  const [isLocked, setIsLocked] = useState(false);
  const [isKioskLockedOut, setIsKioskLockedOut] = useState(false);
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
                // Don't auto-navigate kiosk to dashboard on refresh
                if (validSession.role !== 'kiosk_enabled_device') {
                    setCurrentPage('dashboard');
                }
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
            if (session) {
                localStorage.removeItem('sessionId');
                setSession(null);
                setUserRole('none');
                setCurrentPage('home');
            }
        } else if (!globalSettings.isMaintenanceLockEnabled) {
            clearUnlockTimestamp();
        }
        
        setIsLocked(shouldBeLocked);

        if (isLoading) {
            setIsLoading(false);
        }

    }, (error) => {
        console.error("Firebase settings listener error:", error);
        fetchGlobalSettings().then(fbSettings => {
            setSettings(fbSettings);
            const unlocked = isUnlockValid();
            setIsLocked(fbSettings.isMaintenanceLockEnabled && !unlocked);
        }).finally(() => {
            if (isLoading) setIsLoading(false);
        });
    });

    return () => unsubscribe();
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

  const handleLoginSuccess = async (role: UserRole, userId: string, docId: string) => {
    const newSession = await createSession(role, userId, docId);
    localStorage.setItem('sessionId', newSession.id);
    setSession(newSession);
    setUserRole(role);
    setShowLoginModal(false);

    if (role === 'kiosk_enabled_device') {
        setCurrentPage('home');
    } else if (role === 'admin' || role === 'teacher' || role === 'superadmin') {
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
    if (userRole === 'kiosk_enabled_device') {
        setShowKioskPinModal(true);
    } else if (userRole !== 'none') {
        setCurrentPage('dashboard');
    }
  };

  const navigateToHome = () => {
    setCurrentPage('home');
  };

  const handleKioskPinSuccess = () => {
    setShowKioskPinModal(false);
    setCurrentPage('dashboard');
  };

  const handleKioskLockout = async () => {
    if (!session) return;
    
    setShowKioskPinModal(false); // Close the PIN modal
    await lockUser(session.docId);

    // Fetch IP and send alert
    let ipAddress = 'Tidak dapat dikesan';
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
    } catch (e) {
        console.error("Could not fetch IP address:", e);
    }

    await sendSecurityAlert({
        userId: session.userId,
        role: session.role,
        ipAddress: ipAddress
    });

    setIsKioskLockedOut(true);
  };
  
  const handleKioskUnlock = async () => {
    if (!session) return;
    
    await unlockUser(session.docId);
    setIsKioskLockedOut(false);
    // Optionally, navigate home or log out after unlock for security
    setCurrentPage('home');
  };
  
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F4EF] dark:bg-gray-900 text-[#3D405B] dark:text-gray-300">
            <p>Memuatkan aplikasi...</p>
        </div>
    );
  }

  if (isKioskLockedOut) {
    return <KioskLockoutScreen settings={settings} onUnlock={handleKioskUnlock} />;
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

      {showKioskPinModal && (
        <KioskPinModal
            onClose={() => setShowKioskPinModal(false)}
            onSuccess={handleKioskPinSuccess}
            onLockout={handleKioskLockout}
            settings={settings}
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
