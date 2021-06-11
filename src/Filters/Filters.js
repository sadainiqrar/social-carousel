import React from 'react'
import './style.css'
import { Tab } from '../Tab/Tab'
import { Search } from '../Search/Search'

export const Filters = () => {
  const list = [
    '[ #myCiscoIMPACT ]',
    '[ #Hashtag3 ]',
    '[ #Hashtag4 ]',
    '[ #Hashtag3 ]',
    '[ #Hashtag5 ]',
  ]
  return (
    <div className="filters-wrapper">
      <div className="tab-wrapper">
        <p className="heading">Hashtag Filters:</p>
        <Tab list={list} />
      </div>
      <Search />
    </div>
  )
}
