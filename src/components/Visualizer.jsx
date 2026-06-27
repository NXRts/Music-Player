import React, { useEffect, useRef } from "react";
import LyricsView from "./LyricsView";

const Visualizer = ({
  analyser,
  isPlaying,
  currentSong,
  onSaveLyrics,
  currentTime,
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Handle resizing
    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "#1db954"); // Green
      gradient.addColorStop(0.5, "#1ed760"); // Lighter Green
      gradient.addColorStop(1, "#ffffff"); // White tip

      ctx.fillStyle = gradient;

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        // Draw rounded rect or simple rect
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      renderFrame();
    } else {
      renderFrame();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [analyser, isPlaying]);

  if (!analyser) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary animate-pulse">
        <p>Initializing Audio Engine...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-transparent gap-4 p-4 md:p-6 overflow-hidden">
      {/* Visualizer Section (Hidden on mobile, 75% desktop) */}
      <div className="hidden md:flex md:flex-[3] flex-col min-w-0 min-h-0">
        <div className="flex-1 w-full bg-neutral-900/50 rounded-xl border border-gray-800 shadow-2xl overflow-hidden relative backdrop-blur-sm">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>

      {/* Lyrics Section (Remaining space mobile, 25% desktop) */}
      <div className="flex-1 flex flex-col min-w-0 md:min-w-[300px] min-h-0">
        <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-white">
          Lyrics
        </h2>
        <div className="flex-1 w-full bg-bg-card rounded-xl border border-gray-800 shadow-xl overflow-hidden">
          <LyricsView
            song={currentSong}
            onSaveLyrics={onSaveLyrics}
            currentTime={currentTime}
            // No onClose prop passed, so button will be hidden
          />
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
