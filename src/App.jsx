import Assistant from './components/Assistant'
import { EyesProvider } from './eyes'
import './App.css'

function App() {
  return (
    <EyesProvider>
      <main className="desktop">
        <Assistant />
      </main>
    </EyesProvider>
  )
}

export default App