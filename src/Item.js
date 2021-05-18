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
      fogColor: { type: 'c', value: this.scene.fog.color },
      fogNear: { type: 'f', value: this.scene.fog.near },
      fogFar: { type: 'f', value: this.scene.fog.far },
      texture: { type: 't', value: this.texture },
      opacity: { type: 'f', value: 1.0 },
      progress: { type: 'f', value: 0.0 },
      gradientColor: { type: 'vec3', value: new THREE.Color(0x1b42d8) },
    }

    this.geometry = new THREE.PlaneGeometry(1, 1)
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      fragmentShader: frag,
      vertexShader: vert,
      fog: true,
      transparent: true,
    })
    // this.mesh = new THREE.Mesh(
    //   this.geometry,
    //   new THREE.MeshLambertMaterial({ color: 'white' })y
    // )

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.scale.set(this.texture.size.x, this.texture.size.y, 1)
    // updates size of meshes after texture has been loaded
    this.texture.onUpdate = () => {
      if (
        this.mesh.scale.x !== this.texture.size.x &&
        this.mesh.scale.y !== this.texture.size.y
      ) {
        this.mesh.scale.set(this.texture.size.x, this.texture.size.y, 1)
        this.texture.onUpdate = null
      }
    }

    const pos = new THREE.Vector2()

    pos.set(
      Math.round(Math.random() * this.config.width - this.config.width / 2),
      Math.round(
        (Math.random() * this.config.height) / 2 - this.config.height / 4
      )
    )

    this.position.set(pos.x, pos.y, this.itemIndex * -100)
    this.origPos = new THREE.Vector2(pos.x, pos.y)

    this.add(this.mesh)
  }
}
