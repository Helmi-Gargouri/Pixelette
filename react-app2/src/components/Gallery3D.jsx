import { useRef, useState, useEffect, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, Sky, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Composant pour gérer le déplacement au clavier
function FirstPersonControls() {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'KeyZ':
        case 'ArrowUp':
          keys.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true
          break
        case 'KeyA':
        case 'KeyQ':
        case 'ArrowLeft':
          keys.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true
          break
      }
    }
const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'KeyZ':
        case 'ArrowUp':
          keys.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false
          break
        case 'KeyA':
        case 'KeyQ':
        case 'ArrowLeft':
          keys.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state) => {
    const speed = 0.1
    const camera = state.camera
    const oldPosition = camera.position.clone()

    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(camera.up, direction).normalize()

    // Corriger les directions inversées
    if (keys.current.forward) {
      camera.position.addScaledVector(direction, speed)
    }
    if (keys.current.backward) {
      camera.position.addScaledVector(direction, -speed)
    }
    if (keys.current.left) {
      camera.position.addScaledVector(right, speed)
    }
    if (keys.current.right) {
      camera.position.addScaledVector(right, -speed)
    }

    // Système de collision avec les murs
    const collisionRadius = 0.5
    
    // Murs extérieurs
    if (camera.position.x < -9 + collisionRadius) camera.position.x = -9 + collisionRadius
    if (camera.position.x > 9 - collisionRadius) camera.position.x = 9 - collisionRadius
    if (camera.position.z < -14 + collisionRadius) camera.position.z = -14 + collisionRadius
    if (camera.position.z > 14 - collisionRadius) camera.position.z = 14 - collisionRadius

    // Collisions avec murs intérieurs
    // Mur séparateur gauche (x = -5, z entre -9 et -1)
    if (camera.position.x > -5.3 && camera.position.x < -4.7 && 
        camera.position.z > -9 && camera.position.z < -1) {
      camera.position.x = oldPosition.x
      camera.position.z = oldPosition.z
    }
    
    // Mur séparateur droit (x = 5, z entre -9 et -1)
    if (camera.position.x > 4.7 && camera.position.x < 5.3 && 
        camera.position.z > -9 && camera.position.z < -1) {
      camera.position.x = oldPosition.x
      camera.position.z = oldPosition.z
    }

    // Murs séparateurs centraux horizontaux (z = 0)
    // Partie gauche (x entre -10 et -4)
    if (camera.position.z > -0.3 && camera.position.z < 0.3 && 
        camera.position.x < -4 && camera.position.x > -10) {
      camera.position.x = oldPosition.x
      camera.position.z = oldPosition.z
    }
    
    // Partie droite (x entre 4 et 10)
    if (camera.position.z > -0.3 && camera.position.z < 0.3 && 
        camera.position.x > 4 && camera.position.x < 10) {
      camera.position.x = oldPosition.x
      camera.position.z = oldPosition.z
    }

    camera.position.y = 1.6 // Hauteur constante
  })

  return null
}

// Composant pour une œuvre accrochée au mur
function Artwork({ position, rotation, imageUrl, title, description, oeuvre }) {
  const meshRef = useRef()
  const [textureLoaded, setTextureLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 2, height: 1.5 })

  console.log('Artwork - imageUrl:', imageUrl)

  // Charger l'image pour obtenir ses dimensions réelles
  useEffect(() => {
    if (imageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const fullUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${MEDIA_BASE}${imageUrl}`;
      img.onload = () => {
        const aspectRatio = img.width / img.height
        let width = 2
        let height = 2 / aspectRatio
        
        // Limiter les dimensions max
        if (height > 2.5) {
          height = 2.5
          width = height * aspectRatio
        }
        if (width > 3) {
          width = 3
          height = width / aspectRatio
        }
        
        console.log(`Image ${title}: ${img.width}x${img.height} → Cadre 3D: ${width.toFixed(2)}x${height.toFixed(2)}`)
        setImageDimensions({ width, height })
      }
      img.src = fullUrl
    }
  }, [imageUrl, title])

  const scale = [imageDimensions.width, imageDimensions.height, 0.05]

  return (
    <group position={position} rotation={rotation}>
      {/* Cadre doré sculpté */}
      <mesh position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[scale[0] + 0.2, scale[1] + 0.2, 0.1]} />
        <meshStandardMaterial 
          color="#C9A961" 
          metalness={0.6} 
          roughness={0.4}
        />
      </mesh>
      
      {/* Bordure interne du cadre */}
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[scale[0] + 0.1, scale[1] + 0.1, 0.03]} />
        <meshStandardMaterial 
          color="#8B7355" 
          metalness={0.3} 
          roughness={0.6}
        />
      </mesh>
      
      {/* L'œuvre */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={scale} />
        {imageUrl ? (
          <ArtworkMaterial imageUrl={imageUrl} onLoad={() => setTextureLoaded(true)} />
        ) : (
          <meshBasicMaterial color="#f0f0f0" />
        )}
      </mesh>

      {/* Pancarte sous l'œuvre */}
      <group position={[0, -scale[1] / 2 - 0.5, 0]}>
        {/* Support de la pancarte */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[Math.min(scale[0], 2.2), 0.4, 0.03]} />
          <meshStandardMaterial color="#2c2c2c" metalness={0.1} roughness={0.8} />
        </mesh>
        
        {/* Titre */}
        <Text
          position={[0, 0.08, 0.05]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={Math.min(scale[0], 2) - 0.2}
          fontWeight={700}
        >
          {title || 'Sans titre'}
        </Text>
        
        {/* Description */}
        {description && (
          <Text
            position={[0, -0.08, 0.05]}
            fontSize={0.08}
            color="#cccccc"
            anchorX="center"
            anchorY="middle"
            maxWidth={Math.min(scale[0], 2) - 0.2}
          >
            {description.substring(0, 80)}{description.length > 80 ? '...' : ''}
          </Text>
        )}
      </group>
    </group>
  )
}

// Cache global pour les textures
const textureCache = new Map()

// Composant séparé pour charger la texture
function ArtworkMaterial({ imageUrl, onLoad }) {
  const [texture, setTexture] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!imageUrl) {
      console.warn('Pas d\'imageUrl fournie')
      return
    }

 // Construire l'URL complète si elle est relative
let fullUrl = imageUrl;
if (!imageUrl.startsWith('http')) {
  fullUrl = imageUrl.startsWith('/') 
    ? `${MEDIA_BASE}${imageUrl}`
    : `${MEDIA_BASE}/${imageUrl}`;
}

    // Vérifier si la texture est déjà en cache
    if (textureCache.has(fullUrl)) {
      console.log('📦 Texture depuis cache:', fullUrl)
      const cachedTexture = textureCache.get(fullUrl)
      setTexture(cachedTexture)
      onLoad?.()
      return
    }
    
    console.log('🖼️ Chargement nouvelle texture:', fullUrl)

    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    
    loader.load(
      fullUrl,
      (loadedTexture) => {
        console.log('✅ Texture chargée avec succès!', fullUrl)
        loadedTexture.colorSpace = THREE.SRGBColorSpace
        loadedTexture.needsUpdate = true
        loadedTexture.minFilter = THREE.LinearFilter
        loadedTexture.magFilter = THREE.LinearFilter
        
        // Mettre en cache
        textureCache.set(fullUrl, loadedTexture)
        
        setTexture(loadedTexture)
        onLoad?.()
      },
      (progress) => {
        if (progress.total > 0) {
          console.log('📥 Chargement:', Math.round((progress.loaded / progress.total) * 100) + '%')
        }
      },
      (err) => {
        console.error('❌ ERREUR chargement texture:', fullUrl)
        console.error('Détails erreur:', err)
        setError(true)
      }
    )
  }, [imageUrl, onLoad])

  if (error) {
    console.log('Affichage couleur de secours (erreur)')
    return <meshBasicMaterial color="#ff6b6b" />
  }

  if (!texture) {
    console.log('Affichage couleur de chargement (gris)')
    return <meshBasicMaterial color="#dddddd" />
  }

  console.log('✨ Affichage de la texture - texture object:', texture)
  console.log('Texture details:', {
    image: texture.image,
    needsUpdate: texture.needsUpdate,
    colorSpace: texture.colorSpace
  })
  
  // Utiliser meshBasicMaterial pour forcer l'affichage sans dépendre de l'éclairage
  // IMPORTANT: DoubleSide pour être sûr de voir la texture de tous les côtés
  return <meshBasicMaterial 
    map={texture} 
    side={THREE.DoubleSide}
    toneMapped={false}
    transparent={false}
    color="#ffffff"
  />
}

// Composant pour une plante décorative
function Plant({ position }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Terre */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Plante */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#3a6b1f" roughness={0.9} />
      </mesh>
    </group>
  )
}

// Composant pour une lumière suspendue visible
function CeilingLight({ position }) {
  return (
    <group position={position}>
      {/* Câble */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Abat-jour */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.15, 0.2, 8]} />
        <meshStandardMaterial color="#f5f5f5" emissive="#ffffe0" emissiveIntensity={0.3} />
      </mesh>
      {/* Ampoule (lumière) */}
      <pointLight position={[0, -0.1, 0]} intensity={1.5} distance={8} decay={2} color="#fffacd" />
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#fffacd" />
      </mesh>
    </group>
  )
}

// Composant pour une sculpture décorative
function Sculpture({ position, type = 'sphere' }) {
  return (
    <group position={position}>
      {/* Socle */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.6, 8]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
      </mesh>
      {/* Sculpture */}
      {type === 'sphere' ? (
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
        </mesh>
      ) : (
        <mesh position={[0, 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.35, 0.5, 0.35]} />
          <meshStandardMaterial color="#b8860b" metalness={0.6} roughness={0.4} />
        </mesh>
      )}
    </group>
  )
}

// Composant pour les murs et le sol de la galerie
function GalleryRoom({ oeuvres = [] }) {
  const wallHeight = 4
  const roomLength = 30  // Agrandir
  const roomWidth = 20   // Agrandir

  // Distribuer les œuvres sur TOUS les murs (extérieurs + intérieurs)
  const distributeArtworks = () => {
    const artworks = []
    
    // Définir tous les emplacements disponibles
    const wallPositions = [
      // === MUR DU FOND (3 œuvres) ===
      { pos: [-6, wallHeight / 2, -roomLength / 2 + 0.25], rot: [0, 0, 0] },
      { pos: [0, wallHeight / 2, -roomLength / 2 + 0.25], rot: [0, 0, 0] },
      { pos: [6, wallHeight / 2, -roomLength / 2 + 0.25], rot: [0, 0, 0] },
      
      // === MUR DE DROITE (4 œuvres) ===
      { pos: [roomWidth / 2 - 0.25, wallHeight / 2, -10], rot: [0, -Math.PI / 2, 0] },
      { pos: [roomWidth / 2 - 0.25, wallHeight / 2, -5], rot: [0, -Math.PI / 2, 0] },
      { pos: [roomWidth / 2 - 0.25, wallHeight / 2, 5], rot: [0, -Math.PI / 2, 0] },
      { pos: [roomWidth / 2 - 0.25, wallHeight / 2, 10], rot: [0, -Math.PI / 2, 0] },
      
      // === MUR DE GAUCHE (4 œuvres) ===
      { pos: [-roomWidth / 2 + 0.25, wallHeight / 2, -10], rot: [0, Math.PI / 2, 0] },
      { pos: [-roomWidth / 2 + 0.25, wallHeight / 2, -5], rot: [0, Math.PI / 2, 0] },
      { pos: [-roomWidth / 2 + 0.25, wallHeight / 2, 5], rot: [0, Math.PI / 2, 0] },
      { pos: [-roomWidth / 2 + 0.25, wallHeight / 2, 10], rot: [0, Math.PI / 2, 0] },
      
      // === MUR SÉPARATEUR GAUCHE (côté face nord, z = -5) ===
      { pos: [-5.25, wallHeight / 2, -6], rot: [0, Math.PI / 2, 0] },
      { pos: [-5.25, wallHeight / 2, -3], rot: [0, Math.PI / 2, 0] },
      
      // === MUR SÉPARATEUR GAUCHE (côté face sud) ===
      { pos: [-4.75, wallHeight / 2, -6], rot: [0, -Math.PI / 2, 0] },
      { pos: [-4.75, wallHeight / 2, -3], rot: [0, -Math.PI / 2, 0] },
      
      // === MUR SÉPARATEUR DROIT (côté face nord) ===
      { pos: [5.25, wallHeight / 2, -6], rot: [0, -Math.PI / 2, 0] },
      { pos: [5.25, wallHeight / 2, -3], rot: [0, -Math.PI / 2, 0] },
      
      // === MUR SÉPARATEUR DROIT (côté face sud) ===
      { pos: [4.75, wallHeight / 2, -6], rot: [0, Math.PI / 2, 0] },
      { pos: [4.75, wallHeight / 2, -3], rot: [0, Math.PI / 2, 0] },
      
      // === MURS SÉPARATEURS CENTRAUX (z = 0) ===
      // Partie gauche - face nord
      { pos: [-8, wallHeight / 2, -0.25], rot: [0, 0, 0] },
      { pos: [-6, wallHeight / 2, -0.25], rot: [0, 0, 0] },
      
      // Partie gauche - face sud
      { pos: [-8, wallHeight / 2, 0.25], rot: [0, Math.PI, 0] },
      { pos: [-6, wallHeight / 2, 0.25], rot: [0, Math.PI, 0] },
      
      // Partie droite - face nord
      { pos: [6, wallHeight / 2, -0.25], rot: [0, 0, 0] },
      { pos: [8, wallHeight / 2, -0.25], rot: [0, 0, 0] },
      
      // Partie droite - face sud
      { pos: [6, wallHeight / 2, 0.25], rot: [0, Math.PI, 0] },
      { pos: [8, wallHeight / 2, 0.25], rot: [0, Math.PI, 0] },
    ]

    // Distribuer les œuvres sur les emplacements disponibles
    oeuvres.forEach((oeuvre, index) => {
      if (index < wallPositions.length) {
        const { pos, rot } = wallPositions[index]
        
        artworks.push(
          <Artwork
            key={oeuvre.id}
            position={pos}
            rotation={rot}
            imageUrl={oeuvre.image}
            title={oeuvre.titre}
            description={oeuvre.description}
            oeuvre={oeuvre}
          />
        )
      }
    })

    return artworks
  }

  return (
    <>
      {/* Sol avec texture parquet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomWidth, roomLength]} />
        <meshStandardMaterial 
          color="#8B7355" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Grille du sol pour effet parquet */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={`floor-line-${i}`}
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-roomWidth/2 + i * (roomWidth/20), 0.01, 0]}
        >
          <planeGeometry args={[0.02, roomLength]} />
          <meshBasicMaterial color="#6B5D4F" />
        </mesh>
      ))}

      {/* Plafond avec moulures */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, wallHeight, 0]}>
        <planeGeometry args={[roomWidth, roomLength]} />
        <meshStandardMaterial color="#fafafa" roughness={0.7} />
      </mesh>

      {/* Plinthes au sol */}
      {/* Plinthe fond */}
      <mesh position={[0, 0.1, -roomLength / 2 + 0.05]}>
        <boxGeometry args={[roomWidth, 0.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Plinthe avant */}
      <mesh position={[0, 0.1, roomLength / 2 - 0.05]}>
        <boxGeometry args={[roomWidth, 0.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Plinthe gauche */}
      <mesh position={[-roomWidth / 2 + 0.05, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.2, roomLength]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Plinthe droite */}
      <mesh position={[roomWidth / 2 - 0.05, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.2, roomLength]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Murs */}
      {/* Mur du fond */}
      <mesh position={[0, wallHeight / 2, -roomLength / 2]} castShadow receiveShadow>
        <boxGeometry args={[roomWidth, wallHeight, 0.2]} />
        <meshStandardMaterial 
          color="#f8f8f8" 
          roughness={0.9}
        />
      </mesh>

      {/* Mur avant */}
      <mesh position={[0, wallHeight / 2, roomLength / 2]} receiveShadow>
        <boxGeometry args={[roomWidth, wallHeight, 0.2]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
      </mesh>

      {/* Mur gauche */}
      <mesh position={[-roomWidth / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, wallHeight, roomLength]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
      </mesh>

      {/* Mur droit */}
      <mesh position={[roomWidth / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, wallHeight, roomLength]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
      </mesh>

      {/* Corniches en haut des murs */}
      <mesh position={[0, wallHeight - 0.15, -roomLength / 2 + 0.1]}>
        <boxGeometry args={[roomWidth, 0.3, 0.15]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0, wallHeight - 0.15, roomLength / 2 - 0.1]}>
        <boxGeometry args={[roomWidth, 0.3, 0.15]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>

      {/* Éléments décoratifs - colonnes aux coins */}
      {[
        [-roomWidth/2 + 0.3, wallHeight/2, -roomLength/2 + 0.3],
        [roomWidth/2 - 0.3, wallHeight/2, -roomLength/2 + 0.3],
        [-roomWidth/2 + 0.3, wallHeight/2, roomLength/2 - 0.3],
        [roomWidth/2 - 0.3, wallHeight/2, roomLength/2 - 0.3]
      ].map((pos, i) => (
        <group key={`column-${i}`}>
          <mesh position={pos}>
            <cylinderGeometry args={[0.15, 0.15, wallHeight, 8]} />
            <meshStandardMaterial color="#d4d4d4" metalness={0.3} roughness={0.7} />
          </mesh>
          {/* Chapiteau de colonne */}
          <mesh position={[pos[0], wallHeight - 0.1, pos[2]]}>
            <cylinderGeometry args={[0.2, 0.15, 0.2, 8]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.4} roughness={0.6} />
          </mesh>
          {/* Base de colonne */}
          <mesh position={[pos[0], 0.1, pos[2]]}>
            <cylinderGeometry args={[0.15, 0.2, 0.2, 8]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Bancs au centre de la galerie */}
      {[
        [0, 0.25, 0],
        [0, 0.25, -3]
      ].map((pos, i) => (
        <group key={`bench-${i}`}>
          {/* Assise */}
          <mesh position={pos}>
            <boxGeometry args={[2, 0.1, 0.5]} />
            <meshStandardMaterial color="#8B4513" roughness={0.3} />
          </mesh>
          {/* Pieds */}
          <mesh position={[pos[0] - 0.8, 0.125, pos[2]]}>
            <boxGeometry args={[0.1, 0.25, 0.4]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          <mesh position={[pos[0] + 0.8, 0.125, pos[2]]}>
            <boxGeometry args={[0.1, 0.25, 0.4]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        </group>
      ))}

      {/* Tapis au centre */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1.5]}>
        <planeGeometry args={[4, 6]} />
        <meshStandardMaterial color="#8B0000" roughness={0.9} />
      </mesh>

      {/* Murs intérieurs pour créer plusieurs sections */}
      {/* Mur séparateur gauche avec passage */}
      <mesh position={[-5, wallHeight / 2, -5]}>
        <boxGeometry args={[0.2, wallHeight, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
      </mesh>
      
      {/* Mur séparateur droit avec passage */}
      <mesh position={[5, wallHeight / 2, -5]}>
        <boxGeometry args={[0.2, wallHeight, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
      </mesh>

      {/* Mur séparateur central avec grande ouverture */}
      <mesh position={[-7, wallHeight / 2, 0]}>
        <boxGeometry args={[6, wallHeight, 0.2]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
      </mesh>
      <mesh position={[7, wallHeight / 2, 0]}>
        <boxGeometry args={[6, wallHeight, 0.2]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
      </mesh>

      {/* Arc au-dessus de l'ouverture centrale */}
      <mesh position={[0, wallHeight - 0.5, 0]}>
        <boxGeometry args={[4, 1, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>

      {/* Lumières suspendues au plafond */}
      <CeilingLight position={[0, 3.4, -8]} />
      <CeilingLight position={[-4, 3.4, -4]} />
      <CeilingLight position={[4, 3.4, -4]} />
      <CeilingLight position={[0, 3.4, 0]} />
      <CeilingLight position={[-4, 3.4, 4]} />
      <CeilingLight position={[4, 3.4, 4]} />
      <CeilingLight position={[0, 3.4, 8]} />

      {/* Plantes décoratives dans les coins */}
      <Plant position={[-roomWidth/2 + 0.8, 0, -roomLength/2 + 0.8]} />
      <Plant position={[roomWidth/2 - 0.8, 0, -roomLength/2 + 0.8]} />
      <Plant position={[-roomWidth/2 + 0.8, 0, roomLength/2 - 0.8]} />
      <Plant position={[roomWidth/2 - 0.8, 0, roomLength/2 - 0.8]} />
      
      {/* Plantes le long des murs */}
      <Plant position={[-7, 0, -8]} />
      <Plant position={[7, 0, -8]} />
      <Plant position={[-7, 0, 8]} />
      <Plant position={[7, 0, 8]} />

      {/* Sculptures décoratives */}
      <Sculpture position={[-3, 0, 6]} type="sphere" />
      <Sculpture position={[3, 0, 6]} type="cube" />
      <Sculpture position={[-6, 0, -2]} type="sphere" />
      <Sculpture position={[6, 0, -2]} type="cube" />

      {/* Spots au plafond dirigés vers les œuvres */}
      {oeuvres.slice(0, 6).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 6
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <spotLight
            key={`spot-${i}`}
            position={[x, 3.8, z]}
            angle={0.4}
            intensity={2.0}
            penumbra={0.5}
            castShadow
            target-position={[x, 2, z]}
            color="#ffffff"
          />
        )
      })}

      {/* Œuvres */}
      {distributeArtworks()}
    </>
  )
}

// Composant principal de la galerie 3D
function Gallery3D({ show, onClose, oeuvres = [], galerieName = '' }) {
  const [isLocked, setIsLocked] = useState(false)

  console.log('Gallery3D render:', { show, oeuvresCount: oeuvres.length, galerieName })

  if (!show) return null

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: '#000'
      }}
    >
      {/* Instructions et contrôles */}
      {!isLocked && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            zIndex: 10000,
            maxWidth: '500px'
          }}
        >
          <h2 style={{ marginBottom: '20px', color: '#333' }}>{galerieName}</h2>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Cliquez pour entrer dans la galerie 3D
          </p>
          <div style={{ marginBottom: '20px', textAlign: 'left', color: '#555' }}>
            <p><strong>Contrôles :</strong></p>
            <ul style={{ paddingLeft: '20px' }}>
              <li> <strong>Souris</strong> : Regarder autour de vous</li>
              <li> <strong>Z / W</strong> : Avancer</li>
              <li> <strong>S</strong> : Reculer</li>
              <li> <strong>Q / A</strong> : Gauche</li>
              <li> <strong>D</strong> : Droite</li>
              <li> <strong>ESC</strong> : Quitter</li>
            </ul>
          </div>
        </div>
      )}

      {/* Bouton de fermeture */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10001,
          background: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}
        title="Quitter la galerie 3D"
      >
        ✕
      </button>

      {/* Info en haut */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '25px',
            zIndex: 10000,
            fontSize: '14px'
          }}
        >
          Appuyez sur ESC pour déverrouiller la souris
        </div>
      )}

      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 1.6, 8], fov: 75 }}
        shadows
        gl={{ antialias: true }}
        onCreated={() => console.log('Canvas créé avec succès')}
      >
        <Suspense fallback={null}>
          {/* Lumière ambiante forte pour tout éclairer uniformément */}
          <ambientLight intensity={2.0} />
          
          {/* Lumières du plafond */}
          <pointLight position={[0, 3.5, -5]} intensity={2.0} />
          <pointLight position={[0, 3.5, 0]} intensity={2.0} />
          <pointLight position={[0, 3.5, 5]} intensity={2.0} />
          
          {/* Lumières des murs pour bien éclairer les œuvres */}
          <directionalLight position={[0, 2, -10]} intensity={1.5} />
          <directionalLight position={[0, 2, 10]} intensity={1.5} />
          <directionalLight position={[10, 2, 0]} intensity={1.5} />
          <directionalLight position={[-10, 2, 0]} intensity={1.5} />

          {/* Ciel */}
          <Sky sunPosition={[100, 20, 100]} />

          {/* Contrôles FPS */}
          <PointerLockControls
            onLock={() => {
              console.log('Souris verrouillée')
              setIsLocked(true)
            }}
            onUnlock={() => {
              console.log('Souris déverrouillée')
              setIsLocked(false)
            }}
          />

          {/* Contrôles de déplacement */}
          <FirstPersonControls />

          {/* La galerie */}
          <GalleryRoom oeuvres={oeuvres} />

          {/* Titre de la galerie au plafond */}
          <Text
            position={[0, 3.8, -9]}
            rotation={[0, 0, 0]}
            fontSize={0.5}
            color="#333333"
            anchorX="center"
            anchorY="middle"
          >
            {galerieName}
          </Text>
        </Suspense>
      </Canvas>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default Gallery3D

