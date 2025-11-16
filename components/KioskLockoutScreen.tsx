import React, { useState, useEffect } from 'react';
import { ShieldIcon, LockClosedIcon } from './icons';
import { WebsiteSettings } from '../types';

interface KioskLockoutScreenProps {
  onUnlock: () => void;
  settings: WebsiteSettings;
}

const KioskLockoutScreen: React.FC<KioskLockoutScreenProps> = ({ onUnlock, settings }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');
        
        if (pin === settings.masterResetPin) {
            onUnlock();
        } else {
            setError('PIN Induk Tetapan Semula tidak sah. Sila cuba lagi.');
        }
        setIsVerifying(false);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-red-900 bg-opacity-95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 text-white">
             <div className="text-center max-w-md w-full bg-gray-800 p-8 rounded-xl shadow-2xl border-2 border-red-500">
                <div className="mx-auto mb-6 flex items-center justify-center">
                    <LockClosedIcon className="w-20 h-20 text-red-400 animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold text-red-300 mb-2">
                    Akaun Dikunci!
                </h1>
                <p className="text-gray-300 mb-6">Terlalu banyak percubaan gagal. Untuk keselamatan, akses telah disekat.</p>
                
                <div className="my-6">
                    <div className="text-6xl font-mono tracking-widest text-yellow-300">
                        {formatTime(countdown)}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Masa Bertenang</p>
                </div>
                
                <form onSubmit={handleUnlockSubmit} className="space-y-4">
                     <p className="text-sm text-gray-300">Anda boleh membuka kunci dengan segera menggunakan PIN Induk Tetapan Semula.</p>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => { setError(''); setPin(e.target.value); }}
                        placeholder="Masukkan PIN Induk Tetapan Semula"
                        className="w-full p-3 text-center tracking-widest font-mono text-lg bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition text-white"
                        autoFocus
                        disabled={isVerifying}
                    />
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg shadow-lg hover:bg-yellow-400 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                        disabled={isVerifying || countdown === 0}
                    >
                        {isVerifying ? 'Mengesahkan...' : 'Buka Kunci Sekarang'}
                    </button>
                    {countdown === 0 && (
                        <p className="text-sm text-green-400 pt-2">Masa bertenang telah tamat. Sila log keluar dan log masuk semula.</p>
                    )}
                </form>
             </div>
        </div>
    );
};

export default KioskLockoutScreen;