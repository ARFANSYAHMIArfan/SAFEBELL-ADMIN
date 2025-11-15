import React, { useState } from 'react';
import { ShieldIcon } from './icons';
import { getSettings } from '../utils/storage';

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
            sessionStorage.setItem('siteUnlocked', 'true');
            onUnlock();
        } else {
            setError('PIN tidak sah. Sila cuba lagi.');
        }
    };

    return (
        <div className="fixed inset-0 bg-[#F8F4EF] flex flex-col items-center justify-center z-50 p-4">
             <div className="text-center max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-[#6B8A9E] to-[#D78F70] rounded-lg w-16 h-16 flex items-center justify-center">
                    <ShieldIcon className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-[#6B8A9E] mb-2">Laman Sedang Diselenggara</h1>
                <p className="text-gray-600 mb-6">Kami sedang melakukan beberapa penambahbaikan. Sila masukkan PIN untuk meneruskan jika anda seorang pentadbir.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={8}
                        placeholder="Masukkan 8-Digit PIN"
                        className="w-full p-3 text-center tracking-widest font-mono text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D78F70] focus:border-[#D78F70] transition"
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
