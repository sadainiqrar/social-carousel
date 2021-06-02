import React, { useState, useEffect } from 'react'
import ReactDom from 'react-dom/server'
import logo from './logo.svg'
import './App.css'
import data from './sampledata'
import TimeLine from './Timeline'
import { Post } from './post/Post'

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
      .slice(0, 50)
      .map((item) => {
        const { media } = item
        const [post] = media
        const type = post.type
        return {
          type,
          image: type === 'image' ? post.url : post.thumbUrl,
        }
      })
  )
}

function App() {
  const [posts, setPosts] = useState([])
  const [rawPosts, setRawPosts] = useState([])
  useEffect(() => {
    fetch('https://api.fankave.com/v1.0/cms/content/social?topic=ciscodining')
      .then((response) => response.json())
      .then((images) => {
        setRawPosts(images)
        setPosts(transformData([...images, ...images, ...images]))
      })
  }, [])
  return (
    <>
      <div className="container" style={{ width: 1400, height: 700 }}>
        {posts.length && <TimeLine data={posts} />}
        <div style={{ width: 400, height: 600, border: '1px solid red' }}>
          {posts.length && (
            <Post data={rawPosts.filter((p) => p.type !== 'image')} />
          )}
        </div>
      </div>
    </>
  )
}

export default App
