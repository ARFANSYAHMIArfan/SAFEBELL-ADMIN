import React, { useState } from 'react';
import { UserCredentials } from '../types';

interface AdminLockUnlockModalProps {
  user: UserCredentials;
  action: 'lock' | 'unlock';
  onClose: () => void;
  onConfirm: (pin: string) => Promise<void>;
}

const AdminLockUnlockModal: React.FC<AdminLockUnlockModalProps> = ({ user, action, onClose, onConfirm }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsConfirming(true);
    try {
      await onConfirm(pin);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsConfirming(false);
    }
  };
  
  const actionText = action === 'lock' ? 'Kunci' : 'Buka Kunci';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-[#6B8A9E] dark:text-gray-200">Sahkan Tindakan</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Adakah anda pasti mahu <span className="font-bold">{actionText}</span> akaun untuk <span className="font-bold">{user.id}</span>?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sila masukkan PIN Induk Tetapan Semula untuk meneruskan.</p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-2 text-center tracking-widest font-mono bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D78F70]"
            required
            autoFocus
            placeholder="PIN Induk Tetapan Semula"
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg font-semibold">Batal</button>
            <button type="submit" disabled={isConfirming} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50">
              {isConfirming ? 'Mengesahkan...' : `Sahkan & ${actionText}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLockUnlockModal;
