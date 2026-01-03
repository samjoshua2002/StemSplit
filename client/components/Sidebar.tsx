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
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            fetchProjects();
        } else {
            setProjects([]);
            setFilteredProjects([]);
        }

        const handleProjectUpdate = () => {
            if (user) fetchProjects();
        };

        window.addEventListener('project-list-updated', handleProjectUpdate);
        return () => window.removeEventListener('project-list-updated', handleProjectUpdate);
    }, [user]);

    // Update filtered projects when search or projects change
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProjects(projects);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredProjects(projects.filter(p =>
                p.name.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, projects]);

    const fetchProjects = async () => {
        // Silent update if we already have projects (don't show full loading state)
        if (projects.length === 0) setIsLoading(true);

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
        <aside
            className={`${isCollapsed ? 'w-20' : 'w-80'} bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 flex flex-col h-full sticky top-0 transition-all duration-300 ease-in-out z-50 shadow-xl`}
        >
            {/* Top: Logo & Toggle */}
            <div className={`p-6 border-b border-gray-100 dark:border-gray-900 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
                        Stem<span className="text-purple-600 dark:text-purple-400">Split</span>
                    </h1>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isCollapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Middle: Search & History */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                {/* Search Bar */}
                {!isCollapsed && (
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl leading-5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm font-medium"
                            placeholder="Search projects..."
                        />
                    </div>
                )}

                {/* History Header */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
                    {!isCollapsed && <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">History</h2>}
                </div>

                {!user || projects.length === 0 ? (
                    <div className={`text-center py-10 px-4 ${isCollapsed ? 'hidden' : 'block'}`}>
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">No projects yet</p>
                        <p className="text-[10px] text-gray-500 mt-1">Stems will appear here</p>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3 px-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl ${isCollapsed ? 'h-10 w-10 mx-auto' : 'h-16'}`} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredProjects.map((project) => (
                            <button
                                key={project._id}
                                onClick={() => onProjectSelect(project)}
                                className={`w-full text-left p-2 rounded-xl transition-all group relative overflow-hidden ${isCollapsed
                                    ? 'flex justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/50 border border-transparent hover:border-gray-100 dark:hover:border-gray-800'
                                    } ${currentProjectId === project._id ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : ''}`}
                                title={project.name}
                            >
                                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${currentProjectId === project._id
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-400 group-hover:text-purple-600 group-hover:bg-white dark:group-hover:bg-gray-800'
                                        }`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                                        </svg>
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${currentProjectId === project._id ? 'text-purple-900 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {project.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                                {new Date(project.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom: User & Actions */}
            <div className={`p-4 border-t border-gray-100 dark:border-gray-900 space-y-2 bg-gray-50/50 dark:bg-black/50 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-xs font-bold text-gray-500 dark:text-gray-400 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            {!isCollapsed && <span>Dark Mode</span>}
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {!isCollapsed && <span>Light Mode</span>}
                        </>
                    )}
                </button>

                {user ? (
                    <div className={`flex items-center gap-3 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 ${isCollapsed ? 'justify-center w-full p-2' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md uppercase flex-shrink-0">
                            {user.name.charAt(0)}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                <button
                                    onClick={logout}
                                    className="text-[10px] text-red-500 hover:text-red-600 font-bold transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-auth-dialog', { detail: { mode: 'login' } }))}
                        className={`w-full p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:scale-[0.98] active:scale-95 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group ${isCollapsed ? 'justify-center' : 'justify-center'}`}
                        title="Sign In"
                    >
                        <svg className={`w-4 h-4 ${isCollapsed ? '' : '-ml-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Sign In</span>}
                    </button>
                )}
            </div>
        </aside>
    );
}
