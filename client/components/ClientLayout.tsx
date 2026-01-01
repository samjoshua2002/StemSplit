'use client';

import Sidebar from "@/components/Sidebar";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-black">
            <Sidebar
                onProjectSelect={(project) => {
                    // Dispatch a custom event that the Home page can listen to
                    window.dispatchEvent(new CustomEvent('project-selected', { detail: project }));
                }}
            />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
