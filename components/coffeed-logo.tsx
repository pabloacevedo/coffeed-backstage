import Image from "next/image"

interface CoffeedLogoProps {
  size?: number
  className?: string
}

export function CoffeedLogo({ size = 40, className = "" }: CoffeedLogoProps) {
  return (
    <Image
      src="/coffeed-logo.png"
      alt="Coffeed Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}
