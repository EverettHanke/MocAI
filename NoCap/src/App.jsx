import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PoseTracker from './components/PoseTracker'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <PoseTracker />
      </div>
      <p className="read-the-docs">
        Stand in full frame for the best effect
      </p>
    </>
  )
}

export default App
