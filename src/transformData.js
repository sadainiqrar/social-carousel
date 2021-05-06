Array.prototype.shuffle = function () {
  var currentIndex = this.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = this[currentIndex]
    this[currentIndex] = this[randomIndex]
    this[randomIndex] = temporaryValue
  }

  return this
}

const POSTS_LENGTH = 10
const DEPTH = 0.1
const SCALING_FACTOR = 0.5

export default (data, width, height) => {
  const horizontalScreenOffset = width / (POSTS_LENGTH * 2)
  const verticalScreenOffset = height * 0.05
  const tileSize = (width - horizontalScreenOffset * 2) / POSTS_LENGTH
  const horizontalCentralOffset = tileSize / 2
  const transformedData = data.map((item, index) => {
    const cardWidth = tileSize + tileSize * 0.25 - tileSize * index * DEPTH
    const verticalOffset = height * index * DEPTH
    const tileHeight = height - verticalOffset
    return {
      width: cardWidth,
      scalingValue: cardWidth * SCALING_FACTOR,
      fontSize: 1 - index * DEPTH,
      zIndex: Math.round((1 - index * DEPTH) * POSTS_LENGTH),
      y:
        verticalScreenOffset +
        Math.floor(
          (Math.random() * tileHeight) / (index * SCALING_FACTOR + 3)
        ) +
        verticalOffset / 2,
      content: item,
    }
  })

  const processedData = transformedData.shuffle().map((card, index) => {
    const { scalingValue, ...item } = card
    const cardWidth = item.width
    return {
      ...item,
      x: tileSize * index + horizontalScreenOffset - scalingValue / 2,
      width: cardWidth + scalingValue,
    }
  })
  return processedData
}
