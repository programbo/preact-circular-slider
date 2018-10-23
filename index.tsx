import { Component, h } from 'preact'
import { CSSProperties } from 'typescript-cssproperties'
import { absoluteMousePosition, absoluteTouchPosition } from './helpers/eventHelpers'
import {
  angleToValue,
  calculateAngleBetweenPoints,
  calculateRadialPosition,
  calculateRadialPositionFromValue,
  Point,
} from './helpers/geometryHelpers'

import DefaultRing from './components/Arc'
import DraggableWrapper from './components/DraggableWrapper'

export interface MovementResponse {
  coordinates: Point
  value: number
  pressed: boolean
}
export interface SliderProps {
  children?: any | any[]
  class?: string
  draggable?: any
  draggableOffset?: number
  maxValue?: number
  minValue?: number
  motion?: 'loop' | 'infinite' | 'once'
  onMove?: (response: MovementResponse) => void
  onMoveEnd?: (response: MovementResponse) => void
  radius?: number
  value?: number
  size?: number
  rotationAdjustment?: number
}

export interface SliderState {
  pressed: boolean
}

class CircularSlider extends Component<SliderProps, SliderState> {
  public static defaultProps: SliderProps = {
    children: <DefaultRing radius={100} padding={10} size={40} thickness={20} />,
    draggable: undefined,
    draggableOffset: 0,
    maxValue: 100,
    minValue: 0,
    motion: 'once',
    radius: 100,
    value: 0,
    size: 200,
    rotationAdjustment: -90,
  }

  private defaultStyle: CSSProperties = {
    position: 'relative',
  }

  private center: Point = { x: 0, y: 0 }

  private padding: number = 0

  private container: Element | undefined

  private coordinates: Point = { x: 0, y: 0 }

  private value: number = 0

  public constructor(props: SliderProps) {
    super(props)
    this.state = { pressed: false }
    this.initPosition(props)
  }

  public componentWillReceiveProps(nextProps: SliderProps) {
    this.initPosition(nextProps)
  }

  public componentDidMount() {
    const { onMove, value = 0 } = this.props
    const { pressed } = this.state

    // tslint:disable-next-line no-unused-expression
    onMove && onMove({ coordinates: this.coordinates, pressed, value })
  }

  public render() {
    const { children, class: className, draggable, size } = this.props
    const Draggable = draggable
    return (
      <div
        class={className}
        ref={el => (this.container = el)}
        style={{ ...this.defaultStyle, width: size, height: size }}
      >
        {children}
        <DraggableWrapper onMouseDown={this.handleMouseDown} onTouchStart={this.handleTouchStart}>
          {Draggable}
        </DraggableWrapper>
      </div>
    )
  }

  private initPosition({
    size,
    radius,
    maxValue,
    minValue,
    value = 0,
    rotationAdjustment,
    draggableOffset,
  }: SliderProps) {
    this.padding = (size! - radius! * 2) / 2
    this.center = {
      x: radius! + this.padding!,
      y: radius! + this.padding!,
    }
    this.value = value
    this.coordinates = calculateRadialPositionFromValue(
      this.center!,
      radius! + draggableOffset!,
      value,
      minValue,
      maxValue,
      rotationAdjustment,
    )
  }

  private moveListenerArgs = (isTouch: boolean) => ({
    moveEventType: isTouch ? 'touchmove' : 'mousemove',
    moveHandler: isTouch ? this.handleTouchMove : this.handleMouseMove,
  })

  private endListenerArgs = (isTouch: boolean) => ({
    endEventType: isTouch ? 'touchend' : 'mouseup',
    endHandler: isTouch ? this.handleTouchEnd : this.handleMouseUp,
  })

  private addEventListeners = (isTouch: boolean) => {
    this.setState({ pressed: true })
    const { moveEventType, moveHandler } = this.moveListenerArgs(isTouch)
    document.addEventListener(moveEventType, moveHandler as any)

    const { endEventType, endHandler } = this.endListenerArgs(isTouch)
    document.addEventListener(endEventType, endHandler as any)
  }

  private removeEventListeners = (isTouch: boolean) => {
    this.setState({ pressed: false })
    const { moveEventType, moveHandler } = this.moveListenerArgs(isTouch)
    document.removeEventListener(moveEventType, moveHandler as any)

    const { endEventType, endHandler } = this.endListenerArgs(isTouch)
    document.removeEventListener(endEventType, endHandler as any)
  }

  private handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    this.addEventListeners(false)

    const { onMove } = this.props
    // tslint:disable-next-line no-unused-expression
    onMove && onMove(this.getMovementData(absoluteMousePosition(e), true)!)
  }

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    this.addEventListeners(true)

    const { onMove } = this.props
    // tslint:disable-next-line no-unused-expression
    onMove && onMove(this.getMovementData(absoluteTouchPosition(e), true)!)
  }

  private handleMouseUp = (e: MouseEvent) => {
    e.stopPropagation()
    this.removeEventListeners(false)

    const { onMoveEnd } = this.props
    // tslint:disable-next-line no-unused-expression
    onMoveEnd && onMoveEnd(this.getMovementData(absoluteMousePosition(e), false)!)
  }

  private handleTouchEnd = (e: TouchEvent) => {
    e.stopPropagation()
    this.removeEventListeners(true)

    const { onMoveEnd } = this.props
    // tslint:disable-next-line no-unused-expression
    onMoveEnd && onMoveEnd(this.getMovementData(absoluteTouchPosition(e), false)!)
  }

  private handleMouseMove = (e: MouseEvent) => {
    e.stopPropagation()
    const { onMove } = this.props
    // tslint:disable-next-line no-unused-expression
    onMove && onMove(this.getMovementData(absoluteMousePosition(e), true)!)
  }

  private handleTouchMove = (e: TouchEvent) => {
    e.stopPropagation()
    const { onMove } = this.props
    // tslint:disable-next-line no-unused-expression
    onMove && onMove(this.getMovementData(absoluteTouchPosition(e), true)!)
  }

  private getMovementData = (position: Point, pressed: boolean = false): MovementResponse | null => {
    const { draggableOffset, maxValue, minValue, motion, onMove, radius } = this.props
    if (!this.container || !onMove || typeof radius === 'undefined' || typeof draggableOffset === 'undefined') {
      return null
    }
    const coordinates = calculateRadialPosition(this.container, this.center, radius + draggableOffset, position)

    if (this.coordinates) {
      const angleInRadians = calculateAngleBetweenPoints(this.center, this.coordinates, coordinates)
      const value = this.value + angleToValue(angleInRadians, minValue!, maxValue!)
      if (motion === 'infinite' || (value >= minValue! && value < maxValue!)) {
        this.value = value
        this.coordinates = coordinates
      } else if (motion === 'loop') {
        this.value = (value + maxValue!) % maxValue!
        this.coordinates = coordinates
      }
    } else {
      this.coordinates = coordinates
    }

    return { coordinates: this.coordinates, value: this.value, pressed }
  }
}

export default CircularSlider
