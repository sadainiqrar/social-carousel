import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { TweenMax } from 'gsap'
import Item from './Item'
import { Clock } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass'

import { Post } from './post/Post'

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
function createImageTexture(data, renderer, config) {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('*')
    loader.load(
      data.image,
      (texture) => {
        texture.needsUpdate = true
        const finalSize = getSize(
          { width: texture.image.width, height: texture.image.height },
          config.post.size.width
        )
        texture.size = new THREE.Vector2(finalSize.width, finalSize.height)
        renderer.setTexture2D(texture, 0)
        texture.name = `${data.image}`
        texture.mediaType = 'image'
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        resolve({ data, texture })
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

const Timeline = ({ data, width, height }) => {
  const config = {
    pixelRatio: window.devicePixelRatio >= 2 ? 2 : 1,
    startTime: Date.now(),
    scrollPos: -1500,
    distanceFactor: 200,
    post: {
      size: {
        width: 200,
        height: 300,
      },
    },
    width,
    height,
    fog: {
      color: '#f5f5f5',
      near: 1000,
      far: 2500,
    },
    camera: {
      aspectRatio: width / height,
      fov: 35,
      near: 0.01,
      far: 2500,
    },
  }
  let scrollPos = config.scrollPos
  const items = []
  const target = useRef(null)
  const [renderer] = useState(
    new THREE.WebGLRenderer({
      antialias: true,
      depth: true,
      alpha: true,
    })
  )
  const [selectedItem, setSelectedItem] = useState(null)
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
  const [meshes] = useState([])
  const [intersects] = useState([])

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  const effectPass = new BokehPass(scene, camera, {
    focus: 1500,
    aperture: 0.0,
    maxblur: 0.05,
  })
  composer.addPass(renderPass)
  // composer.addPass(effectPass)
  // composer.addPass(new EffectPass(camera, new BloomEffect()))

  const clock = new Clock()
  let textures = []
  useEffect(() => {
    init()
    const dataPromises = data.map((item) =>
      createImageTexture(item, renderer, config)
    )

    Promise.all(dataPromises).then((values) => {
      textures.push(...values.filter((value) => value !== -1))
      createTimeline()
    })
  }, [])
  const init = () => {
    renderer.setPixelRatio(config.pixelRatio)
    renderer.setSize(config.width, config.height)
    target.current.appendChild(renderer.domElement)

    scene.background = new THREE.Color('#f5f5f5')
    scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far)
    scene.scale.set(1, 1, 1)

    camera.position.set(0, 0, 0)
    // camera.projectionMatrix.scale(new THREE.Vector3(1, 1, -1))
    raycaster.near = camera.near + scrollPos
    raycaster.far = camera.far
  }

  const createTimeline = () => {
    scene.add(timeline)
    const initialItems = textures.map((texture, index) => {
      return new Item({
        name: `item-${index}`,
        config,
        texture: texture.texture,
        data: texture.data,
        itemIndex: index,
        itemIndexTotal: data.length,
      })
    })
    items.push(...initialItems)
    initialItems.map((item) => {
      timeline.add(item)
    })

    renderer.domElement.addEventListener('wheel', scroll, { capture: true })
    renderer.domElement.addEventListener('click', handleClick, {
      capture: true,
    })
    composer.render(clock.getDelta())
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

    composer.render(clock.getDelta())
  }

  const scroll = (e) => {
    const firstItem = items[0]
    const lastItem = items[items.length - 1]
    const maxScroll = -lastItem.position.z + config.scrollPos
    const minScroll = -firstItem.position.z + config.scrollPos
    let delta = normalizeWheelDelta(e)
    const newScrollPosition = scrollPos - delta * 60
    if (newScrollPosition <= maxScroll && newScrollPosition >= minScroll) {
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

  function getCanvasRelativePosition(event, canvas) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) * rect.width) / rect.width,
      y: ((event.clientY - rect.top) * rect.height) / rect.height,
    }
  }

  const handleClick = (e) => {
    if (!renderer || e.target !== renderer.domElement) return
    const normalizedPosition = getCanvasRelativePosition(e, target.current)
    mouse.x = (normalizedPosition.x / renderer.domElement.width) * 2 - 1
    mouse.y = -(normalizedPosition.y / renderer.domElement.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    // raycast for items when in timeline mode
    if (selectedItem) {
      setSelectedItem(null)
      return
    }
    const [intersected] = raycaster.intersectObjects(timeline.children, true)
    if (intersected) {
      setSelectedItem({
        ...intersected.object.parent,
        meta: { origPosition: { x: e.clientX, y: e.clientY } },
      })
      return
    }
  }
  return (
    <>
      <div style={{ overflow: 'auto' }} ref={target}></div>
      {selectedItem && (
        <div className="story-container" onClick={() => setSelectedItem(null)}>
          <div className="story-inner-container">
            <Post
              // post={{
              //   type: selectedItem.data.type,
              //   text: selectedItem.data.text,
              //   media: [{ url: selectedItem.data.image }],
              // }}
              post={selectedItem.data.data}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Timeline
