import React, { useEffect, useState, useRef } from 'react';
import { ReelItem } from '../types';
import { generateReelImage, generateReelAudio } from '../services/geminiService';

interface ReelCardProps {
  item: ReelItem;
  isActive: boolean;
  currentIndex: number;
  totalCount: number;
}

const ReelCard: React.FC<ReelCardProps> = ({ item, isActive, currentIndex, totalCount }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load media eagerly
  useEffect(() => {
    let isMounted = true;
    const loadMedia = async () => {
      // Don't regenerate if we already have it (though component unmounting might clear state in this simple version)
      if (imageUrl) return;

      const img = await generateReelImage(item.visualPrompt);
      if (isMounted && img) setImageUrl(img);

      const audio = await generateReelAudio(item.narrationScript);
      if (isMounted && audio) setAudioUrl(audio);
    };
    loadMedia();
    return () => { isMounted = false; };
  }, [item]);

  // Playback Control
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isActive) {
      // Small delay to allow transition to finish
      const timer = setTimeout(() => {
        audioRef.current?.play().catch(() => console.log("Autoplay prevented"));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      audioRef.current.pause();
      if (!isActive) {
        audioRef.current.currentTime = 0;
        setProgress(0);
      }
    }
  }, [isActive, audioUrl]);

  // Update Progress
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  return (
    <div className="h-full w-full relative flex-shrink-0 snap-start bg-black overflow-hidden select-none">
      {/* Audio Engine */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setProgress(100)}
        />
      )}

      {/* Visual Layer */}
      <div className="absolute inset-0 w-full h-full bg-gray-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.visualPrompt}
            className={`w-full h-full object-cover ${isActive ? 'animate-pan-zoom' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
             <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4"></div>
             <p className="text-zinc-500 text-xs tracking-widest uppercase">Creating Visuals</p>
          </div>
        )}
        
        {/* Professional Scrim (Gradient) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      </div>

      {/* Top Bar (Context & Counter) */}
      <div className="absolute top-0 left-0 right-0 p-5 pt-8 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <span className="text-xs font-bold text-white">SR</span>
            </div>
            <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold max-w-[150px] truncate">{item.topic}</p>
                <p className="text-xs text-gray-400">AI Generated Course</p>
            </div>
        </div>
        
        {/* Reel Counter */}
        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-xs font-medium text-white tracking-wider">
            {currentIndex + 1} / {totalCount || '?'}
          </span>
        </div>
      </div>

      {/* Main Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 z-10">
        <div className="flex flex-col space-y-4 mb-6">
            <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-xl">
                {item.subtopic}
            </h2>
            <div className="relative pl-4">
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                <p className="text-lg text-gray-100 font-normal leading-relaxed drop-shadow-md opacity-95">
                {item.shortNote}
                </p>
            </div>
        </div>

        {/* Audio Progress Bar */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
            />
        </div>
      </div>
    </div>
  );
};

export default ReelCard;
