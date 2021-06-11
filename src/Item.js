import * as THREE from 'three'
// eslint-disable-next-line import/no-webpack-loader-syntax
const frag = require('!!raw-loader?esModule=false!./shaders/item.frag')
// eslint-disable-next-line import/no-webpack-loader-syntax
const vert = require('!!raw-loader?esModule=false!./shaders/default.vert')

export default class Item extends THREE.Group {
  constructor(opts) {
    super()
    Object.assign(this, opts)
    this.create()
  }

  create() {
    this.uniforms = {
      time: { type: 'f', value: 1.0 },
      fogColor: { type: 'c', value: new THREE.Color(this.config.fog.color) },
      fogNear: { type: 'f', value: new THREE.Color(this.config.fog.fogNear) },
      fogFar: { type: 'f', value: new THREE.Color(this.config.fog.fogFar) },
      tex: { type: 't', value: this.texture },
      opacity: { type: 'f', value: 1.0 },
      progress: { type: 'f', value: 0.0 },
      gradientColor: { type: 'vec3', value: new THREE.Color(0x1b42d8) },
      resolution: {
        type: 'v2',
        value: new THREE.Vector2(200, 300),
      },
      imageResolution: {
        type: 'v2',
        value: new THREE.Vector2(
          this.texture.image.width,
          this.texture.image.height
        ),
      },
    }
    this.geometry = new THREE.PlaneGeometry(1, 1)
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      fragmentShader: frag,
      vertexShader: vert,
      fog: true,
      transparent: true,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)

    // this.mesh = new THREE.Mesh(this.geometry, [
    //   this.material,
    //   new THREE.MeshPhongMaterial({ color: 0x0000ff }),
    // ])
    this.mesh.scale.set(this.texture.size.width, this.texture.size.height, 1)
    // updates size of meshes after texture has been loaded
    this.texture.onUpdate = () => {
      if (
        this.mesh.scale.x !== this.texture.size.width &&
        this.mesh.scale.y !== this.texture.size.height
      ) {
        this.mesh.scale.set(
          this.texture.size.width,
          this.texture.size.height,
          1
        )
        this.texture.onUpdate = null
      }
    }

    const pos = new THREE.Vector2()
    let align = this.itemIndex % 4
    const positionNumber = Math.round(Math.random() * 300) + 100
    if (align === 0) pos.set(-positionNumber, positionNumber) // bottom left
    if (align === 1) pos.set(positionNumber, positionNumber) // bottom right
    if (align === 2) pos.set(positionNumber, -positionNumber) // top right
    if (align === 3) pos.set(-positionNumber, -positionNumber) // top left
    // pos.set(
    //   Math.round(Math.random() * this.config.width - this.config.width / 2),
    //   Math.round(
    //     (Math.random() * this.config.height) / 2 - this.config.height / 4
    //   )
    // )

    this.position.set(pos.x, pos.y, this.itemIndex * -300)
    this.origPos = new THREE.Vector2(pos.x, pos.y)
    this.add(this.mesh)
  }
}
