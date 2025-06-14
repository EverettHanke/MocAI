import { useRef, useEffect } from 'react';

const bones = [
  [11, 13], [13, 15],       // Left arm
  [12, 14], [14, 16],       // Right arm
  [11, 12],                 // Shoulders
  [23, 24],                 // Hips
  [11, 23], [12, 24],       // Torso
  [23, 25], [25, 27],       // Left leg
  [24, 26], [26, 28],       // Right leg
];

export default function SkeletonPreview({ frames, width = 300, height = 300, speed = 60 }) {
  const canvasRef = useRef(null);
  const frameIndexRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!frames.length) return;

    const ctx = canvasRef.current.getContext('2d');
    frameIndexRef.current = 0; // Reset to beginning of loop

    const drawFrame = () => {
      const landmarks = frames[frameIndexRef.current];
      ctx.clearRect(0, 0, width, height);

      const scale = 150;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2;

      for (const [start, end] of bones) {
        const a = landmarks[start];
        const b = landmarks[end];
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(centerX + a.x * scale, centerY + a.y * scale);
          ctx.lineTo(centerX + b.x * scale, centerY + b.y * scale);
          ctx.stroke();
        }
      }

      frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;
    };

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(drawFrame, 1000 / speed);

    return () => clearInterval(intervalRef.current);
  }, [frames, width, height, speed]);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Skeleton Preview</h3>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ddd', backgroundColor: '#111' }}
      />
    </div>
  );
}
