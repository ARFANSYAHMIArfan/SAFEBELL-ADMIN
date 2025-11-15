

export const UI_TEXT = {
  TITLE: "S.A.F.E - SMART REPORT",
  SUBTITLE: "Laporkan Kejadian Kecemasan DI Sini Secara Anonim Dan Selamat.",
  REPORT_TYPE_LABEL: "Pilih Jenis Laporan",
  TEXT: "Teks",
  AUDIO: "Audio",
  VIDEO: "Video",
  TEXT_PLACEHOLDER: "Sila terangkan kejadian kecemasan di sini...",
  CHAR_LIMIT_LABEL: "had 200 aksara",
  START_RECORDING_AUDIO: "Rakam Audio",
  STOP_RECORDING_AUDIO: "Hentikan Rakaman Audio",
  START_RECORDING_VIDEO: "Rakam Video",
  STOP_RECORDING_VIDEO: "Hentikan Rakaman Video",
  PREVIEW_AUDIO: "Pratonton Audio",
  PREVIEW_VIDEO: "Pratonton Video",
  SUBMIT_REPORT: "Hantar Laporan",
  SUBMITTING_REPORT: "Menghantar Laporan...",
  ANALYZING_REPORT: "Menganalisis Laporan (Mod Kecerdasan Buatan (AI))...",
  SUCCESS_MESSAGE: "Terima kasih atas laporan. Laporan ini telah dihantar kepada pengurusan sekolah untuk langkah seterusnya. Jangan risau anda dilindungi",
  ERROR_GENERIC: "Gagal menghantar laporan. Sila cuba lagi.",
  ERROR_PARTIAL_SUCCESS: "Laporan berjaya disimpan tetapi gagal dihantar ke Telegram. Pentadbir akan menyemak.",
  ERROR_MEDIA: "Gagal mengakses kamera atau mikrofon.",
  ERROR_ANALYSIS: "Gagal menganalisis laporan. Laporan akan dihantar tanpa analisis.",
  RESET_FORM: "Hantar Laporan Lain",
  CANCEL: "Batalkan",
  LOGIN: "Log Masuk",
  DASHBOARD: "Papan Pemuka",
  ADMIN_LOGIN: "Log Masuk Admin/Guru",
  USER_ID: "ID Pengguna",
  PASSWORD: "Kata Laluan",
  LOGIN_ERROR: "ID atau Kata Laluan tidak sah.",
  LOGOUT: "Log Keluar",
  WELCOME: "Selamat Datang",
  SHARE_REPORT: "Kongsi Laporan",
  COPIED_TO_CLIPBOARD: "Disalin ke papan keratan!",
  SHARE_ERROR: "Tidak dapat berkongsi laporan. Sila cuba lagi.",
  DELETE_REPORT: "Padam Laporan",
  DOWNLOAD_REPORT: "Muat Turun Laporan",
  SAVE_AS_PDF: "Simpan sebagai PDF",
  SAVE_AS_DOCX: "Simpan sebagai DOCX",
  DOWNLOAD_ALL_REPORTS: "Muat Turun Semua Laporan",
  CONFIRM_ACTION: "Sahkan Tindakan",
  ENTER_PIN_PROMPT: "Sila masukkan PIN keselamatan untuk memuat turun semua rekod laporan.",
  CONFIRM_AND_DOWNLOAD: "Sahkan & Muat Turun",
  INVALID_PIN: "Maaf, PIN tidak sah. Sila cuba lagi.",
  NEW_REPORT_NOTIFICATION: "Laporan Baru Diterima!",
  SYSTEM_MONITORING_TITLE: "Status Sistem",
  API_STATUS: "Status API & Konfigurasi",
  TELEGRAM_API: "API Telegram",
  CEREBRAS_API: "API Cerebras",
  OPENAI_API: "API OpenAI (Sandaran)",
  LOCAL_STORAGE: "Storan Tempatan",
  BROWSER_PERMISSIONS: "Kebenaran Pelayar",
  STATUS_OK: "OK",
  STATUS_ERROR: "Ralat",
  STATUS_UNCONFIGURED: "Tidak Dikonfigurasi",
  REPORTS_STORED: "Laporan Disimpan",
  PERMISSION_GRANTED: "Dibenarkan",
  PERMISSION_DENIED: "Ditolak",
  PERMISSION_PROMPT: "Perlu Kelulusan",
  RUN_CHECKS: "Jalankan Semakan",
  CHECKING_STATUS: "Menyemak...",
  FALLBACK_API_CONFIG: "Konfigurasi API Sandaran",
  FALLBACK_API_DESC: "Masukkan kunci API untuk perkhidmatan sandaran (cth: OpenAI) sekiranya API utama gagal. Ini akan mengatasi kunci yang dikonfigurasikan secara lalai.",
  FALLBACK_API_KEY_LABEL: "Kunci API OpenAI Sandaran",
};

export const TELEGRAM_CONFIG = {
    API_KEY: "8442585359:AAEBt1xupGHvayRPMRFlumdBSnbbcBV_-74/",
    CHAT_ID: "-1003022468499"
};

export const CEREBRAS_CONFIG = {
    API_KEY: "csk-f6evm2xmvnrt349cpce5k4tnvt3ne35knnc3jy96kpfh8cp6"
};

export const OPENAI_CONFIG = {
    API_KEY: "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",
    SERVICE_ACCOUNT_API: "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"
};

export const TEXT_CHAR_LIMIT = 200;

// Note: Storing credentials in frontend code is not secure for production environments.
// This is for demonstration purposes only.
export const CREDENTIALS = {
  ADMIN: {
    ID: "Safe2141@mozac",
    PASSWORD: "Admin@mozac101"
  },
  TEACHER: {
    ID: "Safe2141@teacher",
    PASSWORD: "Teacher@mee2141"
  }
};

export const ADMIN_DOWNLOAD_PIN = "21412141";