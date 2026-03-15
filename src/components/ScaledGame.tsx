'use client';

import { useEffect, useRef, useState } from 'react';

interface ScaledGameProps {
  children: React.ReactNode;
  logicalWidth: number;
  logicalHeight: number;
}

export default function ScaledGame({ children, logicalWidth, logicalHeight }: ScaledGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // We want the game to fit perfectly inside the container.
        const scaleX = width / logicalWidth;
        const scaleY = height / logicalHeight;
        
        let newScale = Math.min(scaleX, scaleY);
        // Cap the max scale to 1.2 to prevent looking overly zoomed in on ultra-wide / 4k screens
        newScale = Math.min(newScale, 1.2);
        
        setScale(newScale);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [logicalWidth, logicalHeight]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        style={{ 
          width: logicalWidth, 
          height: logicalHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
        className="flex shrink-0 items-center justify-center flex-col relative"
      >
        {children}
      </div>
    </div>
  );
}
