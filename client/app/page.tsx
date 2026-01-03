'use client';

import { useState, useEffect } from 'react';
import MultiTrackEditor from '@/components/MultiTrackEditor';
import { useTheme } from '@/components/ThemeProvider';
import EditorSkeleton from '@/components/EditorSkeleton';
import { useAuth } from '@/components/AuthContext';
import AuthDialog from '@/components/AuthDialog';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stems, setStems] = useState<any[]>([]);
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isPendingUpload, setIsPendingUpload] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();

  // Seamless upload logic: trigger upload once user logs in if they had a pending upload
  useEffect(() => {
    if (user && isPendingUpload && file) {
      console.log('User logged in, auto-triggering pending upload');
      setIsPendingUpload(false);
      handleUpload();
    }
  }, [user, isPendingUpload, file]);

  // Handle project selection from Sidebar
  useEffect(() => {
    const handleProjectSelect = (e: any) => {
      const project = e.detail;
      setStems(project.stems);
      setCurrentProjectName(project.name);
      setCurrentProjectId(project._id); // Track ID
      setFile(null); // Clear pending file
    };

    window.addEventListener('project-selected', handleProjectSelect);
    return () => window.removeEventListener('project-selected', handleProjectSelect);
  }, []);

  // Handle auth dialog request from Sidebar
  useEffect(() => {
    const handleAuthRequest = (e: any) => {
      if (e.detail?.mode) setAuthMode(e.detail.mode);
      setIsAuthDialogOpen(true);
    };
    window.addEventListener('open-auth-dialog', handleAuthRequest);
    return () => window.removeEventListener('open-auth-dialog', handleAuthRequest);
  }, []);

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

    if (!user) {
      console.log('User not authenticated, holding upload until login');
      setIsPendingUpload(true);
      setAuthMode('login');
      setIsAuthDialogOpen(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('userEmail', user.email);
    formData.append('audio', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const normalizedEmail = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      const response = await fetch(`${apiUrl}/upload?subDir=${normalizedEmail}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        const errorMessage = errorData.details
          ? (typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details))
          : (errorData.error || 'Upload failed');
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStems(data.stems);
      setCurrentProjectName(file.name);
      setCurrentProjectId(`temp-${Date.now()}`); // Force remount for new project
      setIsProcessing(false);

      // Save to project history
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          originalFile: data.originalFile,
          stems: data.stems,
        }),
      });

      // Notify Sidebar for auto-refresh
      window.dispatchEvent(new Event('project-list-updated'));

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
    setCurrentProjectName('Untitled Project');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        initialMode={authMode}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-black p-6 md:p-12">
          {isProcessing ? (
            <EditorSkeleton />
          ) : stems.length > 0 ? (
            <div className="w-full max-w-[1400px] mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-gray-900 dark:text-white truncate pr-4">
                  {currentProjectName}
                </h2>
                <button
                  onClick={handleNewProject}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold text-sm shadow-sm"
                >
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Project
                </button>
              </div>
              <MultiTrackEditor key={currentProjectId || 'default'} stems={stems} songName={currentProjectName} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center max-w-2xl mx-auto">
              <div className="w-full space-y-8 p-10 backdrop-blur-xl">
                <div className="text-center">
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
                    Stem<span className="text-purple-600 dark:text-purple-400">Split</span>
                  </h1>
                  <p className="text-gray-500 font-bold text-sm">Upload your track to isolate stems using AI</p>
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group h-72
                      ${file ? 'border-purple-500 bg-purple-50/30 dark:bg-purple-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50/50 dark:hover:bg-gray-900/30'}`}
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
                      <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg truncate max-w-full px-4">{file.name}</p>
                      <p className="text-xs text-gray-500 font-bold mt-2 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-700 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-500 transition-colors">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <p className="font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white text-lg transition-colors">Select Audio File</p>
                      <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-tighter">Drag and drop supported</p>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                    disabled={!file || isProcessing}
                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all
                        ${!file || isProcessing
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-black dark:bg-purple-600 text-white hover:bg-gray-800 dark:hover:bg-purple-700 hover:shadow-purple-500/40'
                      }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Split Tracks
                      </span>
                    ) : 'Split Tracks'}
                  </button>

                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest px-8">
                    By splitting tracks, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>

                {error && (
                  <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold shadow-sm">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
