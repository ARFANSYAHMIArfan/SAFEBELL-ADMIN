import React from 'react';
import Header from './components/Header';
import ReportForm from './components/ReportForm';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F4EF] text-[#3D405B] font-sans">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <ReportForm />
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-gray-500">
        <p>© 2025 KitaBUDDY:#JOMCEGAHBULI. Hak Cipta Terpelihara. Dikuasakan oleh Teknologi Anonim AI.</p>
      </footer>
    </div>
  );
};

export default App;