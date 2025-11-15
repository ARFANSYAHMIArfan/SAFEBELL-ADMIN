import React from 'react';
import { ShieldIcon, UserIcon, LoginIcon, MoonIcon, SunIcon } from './icons';
import { UI_TEXT } from '../constants';
import { UserRole } from '../types';

interface HeaderProps {
  userRole: UserRole;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onHomeClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, onLoginClick, onDashboardClick, onHomeClick, isDarkMode, toggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button onClick={onHomeClick} className="flex items-center space-x-4 text-left">
          <div className="p-2 bg-gradient-to-br from-[#6B8A9E] to-[#D78F70] rounded-lg">
            <ShieldIcon className="w-8 h-8 text-white" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-[#6B8A9E] dark:text-gray-200">{UI_TEXT.TITLE}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{UI_TEXT.SUBTITLE}</p>
          </div>
        </button>
        <div className="flex items-center space-x-3">
          {userRole === 'none' ? (
            <button
              onClick={onLoginClick}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-[#6B8A9E] dark:bg-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <UserIcon className="w-5 h-5" />
              <span>{UI_TEXT.LOGIN}</span>
            </button>
          ) : (
            <button
              onClick={onDashboardClick}
              className="flex items-center space-x-2 px-4 py-2 bg-[#6B8A9E] text-white font-semibold rounded-lg shadow-md hover:bg-[#5a7588] transition-colors duration-200"
            >
              <LoginIcon className="w-5 h-5" />
              <span>{UI_TEXT.DASHBOARD}</span>
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;