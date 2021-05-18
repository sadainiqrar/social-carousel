import logo from './logo.svg'
import './App.css'
import data from './sampledata'
import TimeLine from './Timeline'

function App() {
  return (
    <div className="container" style={{ width: 800, height: 400 }}>
      <TimeLine data={data} />
    </div>
  )
}

export default App
