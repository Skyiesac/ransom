"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"
import { Folder } from "lucide-react"

interface FolderMarker {
  id: string
  location: [number, number]
  folderName: string
  fileCount: number
}

interface CobeGlobeScrollProps {
  markers?: FolderMarker[]
  className?: string
  speed?: number
}

const defaultMarkers: FolderMarker[] = [
  { id: "folder-sf", location: [37.78, -122.44], folderName: "Projects", fileCount: 24 },
  { id: "folder-nyc", location: [40.71, -74.01], folderName: "Assets", fileCount: 156 },
  { id: "folder-tokyo", location: [35.68, 139.65], folderName: "Data", fileCount: 89 },
  { id: "folder-sydney", location: [-33.87, 151.21], folderName: "Archive", fileCount: 342 },
  { id: "folder-paris", location: [48.86, 2.35], folderName: "Docs", fileCount: 67 },
  { id: "folder-london", location: [51.51, -0.13], folderName: "Code", fileCount: 203 },
]

export function CobeGlobeScroll({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: CobeGlobeScrollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const folderOverlayRef = useRef<HTMLDivElement | null>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)
  const currentPhiRef = useRef(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const elementTop = rect.top
      const elementBottom = rect.bottom

      // Calculate scroll progress from -1 (before) to 1 (after)
      let progress = (windowHeight - elementTop) / (windowHeight + rect.height)
      progress = Math.max(0, Math.min(1, progress))

      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0

    function init() {
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0.9,
        diffuse: 1.2,
        mapSamples: 40000,
        mapBrightness: 2.5,
        baseColor: [0.05, 0.2, 0.4],
        markerColor: [0.5, 0.8, 1.0],
        glowColor: [0.1, 0.5, 1.0],
        markerElevation: 0,
        markers: defaultMarkers.map((m) => ({
          location: m.location,
          size: 0,
          id: m.id,
        })),
        arcs: [],
        arcColor: [0.1, 0.5, 1.0],
        arcWidth: 1.5,
        arcHeight: 0.3,
        opacity: 1.0,
      })

      function animate() {
        if (!isPausedRef.current) phi += speed
        const currentPhi = phi + phiOffsetRef.current + dragOffset.current.phi
        currentPhiRef.current = currentPhi
        
        // Update folder overlay rotation to match globe horizontal movement
        if (folderOverlayRef.current) {
          // phi controls horizontal (longitude) rotation - use negative rotateY to match globe direction
          const rotationDegrees = -currentPhi * 180 / Math.PI
          folderOverlayRef.current.style.transform = `perspective(1000px) rotateY(${rotationDegrees}deg)`
        }
        
        globe!.update({
          phi: currentPhi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        })
        animationId = requestAnimationFrame(animate)
      }

      animate()
      setTimeout(() => canvas && (canvas.style.opacity = "1"))
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  }, [markers, speed])

  return (
    <div ref={containerRef} className={`relative w-full min-h-screen ${className}`} style={{ overflow: 'visible' }}>
      {/* Scroll content wrapper */}
      <div className="relative w-full h-screen flex items-center justify-center overflow-visible" style={{ position: 'relative', zIndex: 20 }}>
        {/* Globe container with scroll-based reveal - positioned at bottom */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "500%",
            maxWidth: "1000px",
            height: "1000px",
            overflow: "hidden",
            zIndex: 25,
          }}
        >
          {/* Gradient mask that reveals globe on scroll */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: scrollProgress > 0 ? `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${Math.min(0.3, scrollProgress * 0.5)}) 100%)` : "transparent",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />

          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            style={{
              width: "100%",
              height: "100%",
              cursor: "grab",
              opacity: 1,
              touchAction: "none",
              // Push down to show only top hemisphere
              transform: `translateY(${50 - scrollProgress * 50}%)`,
              transition: "transform 0.05s ease-out",
              display: "block",
              position: "relative",
              zIndex: 5,
            }}
          />

          {/* Folder icons HTML overlay on globe */}
          <div
            ref={folderOverlayRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "300%",
              overflow: "hidden",
              zIndex: 12,
              pointerEvents: "none",
              borderRadius: "50%",
              transformOrigin: "center center",
              willChange: "transform",
            }}
          >
            {defaultMarkers.map((marker, idx) => {
              const lat = marker.location[0]
              const lng = marker.location[1]
              const x = ((lng + 180) / 360) * 100
              const y = ((90 - lat) / 180) * 100

              return (
                <div
                  key={marker.id}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    // width: "28px",
                    // height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // background: "linear-gradient(135deg, rgba(100, 180, 255, 0.95) 0%, rgba(50, 150, 255, 0.95) 100%)",
                    borderRadius: "6px",
                    // boxShadow: "0 0 15px rgba(100, 180, 255, 0.8)",
                    // border: "1px solid rgba(100, 180, 255, 1)",
                    // backdropFilter: "blur(8px)",
                    fontSize: "16px",
                    pointerEvents: "auto",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    // filter: "drop-shadow(0 0 6px rgba(100, 180, 255, 0.8))",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = "translate(-50%, -50%) scale(1.3)"
                    // el.style.boxShadow = "0 0 25px rgba(100, 180, 255, 1)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = "translate(-50%, -50%) scale(1)"
                    // el.style.boxShadow = "0 0 15px rgba(100, 180, 255, 0.8)"
                  }}
                >
                  📁
                </div>
              )
            })}
          </div>
        </div>

        {/* Folder/Letter markers overlay */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          {defaultMarkers.map((marker, idx) => {
            const angle = (idx / defaultMarkers.length) * Math.PI * 2
            const radius = 200 + scrollProgress * 150
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius * 0.8 - 150
            
            // Random pop-in animation delay
            const popDelay = (idx * 150 + Math.sin(idx) * 200) % 2000

            return (
              <div
                key={marker.id}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  opacity: scrollProgress > 0.05 ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "auto",
                  animation: scrollProgress > 0.05 ? `popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${popDelay}ms forwards` : "none",
                }}
              >
                <style>{`
                  @keyframes popIn {
                    0% {
                      transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0) rotate(-180deg);
                      opacity: 0;
                    }
                    50% {
                      transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.2) rotate(10deg);
                    }
                    100% {
                      transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1) rotate(0deg);
                      opacity: 1;
                    }
                  }
                  @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                  }
                `}</style>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "70px",
                    height: "70px",
                    // background: "linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(88, 28, 135, 0.95) 100%)",
                    // backdropFilter: "blur(12px)",
                    // borderRadius: "18px",
                    // boxShadow: "0 10px 40px rgba(139, 92, 246, 0.5), 0 0 25px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)",
                    // border: "1.5px solid rgba(139, 92, 246, 0.6)",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    animation: "float 3s ease-in-out infinite",
                    animationDelay: `${idx * 0.1}s`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = "scale(1.3) rotate(15deg)"
                    el.style.boxShadow = "0 20px 60px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.5)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = "scale(1) rotate(0deg)"
                    el.style.boxShadow = "0 10px 40px rgba(139, 92, 246, 0.5), 0 0 25px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)"
                  }}
                >
                  <Folder size={38} style={{ color: "#E0D5FF", filter: "drop-shadow(0 0 10px rgba(139, 92, 246, 1))", zIndex: 1 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Additional scrollable content */}
      <div style={{ height: "200vh" }} />
    </div>
  )
}
