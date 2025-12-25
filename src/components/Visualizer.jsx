import React, { useEffect, useRef } from 'react';

const Visualizer = ({ analyser, isPlaying }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Handle resizing
        const handleResize = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

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
            gradient.addColorStop(0, '#1db954'); // Green
            gradient.addColorStop(0.5, '#1ed760'); // Lighter Green
            gradient.addColorStop(1, '#ffffff'); // White tip

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
            // Clean frame if stopped? Or keep last state? 
            // Ideally clear or just stop updating
            renderFrame(); // Keep rendering to show it flatline or fade
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', handleResize);
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-transparent p-4 md:p-8">
            <h2 className="text-2xl font-bold mb-4 text-white self-start">Audio Visualizer</h2>
            <div className="flex-1 w-full bg-neutral-900/50 rounded-xl border border-gray-800 shadow-2xl overflow-hidden relative backdrop-blur-sm">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
        </div>
    );
};

export default Visualizer;
