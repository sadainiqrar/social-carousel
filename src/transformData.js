import * as d3 from 'd3'

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

const treemap = (data, width, height) =>
  d3
    .treemap()
    .tile(d3.treemapSliceDice)
    .size([width, height])
    .padding(5)
    .round(true)(
    d3
      .hierarchy({ name: 'posts', children: data })
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value)
  )

export default (data, width, height) => {
  const lowerValues = data.filter((item) => item.value <= 1)
  const highervalues = data.filter((item) => item.value > 1)
  const groupedData = [
    ...highervalues,
    { name: 'group1', children: lowerValues.slice(0, 2) },
    { name: 'group1', children: lowerValues.slice(2, 4) },
  ]
  const root = treemap(groupedData.shuffle(), width, height)
  const x = root.children.reduce((acc, val) => {
    if (val.children) {
      return [...acc, ...val.children]
    }
    return [...acc, val]
  }, [])
  return { ...root, children: x }
}
