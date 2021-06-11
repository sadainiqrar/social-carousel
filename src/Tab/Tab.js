import React, { useState } from 'react'
import './style.css'

export const Tab = ({ list }) => {
  const [selectedIndex, setSelected] = useState(-1)
  const handleSelected = (index) => {
    if (selectedIndex === index) {
      setSelected(-1)
      return
    }
    setSelected(index)
    return
  }
  return (
    <ul className="filter-list">
      {list.map((item, index) => (
        <li key={`item-${index}`} className="filter-list-item">
          <p
            className={`text ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleSelected(index)}
          >
            {item}
          </p>
        </li>
      ))}
    </ul>
  )
}
