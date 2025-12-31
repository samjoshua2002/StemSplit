'use client';

import { useState, useEffect, useRef } from 'react';

interface RecordingControlsProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    isRecording: boolean;
    onRecordingStateChange: (recording: boolean) => void;
}

export default function RecordingControls({
    onRecordingComplete,
    isRecording,
    onRecordingStateChange
}: RecordingControlsProps) {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [hasPermission, setHasPermission] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [inputLevel, setInputLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Enumerate audio devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const deviceList = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = deviceList.filter(device => device.kind === 'audioinput');
                setDevices(audioInputs);
                if (audioInputs.length > 0 && !selectedDevice) {
                    setSelectedDevice(audioInputs[0].deviceId);
                }
            } catch (error) {
                console.error('Error enumerating devices:', error);
            }
        };

        getDevices();
    }, [selectedDevice]);

    // Request microphone permission
    const requestPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;
            setHasPermission(true);

            // Setup audio analysis for level meter
            setupAudioAnalysis(stream);

            return stream;
        } catch (error) {
            console.error('Error requesting microphone permission:', error);
            alert('Microphone access denied. Please allow microphone access to record.');
            return null;
        }
    };

    // Setup audio analysis for input level meter
    const setupAudioAnalysis = (stream: MediaStream) => {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

        updateInputLevel();
    };

    // Update input level meter
    const updateInputLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setInputLevel(average / 255); // Normalize to 0-1

        animationFrameRef.current = requestAnimationFrame(updateInputLevel);
    };

    // Start recording
    const startRecording = async () => {
        let stream = streamRef.current;

        if (!stream) {
            stream = await requestPermission();
            if (!stream) return;
        }

        audioChunksRef.current = [];

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            onRecordingComplete(audioBlob, recordingTime);
            setRecordingTime(0);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        onRecordingStateChange(true);

        // Start timer
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            onRecordingStateChange(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Device Selector */}
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isRecording}
                >
                    {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Input Level Meter */}
            <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Level</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-75 rounded-full"
                        style={{
                            width: `${inputLevel * 100}%`,
                            backgroundColor: inputLevel > 0.8 ? '#EF4444' : inputLevel > 0.5 ? '#F59E0B' : '#10B981'
                        }}
                    />
                </div>
            </div>

            {/* Recording Timer */}
            {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-mono font-bold text-red-600">
                        {formatTime(recordingTime)}
                    </span>
                </div>
            )}

            {/* Record Button */}
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
            >
                {isRecording ? 'Stop Recording' : 'Record'}
            </button>
        </div>
    );
}
