import * as classnames from 'classnames'
import { Component, h } from 'preact'
import { CSSProperties } from 'typescript-cssproperties'

export interface DraggableProps {
  children?: any
  coordinates?: { x: number; y: number }
  pressed?: boolean
  rotation?: number
  size?: number
  style?: CSSProperties
}

const defaultStyle: CSSProperties = {
  backgroundColor: 'black',
  borderRadius: '50%',
  boxSizing: 'border-box',
  cursor: 'pointer',
  height: 40,
  position: 'absolute',
  width: 40,
}

const Draggable = ({
  children,
  coordinates,
  pressed = false,
  rotation = 0,
  size = 40,
  style,
}: DraggableProps): JSX.Element => (
  <div
    style={{
      ...defaultStyle,
      ...style,
      width: size,
      height: size,
      top: coordinates ? coordinates.y : 0,
      left: coordinates ? coordinates.x : 0,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    }}
    class={classnames({ pressed })}
  >
    {children}
  </div>
)

export default Draggable
