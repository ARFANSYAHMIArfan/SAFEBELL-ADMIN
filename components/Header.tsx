import React from 'react';
import { ShieldIcon, UserIcon, LoginIcon } from './icons';
import { UI_TEXT } from '../constants';
import { UserRole } from '../types';

interface HeaderProps {
  userRole: UserRole;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, onLoginClick, onDashboardClick, onHomeClick }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button onClick={onHomeClick} className="flex items-center space-x-4 text-left">
          <div className="p-2 bg-gradient-to-br from-[#6B8A9E] to-[#D78F70] rounded-lg">
            <ShieldIcon className="w-8 h-8 text-white" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-[#6B8A9E]">{UI_TEXT.TITLE}</h1>
              <p className="text-sm text-gray-500">{UI_TEXT.SUBTITLE}</p>
          </div>
        </button>
        <div>
          {userRole === 'none' ? (
            <button
              onClick={onLoginClick}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-[#6B8A9E] font-semibold rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-200"
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
        </div>
      </div>
    </header>
  );
};

export default Header;
