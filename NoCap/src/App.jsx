import { useState } from 'react'
import './App.css'
import PoseTracker from './components/PoseTracker'

function App() {
  const [cameraEnabled, setCameraEnabled] = useState(false)

  return (
    <>
      {/* When Camera is disabled */}
      {!cameraEnabled && (
        <>
          <div>
            <h1>Welcome to NoCap</h1>
            <p>An AI centric suitless Motion Capture alternative</p>
            <p>Make animations for free! No Cap!</p>
            <button
              onClick={() => setCameraEnabled(true)}
              sx={{
                mt: 2,
                px: 4,
                py: 1,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }}
            >
              Enable Camera
            </button>
          </div>
        </>
      )}
      {/* When Camera is enabled */}
      {cameraEnabled && (
        <>
          <div>
            <button
              onClick={() => setCameraEnabled(false)}
            >
              Disable Camera
            </button>
            <PoseTracker />
          </div>
        </>
      )}
      <p className="read-the-docs">
        Stand in full frame for the best effect
      </p>
    </>
  )
}

export default App
