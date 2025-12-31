'use client';

import { useState } from 'react';
import MultiTrackEditor from '@/components/MultiTrackEditor';
import { useTheme } from '@/components/ThemeProvider';
import BuildAnimation from '@/components/BuildAnimation';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stems, setStems] = useState<any[]>([]);
  const { theme, toggleTheme } = useTheme();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav)$/i)) {
        setError('Please upload a valid MP3 or WAV file');
        return;
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 50MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || errorData.details?.detail || 'Upload failed');
      }

      const data = await response.json();
      setStems(data.stems);
      setIsProcessing(false);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      setIsProcessing(false);
    }
  };

  const handleNewProject = () => {
    setStems([]);
    setFile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      {/* Navbar */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Stem<span className="text-purple-600 dark:text-purple-400">Split</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {stems.length > 0 && (
            <button
              onClick={handleNewProject}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              New Project
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Upload Section (col-4) */}
        <aside className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upload Audio</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a song (MP3/WAV) to isolate vocals, drums, bass, and more using AI.
              </p>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
                  ${file ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              onClick={() => document.getElementById('audio-upload')?.click()}
            >
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <>
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 group-hover:text-purple-500 dark:group-hover:text-purple-400 rounded-full flex items-center justify-center mb-3 transition-colors">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <p className="font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white text-sm">Click to upload</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">MP3 or WAV up to 50MB</p>
                </>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              disabled={!file || isProcessing}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all
                  ${!file || isProcessing
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-black dark:bg-purple-600 text-white hover:bg-gray-800 dark:hover:bg-purple-700 hover:shadow-xl'
                }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Separating Stems...
                </span>
              ) : 'Split Tracks'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs">
                {error}
              </div>
            )}
          </div>
        </aside>

        {/* Main Area - Editor (col-8) */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50 dark:bg-black">
          {isProcessing ? (
            <BuildAnimation />
          ) : stems.length > 0 ? (
            <div className="w-full max-w-[1400px] mx-auto">
              <MultiTrackEditor stems={stems} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Project Loaded</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Upload an audio file to get started with stem separation and multi-track editing.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
