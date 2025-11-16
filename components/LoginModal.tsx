import React, { useState } from 'react';
import { UI_TEXT } from '../constants';
import { UserRole } from '../types';
import { XCircleIcon } from './icons';
import { validateLogin } from '../services/userService';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (role: UserRole, userId: string, docId: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
        const user = await validateLogin(userId, password);

        if (user) {
            onLoginSuccess(user.role, user.id, user.docId);
        } else {
            // Check if account might be locked
            const potentialUser = await validateLogin(userId, password + 'invalid');
            if (potentialUser && potentialUser.isLocked) {
                setError("Akaun ini dikunci kerana percubaan log masuk yang gagal. Sila hubungi pentadbir.");
            } else {
                 setError(UI_TEXT.LOGIN_ERROR);
            }
        }
    } catch (err) {
        console.error("Login error:", err);
        setError("Ralat berlaku semasa log masuk. Sila cuba lagi.");
    } finally {
        setIsLoggingIn(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
        aria-labelledby="login-modal-title"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4 transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 id="login-modal-title" className="text-xl font-bold text-[#6B8A9E] dark:text-gray-200">{UI_TEXT.ADMIN_LOGIN}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <span className="sr-only">Close</span>
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{UI_TEXT.USER_ID}</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70] sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">{UI_TEXT.PASSWORD}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-[#D78F70] focus:border-[#D78F70] sm:text-sm"
              required
            />
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#D78F70] to-[#E8A87C] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D78F70] disabled:opacity-50"
            >
              {isLoggingIn ? 'Mengesahkan...' : UI_TEXT.LOGIN}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;