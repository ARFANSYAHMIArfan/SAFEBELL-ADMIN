import React, { useState } from 'react';
import { WebsiteSettings } from '../types';
import { XCircleIcon, ShieldIcon } from './icons';

interface KioskPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onLockout: () => void;
  settings: WebsiteSettings;
}

const KioskPinModal: React.FC<KioskPinModalProps> = ({ onClose, onSuccess, onLockout, settings }) => {
    const [step, setStep] = useState<'maintenance' | 'adminAction'>('maintenance');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);

    const handleFailure = () => {
        const newAttemptCount = failedAttempts + 1;
        setFailedAttempts(newAttemptCount);
        if (newAttemptCount >= 3) {
            onLockout();
        } else {
            const attemptsLeft = 3 - newAttemptCount;
            const pinType = step === 'maintenance' ? 'Penyelenggaraan' : 'Tindakan Pentadbir';
            setError(`PIN ${pinType} tidak sah. ${attemptsLeft} percubaan lagi.`);
        }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsVerifying(true);

        if (step === 'maintenance') {
            if (pin === settings.maintenancePin) {
                setStep('adminAction');
                setPin('');
                setFailedAttempts(0); // Reset attempts on successful step
            } else {
                handleFailure();
            }
        } else if (step === 'adminAction') {
            if (pin === settings.adminActionPin) {
                onSuccess();
            } else {
                handleFailure();
            }
        }
        setIsVerifying(false);
    };

    const title = step === 'maintenance'
        ? 'Akses Papan Pemuka Disekat'
        : 'Pengesahan Peringkat Kedua';
    
    const description = step === 'maintenance'
        ? 'Sila masukkan PIN Penyelenggaraan untuk meneruskan.'
        : 'Untuk keselamatan tambahan, sila masukkan PIN Tindakan Pentadbir.';
        
    const placeholder = step === 'maintenance'
        ? 'PIN Penyelenggaraan'
        : 'PIN Tindakan Pentadbir';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity p-4"
            aria-labelledby="kiosk-pin-modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4 transform transition-all text-center relative">
                <div className="flex justify-center mb-4">
                    <ShieldIcon className="w-16 h-16" />
                </div>
                <h2 id="kiosk-pin-modal-title" className="text-xl font-bold text-[#6B8A9E] dark:text-gray-200 w-full text-center mb-4">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 absolute top-4 right-4">
                    <span className="sr-only">Close</span>
                    <XCircleIcon className="w-6 h-6" />
                </button>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
                
                <form onSubmit={handlePinSubmit} className="space-y-4">
                    <input
                        type="password"
                        id="kiosk-pin"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70] sm:text-sm text-center tracking-widest"
                        placeholder={placeholder}
                        required
                        autoFocus
                    />
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#D78F70] to-[#E8A87C] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D78F70] disabled:opacity-50"
                        >
                            {isVerifying ? 'Mengesahkan...' : 'Sahkan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KioskPinModal;