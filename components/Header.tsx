
import React from 'react';
import { ShieldIcon } from './icons';
import { UI_TEXT } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
        <div className="p-2 bg-gradient-to-br from-[#6B8A9E] to-[#D78F70] rounded-lg">
          <ShieldIcon className="w-8 h-8 text-white" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-[#6B8A9E]">{UI_TEXT.TITLE}</h1>
            <p className="text-sm text-gray-500">{UI_TEXT.SUBTITLE}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
