import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { TweenMax } from 'gsap'
import Item from './Item'

function containCanvas(img, canvas) {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const imgRatio = img.height / img.width
  const winRatio = canvas.height / canvas.width
  if (imgRatio < winRatio) {
    const h = canvas.width * imgRatio
    ctx.drawImage(img, 0, (canvas.height - h) / 2, canvas.width, h)
  } else if (imgRatio > winRatio) {
    const w = (canvas.width * winRatio) / imgRatio
    ctx.drawImage(img, (canvas.width - w) / 2, 0, w, canvas.height)
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
}

const getSize = (imageSize, width) => {
  return {
    width,
    height: (imageSize.height * width) / imageSize.width,
  }
}
function createImageTexture(filename, renderer, config) {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      filename,
      (texture) => {
        texture.needsUpdate = true
        const finalSize = getSize(
          { width: texture.image.width, height: texture.image.height },
          config.post.size.width
        )
        texture.size = new THREE.Vector2(finalSize.width, finalSize.height)
        renderer.setTexture2D(texture, 0)
        texture.name = `${filename}`
        texture.mediaType = 'image'
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        resolve(texture)
      },
      undefined,
      () => {
        resolve(-1)
      }
    )
  })
}

function createVideoTexture(filename, renderer, config) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.style = 'position:absolute;height:0'
    video.muted = true
    video.autoplay = false
    video.loop = true
    video.crossOrigin = 'anonymous'
    video.setAttribute('muted', true)
    video.setAttribute('webkit-playsinline', true)
    video.setAttribute('playsinline', true)
    video.preload = 'metadata'
    video.src = `${filename}`
    document.body.appendChild(video)
    video.load() // must call after setting/changing source
    video.onloadeddata = () => {
      video.onerror = null
      const texture = new THREE.VideoTexture(video)
      texture.minFilter = texture.magFilter = THREE.LinearFilter
      texture.name = `${filename}`
      texture.mediaType = 'video'
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      const finalSize = getSize(
        { width: texture.image.videoWidth, height: texture.image.videoHeight },
        config.post.size.width
      )
      texture.size = new THREE.Vector2(finalSize.width, finalSize.height)
      renderer.setTexture2D(texture, 0)
      video.oncanplaythrough = () => {
        texture.needsUpdate = false
        video.oncanplaythrough = null
      }
      resolve(texture)
    }

    video.onerror = () => {
      video.onloadeddata = null
      resolve(-1)
    }
  })
}

const config = {
  pixelRatio: window.devicePixelRatio >= 2 ? 2 : 1,
  startTime: Date.now(),
  scrollPos: 1200,
  distanceFactor: 200,
  post: {
    size: {
      width: 200,
      height: 300,
    },
  },
  width: 1400,
  height: 700,
  fog: {
    color: 0xaec7c3,
    near: 2000,
    far: 5000,
  },
  camera: {
    aspectRatio: 1400 / 700,
    fov: 35,
    near: 500,
    far: 2500,
  },
}

const Timeline = ({ data }) => {
  let scrollPos = config.scrollPos
  const target = useRef(null)
  const [renderer] = useState(
    new THREE.WebGLRenderer({ antialias: true, alpha: true })
  )
  const [scene] = useState(new THREE.Scene())
  const [camera] = useState(
    new THREE.PerspectiveCamera(
      config.camera.fov,
      config.camera.aspectRatio,
      config.camera.near,
      config.camera.far
    )
  )
  const [raycaster] = useState(new THREE.Raycaster())
  const [frustum] = useState(new THREE.Frustum())
  const [cameraViewProjectionMatrix] = useState(new THREE.Matrix4())
  const [mouse] = useState(new THREE.Vector2())
  const [mousePerspective] = useState(new THREE.Vector2())
  const [timeline] = useState(new THREE.Group())
  const [posts] = useState(new THREE.Group())
  let textures = []
  useEffect(() => {
    init()
    const dataPromises = data.map((item) =>
      item.type === 'image'
        ? createImageTexture(item.image, renderer, config)
        : createVideoTexture(item.image, renderer, config)
    )

    Promise.all(dataPromises).then((values) => {
      textures.push(...values.filter((value) => value !== -1))
      createTimeline()
    })
    renderer.domElement.addEventListener('wheel', scroll, { capture: true })
  }, [])
  const init = () => {
    renderer.setPixelRatio(config.pixelRatio)
    renderer.setSize(config.width, config.height)
    target.current.appendChild(renderer.domElement)

    scene.background = new THREE.Color(0xaec7c3)
    scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far)
    scene.scale.set(1, 1, 1)

    camera.position.set(0, 0, 0)
    camera.projectionMatrix.scale(new THREE.Vector3(1, 1, -1))
    raycaster.near = camera.near
    raycaster.far = camera.far
  }

  const createTimeline = () => {
    scene.add(timeline)
    const items = textures.map((texture, index) => {
      return new Item({
        name: `item-${index}`,
        config,
        texture,
        itemIndex: index,
        itemIndexTotal: data.length,
      })
    })
    items.map((item) => {
      timeline.add(item)
    })
    renderer.render(scene, camera)
    animate()
  }

  const animate = () => {
    const animationId = requestAnimationFrame(animate)
    // let delta = (scrollPos - timeline.position.z) / 12
    TweenMax.to(timeline.position, 3, {
      z: scrollPos,
      ease: 'Power0.Linear',
    })
    // timeline.position.z += delta
    renderer.render(scene, camera)
  }

  const scroll = (e) => {
    const maxScroll = (data.length || 1) * 100 - (config.camera.near || 0)
    let delta = normalizeWheelDelta(e)

    const newScrollPosition = scrollPos - delta * 60
    if (
      newScrollPosition <= maxScroll &&
      newScrollPosition >= config.scrollPos
    ) {
      scrollPos = newScrollPosition
      e.preventDefault()
      animate()
    }
    function normalizeWheelDelta(e) {
      if (e.detail && e.wheelDelta)
        return (e.wheelDelta / e.detail / 40) * (e.detail > 0 ? 1 : -1)
      // Opera
      else if (e.deltaY) return -e.deltaY / 60
      // Firefox
      else return e.wheelDelta / 120 // IE,Safari,Chrome
    }
  }

  return (
    <>
      <div style={{ overflow: 'auto' }} ref={target}></div>
    </>
  )
}

export default Timeline