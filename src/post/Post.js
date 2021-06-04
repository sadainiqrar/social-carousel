import React from 'react'
import './post.css'

const VideoViewer = ({ url }) => {
  return (
    <video className="video" controls>
      <source src={url} type="video/mp4" />
      Your browser does not support HTML video.
    </video>
  )
}

const ImageViewer = ({ url }) => {
  return <img className="image" src={url} alt="" />
}

export const Post = ({ post }) => {
  const {
    type,
    text,
    media,
    author,
    tags = ['#myFY21Impact', '#Hastag1', '#Hashtag2', '#Hashtag3'],
  } = post
  const [image] = media
  const url = `https://devapi.fankave.com/cmsx/instaproxy/media?url=${encodeURIComponent(
    image.url
  )}`
  return (
    <div className="post-container">
      <div className="post-image">
        {type === 'image' ? (
          <ImageViewer url={url} />
        ) : (
          <VideoViewer url={url} />
        )}
      </div>
      <div className="post-content">
        <div className="text">{text.slice(0, 280)}</div>
        <div className="tags">{tags.map((tag) => `${tag} `)}</div>
        <div className="user-details">
          <div className="user-image">
            <img
              src={
                author.image ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8dXNlcnxlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&w=1000&q=80'
              }
              className="image"
              alt=""
            />
          </div>
          <div className="user-name">{author.name || 'Anonymous User'}</div>
        </div>
      </div>
    </div>
  )
}
