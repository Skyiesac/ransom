import AnoAI from '@/components/ui/animated-shader-background'
import { CobeGlobeScroll } from '@/components/ui/cobe-globe-scroll'

const DemoOne = () => {
  return (
    <div className="relative w-full bg-black overflow-x-hidden" style={{ minHeight: '100vh' }}>
      {/* Animated background - fixed behind everything */}
      <div className="fixed inset-0 w-full h-screen z-0 pointer-events-none">
        <AnoAI />
      </div>

      {/* Globe component - in foreground */}
      <div style={{ position: 'relative', zIndex: 20, width: '100%' }}>
        <CobeGlobeScroll />
      </div>
    </div>
  )
}

export { DemoOne }
