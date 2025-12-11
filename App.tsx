import React, { useState, useRef, useEffect, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import ReelCard from './components/ReelCard';
import { ReelItem, LoadingState } from './types';
import { streamLearningReels } from './services/geminiService';

const App: React.FC = () => {
  const [items, setItems] = useState<ReelItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentTopic, setCurrentTopic] = useState('');
  // Use a ref to track if stream is finished to avoid premature "End of Feed"
  const [isStreamComplete, setIsStreamComplete] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const startStream = async (topic: string, mode: 'learn' | 'quiz' | 'deep-dive' = 'learn') => {
    setLoadingState(LoadingState.PLANNING);
    setItems([]);
    setActiveIndex(0);
    setIsStreamComplete(false);
    setCurrentTopic(topic);

    try {
      await streamLearningReels(
        topic, 
        (newItem) => {
          setItems(prev => {
            // Avoid duplicates if streaming hiccups
            if (prev.find(i => i.id === newItem.id)) return prev;
            return [...prev, newItem];
          });
          // Move to READY state as soon as we have one item
          setLoadingState(prev => prev === LoadingState.PLANNING ? LoadingState.READY : prev);
        },
        mode
      );
      setIsStreamComplete(true);
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
      // Only alert if we have 0 items
      if (items.length === 0) {
        alert("Failed to generate content. Please try again.");
        setLoadingState(LoadingState.IDLE);
      }
    }
  };

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const height = container.clientHeight;
    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / height);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const goBack = () => {
    setItems([]);
    setLoadingState(LoadingState.IDLE);
    setActiveIndex(0);
    setCurrentTopic('');
  };

  if (loadingState === LoadingState.IDLE) {
    return <LandingPage onStartLearning={(t) => startStream(t, 'learn')} isLoading={false} />;
  }

  // If planning and no items yet, show loading spinner on landing page
  if (loadingState === LoadingState.PLANNING && items.length === 0) {
    return <LandingPage onStartLearning={() => {}} isLoading={true} />;
  }

  return (
    <div className="h-screen w-full bg-black relative flex items-center justify-center overflow-hidden">
      
      {/* Desktop Ambient Background */}
      <div className="absolute inset-0 hidden md:block opacity-30 pointer-events-none transition-colors duration-1000 bg-gray-900">
         <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-black to-blue-900/40 blur-[100px]"></div>
      </div>

      {/* Main App Container */}
      <div className="relative w-full h-full md:h-[90vh] md:w-[420px] md:rounded-[3rem] md:border-[8px] md:border-zinc-800 md:shadow-2xl overflow-hidden bg-black ring-1 ring-white/10">
        
        {/* Back Button */}
        <button 
          onClick={goBack}
          className="absolute top-6 left-4 z-50 p-2.5 bg-black/20 text-white rounded-full hover:bg-black/50 transition backdrop-blur-md border border-white/10 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>

        {/* Scroll Feed */}
        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth"
        >
          {items.map((item, index) => (
            <div key={item.id} className="h-full w-full snap-start relative">
               <ReelCard 
                 item={item} 
                 isActive={index === activeIndex}
                 currentIndex={index}
                 totalCount={isStreamComplete ? items.length : items.length + 1} // +1 to imply more coming if streaming
               />
            </div>
          ))}
          
          {/* End of Feed Card - Only show when stream is done */}
          {isStreamComplete && (
            <div className="h-full w-full snap-start flex flex-col items-center justify-center bg-zinc-900 text-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black opacity-50"></div>
               
               <div className="z-10 w-full max-w-xs space-y-8">
                   <div className="space-y-2">
                       <h2 className="text-3xl font-bold text-white tracking-tight">Nice Work!</h2>
                       <p className="text-zinc-400">You've covered the basics of {currentTopic}.</p>
                   </div>

                   <div className="space-y-3 w-full">
                       <button 
                         onClick={() => startStream(currentTopic, 'deep-dive')}
                         className="w-full py-4 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl flex items-center justify-between transition group"
                       >
                         <div className="flex flex-col items-start">
                            <span className="font-semibold text-sm">Explore More</span>
                            <span className="text-xs text-gray-400">Deep dive into {currentTopic}</span>
                         </div>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                         </svg>
                       </button>

                       <button 
                         onClick={() => startStream(currentTopic, 'quiz')}
                         className="w-full py-4 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl flex items-center justify-between transition group"
                       >
                         <div className="flex flex-col items-start">
                            <span className="font-semibold text-sm">Take Test</span>
                            <span className="text-xs text-gray-400">Quiz on {currentTopic}</span>
                         </div>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </button>

                       <button 
                         onClick={goBack}
                         className="w-full py-4 px-6 bg-transparent border border-white/5 hover:border-white/20 text-gray-400 hover:text-white rounded-2xl text-sm font-medium transition"
                       >
                         Explore Other Topics
                       </button>
                   </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
