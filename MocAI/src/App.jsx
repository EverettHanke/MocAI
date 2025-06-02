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
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
