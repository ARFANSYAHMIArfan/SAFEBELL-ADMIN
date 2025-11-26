import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, Report, WebsiteSettings, Session, UserCredentials } from '../types';
import { UI_TEXT } from '../constants';
import { 
    LogoutIcon, SettingsIcon, ShieldIcon, TrashIcon, ChevronDownIcon, 
    ShareIcon, DownloadIcon, ArchiveBoxIcon, BellIcon, ServerIcon, 
    DatabaseIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, UploadIcon, UserGroupIcon,
    EyeIcon, EyeSlashIcon, FileTextIcon, MediaIcon
} from './icons';
import { deleteReport, mergeAndSaveReports, getReports } from '../utils/storage';
import { fetchGlobalSettings, updateGlobalSettings } from '../services/settingsService';
import { downloadAsPdf, downloadAsDocx, downloadAsCsv } from '../services/downloadService';
import { 
    checkTelegramApi, checkCerebrasConfig, checkOpenAIConfig, checkRequestyConfig,
    getReportCount, checkPermissions, SystemStatus, checkFirebaseStatus
} from '../utils/statusCheck';
// FIX: Updated firebase/firestore import to use the scoped package @firebase/firestore
import { onSnapshot, collection, query, orderBy } from '@firebase/firestore';
import { db } from '../services/firebaseConfig';
import DebugPanel from './DebugPanel';
import { getUsers, addUser, deleteUser as deleteUserService, getUserPassword, validateLogin, lockUser, unlockUser } from '../services/userService';
import AdminLockUnlockModal from './AdminLockUnlockModal';


declare const saveAs: any;

interface DashboardProps {
  session: Session | null;
  userRole: UserRole;
  onLogout: () => void;
  onNavigateHome: () => void;
  onSettingsChange: (settings: WebsiteSettings) => void;
}

const getRoleDisplayName = (role: UserRole) => {
    switch(role) {
        case 'superadmin': return 'Super Admin';
        case 'admin': return 'Admin';
        case 'teacher': return 'Guru';
        case 'kiosk_enabled_device': return 'Peranti Kiosk';
        default: return role;
    }
}

export default function Dashboard({ session, userRole, onLogout, onNavigateHome, onSettingsChange }: DashboardProps): React.JSX.Element {
    const roleText = getRoleDisplayName(userRole);
    
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);
    const [settings, setSettings] = useState<WebsiteSettings>({ isFormDisabled: false, isMaintenanceLockEnabled: false, maintenancePin: '', fallbackOpenAIKey: '', fallbackCerebrasKey: '', fallbackRequestyKey: '' });
    const [savedSettings, setSavedSettings] = useState<WebsiteSettings>({ isFormDisabled: false, isMaintenanceLockEnabled: false, maintenancePin: '', fallbackOpenAIKey: '', fallbackCerebrasKey: '', fallbackRequestyKey: '' });
    const [backupOpenAIKeyInput, setBackupOpenAIKeyInput] = useState('');
    const [backupCerebrasKeyInput, setBackupCerebrasKeyInput] = useState('');
    const [backupRequestyKeyInput, setBackupRequestyKeyInput] = useState('');
    const [activeTab, setActiveTab] = useState<'reports' | 'media' | 'settings' | 'admin' | 'debug'>('reports');
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
    const [showDownloadOptions, setShowDownloadOptions] = useState<string | null>(null);
    const [showDownloadPinModal, setShowDownloadPinModal] = useState(false);
    const [downloadPin, setDownloadPin] = useState('');
    const [downloadPinError, setDownloadPinError] = useState('');
    const [notification, setNotification] = useState<{ id: string; message: string } | null>(null);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const reportsRef = useRef<Report[]>([]);

    // Admin Panel State
    const [adminUsers, setAdminUsers] = useState<UserCredentials[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [showAdminPinModal, setShowAdminPinModal] = useState(false);
    const [adminPinModalConfig, setAdminPinModalConfig] = useState<{ action: 'delete' | 'view'; user: UserCredentials | null }>({ action: 'delete', user: null });
    const [adminActionPin, setAdminActionPin] = useState('');
    const [adminActionPinError, setAdminActionPinError] = useState('');
    const [newUserId, setNewUserId] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('teacher');
    const [userToModify, setUserToModify] = useState<UserCredentials | null>(null);
    const [showLockUnlockModal, setShowLockUnlockModal] = useState(false);

    // Super Admin PIN Management State
    const [maintenancePinInput, setMaintenancePinInput] = useState('');
    const [masterResetPinInput, setMasterResetPinInput] = useState('');
    const [adminActionPinInput, setAdminActionPinInput] = useState('');
    const [adminDownloadPinInput, setAdminDownloadPinInput] = useState('');
    const [showMasterPinModal, setShowMasterPinModal] = useState(false);
    const [masterPinPassword, setMasterPinPassword] = useState('');
    const [masterPinError, setMasterPinError] = useState('');
    const [showMasterPins, setShowMasterPins] = useState(false);


    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const users = await getUsers();
            setAdminUsers(users);
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'admin' && (userRole === 'admin' || userRole === 'superadmin')) {
            fetchUsers();
        }
    }, [activeTab, userRole, fetchUsers]);


    useEffect(() => {
        reportsRef.current = reports;
    }, [reports]);

    useEffect(() => {
        setIsLoadingReports(true);
        const reportsCollection = collection(db, 'reports');
        const q = query(reportsCollection, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedReports: Report[] = [];
            const isInitialLoad = reportsRef.current.length === 0;

            querySnapshot.forEach((doc) => {
                fetchedReports.push(doc.data() as Report);
            });

            if (!isInitialLoad && fetchedReports.length > reportsRef.current.length) {
                const newReport = fetchedReports[0]; 
                const isTrulyNew = !reportsRef.current.some(r => r.id === newReport.id);
                if (isTrulyNew) {
                    setNotification({
                        id: newReport.id,
                        message: `${UI_TEXT.NEW_REPORT_NOTIFICATION} (Jenis: ${newReport.type})`,
                    });
                }
            }
            
            setReports(fetchedReports);
            setIsLoadingReports(false);
        }, (error) => {
            console.error("Error listening to reports collection:", error);
            setIsLoadingReports(false);
        });

        fetchGlobalSettings().then(initialSettings => {
            setSettings(initialSettings);
            setSavedSettings(initialSettings);
            setBackupOpenAIKeyInput(initialSettings.fallbackOpenAIKey || '');
            setBackupCerebrasKeyInput(initialSettings.fallbackCerebrasKey || '');
            setBackupRequestyKeyInput(initialSettings.fallbackRequestyKey || '');
            
            // Init super admin pin inputs
            setMaintenancePinInput(initialSettings.maintenancePin || '');
            setMasterResetPinInput(initialSettings.masterResetPin || '');
            setAdminActionPinInput(initialSettings.adminActionPin || '');
            setAdminDownloadPinInput(initialSettings.adminDownloadPin || '');
        });

        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);
    
    const handleRunChecks = useCallback(async () => {
        setIsCheckingStatus(true);
        const [tg, reportCount, perms, openai, cerebras, requesty] = await Promise.all([
            checkTelegramApi(),
            getReportCount(),
            checkPermissions(),
            checkOpenAIConfig(),
            checkCerebrasConfig(),
            checkRequestyConfig()
        ]);
        const firebase = checkFirebaseStatus();
        
        setSystemStatus({
            telegram: tg,
            cerebras,
            requesty,
            openai,
            firebase,
            storage: reportCount,
            permissions: perms,
        });
        setIsCheckingStatus(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'settings' && (userRole === 'admin' || userRole === 'superadmin') && !systemStatus) {
            handleRunChecks();
        }
    }, [activeTab, userRole, systemStatus, handleRunChecks]);

    const handleSettingsSave = async () => {
        if (settings.isMaintenanceLockEnabled && !settings.maintenancePin) {
             alert('Sila tetapkan PIN penyelenggaraan di panel Super Admin sebelum mengaktifkan kunci.');
             setSettings(prev => ({...prev, isMaintenanceLockEnabled: false})); // Revert toggle
             return;
        }

        const newSettings: WebsiteSettings = { 
            ...settings, 
            fallbackOpenAIKey: backupOpenAIKeyInput,
            fallbackCerebrasKey: backupCerebrasKeyInput,
            fallbackRequestyKey: backupRequestyKeyInput
        };
        
        const wasPreviouslyLocked = savedSettings.isMaintenanceLockEnabled;
        const isNowLocked = newSettings.isMaintenanceLockEnabled;

        setIsSaving(true);
        try {
            await updateGlobalSettings(newSettings);
            setSettings(newSettings);
            setSavedSettings(newSettings);
            onSettingsChange(newSettings);
            alert('Selesai! Tetapan telah disimpan!');

            if (!wasPreviouslyLocked && isNowLocked) {
                setTimeout(() => {
                    alert('Anda telah log keluar untuk tujuan keselamatan selepas mengunci laman web.');
                    onLogout();
                }, 500);
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert('Gagal menyimpan tetapan. Sila cuba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmPinChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMasterPinError('');

        if (!session?.userId) {
            setMasterPinError("Sesi tidak sah. Sila log masuk semula.");
            return;
        }

        // Validate password
        const user = await validateLogin(session.userId, masterPinPassword);
        if (!user) {
            setMasterPinError("Kata laluan tidak sah.");
            return;
        }

        // Basic PIN validation
        if (maintenancePinInput && !/^\d{8}$/.test(maintenancePinInput)) {
            alert('PIN Penyelenggaraan mesti 8 digit nombor.');
            return;
        }

        const newPinSettings: Partial<WebsiteSettings> = {
            maintenancePin: maintenancePinInput,
            masterResetPin: masterResetPinInput,
            adminActionPin: adminActionPinInput,
            adminDownloadPin: adminDownloadPinInput,
        };

        const updatedSettings = { ...settings, ...newPinSettings };

        setIsSaving(true);
        try {
            await updateGlobalSettings(updatedSettings);
            setSettings(updatedSettings);
            setSavedSettings(updatedSettings);
            onSettingsChange(updatedSettings);

            alert('PIN Keselamatan Induk berjaya dikemas kini!');
            setShowMasterPinModal(false);
            setMasterPinPassword('');

        } catch (error) {
            alert(`Gagal mengemas kini PIN: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (window.confirm('Adakah anda pasti mahu memadam laporan ini?')) {
            try {
                await deleteReport(reportId);
            } catch (error) {
                console.error("Failed to delete report:", error);
                alert("Gagal memadam laporan.");
            }
        }
    };

    const toggleReport = (reportId: string) => {
        setExpandedReportId(expandedReportId === reportId ? null : reportId);
        setShowDownloadOptions(null);
    };

    const handleShareReport = async (report: Report) => {
        const shareText = `Laporan Kecemasan S.A.F.E\n\nID Laporan: ${report.id}\n\nButiran:\n${report.content}\n\nAnalisis AI:\n${report.analysis}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Laporan Kecemasan S.A.F.E - ID: ${report.id}`,
                    text: shareText,
                });
            } catch (error) {
                console.error('Gagal berkongsi:', error);
                alert(UI_TEXT.SHARE_ERROR);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                setCopiedReportId(report.id);
                setTimeout(() => setCopiedReportId(null), 2000);
            } catch (error) {
                console.error('Gagal menyalin:', error);
                alert('Gagal menyalin ke papan keratan.');
            }
        }
    };

    const handleClosePinModal = () => {
        setShowDownloadPinModal(false);
        setDownloadPin('');
        setDownloadPinError('');
    };

    const handleConfirmDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (downloadPin === settings.adminDownloadPin) {
            setDownloadPinError('');
            
            const allReports = await getReports();
            const dataStr = JSON.stringify(allReports, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const timestamp = new Date().toISOString().split('T')[0];
            saveAs(blob, `semua_laporan_safe_${timestamp}.json`);

            handleClosePinModal();
        } else {
            setDownloadPinError(UI_TEXT.INVALID_PIN);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const inputElement = event.target;
        if (!file) return;

        setUploadStatus(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("Gagal membaca kandungan fail.");
                }
                const importedReports: Report[] = JSON.parse(text);

                if (!Array.isArray(importedReports)) {
                    throw new Error("Fail JSON tidak sah. Ia sepatutnya mengandungi senarai (array) laporan.");
                }
                
                await mergeAndSaveReports(importedReports);
                
                setUploadStatus({ type: 'success', message: `Berjaya mengimport dan menggabungkan ${importedReports.length} laporan.` });
            } catch (error) {
                console.error("Gagal mengimport laporan:", error);
                const errorMessage = error instanceof Error ? error.message : "Ralat tidak diketahui berlaku.";
                setUploadStatus({ type: 'error', message: `Gagal mengimport: ${errorMessage}` });
            } finally {
                inputElement.value = '';
            }
        };

        reader.onerror = () => {
            setUploadStatus({ type: 'error', message: 'Gagal membaca fail.' });
            inputElement.value = '';
        };

        reader.readAsText(file);
    };

    const handleAddNewUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserId.trim() || !newUserPassword.trim()) {
            alert("ID Pengguna dan Kata Laluan mesti diisi.");
            return;
        }
        try {
            await addUser(newUserId, newUserPassword, newUserRole);
            alert("Pengguna baharu berjaya ditambah.");
            setNewUserId('');
            setNewUserPassword('');
            setNewUserRole('teacher');
            fetchUsers();
        } catch (error) {
            alert(`Gagal menambah pengguna: ${(error as Error).message}`);
        }
    };

    const closeAdminPinModal = () => {
        setShowAdminPinModal(false);
        setAdminActionPin('');
        setAdminActionPinError('');
        setAdminPinModalConfig({ action: 'delete', user: null });
    };

    const handleAdminAction = (action: 'delete' | 'view', user: UserCredentials) => {
        setAdminPinModalConfig({ action, user });
        setShowAdminPinModal(true);
    };

    const handleAdminPinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adminActionPin !== settings.adminActionPin) {
            setAdminActionPinError(UI_TEXT.INVALID_PIN);
            return;
        }

        const { action, user } = adminPinModalConfig;
        if (!user) return;

        try {
            if (action === 'delete') {
                if (user.id === session?.userId) {
                    alert("Anda tidak boleh memadam akaun anda sendiri.");
                } else {
                    if (window.confirm(`Adakah anda pasti mahu memadam pengguna "${user.id}"? Tindakan ini tidak boleh diubah.`)) {
                        await deleteUserService(user.docId);
                        alert(`Pengguna "${user.id}" telah dipadam.`);
                        fetchUsers();
                    }
                }
            } else if (action === 'view') {
                const password = await getUserPassword(user.docId);
                if (password) {
                    alert(`Kata Laluan untuk ${user.id}:\n\n${password}`);
                } else {
                    alert('Tidak dapat mengambil kata laluan.');
                }
            }
        } catch (error) {
            alert(`Operasi gagal: ${(error as Error).message}`);
        } finally {
            closeAdminPinModal();
        }
    };

    const handleLockUnlockClick = (user: UserCredentials) => {
        setUserToModify(user);
        setShowLockUnlockModal(true);
    };

    const handleConfirmLockUnlock = async (pin: string) => {
        if (!userToModify) return;
        if (pin !== settings.masterResetPin) {
            throw new Error("PIN Induk Tetapan Semula tidak sah.");
        }

        const action = userToModify.isLocked ? unlockUser : lockUser;
        const actionText = userToModify.isLocked ? 'dibuka' : 'dikunci';

        try {
            await action(userToModify.docId);
            alert(`Akaun untuk ${userToModify.id} telah berjaya ${actionText}.`);
            setShowLockUnlockModal(false);
            setUserToModify(null);
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error(`Failed to ${action} user:`, error);
            alert(`Gagal ${actionText} akaun: ${(error as Error).message}`);
        }
    };

    const textReports = reports.filter(r => r.type === 'text');
    const mediaReports = reports.filter(r => r.type === 'audio' || r.type === 'video');

    const renderReportList = (reportList: Report[]) => {
        if (isLoadingReports) {
            return <p className="text-gray-500 dark:text-gray-400 italic">Memuatkan laporan...</p>;
        }
        if (reportList.length === 0) {
            return <p className="text-gray-500 dark:text-gray-400 italic">Tiada laporan ditemui.</p>;
        }
        return (
            <div className="space-y-3">
                {reportList.map(report => (
                    <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                        <button onClick={() => toggleReport(report.id)} className="w-full flex justify-between items-center p-3 text-left">
                           <div className="flex items-center space-x-4">
                               <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-md font-bold tracking-wider">{report.id}</span>
                               <div>
                                   <span className="block font-semibold text-gray-800 dark:text-gray-200 capitalize">{report.type} Report</span>
                                   <span className="block text-xs text-gray-500 dark:text-gray-400">{new Date(report.timestamp).toLocaleString()}</span>
                               </div>
                           </div>
                           <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${expandedReportId === report.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedReportId === report.id && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Butiran Laporan:</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600 mt-1">{report.content}</p>
                                    </div>

                                    {(report.type === 'audio' || report.type === 'video') && (
                                        <div>
                                            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Pratonton Media:</h4>
                                            <div className="mt-2">
                                                {report.mediaUrl ? (
                                                    report.type === 'audio' ? (
                                                        <audio key={report.id} controls className="w-full" src={report.mediaUrl}>
                                                            Pelayar anda tidak menyokong elemen audio.
                                                        </audio>
                                                    ) : (
                                                        <video key={report.id} controls playsInline className="w-full max-w-md mx-auto rounded-lg bg-black" src={report.mediaUrl}>
                                                            Pelayar anda tidak menyokong tag video.
                                                        </video>
                                                    )
                                                ) : (
                                                    <p className="text-sm italic text-gray-500 dark:text-gray-400">
                                                        Pratonton media tidak tersedia. Fail mungkin telah dihantar sebagai rujukan sahaja.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Analisis AI:</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600 mt-1">{report.analysis}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <button onClick={() => handleShareReport(report)} className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900">
                                            <ShareIcon className="w-4 h-4" />
                                            <span>{copiedReportId === report.id ? UI_TEXT.COPIED_TO_CLIPBOARD : UI_TEXT.SHARE_REPORT}</span>
                                        </button>

                                        <div className="relative">
                                            <button onClick={() => setShowDownloadOptions(showDownloadOptions === report.id ? null : report.id)} className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">
                                                <DownloadIcon className="w-4 h-4" />
                                                <span>{UI_TEXT.DOWNLOAD_REPORT}</span>
                                            </button>
                                            {showDownloadOptions === report.id && (
                                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10">
                                                    <button onClick={() => { downloadAsPdf(report); setShowDownloadOptions(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        {UI_TEXT.SAVE_AS_PDF}
                                                    </button>
                                                    <button onClick={() => { downloadAsDocx(report); setShowDownloadOptions(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        {UI_TEXT.SAVE_AS_DOCX}
                                                    </button>
                                                    <button onClick={() => { downloadAsCsv(report); setShowDownloadOptions(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        {UI_TEXT.SAVE_AS_CSV}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {(userRole === 'admin' || userRole === 'superadmin') && (
                                             <button onClick={() => handleDeleteReport(report.id)} className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                                                <TrashIcon className="w-4 h-4" />
                                                <span>{UI_TEXT.DELETE_REPORT}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderStatusBadge = (statusItem: { status: 'ok' | 'error' | 'warn' | 'info'; message: string }) => {
        const styles = {
            ok: { icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />, text: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/50' },
            error: { icon: <XCircleIcon className="w-5 h-5 text-red-500" />, text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' },
            warn: { icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />, text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
            info: { icon: <DatabaseIcon className="w-5 h-5 text-blue-500" />, text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
        };
        const selected = styles[statusItem.status];
        return (
            <span className={`flex items-center space-x-2 px-2 py-1 text-xs font-medium rounded-full ${selected.bg} ${selected.text}`}>
                {selected.icon}
                <span>{statusItem.message}</span>
            </span>
        );
    };

    const renderSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Tetapan Laman</h3>
                <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Lumpuhkan Borang Laporan</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={settings.isFormDisabled} onChange={e => setSettings({...settings, isFormDisabled: e.target.checked})}/>
                            <div className={`block w-14 h-8 rounded-full ${settings.isFormDisabled ? 'bg-[#6B8A9E]' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.isFormDisabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Jika diaktifkan, pengguna tidak akan dapat menghantar laporan baharu dari halaman utama.</p>
                </div>
            </div>

            <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Aktifkan Kunci Penyelenggaraan</span>
                     <div className="relative">
                        <input type="checkbox" className="sr-only" checked={settings.isMaintenanceLockEnabled} onChange={e => setSettings({...settings, isMaintenanceLockEnabled: e.target.checked})}/>
                        <div className={`block w-14 h-8 rounded-full ${settings.isMaintenanceLockEnabled ? 'bg-[#6B8A9E]' : 'bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.isMaintenanceLockEnabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Jika diaktifkan, pelawat akan melihat skrin kunci dan perlu memasukkan PIN untuk mengakses laman web. PIN hanya boleh ditetapkan oleh Super Admin.</p>
            </div>

             <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-700 dark:text-gray-200">{UI_TEXT.FALLBACK_API_CONFIG}</h4>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{UI_TEXT.FALLBACK_API_DESC}</p>
                <div className="mt-4 space-y-4">
                     {/* Cerebras (Primary Override) */}
                    <div>
                        <label htmlFor="backup-cerebras-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{UI_TEXT.FALLBACK_CEREBRAS_KEY}</label>
                        <input
                            type="password"
                            id="backup-cerebras-key"
                            value={backupCerebrasKeyInput}
                            onChange={(e) => setBackupCerebrasKeyInput(e.target.value)}
                            placeholder="Masukkan kunci API Cerebras di sini"
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70]"
                        />
                    </div>
                     {/* Requesty (Secondary Override) */}
                    <div>
                        <label htmlFor="backup-requesty-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{UI_TEXT.FALLBACK_REQUESTY_KEY}</label>
                        <input
                            type="password"
                            id="backup-requesty-key"
                            value={backupRequestyKeyInput}
                            onChange={(e) => setBackupRequestyKeyInput(e.target.value)}
                            placeholder="Masukkan kunci API Requesty di sini"
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70]"
                        />
                    </div>
                    {/* OpenAI (Fallback Override) */}
                    <div>
                        <label htmlFor="backup-api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{UI_TEXT.FALLBACK_OPENAI_KEY}</label>
                        <input
                            type="password"
                            id="backup-api-key"
                            value={backupOpenAIKeyInput}
                            onChange={(e) => setBackupOpenAIKeyInput(e.target.value)}
                            placeholder="Masukkan kunci API OpenAI di sini"
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70]"
                        />
                    </div>
                </div>
            </div>
            
            <button 
                onClick={handleSettingsSave} 
                className="px-6 py-2 bg-gradient-to-r from-[#D78F70] to-[#E8A87C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={isSaving}
            >
                {isSaving ? 'Menyimpan...' : 'Simpan Tetapan'}
            </button>

            {userRole === 'superadmin' && (
              <div className="mt-6 p-4 border-2 border-red-400 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/40">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-red-800 dark:text-red-200 text-lg">Pengurusan PIN Keselamatan Induk (Super Admin Sahaja)</h3>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          Tindakan ini akan menukar PIN keselamatan kritikal sistem. Teruskan dengan berhati-hati.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowMasterPins(prev => !prev)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title={showMasterPins ? "Sembunyikan PIN" : "Tunjukkan PIN"}
                    >
                        {showMasterPins ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Penyelenggaraan (8-digit)</label>
                          <input type={showMasterPins ? 'text' : 'password'} value={maintenancePinInput} onChange={e => setMaintenancePinInput(e.target.value)} maxLength={8} className="mt-1 block w-full input-style" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Induk Tetapan Semula</label>
                          <input type={showMasterPins ? 'text' : 'password'} value={masterResetPinInput} onChange={e => setMasterResetPinInput(e.target.value)} className="mt-1 block w-full input-style" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Tindakan Pentadbir</label>
                          <input type={showMasterPins ? 'text' : 'password'} value={adminActionPinInput} onChange={e => setAdminActionPinInput(e.target.value)} className="mt-1 block w-full input-style" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Muat Turun Pentadbir</label>
                          <input type={showMasterPins ? 'text' : 'password'} value={adminDownloadPinInput} onChange={e => setAdminDownloadPinInput(e.target.value)} className="mt-1 block w-full input-style" />
                      </div>
                  </div>
                  <button
                      onClick={() => setShowMasterPinModal(true)}
                      className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                      disabled={isSaving}
                  >
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan PIN'}
                  </button>
              </div>
            )}


            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{UI_TEXT.SYSTEM_MONITORING_TITLE}</h3>
                 <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 space-y-4">
                     {isCheckingStatus && <p className="text-sm italic text-gray-500 dark:text-gray-400">Menyemak status sistem...</p>}
                     {!isCheckingStatus && systemStatus && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300">{UI_TEXT.API_STATUS}</h4>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.FIREBASE_STATUS}</span>
                                    {renderStatusBadge(systemStatus.firebase)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.TELEGRAM_API}</span>
                                    {renderStatusBadge(systemStatus.telegram)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.CEREBRAS_API}</span>
                                    {renderStatusBadge(systemStatus.cerebras)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.REQUESTY_API}</span>
                                    {renderStatusBadge(systemStatus.requesty)}
                                </div>
                                 <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.OPENAI_API}</span>
                                    {renderStatusBadge(systemStatus.openai)}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300">{UI_TEXT.LOCAL_STORAGE}</h4>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><DatabaseIcon className="w-4 h-4 mr-2" />{UI_TEXT.REPORTS_STORED}</span>
                                    {renderStatusBadge(systemStatus.storage)}
                                </div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 pt-2">{UI_TEXT.BROWSER_PERMISSIONS}</h4>
                                 <div className="flex items-center justify-between text-sm"><span>Kamera</span>{renderStatusBadge(systemStatus.permissions.camera)}</div>
                                 <div className="flex items-center justify-between text-sm"><span>Mikrofon</span>{renderStatusBadge(systemStatus.permissions.microphone)}</div>
                                 <div className="flex items-center justify-between text-sm"><span>Lokasi</span>{renderStatusBadge(systemStatus.permissions.geolocation)}</div>
                            </div>
                         </div>
                     )}
                     <button onClick={handleRunChecks} disabled={isCheckingStatus} className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">
                         {isCheckingStatus ? UI_TEXT.CHECKING_STATUS : UI_TEXT.RUN_CHECKS}
                     </button>
                 </div>
            </div>

            <div className="p-4 border border-yellow-300 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/30">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Eksport Data</h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Muat turun salinan semua rekod laporan dalam format JSON. Tindakan ini memerlukan PIN keselamatan.</p>
                <button
                    onClick={() => setShowDownloadPinModal(true)}
                    className="mt-3 flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-yellow-500 text-white hover:bg-yellow-600"
                >
                    <ArchiveBoxIcon className="w-5 h-5" />
                    <span>{UI_TEXT.DOWNLOAD_ALL_REPORTS}</span>
                </button>
            </div>
            
            <div className="p-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">Import Data Laporan</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Muat naik sejarah laporan daripada fail JSON. Laporan sedia ada dengan ID yang sama akan dikemas kini.
                </p>
                <input
                    type="file"
                    id="json-upload"
                    className="hidden"
                    accept="application/json"
                    onChange={handleFileUpload}
                />
                <label
                    htmlFor="json-upload"
                    className="cursor-pointer mt-3 inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-blue-500 text-white hover:bg-blue-600"
                >
                    <UploadIcon className="w-5 h-5" />
                    <span>Pilih Fail JSON...</span>
                </label>
                {uploadStatus && (
                    <p className={`mt-2 text-xs font-semibold ${uploadStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {uploadStatus.message}
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 min-h-[500px] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="mb-4 sm:mb-0">
                    <h2 className="text-2xl font-bold text-[#6B8A9E] dark:text-gray-200">Papan Pemuka {roleText}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Urus laporan dan tetapan sistem.</p>
                </div>
                <div className="flex items-center space-x-3">
                     <button onClick={onLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
                        <LogoutIcon className="w-5 h-5" />
                        <span>{UI_TEXT.LOGOUT}</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button 
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-[#6B8A9E] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <div className="flex items-center space-x-2">
                        <FileTextIcon className="w-4 h-4" />
                        <span>Laporan Teks ({textReports.length})</span>
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('media')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'media' ? 'bg-[#6B8A9E] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <div className="flex items-center space-x-2">
                        <MediaIcon className="w-4 h-4" />
                        <span>Media ({mediaReports.length})</span>
                    </div>
                </button>
                {(userRole === 'admin' || userRole === 'superadmin') && (
                    <>
                        <button 
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-[#6B8A9E] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            <div className="flex items-center space-x-2">
                                <SettingsIcon className="w-4 h-4" />
                                <span>Tetapan</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => setActiveTab('admin')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'admin' ? 'bg-[#6B8A9E] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            <div className="flex items-center space-x-2">
                                <UserGroupIcon className="w-4 h-4" />
                                <span>Pengguna</span>
                            </div>
                        </button>
                         <button 
                            onClick={() => setActiveTab('debug')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'debug' ? 'bg-[#6B8A9E] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            <div className="flex items-center space-x-2">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                <span>Debug</span>
                            </div>
                        </button>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'reports' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Senarai Laporan Teks</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{textReports.length} Laporan</span>
                        </div>
                        {renderReportList(textReports)}
                    </div>
                )}

                {activeTab === 'media' && (
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Senarai Laporan Media</h3>
                             <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{mediaReports.length} Laporan</span>
                        </div>
                        {renderReportList(mediaReports)}
                    </div>
                )}

                {activeTab === 'settings' && (userRole === 'admin' || userRole === 'superadmin') && renderSettings()}

                {activeTab === 'admin' && (userRole === 'admin' || userRole === 'superadmin') && (
                     <div className="space-y-6">
                        {/* Add User Form */}
                        <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Tambah Pengguna Baharu</h3>
                            <form onSubmit={handleAddNewUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Pengguna</label>
                                    <input 
                                        type="text" 
                                        value={newUserId} 
                                        onChange={(e) => setNewUserId(e.target.value)} 
                                        className="w-full input-style p-2 rounded border dark:bg-gray-600 dark:border-gray-500" 
                                        placeholder="cth: guru01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kata Laluan</label>
                                    <input 
                                        type="text" 
                                        value={newUserPassword} 
                                        onChange={(e) => setNewUserPassword(e.target.value)} 
                                        className="w-full input-style p-2 rounded border dark:bg-gray-600 dark:border-gray-500" 
                                        placeholder="*******"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peranan</label>
                                    <select 
                                        value={newUserRole} 
                                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                        className="w-full input-style p-2 rounded border dark:bg-gray-600 dark:border-gray-500"
                                    >
                                        <option value="teacher">Guru</option>
                                        <option value="admin">Admin</option>
                                        {userRole === 'superadmin' && <option value="superadmin">Super Admin</option>}
                                        <option value="kiosk_enabled_device">Peranti Kiosk</option>
                                    </select>
                                </div>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                                    Tambah
                                </button>
                            </form>
                        </div>

                        {/* User List */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Senarai Pengguna</h3>
                            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden">
                                {isLoadingUsers ? (
                                    <p className="p-4 text-gray-500">Memuatkan pengguna...</p>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Peranan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tindakan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {adminUsers.map((user) => (
                                                <tr key={user.docId}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{getRoleDisplayName(user.role)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {user.isLocked ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                                                                Dikunci
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                                                Aktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <button 
                                                            onClick={() => handleAdminAction('view', user)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            Lihat PW
                                                        </button>
                                                        <button 
                                                            onClick={() => handleLockUnlockClick(user)}
                                                            className={`${user.isLocked ? 'text-green-600 hover:text-green-900 dark:text-green-400' : 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400'}`}
                                                        >
                                                            {user.isLocked ? 'Buka Kunci' : 'Kunci'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAdminAction('delete', user)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Padam
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {adminUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Tiada pengguna ditemui.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                     </div>
                )}

                {activeTab === 'debug' && (userRole === 'admin' || userRole === 'superadmin') && <DebugPanel />}

            </div>

            {/* Modals */}
            {showDownloadPinModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Masukkan PIN Muat Turun</h3>
                        <form onSubmit={handleConfirmDownload}>
                            <input 
                                type="password" 
                                value={downloadPin} 
                                onChange={(e) => setDownloadPin(e.target.value)} 
                                className="w-full input-style p-2 rounded border mb-2 dark:bg-gray-700" 
                                placeholder="PIN"
                                autoFocus
                            />
                            {downloadPinError && <p className="text-red-500 text-sm mb-2">{downloadPinError}</p>}
                            <div className="flex justify-end space-x-2 mt-4">
                                <button type="button" onClick={handleClosePinModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded">Sahkan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdminPinModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
                         <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
                            {adminPinModalConfig.action === 'delete' ? 'Sahkan Pemadaman Pengguna' : 'Lihat Kata Laluan'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Sila masukkan PIN Tindakan Pentadbir untuk meneruskan.</p>
                        <form onSubmit={handleAdminPinSubmit}>
                            <input 
                                type="password" 
                                value={adminActionPin} 
                                onChange={(e) => setAdminActionPin(e.target.value)} 
                                className="w-full input-style p-2 rounded border mb-2 dark:bg-gray-700" 
                                placeholder="PIN Tindakan Pentadbir"
                                autoFocus
                            />
                            {adminActionPinError && <p className="text-red-500 text-sm mb-2">{adminActionPinError}</p>}
                            <div className="flex justify-end space-x-2 mt-4">
                                <button type="button" onClick={closeAdminPinModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Sahkan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showLockUnlockModal && userToModify && (
                <AdminLockUnlockModal
                    user={userToModify}
                    action={userToModify.isLocked ? 'unlock' : 'lock'}
                    onClose={() => setShowLockUnlockModal(false)}
                    onConfirm={handleConfirmLockUnlock}
                />
            )}
            
            {showMasterPinModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Sahkan Perubahan PIN</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Sila masukkan kata laluan akaun anda untuk mengesahkan perubahan PIN Induk.</p>
                        <form onSubmit={handleConfirmPinChange}>
                            <input 
                                type="password" 
                                value={masterPinPassword} 
                                onChange={(e) => setMasterPinPassword(e.target.value)} 
                                className="w-full input-style p-2 rounded border mb-2 dark:bg-gray-700" 
                                placeholder="Kata Laluan Anda"
                                autoFocus
                            />
                            {masterPinError && <p className="text-red-500 text-sm mb-2">{masterPinError}</p>}
                            <div className="flex justify-end space-x-2 mt-4">
                                <button type="button" onClick={() => { setShowMasterPinModal(false); setMasterPinPassword(''); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">
                                    {isSaving ? 'Menyimpan...' : 'Sahkan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
