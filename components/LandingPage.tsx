import React, { useState } from 'react';

interface LandingPageProps {
  onStartLearning: (topic: string) => void;
  isLoading: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartLearning, isLoading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onStartLearning(topic);
    }
  };

  const suggestions = ["Artificial Intelligence", "Renaissance Art", "Crypto Economics", "React Performance"];

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Subtle Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] animate-soft-pulse"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-xl w-full z-10 px-6 flex flex-col items-center space-y-10">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 uppercase tracking-widest">
            AI-Powered Learning
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            SkillReels
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-light max-w-md mx-auto leading-relaxed">
            Transform any topic into an immersive, bite-sized learning experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="relative group w-full">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to master?"
              className="w-full bg-neutral-900/50 backdrop-blur-xl border border-white/10 text-white placeholder-gray-500 rounded-2xl px-6 py-5 text-xl font-light focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-2xl"
              disabled={isLoading}
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className={`w-full py-4 rounded-2xl text-lg font-medium tracking-wide transition-all transform duration-300 
              ${!topic.trim() || isLoading 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.01] shadow-xl shadow-white/5'
              }`}
          >
            {isLoading ? 'Curating Content...' : 'Generate Reels'}
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
             <button 
               key={s}
               onClick={() => !isLoading && onStartLearning(s)}
               disabled={isLoading}
               className="px-4 py-2 bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 rounded-full text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
             >
               {s}
             </button>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-6 text-neutral-600 text-xs">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default LandingPage;