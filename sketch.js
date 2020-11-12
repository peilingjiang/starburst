'use strict'

let ctx
let midPoint

let saveButton

/* --------------------------------- Sliders -------------------------------- */
let polygon, radius, thickness, innerLayer, cross

let children
let roOffset
let rRatio
let constantGap
let perspective

let strokeColor
let backgroundColor

let rotationSlider, rotatingSpeed, clockWise
let rotatingCounter = 0

// Fancy
let pinhole

let flash, nowTime
let flashTrue = true // Display or not

let pNoise = {}

let cues = {}
let cueR = 13

let c
function setup() {
  c = createCanvas(720, 720)
  c.parent(select('#rendering'))
  ctx = c.drawingContext

  noFill()
  imageMode(CENTER)
  pixelDensity(3)

  midPoint = width / 2

  saveButton = select('#save-button')
  saveButton.mouseClicked(saveMyCanvas)

  polygon = select('#polygon')
  radius = select('#radius')
  thickness = select('#thickness')
  innerLayer = select('#inner-layer')
  cross = select('#cross')

  children = select('#child-num')
  roOffset = select('#ro-offset')
  rRatio = select('#r-ratio')
  constantGap = select('#constant-gap')
  perspective = select('#perspective')

  strokeColor = select('#stroke-color')
  backgroundColor = select('#background')

  rotationSlider = select('#rotation')
  rotatingSpeed = select('#rotating-speed')
  clockWise = select('#clockwise')

  // Fancy
  pinhole = select('#pinhole')
  flash = select('#flash')

  pNoise.y = select('#y-noise')
  pNoise.x = select('#x-noise')

  cues.center = select('#center-cue')
  cues.side1 = select('#side-cue-1')
  cues.side2 = select('#side-cue-2')
  cues.side3 = select('#side-cue-3')
  cues.side4 = select('#side-cue-4')
  cues.corner1 = select('#corner-cue-1')
  cues.corner2 = select('#corner-cue-2')
  cues.corner3 = select('#corner-cue-3')
  cues.corner4 = select('#corner-cue-4')

  nowTime = millis()
}

let p, r, hasInner
let thick = 8
let childRatio, hasPerspective
let clockWiseCounter = 1

let flashValue = 0
let flashGap = 1000
let thisTime = 0

function draw() {
  /* -------------------------------------------------------------------------- */

  p = polygon.value()
  r = radius.value()
  thick = thickness.value()
  hasInner = innerLayer.checked()
  hasPerspective = perspective.checked()

  childRatio = rRatio.value()

  clockWiseCounter = clockWise.checked() ? 1 : -1

  flashValue = flash.value()
  if (flashValue != 0) flashGap = 1000 / flashValue

  /* -------------------------------------------------------------------------- */

  if (isColorful) {
    colorMode(HSB)
    background(backgroundColor.value(), 90, 170)
    stroke(strokeColor.value(), 90, 170)
  } else {
    colorMode(RGB)
    background(backgroundColor.value())
    stroke(strokeColor.value())
  }

  strokeWeight(thickness.value())

  thisTime = millis()
  if (flashValue > 0 && thisTime - nowTime > flashGap) {
    nowTime = thisTime
    flashTrue = !flashTrue
  }

  push()
  translate(
    midPoint + pNoise.x.value() * (noise(millis()) - 0.5),
    midPoint + pNoise.y.value() * (noise(0, millis()) - 0.5)
  )

  rotatingCounter += (clockWiseCounter * rotatingSpeed.value() * PI * 0.01) / 60
  rotate(
    clockWiseCounter * rotationSlider.value() * PI * 0.01 + rotatingCounter
  )

  if (flashTrue || flashValue == 0) {
    _drawSet(r, p, thick, hasInner)

    let childR = r
    let newThick = thick
    // Draw children
    for (let i = 0; i < children.value(); i++) {
      let innerR = _getInner(p, _getInner(p, childR, newThick), newThick)

      rotate((roOffset.value() * 0.01 * PI) / p)

      if (constantGap.checked())
        childR = Math.max(innerR - map(childRatio, 50, 100, r * 0.5, 0), 0)
      else childR = innerR * childRatio * 0.01

      newThick = hasPerspective
        ? (thickness.value() * childR) / r
        : thickness.value()
      if (hasPerspective) strokeWeight(newThick)
      _drawSet(childR, p, newThick, hasInner)
    }
  }

  pop()

  push()
  colorMode(RGB)
  fill(0)
  noStroke()

  // Cues
  if (cues.center.checked()) circle(midPoint, midPoint, cueR)
  if (cues.side1.checked()) circle(70, midPoint, cueR)
  if (cues.side2.checked()) circle(midPoint, 70, cueR)
  if (cues.side3.checked()) circle(width - 70, midPoint, cueR)
  if (cues.side4.checked()) circle(midPoint, height - 70, cueR)
  if (cues.corner1.checked()) circle(100, 100, cueR)
  if (cues.corner2.checked()) circle(width - 100, 100, cueR)
  if (cues.corner3.checked()) circle(width - 100, height - 100, cueR)
  if (cues.corner4.checked()) circle(100, height - 100, cueR)

  // Pinhole
  if (pinhole.value() != 0)
    drawPinhole(
      pinholeType
        ? _map(pinhole.value(), 0, 100, dist(0, 0, width, height) >> 1, 0)
        : _map(pinhole.value(), 0, 100, width >> 1, 0)
    )

  pop()
}

function saveMyCanvas() {
  saveCanvas(c, 'newStarburst', 'png')
}

/* --------------------------------- Helpers -------------------------------- */

function drawPolygon(x, y, radius, n) {
  let angle = TWO_PI / n
  beginShape()
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius
    let sy = y + sin(a) * radius
    vertex(sx, sy)
  }
  endShape(CLOSE)
}

function _drawSet(r, p, t, hI) {
  // radius, polygon, hasInner
  drawPolygon(0, 0, r, p)
  if (hI) drawPolygon(0, 0, _getInner(p, r, t), p, t)
  if (cross.checked()) {
    rotate(PI / p)
    drawPolygon(0, 0, r, p)
    if (hI) drawPolygon(0, 0, _getInner(p, r, t), p, t)
  }
}

function _getInner(p, outerR, t = 8) {
  return (outerR - t) * Math.cos(PI / p)
}

function _changeValue(name, val) {
  if (name === 'rotation' || name === 'rotating-speed') {
    document.getElementById(name + '-text').innerText = (val * 0.01).toFixed(2)
    return
  }
  document.getElementById(name + '-text').innerText = val
}

let yPerspective = 0
let xPerspective = 0

function _changePerspectiveValue(axis, val) {
  let v = (val * 0.01).toFixed(2)
  document.getElementById(`${axis}-perspective-text`).innerText = v
  axis === 'x' ? (xPerspective = v) : (yPerspective = v)
  document.getElementById('defaultCanvas0').style.transform = `rotateX(${
    yPerspective * PI
  }rad) rotateY(${xPerspective * PI}rad)`
}

let isColorful = false

function _changeColorful() {
  if (!isColorful) {
    document.getElementById('stroke-color-name').innerHTML = 'Stroke Hue'
    document.getElementById('background-name').innerHTML = 'BG Hue'
  } else {
    document.getElementById('stroke-color-name').innerHTML = 'Stroke Color'
    document.getElementById('background-name').innerHTML = 'Background'
  }
  isColorful = !isColorful
}

let pinholeType = true // circle

function _changePinhole() {
  pinholeType = !pinholeType
}

function drawPinhole(r) {
  pinholeType ? translate(midPoint, midPoint) : translate(0, 0)
  beginShape()

  vertex(-width, -height)
  vertex(width, -height)
  vertex(width, height)
  vertex(-width, height)

  beginContour()
  if (pinholeType) {
    for (var i = 0; i <= 50; i++)
      vertex(r * cos((-i * TWO_PI) / 50), r * sin((-i * TWO_PI) / 50))
  } else {
    // Square
    vertex(midPoint - r, midPoint + r)
    vertex(midPoint + r, midPoint + r)
    vertex(midPoint + r, midPoint - r)
    vertex(midPoint - r, midPoint - r)
  }

  endContour()

  endShape(CLOSE)
}

/* --------------------------- Custom Calculation --------------------------- */

function _constrain(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function _map(value, iStart, iStop, oStart, oStop) {
  return (
    oStart + (oStop - oStart) * (((value - iStart) * 1.0) / (iStop - iStart))
  )
}
