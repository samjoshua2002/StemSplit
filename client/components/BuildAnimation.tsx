'use client';

import { useEffect, useState, useRef } from 'react';

export default function BuildAnimation() {
    const [logs, setLogs] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const buildSteps = [
        "Initializing AI model...",
        "Loading audio waveform...",
        "Analyzing frequency spectrum...",
        "Separating vocals...",
        "Isolating drum patterns...",
        "Extracting bass frequencies...",
        "Processing harmonic elements...",
        "Synthesizing stem tracks...",
        "Finalizing audio buffers...",
        "Optimizing playback streams...",
        "Project build complete."
    ];

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < buildSteps.length) {
                setLogs(prev => [...prev, `> ${buildSteps[currentIndex]} [${new Date().toLocaleTimeString()}]`]);
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 font-mono text-sm relative">
                {/* Terminal Header */}
                <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="ml-4 text-gray-500 text-xs">stem-separator-cli — build</div>
                </div>

                {/* Terminal Content */}
                <div
                    ref={scrollRef}
                    className="h-[400px] p-6 text-green-400 overflow-y-auto font-mono space-y-2 scroll-smooth"
                >
                    <div className="text-gray-500 mb-4">
                        Starting build process for project...<br />
                        Target: Multi-track Audio Stems<br />
                        Engine: Next.js + WaveSurfer + Tone.js
                    </div>

                    {logs.map((log, index) => (
                        <div key={index} className="opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
                            <span className="text-blue-400 mr-2">info</span>
                            {log}
                        </div>
                    ))}

                    <div className="animate-pulse mt-2">
                        <span className="text-purple-500">➜</span> <span className="text-gray-300">_</span>
                    </div>
                </div>

                {/* Scanning visual effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20 animate-scan"></div>
            </div>

            <div className="mt-8 text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Processing Your Audio</h3>
                <p className="text-gray-500 dark:text-gray-400">Our AI is splitting your track into individual stems. This usually takes about 10-15 seconds.</p>
            </div>

            <style jsx>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out;
                }
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
