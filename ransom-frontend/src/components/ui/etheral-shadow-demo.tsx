import { EtherealShadow } from "@/components/ui/etheral-shadow"

const EtherealShadowPage = () => {
  return (
    <div className="relative w-full bg-black overflow-x-hidden" style={{ minHeight: '100vh' }}>
      {/* Etheral Shadow component - full screen */}
      <div style={{ position: 'relative', zIndex: 20, width: '100%', height: '100vh' }}>
        <EtherealShadow
          color="rgba(14, 117, 214, 0.83)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
        />
      </div>
    </div>
  )
}

export { EtherealShadowPage }
