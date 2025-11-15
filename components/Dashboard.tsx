import React, { useState, useEffect } from 'react';
import { UserRole, Report, WebsiteSettings } from '../types';
import { UI_TEXT } from '../constants';
import { LogoutIcon, FileTextIcon, MediaIcon, SettingsIcon, ShieldIcon, TrashIcon, ChevronDownIcon } from './icons';
import { getReports, getSettings, saveSettings, deleteReport } from '../utils/storage';

interface DashboardProps {
  userRole: UserRole;
  onLogout: () => void;
  onNavigateHome: () => void;
  onSettingsChange: (settings: WebsiteSettings) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, onLogout, onNavigateHome, onSettingsChange }) => {
    const roleText = userRole === 'admin' ? 'Admin' : 'Guru';
    
    const [reports, setReports] = useState<Report[]>([]);
    const [settings, setSettings] = useState<WebsiteSettings>(getSettings());
    const [pinInput, setPinInput] = useState(settings.maintenancePin);
    const [activeTab, setActiveTab] = useState<'reports' | 'media' | 'settings'>('reports');
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
    const [pinError, setPinError] = useState('');

    useEffect(() => {
        setReports(getReports());
    }, []);

    const handleSettingsSave = () => {
        setPinError('');
        if (settings.isMaintenanceLockEnabled) {
            if (!/^\d{8}$/.test(pinInput)) {
                setPinError('PIN mesti 8 digit nombor.');
                return;
            }
        }
        const newSettings = { ...settings, maintenancePin: pinInput };
        setSettings(newSettings);
        saveSettings(newSettings);
        onSettingsChange(newSettings); // Notify App component
        alert('Tetapan telah disimpan!');
    };

    const handleDeleteReport = (reportId: string) => {
        if (window.confirm('Adakah anda pasti mahu memadam laporan ini?')) {
            deleteReport(reportId);
            setReports(getReports()); // Refresh reports list
        }
    };

    const toggleReport = (reportId: string) => {
        setExpandedReportId(expandedReportId === reportId ? null : reportId);
    };

    const textReports = reports.filter(r => r.type === 'text');
    const mediaReports = reports.filter(r => r.type === 'audio' || r.type === 'video');

    const renderReportList = (reportList: Report[]) => {
        if (reportList.length === 0) {
            return <p className="text-gray-500 italic">Tiada laporan ditemui.</p>;
        }
        return (
            <div className="space-y-3">
                {reportList.map(report => (
                    <div key={report.id} className="border border-gray-200 rounded-lg">
                        <button onClick={() => toggleReport(report.id)} className="w-full flex justify-between items-center p-3 text-left">
                           <div className="flex items-center space-x-3">
                                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{report.id}</span>
                                <span className="font-semibold text-gray-800 capitalize">{report.type} Report</span>
                                <span className="text-sm text-gray-500">{new Date(report.timestamp).toLocaleString()}</span>
                           </div>
                           <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedReportId === report.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedReportId === report.id && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-700">Butiran Laporan:</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap font-mono bg-white p-2 rounded border">{report.content}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-700">Analisis AI:</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">{report.analysis}</p>
                                    </div>
                                    {userRole === 'admin' && (
                                         <button onClick={() => handleDeleteReport(report.id)} className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-4 h-4" />
                                            <span>Padam Laporan</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderSettings = () => (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-700">Lumpuhkan Borang Laporan</span>
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={settings.isFormDisabled} onChange={e => setSettings({...settings, isFormDisabled: e.target.checked})}/>
                        <div className={`block w-14 h-8 rounded-full ${settings.isFormDisabled ? 'bg-[#6B8A9E]' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.isFormDisabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">Jika diaktifkan, pengguna tidak akan dapat menghantar laporan baharu dari halaman utama.</p>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-700">Aktifkan Kunci Penyelenggaraan</span>
                     <div className="relative">
                        <input type="checkbox" className="sr-only" checked={settings.isMaintenanceLockEnabled} onChange={e => setSettings({...settings, isMaintenanceLockEnabled: e.target.checked})}/>
                        <div className={`block w-14 h-8 rounded-full ${settings.isMaintenanceLockEnabled ? 'bg-[#6B8A9E]' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.isMaintenanceLockEnabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">Jika diaktifkan, pelawat akan melihat skrin kunci dan perlu memasukkan PIN untuk mengakses laman web.</p>
                 {settings.isMaintenanceLockEnabled && (
                    <div className="mt-4">
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-700">Set 8-Digit PIN</label>
                        <input
                          type="password"
                          id="pin"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          maxLength={8}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70]"
                        />
                        {pinError && <p className="text-xs text-red-500 mt-1">{pinError}</p>}
                    </div>
                 )}
            </div>
            
            <button onClick={handleSettingsSave} className="px-6 py-2 bg-gradient-to-r from-[#D78F70] to-[#E8A87C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl">
                Simpan Tetapan
            </button>
        </div>
    );
    
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-gray-200">
                 <div>
                    <h2 className="text-2xl font-bold text-[#6B8A9E]">{UI_TEXT.DASHBOARD}</h2>
                    <p className="text-gray-500">{UI_TEXT.WELCOME}, {roleText}!</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <button onClick={onNavigateHome} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-200 transition-colors">
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
            <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'reports' ? 'border-b-2 border-[#6B8A9E] text-[#6B8A9E]' : 'text-gray-500'}`}>Urus Laporan Teks</button>
                <button onClick={() => setActiveTab('media')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'media' ? 'border-b-2 border-[#6B8A9E] text-[#6B8A9E]' : 'text-gray-500'}`}>Arkib Media</button>
                {userRole === 'admin' && <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'settings' ? 'border-b-2 border-[#6B8A9E] text-[#6B8A9E]' : 'text-gray-500'}`}>Tetapan</button>}
            </div>

            {/* Content */}
            <div>
                {activeTab === 'reports' && renderReportList(textReports)}
                {activeTab === 'media' && renderReportList(mediaReports)}
                {activeTab === 'settings' && userRole === 'admin' && renderSettings()}
            </div>
        </div>
    );
};

export default Dashboard;
