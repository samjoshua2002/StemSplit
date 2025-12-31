export default function EditorSkeleton() {
    return (
        <div className="w-full bg-white dark:bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[700px] border border-gray-200 dark:border-gray-800 animate-pulse">

            {/* Header Skeleton */}
            <div className="h-20 bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-800 px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Play Button */}
                    <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800"></div>

                    {/* Time Display */}
                    <div className="flex flex-col gap-2">
                        <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        <div className="w-32 h-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Timeline Skeleton */}
            <div className="h-12 px-8 flex items-center bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800">
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            </div>

            {/* Tracks Area Skeleton */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-black">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                        {/* Track Controls (Left) */}
                        <div className="w-72 p-5 flex flex-col justify-between border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-black">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-3 h-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                                    <div className="w-32 h-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-900 rounded"></div>
                                    <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-900 rounded"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                            </div>
                        </div>

                        {/* Waveform (Right) */}
                        <div className="flex-1 p-4 bg-white dark:bg-black relative">
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg"></div>

                            {/* Loading Text Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        Generating Stem...
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
