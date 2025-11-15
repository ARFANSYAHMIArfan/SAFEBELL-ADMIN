import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Report, WebsiteSettings, ReportType } from '../types';
import { UI_TEXT, ADMIN_DOWNLOAD_PIN } from '../constants';
import { 
    LogoutIcon, SettingsIcon, ShieldIcon, TrashIcon, ChevronDownIcon, 
    ShareIcon, DownloadIcon, ArchiveBoxIcon, BellIcon, ServerIcon, 
    DatabaseIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon 
} from './icons';
import { getReports, deleteReport } from '../utils/storage';
import { fetchGlobalSettings, updateGlobalSettings } from '../services/settingsService';
import { downloadAsPdf, downloadAsDocx } from '../services/downloadService';
import { 
    checkTelegramApi, checkCerebrasConfig, checkOpenAIConfig, 
    getLocalStorageUsage, checkPermissions, SystemStatus 
} from '../utils/statusCheck';

declare const saveAs: any;

interface DashboardProps {
  userRole: UserRole;
  onLogout: () => void;
  onNavigateHome: () => void;
  onSettingsChange: (settings: WebsiteSettings) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, onLogout, onNavigateHome, onSettingsChange }) => {
    const roleText = userRole === 'admin' ? 'Admin' : 'Guru';
    
    const [reports, setReports] = useState<Report[]>([]);
    const [settings, setSettings] = useState<WebsiteSettings>({ isFormDisabled: false, isMaintenanceLockEnabled: false, maintenancePin: '' });
    const [pinInput, setPinInput] = useState('');
    const [activeTab, setActiveTab] = useState<'reports' | 'media' | 'settings'>('reports');
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
    const [pinError, setPinError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
    const [showDownloadOptions, setShowDownloadOptions] = useState<string | null>(null);
    const [showDownloadPinModal, setShowDownloadPinModal] = useState(false);
    const [downloadPin, setDownloadPin] = useState('');
    const [downloadPinError, setDownloadPinError] = useState('');
    const [notification, setNotification] = useState<{ id: string; message: string } | null>(null);
    const [hasUnseenReports, setHasUnseenReports] = useState(false);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);


    useEffect(() => {
        setReports(getReports());
        fetchGlobalSettings().then(initialSettings => {
            setSettings(initialSettings);
            setPinInput(initialSettings.maintenancePin);
        });

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'new_report_notification' && event.newValue) {
                const newReportInfo: { id: string; type: ReportType } = JSON.parse(event.newValue);
                setReports(prev => [getReports()[0], ...prev]); // Add new report to list
                setNotification({
                    id: newReportInfo.id,
                    message: `${UI_TEXT.NEW_REPORT_NOTIFICATION} (Jenis: ${newReportInfo.type})`,
                });
                setHasUnseenReports(true);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000); // Auto-dismiss after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        // When user switches to a report tab, clear the "unseen" flag
        if (activeTab === 'reports' || activeTab === 'media') {
            setHasUnseenReports(false);
        }
    }, [activeTab]);
    
    const handleRunChecks = useCallback(async () => {
        setIsCheckingStatus(true);
        const [tg, storage, perms] = await Promise.all([
            checkTelegramApi(),
            getLocalStorageUsage(),
            checkPermissions(),
        ]);
        const cerebras = checkCerebrasConfig();
        const openai = checkOpenAIConfig();
        
        setSystemStatus({
            telegram: tg,
            cerebras,
            openai,
            storage,
            permissions: perms,
        });
        setIsCheckingStatus(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'settings' && userRole === 'admin' && !systemStatus) {
            handleRunChecks();
        }
    }, [activeTab, userRole, systemStatus, handleRunChecks]);

    const handleSettingsSave = async () => {
        setPinError('');
        if (settings.isMaintenanceLockEnabled) {
            if (!/^\d{8}$/.test(pinInput)) {
                setPinError('PIN mesti 8 digit nombor.');
                return;
            }
        }
        
        const newSettings = { ...settings, maintenancePin: pinInput };
        setIsSaving(true);
        try {
            await updateGlobalSettings(newSettings);
            setSettings(newSettings);
            onSettingsChange(newSettings); // Notify App component
            alert('Selesai! Tetapan telah disimpan!');
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert('Gagal menyimpan tetapan. Sila cuba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteReport = (reportId: string) => {
        if (window.confirm('Adakah anda pasti mahu memadam laporan ini?')) {
            deleteReport(reportId);
            setReports(getReports()); // Refresh reports list
        }
    };

    const toggleReport = (reportId: string) => {
        setExpandedReportId(expandedReportId === reportId ? null : reportId);
        setShowDownloadOptions(null); // Close download options when collapsing
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

    const handleConfirmDownload = (e: React.FormEvent) => {
        e.preventDefault();
        if (downloadPin === ADMIN_DOWNLOAD_PIN) {
            setDownloadPinError('');
            
            const allReports = getReports();
            const dataStr = JSON.stringify(allReports, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            saveAs(blob, `semua_laporan_safe_${timestamp}.json`);

            handleClosePinModal();
        } else {
            setDownloadPinError(UI_TEXT.INVALID_PIN);
        }
    };


    const textReports = reports.filter(r => r.type === 'text');
    const mediaReports = reports.filter(r => r.type === 'audio' || r.type === 'video');

    const renderReportList = (reportList: Report[]) => {
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
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Butiran Laporan:</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600">{report.content}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Analisis AI:</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600">{report.analysis}</p>
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
                                                <div className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10">
                                                    <button onClick={() => { downloadAsPdf(report); setShowDownloadOptions(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        {UI_TEXT.SAVE_AS_PDF}
                                                    </button>
                                                    <button onClick={() => { downloadAsDocx(report); setShowDownloadOptions(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        {UI_TEXT.SAVE_AS_DOCX}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {userRole === 'admin' && (
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
            warn: { icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />, text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Jika diaktifkan, pelawat akan melihat skrin kunci dan perlu memasukkan PIN untuk mengakses laman web.</p>
                 {settings.isMaintenanceLockEnabled && (
                    <div className="mt-4">
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Set 8-Digit PIN</label>
                        <input
                          type="password"
                          id="pin"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          maxLength={8}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70]"
                        />
                        {pinError && <p className="text-xs text-red-500 mt-1">{pinError}</p>}
                    </div>
                 )}
            </div>
            
            <button 
                onClick={handleSettingsSave} 
                className="px-6 py-2 bg-gradient-to-r from-[#D78F70] to-[#E8A87C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={isSaving}
            >
                {isSaving ? 'Menyimpan...' : 'Simpan Tetapan'}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{UI_TEXT.SYSTEM_MONITORING_TITLE}</h3>
                 <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 space-y-4">
                     {isCheckingStatus && <p className="text-sm italic text-gray-500 dark:text-gray-400">Menyemak status sistem...</p>}
                     {!isCheckingStatus && systemStatus && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {/* API Status */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300">{UI_TEXT.API_STATUS}</h4>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.TELEGRAM_API}</span>
                                    {renderStatusBadge(systemStatus.telegram)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.CEREBRAS_API}</span>
                                    {renderStatusBadge(systemStatus.cerebras)}
                                </div>
                                 <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" />{UI_TEXT.OPENAI_API}</span>
                                    {renderStatusBadge(systemStatus.openai)}
                                </div>
                            </div>
                             {/* Storage and Permissions */}
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
        </div>
    );
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-20 right-5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 flex items-center space-x-3 z-50 animate-pulse">
                    <BellIcon className="w-6 h-6 text-[#6B8A9E]" />
                    <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID Laporan: {notification.id}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                 <div>
                    <h2 className="text-2xl font-bold text-[#6B8A9E] dark:text-gray-200">{UI_TEXT.DASHBOARD}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{UI_TEXT.WELCOME}, {roleText}!</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <button onClick={onNavigateHome} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                         <ShieldIcon className="w-5 h-5"/>
                         <span>Borang Laporan</span>
                    </button>
                     <button onClick={onLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors">
                        <LogoutIcon className="w-5 h-5" />
                        <span>{UI_TEXT.LOGOUT}</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button onClick={() => setActiveTab('reports')} className={`relative px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'reports' ? 'border-b-2 border-[#6B8A9E] text-[#6B8A9E] dark:text-[#a6c8de]' : 'text-gray-500 dark:text-gray-400'}`}>
                    Urus Laporan Teks
                    {hasUnseenReports && reports.some(r => r.type === 'text') && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>}
                </button>
                <button onClick={() => setActiveTab('media')} className={`relative px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'media' ? 'border-b-2 border-[#6B8A9E] text-[#6B8A9E] dark:text-[#a6c8de]' : 'text-gray-500 dark:text-gray-400'}`}>
                    Arkib Media
                    {hasUnseenReports && reports.some(r => r.type !== 'text') && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>}
                </button>
                {userRole === 'admin' && <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'border-b-2 border-[#6B8A9E] text-[#6B8A9E] dark:text-[#a6c8de]' : 'text-gray-500 dark:text-gray-400'}`} title="Manage website features and maintenance lock">Tetapan</button>}
            </div>

            {/* Content */}
            <div>
                {activeTab === 'reports' && renderReportList(textReports)}
                {activeTab === 'media' && renderReportList(mediaReports)}
                {activeTab === 'settings' && userRole === 'admin' && renderSettings()}
            </div>

            {/* PIN Modal for Download */}
            {showDownloadPinModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm m-4 transform transition-all">
                        <h3 className="text-lg font-bold text-[#6B8A9E] dark:text-gray-200">{UI_TEXT.CONFIRM_ACTION}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{UI_TEXT.ENTER_PIN_PROMPT}</p>
                        <form onSubmit={handleConfirmDownload} className="space-y-4 mt-4">
                            <input
                                type="password"
                                value={downloadPin}
                                onChange={(e) => setDownloadPin(e.target.value)}
                                className="w-full p-2 text-center tracking-widest font-mono bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D78F70]"
                                required
                                autoFocus
                            />
                            {downloadPinError && <p className="text-sm text-red-500 text-center">{downloadPinError}</p>}
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={handleClosePinModal} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                    {UI_TEXT.CANCEL}
                                </button>
                                <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                                    {UI_TEXT.CONFIRM_AND_DOWNLOAD}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;