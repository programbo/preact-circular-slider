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
  valueToRadians
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
    size: 200
  }

  public state: SliderState = {
    pressed: false
  }

  private defaultStyle: CSSProperties = {
    position: 'relative'
  }

  private center: Point = { x: 0, y: 0 }

  private padding: number = 0

  private container: Element | undefined

  private coordinates: Point = { x: 0, y: 0 }

  private angle = 0
  private value: number = 0

  public constructor(props: SliderProps) {
    super(props)
    this.initPosition(props)
  }

  public componentWillReceiveProps(nextProps: SliderProps) {
    this.initPosition(nextProps)
  }

  public componentDidMount() {
    // tslint:disable-next-line no-unused-expression
    this.props.onMove &&
      this.props.onMove({ coordinates: this.coordinates, pressed: this.state.pressed, value: this.props.value! })
  }

  public render() {
    const Draggable = this.props.draggable
    return (
      <div
        class={this.props.class}
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

  private initPosition(props: SliderProps) {
    this.padding = (props.size! - props.radius! * 2) / 2
    this.center = {
      x: props.radius! + this.padding!,
      y: props.radius! + this.padding!
    }
    this.value = props.value || 0
    this.coordinates = calculateRadialPositionFromValue(
      this.center!,
      props.radius! + props.draggableOffset!,
      props.value,
      props.minValue,
      props.maxValue
    )
  }

  private moveListenerArgs = (isTouch: boolean) => ({
    moveEventType: isTouch ? 'touchmove' : 'mousemove',
    moveHandler: isTouch ? this.handleTouchMove : this.handleMouseMove
  })

  private endListenerArgs = (isTouch: boolean) => ({
    endEventType: isTouch ? 'touchend' : 'mouseup',
    endHandler: isTouch ? this.handleTouchEnd : this.handleMouseUp
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
