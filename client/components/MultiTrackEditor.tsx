'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordingControls from './RecordingControls';

interface Stem {
    name: string;
    url: string;
}

interface MultiTrackEditorProps {
    stems: Stem[];
    songName?: string;
}

interface TrackState {
    id: string;
    name: string;
    url: string;
    wavesurfer: WaveSurfer | null;
    volume: number;
    isMuted: boolean;
    isSoloed: boolean;
    type: 'audio' | 'midi' | 'recorded';
    color?: string;
}

// Modern color palette
const STEM_COLORS: Record<string, string> = {
    drums: '#FF6B8B', // coral pink
    bass: '#5E7CE2',  // soft blue
    other: '#FFC145', // sunny yellow
    vocals: '#B39EF3', // lavender
    piano: '#A78BFA', // purple
    guitar: '#F97316', // orange
    recorded: '#10B981', // green
    midi: '#EC4899', // pink
    default: '#4ECDC4' // turquoise
};

export default function MultiTrackEditor({ stems, songName = 'Unknown Track' }: MultiTrackEditorProps) {
    const [tracks, setTracks] = useState<TrackState[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [soloActive, setSoloActive] = useState(false);
    const [showRecordingPanel, setShowRecordingPanel] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isReadyRef = useRef<boolean>(false);
    const rafRef = useRef<number>(0);

    // Initialize WaveSurfers
    useEffect(() => {
        tracks.forEach(t => t.wavesurfer?.destroy());

        const newTracks: TrackState[] = stems.map((stem, index) => {
            const stemType = Object.keys(STEM_COLORS).find(key =>
                stem.name.toLowerCase().includes(key)
            ) || 'default';
            const color = STEM_COLORS[stemType];

            return {
                id: `track-${index}`,
                name: stem.name.replace('.wav', ''),
                url: stem.url,
                wavesurfer: null,
                volume: 0.8,
                isMuted: false,
                isSoloed: false,
                type: 'audio',
                color: color,
            };
        });

        setTracks(newTracks);
        isReadyRef.current = false;
    }, [stems]);

    // Mount WaveSurfers when DOM is ready
    useEffect(() => {
        if (tracks.length === 0 || isReadyRef.current) return;

        const initializedTracks = [...tracks];
        let loadedCount = 0;

        initializedTracks.forEach((track, index) => {
            const container = containerRefs.current[index];
            if (!container) return;

            const stemType = Object.keys(STEM_COLORS).find(key =>
                track.name.toLowerCase().includes(key)
            ) || 'default';
            const color = STEM_COLORS[stemType];

            const ws = WaveSurfer.create({
                container: container,
                waveColor: color + '96',
                progressColor: color,
                cursorColor: '#626060ff',
                cursorWidth: 1,
                barWidth: 2,
                barGap: 1,
                barRadius: 1,
                height: 80,
                normalize: true,
                backend: 'WebAudio',
                barHeight: 0.9,
                interact: true,
            });

            ws.load(track.url);

            ws.on('ready', () => {
                loadedCount++;
                if (loadedCount === stems.length) {
                    const longestDuration = Math.max(...initializedTracks.map(t =>
                        t.wavesurfer?.getDuration() || 0
                    ));
                    setDuration(longestDuration);
                }
            });

            ws.on('finish', () => {
                if (index === 0) setIsPlaying(false);
            });

            // Sync seeking across all tracks
            ws.on('interaction', (newTime) => {
                initializedTracks.forEach((t, idx) => {
                    if (idx !== index && t.wavesurfer) {
                        t.wavesurfer.setTime(newTime);
                    }
                });
                setCurrentTime(newTime);
            });

            // Sync time updates
            ws.on('timeupdate', (time) => {
                if (index === 0) {
                    setCurrentTime(time);
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = requestAnimationFrame(() => {
                        setCurrentTime(time);
                    });
                }
            });

            track.wavesurfer = ws;
        });

        setTracks(initializedTracks);
        isReadyRef.current = true;

        return () => {
            initializedTracks.forEach(t => t.wavesurfer?.destroy());
            cancelAnimationFrame(rafRef.current);
        };
    }, [tracks.length, stems]);

    // Improved solo/mute synchronization
    const updateTrackStates = useCallback((updatedTracks: TrackState[], isCurrentlyPlaying: boolean = false) => {
        const hasSolo = updatedTracks.some(t => t.isSoloed);
        setSoloActive(hasSolo);

        // If playing, sync all tracks to the same position first
        if (isCurrentlyPlaying && updatedTracks.length > 0 && updatedTracks[0].wavesurfer) {
            const currentTime = updatedTracks[0].wavesurfer.getCurrentTime();
            updatedTracks.forEach(track => {
                if (track.wavesurfer) {
                    track.wavesurfer.setTime(currentTime);
                }
            });
        }

        updatedTracks.forEach(track => {
            if (!track.wavesurfer) return;

            if (hasSolo) {
                // Solo mode: mute all non-soloed tracks
                const shouldBeMuted = !track.isSoloed;
                track.wavesurfer.setMuted(shouldBeMuted);
                // Keep volume for soloed tracks
                if (track.isSoloed) {
                    track.wavesurfer.setVolume(track.volume);
                }
            } else {
                // Normal mode: respect individual mute states
                track.wavesurfer.setMuted(track.isMuted);
                track.wavesurfer.setVolume(track.volume);
            }
        });
    }, []);

    const toggleMute = (index: number) => {
        const newTracks = [...tracks];
        const track = newTracks[index];

        // If solo is active and we're muting a soloed track, turn off solo first
        if (soloActive && track.isSoloed) {
            track.isSoloed = false;
            setSoloActive(newTracks.some(t => t.isSoloed && t.id !== track.id));
        }

        track.isMuted = !track.isMuted;
        setTracks(newTracks);
        updateTrackStates(newTracks, isPlaying);
    };

    const toggleSolo = (index: number) => {
        const newTracks = [...tracks];
        const track = newTracks[index];

        // Toggle solo state
        track.isSoloed = !track.isSoloed;

        // If turning solo on, ensure track is not muted
        if (track.isSoloed) {
            track.isMuted = false;
        }

        setTracks(newTracks);
        updateTrackStates(newTracks, isPlaying);
    };

    const setVolume = (index: number, val: number) => {
        const newTracks = [...tracks];
        const track = newTracks[index];
        track.volume = val;

        if (track.wavesurfer && (!soloActive || track.isSoloed)) {
            track.wavesurfer.setVolume(val);
        }
        setTracks(newTracks);
    };

    const skipBackward = useCallback(() => {
        const newTime = Math.max(0, currentTime - 10);
        tracks.forEach(track => {
            if (track.wavesurfer) {
                track.wavesurfer.setTime(newTime);
            }
        });
        setCurrentTime(newTime);
    }, [currentTime, tracks]);

    const skipForward = useCallback(() => {
        const newTime = Math.min(duration, currentTime + 10);
        tracks.forEach(track => {
            if (track.wavesurfer) {
                track.wavesurfer.setTime(newTime);
            }
        });
        setCurrentTime(newTime);
    }, [duration, currentTime, tracks]);

    const togglePlay = () => {
        if (tracks.length === 0) return;

        if (isPlaying) {
            tracks.forEach(t => t.wavesurfer?.pause());
        } else {
            // Start all tracks at the same time
            const currentTime = tracks[0].wavesurfer?.getCurrentTime() || 0;
            tracks.forEach(t => {
                if (t.wavesurfer) {
                    t.wavesurfer.setTime(currentTime);
                    t.wavesurfer.play();
                }
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        setCurrentTime(time);
        tracks.forEach(t => t.wavesurfer?.setTime(time));
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Spacebar or Media Play/Pause
            if (e.code === 'Space' || e.key === 'MediaPlayPause') {
                e.preventDefault(); // Prevent scrolling
                togglePlay();
            }
            // Media Next
            if (e.key === 'MediaTrackNext') {
                e.preventDefault();
                skipForward();
            }
            // Media Previous
            if (e.key === 'MediaTrackPrevious') {
                e.preventDefault();
                skipBackward();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, skipForward, skipBackward]); // Dependencies must be included

    // Handle completed recording
    const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
        // Convert blob to URL
        const url = URL.createObjectURL(audioBlob);

        // Create new track
        const newTrack: TrackState = {
            id: `track-${Date.now()}`,
            name: `Recording ${tracks.length + 1}`,
            url: url,
            wavesurfer: null,
            volume: 0.8,
            isMuted: false,
            isSoloed: false,
            type: 'recorded',
            color: STEM_COLORS['recorded'],
        };

        setTracks(prev => [...prev, newTrack]);
        setShowRecordingPanel(false);
    };

    // Add new empty track
    const addNewTrack = () => {
        setShowRecordingPanel(true);
    };

    // Delete track
    const deleteTrack = (index: number) => {
        const track = tracks[index];
        if (track.wavesurfer) {
            track.wavesurfer.destroy();
        }

        // Revoke object URL if it's a recorded track
        if (track.type === 'recorded' || track.type === 'midi') {
            URL.revokeObjectURL(track.url);
        }

        setTracks(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full bg-white dark:bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[700px] border border-gray-200 dark:border-gray-800">

            {/* New Header Design */}
            <div className="h-24 bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">

                {/* Left: Song Details */}
                <div className="w-1/3 flex items-center gap-4 overflow-hidden">
                    <div className="relative group cursor-help">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute top-12 left-0 w-64 p-4 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
                            <p className="font-bold text-gray-300 uppercase tracking-wider mb-1">Current Track</p>
                            <p className="font-medium text-white">{songName}</p>
                            <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between">
                                <span className="text-gray-500">Duration</span>
                                <span className="text-gray-300">{formatTime(duration)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative h-10 flex items-center">
                        <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-4">
                            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{songName}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm font-medium text-gray-500">{stems.length} Stems</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{songName}</span>
                        </div>
                    </div>
                </div>

                {/* Center: Playback Controls */}
                <div className="w-1/3 flex flex-col items-center justify-center -mt-1">
                    <div className="flex items-center gap-6 mb-1">
                        {/* Skip -10s */}
                        <button
                            onClick={skipBackward}
                            className="p-2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            title="-10 Seconds"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                            </svg>
                        </button>

                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 rounded-full flex items-center justify-center bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl z-10"
                        >
                            {isPlaying ? (
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-7 h-7 ml-1 fill-current" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        {/* Skip +10s */}
                        <button
                            onClick={skipForward}
                            className="p-2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            title="+10 Seconds"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Timer */}
                    <div className="font-mono text-sm font-medium text-gray-400 dark:text-gray-500 tracking-wider">
                        <span className="text-gray-900 dark:text-white/90">{formatTime(currentTime)}</span>
                        <span className="mx-1 opacity-50">/</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Tools & Solo */}
                <div className="w-1/3 flex items-center justify-end gap-3">
                    {soloActive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                            <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-wide">Solo Active</span>
                        </div>
                    )}
                </div>

            </div>

            {/* Recording Panel */}
            {showRecordingPanel && (
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Record Audio Track</h3>
                        <button
                            onClick={() => setShowRecordingPanel(false)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Recording Controls */}
                    <RecordingControls
                        onRecordingComplete={handleRecordingComplete}
                        isRecording={isRecording}
                        onRecordingStateChange={setIsRecording}
                    />
                </div>
            )}

            {/* Timeline */}
            <div className="h-12 px-8 flex items-center bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800">
                <div className="flex-1 relative group flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={duration || 1}
                        step="0.01"
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-800 accent-purple-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                        style={{
                            backgroundImage: `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / (duration || 1)) * 100}%, transparent ${(currentTime / (duration || 1)) * 100}%, transparent 100%)`
                        }}
                    />
                </div>
            </div>

            {/* Tracks Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-black">
                {tracks.map((track, index) => {
                    const stemType = Object.keys(STEM_COLORS).find(key =>
                        track.name.toLowerCase().includes(key)
                    ) || 'default';
                    const color = STEM_COLORS[stemType];

                    const isMuted = track.isMuted || (soloActive && !track.isSoloed);

                    return (
                        <div
                            key={track.id}
                            className={`group flex rounded-xl overflow-hidden transition-all duration-300 shadow-sm border ${isMuted
                                ? 'opacity-60 bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                                : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-md'
                                } ${track.isSoloed ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-black' : ''}`}
                        >
                            {/* Track Controls */}
                            <div className={`w-72 p-5 flex flex-col justify-between transition-all duration-300 border-r border-gray-100 dark:border-gray-800 ${isMuted ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-black'
                                }`}>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-8 rounded-full shadow-sm"
                                                style={{ backgroundColor: color }}
                                            ></div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-lg capitalize tracking-tight">
                                                {track.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            onClick={() => toggleMute(index)}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${track.isMuted
                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-900 shadow-inner'
                                                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                                                }`}
                                        >
                                            {track.isMuted ? 'Muted' : 'Mute'}
                                        </button>

                                        <button
                                            onClick={() => toggleSolo(index)}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${track.isSoloed
                                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900 shadow-inner'
                                                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                                                }`}
                                        >
                                            Solo
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={track.volume}
                                            onChange={(e) => setVolume(index, Number(e.target.value))}
                                            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-100"
                                            style={{
                                                backgroundImage: `linear-gradient(to right, ${color} 0%, ${color} ${track.volume * 100}%, transparent ${track.volume * 100}%, transparent 100%)`
                                            }}
                                            disabled={isMuted}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Waveform */}
                            <div className="flex-1 relative bg-white dark:bg-black p-4">
                                <div
                                    ref={el => { containerRefs.current[index] = el }}
                                    className="w-full h-full rounded-lg overflow-hidden"
                                />
                                {isMuted && (
                                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest bg-white dark:bg-gray-900 px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
                                            {soloActive && !track.isSoloed ? 'Muted by Solo' : 'Muted'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Download Button (Right) */}
                            <div className="w-16 border-l border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                                <a
                                    href={track.url}
                                    download
                                    className="p-3 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-black rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                    title="Download Stem"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
