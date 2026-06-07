'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

const ASSET_ROOT = '/assets/element'

type CompositionModelProps = {
  accent: string
  index: number
  label: string
  name: string
}

type SharedModelAsset = {
  model: THREE.Group
  textures: {
    color: THREE.Texture
    normal: THREE.Texture
    roughness: THREE.Texture
    metalness: THREE.Texture
  }
}

let sharedModelAsset: Promise<SharedModelAsset> | null = null

function loadTexture(loader: THREE.TextureLoader, path: string, colorSpace?: THREE.ColorSpace) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = colorSpace ?? THREE.NoColorSpace
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.generateMipmaps = true
        texture.needsUpdate = true
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}

function normalizeObject(object: THREE.Group) {
  const bounds = new THREE.Box3().setFromObject(object)
  const center = bounds.getCenter(new THREE.Vector3())
  const size = bounds.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001)

  object.position.sub(center)
  object.scale.setScalar(1.42 / maxAxis)
  object.rotation.set(-0.04, 0, 0)

  return object
}

function getSharedModelAsset() {
  if (!sharedModelAsset) {
    sharedModelAsset = Promise.all([
      new OBJLoader().loadAsync(`${ASSET_ROOT}/base.obj`),
      Promise.resolve(new THREE.TextureLoader()),
    ]).then(async ([model, textureLoader]) => {
      const [color, normal, roughness, metalness] = await Promise.all([
        loadTexture(textureLoader, `${ASSET_ROOT}/shaded.png`, THREE.SRGBColorSpace),
        loadTexture(textureLoader, `${ASSET_ROOT}/texture_normal.png`),
        loadTexture(textureLoader, `${ASSET_ROOT}/texture_roughness.png`),
        loadTexture(textureLoader, `${ASSET_ROOT}/texture_metallic.png`),
      ])

      model.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry.computeVertexNormals()
        node.castShadow = true
        node.receiveShadow = true
      })

      return {
        model: normalizeObject(model),
        textures: { color, normal, roughness, metalness },
      }
    })
  }

  return sharedModelAsset
}

function createModelMaterial(textures: SharedModelAsset['textures'], accent: string, renderer: THREE.WebGLRenderer) {
  const [r, g, b] = accent.split(' ').map((channel) => Number(channel) / 255)
  const accentColor = new THREE.Color(r, g, b)
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

  Object.values(textures).forEach((texture) => {
    texture.anisotropy = Math.min(maxAnisotropy, 8)
  })

  return new THREE.MeshStandardMaterial({
    map: textures.color,
    normalMap: textures.normal,
    roughnessMap: textures.roughness,
    metalnessMap: textures.metalness,
    color: new THREE.Color(0xf7f2ff).lerp(accentColor, 0.08),
    emissive: accentColor,
    emissiveIntensity: 0.035,
    envMapIntensity: 1.45,
    metalness: 0.76,
    roughness: 0.31,
  })
}

export default function CompositionModel({ accent, index, label, name }: CompositionModelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const frameRef = useRef<number | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const [modelState, setModelState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let visible = false
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
    let renderer: THREE.WebGLRenderer
    let modelMaterial: THREE.Material | null = null

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setModelState('error')
      return undefined
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.22
    mount.appendChild(renderer.domElement)

    camera.position.set(0, 0.02, 5.9)

    const modelGroup = new THREE.Group()
    modelGroup.rotation.y = -0.5 + index * 0.42
    scene.add(modelGroup)

    const ambient = new THREE.HemisphereLight(0xf7f2ff, 0x09040e, 1.55)
    const key = new THREE.DirectionalLight(0xffffff, 2.1)
    const rim = new THREE.PointLight(new THREE.Color(`rgb(${accent})`), 18, 8, 1.8)
    const underGlow = new THREE.PointLight(0x5f39ff, 7, 6, 2)

    key.position.set(-1.8, 2.4, 3.4)
    rim.position.set(1.9, 0.9, 2.2)
    underGlow.position.set(-0.35, -1.4, 1.4)
    scene.add(ambient, key, rim, underGlow)

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(rect.width, 1)
      const height = Math.max(rect.height, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect()
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointerRef.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }

    const onPointerLeave = () => {
      pointerRef.current.x = 0
      pointerRef.current.y = 0
    }

    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerleave', onPointerLeave)

    const render = (time: number) => {
      if (!disposed) {
        const model = modelRef.current
        if (model) {
          const seconds = time * 0.001
          const targetY = -0.42 + index * 0.34 + pointerRef.current.x * 0.16
          const targetX = -0.04 + pointerRef.current.y * 0.05
          model.rotation.y += (targetY - model.rotation.y) * 0.055
          model.rotation.x += (targetX - model.rotation.x) * 0.055

          model.position.y = -0.18

          if (!prefersReducedMotion) {
            model.position.y += Math.sin(seconds * 0.72 + index) * 0.026
            model.rotation.z = Math.sin(seconds * 0.45 + index * 0.8) * 0.012
          }
        }

        renderer.render(scene, camera)
        frameRef.current = requestAnimationFrame(render)
      }
    }

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting)
        if (!visible || modelRef.current) return

        getSharedModelAsset()
          .then(({ model, textures }) => {
            if (disposed || modelRef.current) return

            const clone = model.clone(true)
            modelMaterial = createModelMaterial(textures, accent, renderer)
            clone.traverse((node) => {
              if (!(node instanceof THREE.Mesh)) return
              node.material = modelMaterial
            })

            modelRef.current = clone
            modelGroup.add(clone)
            setModelState('ready')
          })
          .catch(() => {
            if (!disposed) setModelState('error')
          })
      },
      { rootMargin: '360px 0px', threshold: 0.04 },
    )

    visibilityObserver.observe(mount)
    frameRef.current = requestAnimationFrame(render)

    return () => {
      disposed = true
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerleave', onPointerLeave)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      modelMaterial?.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [accent, index])

  return (
    <div className="composition-model" aria-label={`${name} 3D composition preview`}>
      <div ref={mountRef} className="composition-model-canvas" aria-hidden="true" />
      <div className={`model-fallback ${modelState === 'ready' ? 'is-hidden' : ''}`} aria-hidden="true">
        <div className="bottle-glyph">
          <span />
          <i />
        </div>
      </div>
      <b>{label}</b>
      <span>{modelState === 'error' ? 'Preview pending' : '3D object'}</span>
    </div>
  )
}
