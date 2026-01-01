'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeProvider';

interface Project {
    _id: string;
    name: string;
    originalFile: string;
    stems: Array<{ name: string; url: string }>;
    createdAt: string;
}

interface SidebarProps {
    onProjectSelect: (project: Project) => void;
    currentProjectId?: string;
}

export default function Sidebar({ onProjectSelect, currentProjectId }: SidebarProps) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProjects();
        } else {
            setProjects([]);
        }
    }, [user]);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <aside className="w-72 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col h-full sticky top-0">
            {/* Top: Logo */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-900">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Stem<span className="text-purple-600 dark:text-purple-400">Split</span>
                </h1>
            </div>

            {/* Middle: History */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">History</h2>
                    {user && (
                        <button
                            onClick={fetchProjects}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            title="Refresh History"
                        >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>

                {!user || projects.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">No projects yet</p>
                        <p className="text-[10px] text-gray-500 mt-1">Stems will appear here after upload</p>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3 px-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {projects.map((project) => (
                            <button
                                key={project._id}
                                onClick={() => onProjectSelect(project)}
                                className={`w-full text-left p-3 rounded-xl transition-all group ${currentProjectId === project._id
                                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/50 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${currentProjectId === project._id
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-400 group-hover:text-purple-600'
                                        }`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                                        </svg>
                                    </div>
                                    <div className="truncate">
                                        <p className={`text-sm font-bold truncate ${currentProjectId === project._id ? 'text-purple-900 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {project.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom: User & Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-900 space-y-2">
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-colors text-xs font-bold text-gray-500 dark:text-gray-400"
                >
                    {theme === 'light' ? (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            Dark Mode
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Light Mode
                        </>
                    )}
                </button>

                {user ? (
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md uppercase">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                            <button
                                onClick={logout}
                                className="text-[10px] text-red-500 hover:text-red-600 font-bold transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Guest Mode</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
