import React, { useRef, useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { exportBVH } from './exportBVH';

export default function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState([]); // store recorded frames

  useEffect(() => {
    const onResults = (results) => {
      const canvasCtx = canvasRef.current.getContext('2d');
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.poseLandmarks) {
        for (let landmark of results.poseLandmarks) {
          const { x, y } = landmark;
          canvasCtx.beginPath();
          canvasCtx.arc(x * canvasRef.current.width, y * canvasRef.current.height, 5, 0, 2 * Math.PI);
          canvasCtx.fillStyle = 'red';
          canvasCtx.fill();
        }
      }

      canvasCtx.restore();

      if (isRecording && results.poseWorldLandmarks) {
        setFrames((prev) => [...prev, results.poseWorldLandmarks.map(p => ({ x: p.x, y: p.y, z: p.z }))]);
      }
    };

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, [isRecording]);

  // Export as JSON
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(frames, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motion_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <video ref={videoRef} style={{ display: 'none' }}></video>
      <canvas ref={canvasRef} width="640" height="480" />
      <div style={{ marginTop: 12 }}>
        {!isRecording ? (
          <button onClick={() => { setFrames([]); setIsRecording(true); }}>Start Recording</button>
        ) : (
          <button onClick={() => setIsRecording(false)}>Stop Recording</button>
        )}
        <button onClick={handleExport} disabled={frames.length === 0}>Export JSON</button>
        <button onClick={() => exportBVH(frames)} disabled={frames.length === 0}>
          Export BVH
        </button>

      </div>
    </div>
  );
}
