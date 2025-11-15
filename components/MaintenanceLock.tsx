import React, { useState } from 'react';
import { ShieldIcon } from './icons';
import { getSettings, setUnlockTimestamp } from '../utils/storage';

interface MaintenanceLockProps {
  onUnlock: () => void;
}

const MaintenanceLock: React.FC<MaintenanceLockProps> = ({ onUnlock }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const settings = getSettings();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === settings.maintenancePin) {
            setError('');
            setUnlockTimestamp();
            onUnlock();
        } else {
            setError('Maaf, PIN tidak sah. Sila cuba lagi.');
        }
    };

    return (
        <div className="fixed inset-0 bg-[#F8F4EF] dark:bg-gray-900 flex flex-col items-center justify-center z-50 p-4">
             <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="mx-auto mb-6 flex items-center justify-center">
                    <ShieldIcon className="w-20 h-20 object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-[#6B8A9E] dark:text-gray-200 mb-2">Laman Sedang Diselenggara</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Kami sedang melakukan beberapa penambahbaikan. Sila masukkan PIN untuk meneruskan jika anda seorang pentadbir.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={8}
                        placeholder="Masukkan 8-Digit PIN"
                        className="w-full p-3 text-center tracking-widest font-mono text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#D78F70] focus:border-[#D78F70] transition"
                        autoFocus
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-gradient-to-r from-[#D78F70] to-[#E8A87C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Buka Kunci
                    </button>
                </form>
             </div>
        </div>
    );
};

export default MaintenanceLock;