import logo from './logo.svg'
import './App.css'
import data from './sampledata'
import transformData from './transformData'

function App() {
  const tData = transformData(data, 800, 400)
  console.log(tData)
  return (
    <div className="container" style={{ width: 800, height: 400 }}>
      {tData.map((item) => {
        return (
          <div
            className="card"
            style={{
              top: item.y,
              left: item.x,
              width: item.width,
              zIndex: item.zIndex,
            }}
          >
            <div className="image">
              <img src={item.content.image} style={{ width: '100%' }} />
            </div>
            <div className="text" style={{ fontSize: `${item.fontSize}em` }}>
              {item.content.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default App
