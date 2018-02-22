export const absoluteTouchPosition = (e: TouchEvent) => ({
  x: e.changedTouches[0].pageX - (window.scrollX || window.pageXOffset),
  y: e.changedTouches[0].pageY - (window.scrollY || window.pageYOffset),
})

export const absoluteMousePosition = (e: MouseEvent) => ({
  x: e.pageX - (window.scrollX || window.pageXOffset),
  y: e.pageY - (window.scrollY || window.pageYOffset),
})
