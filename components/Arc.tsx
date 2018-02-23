import { arc } from 'd3-shape'
import { Component, h } from 'preact'
import { CSSProperties } from 'typescript-cssproperties'

export interface ArcProps {
  startAngle?: number
  endAngle?: number
  padding: number
  radius: number
  thickness: number
  style?: CSSProperties
  mask?: JSX.Element
  [index: string]: any
}

const defaultStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
}

export default ({
  radius = 80,
  startAngle = 0,
  endAngle = 360,
  padding = 10,
  thickness = 20,
  style,
  children,
  mask,
  ...otherProps
}: ArcProps): JSX.Element => {
  const arcData = arc()({
    innerRadius: radius - thickness,
    outerRadius: radius,
    startAngle: Math.PI * 2 * (startAngle / 360),
    endAngle: Math.PI * 2 * (endAngle / 360),
    padAngle: 0,
  })

  const size = (padding + radius) * 2
  const maskId = mask ? `arcmask-${new Date().getTime()}` : null
  const maskAttribute = mask ? `url(#${maskId})` : null

  return (
    <svg
      height={size}
      width={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ ...defaultStyle, ...style }}
      {...otherProps}
    >
      {maskId && (
        <defs>
          <mask id={maskId}>
            <rect width={size} height={size} fill="white" />
            {mask}
          </mask>
        </defs>
      )}
      <g mask={maskAttribute!}>
        <path d={arcData!} transform={`translate(${size / 2} ${size / 2})`} />
        {children}
      </g>
    </svg>
  )
}
