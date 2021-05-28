import React from 'react'
import './post.css'

const getImagePlace = (imageSize, ParentSize) => {
  const imgRatio = imageSize.height / imageSize.width
  const winRatio = ParentSize.height / ParentSize.width
  if (imgRatio < winRatio) {
    const h = ParentSize.width * imgRatio
    return {
      x: 0,
      y: (ParentSize.height - h) / 2,
      width: ParentSize.width,
      height: h,
    }
  } else if (imgRatio > winRatio) {
    const w = (ParentSize.width * winRatio) / imgRatio
    return {
      x: (ParentSize.width - w) / 2,
      y: 0,
      width: w,
      height: ParentSize.height,
    }
  } else {
    return { x: 0, y: 0, width: ParentSize.width, height: ParentSize.height }
  }
}

const LoadImage = (url) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = function () {
    return getImagePlace(
      { width: img.width, height: img.height },
      { width: 200, height: 300 }
    )
  }
  img.src = url
}

const getImageConstants = (size, spacing = 0.1) => {
  const wrapHeight = size.height * 0.55
  const wrapWidth = size.width
  const vOffset = spacing ? (size.width * spacing) / 2 : 0
  const hOffset = spacing ? (size.width * spacing) / 2 : 0
  return {
    x: hOffset,
    y: vOffset,
    width: wrapWidth - hOffset * 2,
    height: wrapHeight - vOffset * 2,
  }
}

const getTextConstants = (size, spacing = 0.1) => {
  const wrapHeight = size.height * 0.25
  const wrapWidth = size.width
  const vOffset = spacing ? (size.width * spacing) / 2 : 0
  const hOffset = spacing ? (size.width * spacing) / 2 : 0
  return {
    x: hOffset,
    y: vOffset + size.height * 0.55,
    width: wrapWidth - hOffset * 2,
    height: wrapHeight - vOffset * 2,
  }
}

const getHashConstants = (size, spacing = 0.1) => {
  const wrapHeight = size.height * 0.1
  const wrapWidth = size.width
  const vOffset = spacing ? (size.width * spacing) / 2 : 0
  const hOffset = spacing ? (size.width * spacing) / 2 : 0
  return {
    x: hOffset,
    y: vOffset + size.height * 0.8,
    width: wrapWidth - hOffset * 2,
    height: wrapHeight - vOffset * 2,
  }
}

const getUserConstants = (size, spacing = 0.1) => {
  const wrapHeight = size.height * 0.1
  const wrapWidth = size.width
  const vOffset = spacing ? (size.width * spacing) / 2 : 0
  const hOffset = spacing ? (size.width * spacing) / 2 : 0
  const image = {
    x: hOffset,
    y: vOffset + size.height * 0.9,
    width: wrapHeight - vOffset * 2,
    height: wrapHeight - vOffset * 2,
  }
  return {
    image,
    text: {
      x: hOffset * 2 + image.width,
      y: vOffset + size.height * 0.9,
      width: wrapHeight - vOffset * 2 - image.width,
      height: wrapHeight - vOffset * 2,
    },
  }
}

export const Post = ({ data }) => {
  const imageValues = getImageConstants(data.size)
  const textValues = getTextConstants(data.size)
  const hashValues = getHashConstants(data.size)
  const userValues = getUserConstants(data.size)
  return (
    <svg
      width={data.size.width}
      height={data.size.height}
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`svg {
  border: 1px solid red;
  display: border-box;
  border-radius: 20px;
}

svg .image image {
  filter: url(#dropshadow);
}

svg .content image {
  filter: url(#dropshadow);
  fill: red;
}
.tags,
.username {
  fill: #0d274d;
  font-weight: 500;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
}`}
      </style>
      <filter id="dropshadow" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="2" dy="2" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <g className="image">
        <rect
          fill="transparent"
          x={imageValues.x}
          y={imageValues.y}
          width={imageValues.width}
          height={imageValues.height}
        />
        <image
          href={data.content.image}
          x={imageValues.x}
          y={imageValues.y}
          width={imageValues.width}
          height={imageValues.height}
          // crossOrigin="anonymous"
        />
      </g>
      <g className="content">
        <text x={textValues.x} y={textValues.y}>
          {data.content.text}
        </text>
        <text x={hashValues.x} y={hashValues.y} className="tags">
          {data.content.tags.map((item) => {
            return `${item} `
          })}
        </text>

        <defs>
          <clipPath id="myCircle">
            <circle
              cx={userValues.image.x + userValues.image.width / 2}
              cy={userValues.image.y + userValues.image.height / 2}
              r={userValues.image.width / 2}
            />
          </clipPath>
        </defs>
        <image
          x={userValues.image.x}
          y={userValues.image.y}
          width={userValues.image.width}
          height={userValues.image.height}
          href={data.content.userImage}
          clipPath="url(#myCircle)"
          // crossOrigin="anonymous"
        />

        <text
          x={userValues.text.x}
          y={userValues.text.y}
          alignmentBaseline="mathematical"
          className="username"
        >
          {data.content.userName}
        </text>
      </g>
    </svg>
  )
}
