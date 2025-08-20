
import './App.css'
import { env } from './config/env'

function App() {

  const testEnvValue = env.TEST_ENV_VALUE;

  return (
    
<>
       
      <h1>Vite + React</h1>
      <div className="card">
      <p className="read-the-docs">
        {testEnvValue}
      </p>
      </div>
      </>
  )
}

export default App
