import React, { useState, useEffect } from 'react'
import ReactDom from 'react-dom/server'
import logo from './logo.svg'
import './App.css'
import data from './sampledata'
import TimeLine from './Timeline'
import { Post } from './post/Post'
import { Filters } from './Filters/Filters'
import { Overlay } from './Overlay/Overlay'

if (!('contains' in String.prototype)) {
  String.prototype.contains = function (str, startIndex) {
    return -1 !== String.prototype.indexOf.call(this, str, startIndex)
  }
}

Array.prototype.shuffle = function () {
  var i = this.length,
    j,
    temp
  if (i == 0) return this
  while (--i) {
    j = Math.floor(Math.random() * (i + 1))
    temp = this[i]
    this[i] = this[j]
    this[j] = temp
  }
  return this
}

const transformData = (data) => {
  return (
    data
      .shuffle()
      // .filter(({ media: [post] }) => post.sizes.full.h > post.sizes.full.w)
      .slice(0, 30)
      .map((item) => {
        const { media } = item
        const [post] = media
        const type = post.type
        return {
          type,
          image: type === 'image' ? post.url : post.thumbUrl,
          data: item,
        }
      })
  )
}

function App() {
  const [visited, setVisited] = useState(localStorage.getItem('visited'))
  const [posts, setPosts] = useState([])
  const [rawPosts, setRawPosts] = useState([])
  useEffect(() => {
    fetch(
      'https://api.fankave.com/v1.0/cms/content/social?topic=fankave.com%3Acontext%3Dtesting'
    )
      .then((response) => response.json())
      .then((images) => {
        setRawPosts(images)
        setPosts(transformData(images))
      })
  }, [])
  const handleAction = () => {
    localStorage.setItem('visited', true)
    setVisited(true)
  }
  return (
    <>
      <div
        className="container"
        style={{ width: window.innerWidth, height: window.innerHeight }}
      >
        <Filters />
        {posts.length && (
          <TimeLine
            data={posts}
            width={window.innerWidth - 100}
            height={window.innerHeight - 100}
          />
        )}

        {!visited && <Overlay onAction={handleAction} />}
      </div>
    </>
  )
}

export default App
