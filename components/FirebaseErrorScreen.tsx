import React from 'react';
import { ExclamationTriangleIcon } from './icons';

interface FirebaseErrorScreenProps {
  error: Error;
}

const FirebaseErrorScreen: React.FC<FirebaseErrorScreenProps> = ({ error }) => {
  return (
    <div className="fixed inset-0 bg-[#F8F4EF] dark:bg-gray-900 flex flex-col items-center justify-center z-50 p-4">
      <div className="text-center max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-red-300 dark:border-red-700">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-20 h-20 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Ralat Konfigurasi Backend</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Aplikasi gagal disambungkan ke pangkalan data Firebase. Sila semak perkara berikut dalam <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Firebase Console</a> anda:</p>

        <ul className="text-left space-y-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <li className="flex items-start">
            <span className="font-bold text-blue-500 mr-2">1.</span>
            <div>
              <strong>Aktifkan Pangkalan Data Firestore:</strong> Pastikan anda telah pergi ke bahagian "Firestore Database" dan mengklik "Create database". Jika belum, aplikasi tidak akan dapat menyimpan atau memuatkan sebarang data.
            </div>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-500 mr-2">2.</span>
            <div>
              <strong>Peraturan Keselamatan (Security Rules):</strong> Untuk pembangunan awal, anda boleh menetapkan peraturan anda kepada mod ujian. Pergi ke "Firestore Database" → "Rules" dan pastikan ia membenarkan bacaan dan tulisan (cth., `allow read, write: if true;`). <strong>Amaran:</strong> Jangan gunakan ini dalam produksi.
            </div>
          </li>
           <li className="flex items-start">
            <span className="font-bold text-blue-500 mr-2">3.</span>
            <div>
              <strong>Sahkan Kredential:</strong> Semak semula kredential dalam `services/firebaseConfig.ts` untuk memastikan ia sepadan dengan yang ada dalam tetapan projek Firebase anda.
            </div>
          </li>
        </ul>

        <div className="mt-6 text-left p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <p className="font-semibold text-red-800 dark:text-red-300">Butiran Ralat Teknikal:</p>
            <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono mt-2">{error.message}</pre>
        </div>
      </div>
    </div>
  );
};

export default FirebaseErrorScreen;
