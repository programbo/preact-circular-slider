import { Component, h } from 'preact'
import { CSSProperties } from 'typescript-cssproperties'
import { absoluteMousePosition, absoluteTouchPosition } from './helpers/eventHelpers'
import {
  absoluteContainerPosition,
  angleToValue,
  calculateAngleBetweenPoints,
  calculateAngleDelta,
  calculateAngleFromOrigin,
  calculateAngleToPoint,
  calculateOrigin,
  calculateRadialPosition,
  calculateRadialPositionFromValue,
  Point,
  valueToRadians,
} from './helpers/geometryHelpers'

import DefaultRing, { ArcProps } from './components/Arc'
import DraggableWrapper from './components/DraggableWrapper'

export interface MovementResponse {
  coordinates: Point
  value: number
  pressed: boolean
}
export interface SliderProps {
  children?: any | any[]
  className?: string
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
  }

  public state: SliderState = {
    pressed: false,
  }

  private defaultStyle: CSSProperties = {
    position: 'relative',
  }

  private center: Point

  private padding: number

  private container: Element | undefined

  private coordinates: Point | undefined

  private angle = 0
  private value: number

  public constructor(props: SliderProps) {
    super(props)

    this.padding = (this.props.size! - this.props.radius! * 2) / 2
    this.center = {
      x: this.props.radius! + this.padding!,
      y: this.props.radius! + this.padding!,
    }
    this.value = this.props.value || 0
  }

  public componentDidMount() {
    this.coordinates = calculateRadialPositionFromValue(
      this.center!,
      this.props.radius! + this.props.draggableOffset!,
      this.props.value,
      this.props.minValue,
      this.props.maxValue,
    )

    // tslint:disable-next-line no-unused-expression
    this.props.onMove &&
      this.props.onMove({ coordinates: this.coordinates, pressed: this.state.pressed, value: this.props.value! })
  }

  public render() {
    const Draggable = this.props.draggable
    return (
      <div
        className={this.props.className}
        ref={el => (this.container = el)}
        style={{ ...this.defaultStyle, width: this.props.size, height: this.props.size }}
      >
        {this.props.children}
        <DraggableWrapper onMouseDown={this.handleMouseDown} onTouchStart={this.handleTouchStart}>
          {Draggable}
        </DraggableWrapper>
      </div>
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
    const { draggableOffset, onMove, radius } = this.props
    if (!this.container || !onMove || typeof radius === 'undefined' || typeof draggableOffset === 'undefined') {
      return null
    }

    const coordinates = calculateRadialPosition(this.container, this.center, radius + draggableOffset, position)

    if (this.coordinates) {
      const angleInRadians = calculateAngleBetweenPoints(this.center, this.coordinates, coordinates)
      this.value += angleToValue(angleInRadians, this.props.minValue!, this.props.maxValue!)
    }

    this.coordinates = coordinates
    return { coordinates, value: this.value, pressed }
  }
}

export default CircularSlider
