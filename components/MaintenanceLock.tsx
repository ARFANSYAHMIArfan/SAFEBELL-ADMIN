import React, { useState } from 'react';
import { ShieldIcon } from './icons';
import { setUnlockTimestamp } from '../utils/storage';
import { fetchGlobalSettings, updateGlobalSettings, defaultSettings } from '../services/settingsService';

interface MaintenanceLockProps {
  onUnlock: () => void;
}

const MaintenanceLock: React.FC<MaintenanceLockProps> = ({ onUnlock }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [flowState, setFlowState] = useState<'unlock' | 'enterMasterPin' | 'setNewPin'>('unlock');
    const [masterPin, setMasterPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [resetMessage, setResetMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const settings = await fetchGlobalSettings(); // Fetch latest settings for unlock check
            if (pin === settings.maintenancePin) {
                setUnlockTimestamp();
                onUnlock();
            } else {
                setError('Maaf, PIN tidak sah. Sila cuba lagi.');
            }
        } catch {
            setError('Gagal mengesahkan PIN. Sila semak sambungan anda.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMasterPinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResetMessage(null);
        try {
            const settings = await fetchGlobalSettings();
            const masterPinToUse = settings.masterResetPin || defaultSettings.masterResetPin;
            if (masterPin === masterPinToUse) {
                setFlowState('setNewPin');
            } else {
                setResetMessage({ type: 'error', text: 'PIN Induk tidak sah.' });
            }
        } catch (error) {
            setResetMessage({ type: 'error', text: `Gagal mengesahkan PIN: ${(error as Error).message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewPinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetMessage(null);
        if (!/^\d{8}$/.test(newPin)) {
            setResetMessage({ type: 'error', text: 'PIN baharu mesti 8 digit nombor.' });
            return;
        }
        if (newPin !== confirmNewPin) {
            setResetMessage({ type: 'error', text: 'PIN baharu dan pengesahan tidak sepadan.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const currentSettings = await fetchGlobalSettings();
            const newSettings = { ...currentSettings, maintenancePin: newPin };
            await updateGlobalSettings(newSettings);
            setResetMessage({ type: 'success', text: 'PIN berjaya ditetapkan semula! Sila gunakan PIN baharu untuk membuka kunci.' });
            setNewPin('');
            setConfirmNewPin('');
            setMasterPin('');
            setPin(''); // Clear the old pin attempt as well
            setFlowState('unlock');
        } catch (error) {
            setResetMessage({ type: 'error', text: `Gagal menetapkan semula PIN: ${(error as Error).message}` });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderUnlockView = () => (
        <>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Kami sedang melakukan beberapa penambahbaikan. Sila masukkan PIN untuk meneruskan jika anda seorang pentadbir.</p>
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
                <input
                    type="password"
                    value={pin}
                    onChange={(e) => { setError(''); setPin(e.target.value); }}
                    maxLength={8}
                    placeholder="Masukkan 8-Digit PIN"
                    className="w-full p-3 text-center tracking-widest font-mono text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#D78F70] focus:border-[#D78F70] transition"
                    autoFocus
                    disabled={isSubmitting}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#D78F70] to-[#E8A87C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Mengesahkan...' : 'Buka Kunci'}
                </button>
                <button type="button" onClick={() => { setFlowState('enterMasterPin'); setError(''); setResetMessage(null); }} className="text-sm text-gray-500 dark:text-gray-400 hover:underline pt-2">
                    Lupa PIN? Tetapkan Semula
                </button>
            </form>
        </>
    );

    const renderMasterPinView = () => (
        <form onSubmit={handleMasterPinSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sila masukkan PIN Induk untuk menetapkan semula PIN penyelenggaraan.</p>
            <input
                type="password"
                value={masterPin}
                onChange={(e) => { setResetMessage(null); setMasterPin(e.target.value); }}
                placeholder="Masukkan PIN Induk"
                className="w-full p-3 text-center tracking-widest font-mono text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#D78F70] focus:border-[#D78F70] transition"
                autoFocus
                disabled={isSubmitting}
            />
            <button
                type="submit"
                className="w-full px-6 py-3 bg-[#6B8A9E] text-white font-bold rounded-lg shadow-md hover:bg-[#5a7588] transition-colors"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Mengesahkan...' : 'Sahkan PIN Induk'}
            </button>
            <button type="button" onClick={() => { setFlowState('unlock'); setResetMessage(null); }} className="text-sm text-gray-500 dark:text-gray-400 hover:underline pt-2">
                Kembali ke Buka Kunci
            </button>
        </form>
    );
    
    const renderSetNewPinView = () => (
         <form onSubmit={handleNewPinSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sila tetapkan 8-digit PIN baharu anda.</p>
            <div>
                <input
                    type="password"
                    value={newPin}
                    onChange={(e) => { setResetMessage(null); setNewPin(e.target.value); }}
                    maxLength={8}
                    placeholder="PIN 8-Digit Baharu"
                    className="w-full p-3 text-center tracking-widest font-mono text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#D78F70] focus:border-[#D78F70] transition"
                    autoFocus
                    disabled={isSubmitting}
                />
            </div>
            <div>
                <input
                    type="password"
                    value={confirmNewPin}
                    onChange={(e) => { setResetMessage(null); setConfirmNewPin(e.target.value); }}
                    maxLength={8}
                    placeholder="Sahkan PIN Baharu"
                    className="w-full p-3 text-center tracking-widest font-mono text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#D78F70] focus:border-[#D78F70] transition"
                    disabled={isSubmitting}
                />
            </div>
            <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-[#D78F70] to-[#E8A87C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Menyimpan...' : 'Tetapkan PIN Baharu'}
            </button>
            <button type="button" onClick={() => { setFlowState('enterMasterPin'); setResetMessage(null); }} className="text-sm text-gray-500 dark:text-gray-400 hover:underline pt-2">
                Kembali
            </button>
        </form>
    );

    const renderContent = () => {
        switch(flowState) {
            case 'enterMasterPin': return renderMasterPinView();
            case 'setNewPin': return renderSetNewPinView();
            case 'unlock':
            default:
                return renderUnlockView();
        }
    }

    return (
        <div className="fixed inset-0 bg-[#F8F4EF] dark:bg-gray-900 flex flex-col items-center justify-center z-50 p-4">
             <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="mx-auto mb-6 flex items-center justify-center">
                    <ShieldIcon className="w-20 h-20 object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-[#6B8A9E] dark:text-gray-200 mb-2">
                    {flowState === 'unlock' ? 'Laman Sedang Diselenggara' : 'Tetapkan Semula PIN Penyelenggaraan'}
                </h1>

                {resetMessage && (
                    <p className={`my-4 text-sm ${resetMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {resetMessage.text}
                    </p>
                )}
                
                {renderContent()}
             </div>
        </div>
    );
};

export default MaintenanceLock;