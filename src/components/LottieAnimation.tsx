import { useEffect, useRef } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'

type LottieAnimationProps = {
  animationData: Record<string, unknown>
  className?: string
  ariaLabel?: string
  active?: boolean
}

export function LottieAnimation({
  animationData,
  className,
  ariaLabel,
  active = true,
}: LottieAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)

  useEffect(() => {
    if (active) {
      lottieRef.current?.goToAndPlay(0, true)
    } else {
      lottieRef.current?.goToAndStop(0, true)
    }
  }, [active])

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop
      autoplay={active}
      className={className}
      aria-label={ariaLabel}
      rendererSettings={{
        preserveAspectRatio: 'xMidYMid meet',
      }}
    />
  )
}
