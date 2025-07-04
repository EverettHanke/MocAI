import { useRef, useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { exportBVH } from './exportSimpleBVH';
import SkeletonPreview from './SkeletonPreivew';
import CircularProgress from '@mui/material/CircularProgress';

export default function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState([]);
  const [exportMessage, setExportMessage] = useState('');
  const [cameraLoaded, setCameraLoaded] = useState(false);

  // Internal ref to store recording state + frames (isolated from React re-renders)
  const recorderRef = useRef({ isRecording: false, frames: [] });

  useEffect(() => {
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

    const onResults = (results) => {
      const ctx = canvasRef.current.getContext('2d');
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(results.image, 0, 0, width, height);

      if (results.poseLandmarks) {
        for (let { x, y } of results.poseLandmarks) {
          ctx.beginPath();
          ctx.arc(x * width, y * height, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        }
      }

      ctx.restore();

      if (recorderRef.current.isRecording && results.poseWorldLandmarks) {
        const safeFrame = Array(33).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));
        results.poseWorldLandmarks.forEach((p, i) => {
          if (p) safeFrame[i] = { x: p.x, y: p.y, z: p.z };
        });

        const frozenFrame = JSON.parse(JSON.stringify(safeFrame));
        recorderRef.current.frames.push(frozenFrame);
      }
    };

    pose.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => await pose.send({ image: videoRef.current }),
        width: 640,
        height: 480,
      });

      videoRef.current.onloadeddata = () => {
        setCameraLoaded(true);
      };

      camera.start();
    }
  }, []); // Run only once

  const showMessage = (msg) => {
    setExportMessage(msg);
    setTimeout(() => setExportMessage(''), 6000);
  };

  const handleJSONExport = () => {
    if (!frames.length) return showMessage('⚠️ No data to export.');
    const blob = new Blob([JSON.stringify(frames, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motion_data.json';
    a.click();
    URL.revokeObjectURL(url);
    showMessage('✅ Exported as JSON!');
  };

  const handleBVHExport = () => {
    if (!frames.length) return showMessage('⚠️ No data to export.');
    if (frames[0].length < 33) return showMessage('⚠️ Incomplete landmark data.');
    exportBVH(frames);
    showMessage('✅ Exported as BVH!');
  };

  const startRecording = () => {
    recorderRef.current.frames = [];
    recorderRef.current.isRecording = true;
    setFrames([]); // reset local state
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current.isRecording = false;
    setFrames([...recorderRef.current.frames]); // freeze recorded copy
    setIsRecording(false);
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
      <video ref={videoRef} style={{ display: 'none' }} />

      {!cameraLoaded ? (
        <div style={{
          width: 640, height: 480,
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', border: '1px solid #ccc',
          margin: 'auto'
        }}>
          <CircularProgress />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ border: '1px solid #ccc' }}
        />
      )}

      {isRecording && (
        <div style={{ color: 'red', fontWeight: 'bold', marginTop: 10 }}>
          ● Recording...
        </div>
      )}

      {exportMessage && (
        <div style={{ marginTop: 8, color: 'green' }}>
          {exportMessage}
        </div>
      )}

      {frames.length > 0 && !isRecording && (
        <SkeletonPreview frames={frames} isRecording={false} />
      )}

      <div style={{
        marginTop: 16,
        display: 'flex',
        gap: '12px',
        justifyContent: 'center'
      }}>
        {!isRecording ? (
          <button onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording}>
            Stop Recording
          </button>
        )}
        <button onClick={handleJSONExport} disabled={frames.length === 0}>
          Export JSON
        </button>
        <button onClick={handleBVHExport} disabled={frames.length === 0}>
          Export BVH
        </button>
      </div>
    </div>
  );
}
