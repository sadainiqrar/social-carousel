import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { TweenMax } from 'gsap'
import Item from './Item'
import { Clock } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass'
import ciscoFont from './fonts/CiscoSansTT_Regular.json'

import { Post } from './post/Post'

const getSize = (imageSize, width) => {
  return {
    width,
    height: (imageSize.height * width) / imageSize.width,
  }
}

const rotatePoint = (x, y, cx, cy, angle) => {
  const s = Math.sin(degsToRads(angle))
  const c = Math.cos(degsToRads(angle))

  // translate point back to origin:
  const oX = x - cx
  const oY = y - cy

  // rotate point
  const xNew = oX * c - oY * s
  const yNew = oX * s + oY * c

  return { x: xNew + cx, y: yNew + cy }
}

const degsToRads = (deg) => (deg * Math.PI) / 180.0

const roundedBorders = (ctx, x, y, width, height, radius) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

const generatePlayButton = (ctx, width, height) => {
  const x = width / 2
  const y = height / 2
  ctx.fillStyle = 'transparent'

  ctx.beginPath()
  ctx.lineWidth = 30
  ctx.arc(x, y, width / 5, 0, 2 * Math.PI)
  ctx.strokeStyle = '#55c3ec'
  ctx.stroke()

  //make play button
  const p1 = { x: x + width / 5 - 30, y }
  const p2 = rotatePoint(p1.x, p1.y, x, y, 120)
  const p3 = rotatePoint(p1.x, p1.y, x, y, -120)
  ctx.fillStyle = '#55c3ec'
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.lineTo(p3.x, p3.y)
  ctx.fill()
}

const generateCanvasImage = (url, type) => {
  return new Promise((resolve) => {
    const image = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    image.crossOrigin = 'anonymous'
    image.onload = function () {
      canvas.width = image.width + 40
      canvas.height = image.height + 40
      ctx.save()
      roundedBorders(ctx, 0, 0, canvas.width, canvas.height, 10)
      ctx.clip()
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
      roundedBorders(ctx, 20, 20, image.width, image.height, 10)
      ctx.clip()
      ctx.drawImage(image, 20, 20, image.width, image.height)
      ctx.restore()
      if (type === 'video') generatePlayButton(ctx, canvas.width, canvas.height)
      resolve(canvas)
    }
    image.onerror = function () {
      resolve(null)
    }
    image.src = url
  })
}

function createImageTexture(data, renderer, config) {
  return new Promise((resolve) => {
    generateCanvasImage(data.image, data.type)
      .then((canvas) => {
        const texture = new THREE.CanvasTexture(canvas)
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
      })
      .catch(() => resolve(null))
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

    const font = new THREE.Font(ciscoFont)
    config['fonts'] = [font]
    const dataPromises = data.map((item) =>
      createImageTexture(item, renderer, config)
    )

    Promise.all(dataPromises).then((values) => {
      textures.push(...values.filter((value) => value))
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
    renderer.domElement.addEventListener('mousemove', handleClick, {
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
    const [intersected] = raycaster.intersectObjects(timeline.children, true)
    if (e.type === 'mousemove') {
      if (intersected) {
        target.current.style.cursor = 'pointer'
      } else {
        target.current.style.cursor = 'default'
      }
      return
    }
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
