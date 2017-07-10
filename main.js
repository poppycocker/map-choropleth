// constants
const frameWidth = 1200
const frameHeight = 600
const legendWidth = 300
const legendHeight = 60
const projScale = 60000
const center = [139.330663, 35.71939] // 多摩川緑地福生南公園
const scaleDomain = [0, 1000000]
const scaleColorRange = ['#ffffd9', '#081d58']

// containers
let svgContainer = d3
  .select('#mainBlock')
  .append('svg')
  .attr('width', frameWidth)
  .attr('height', frameHeight)
let mapContainer = svgContainer.append('g').attr('class', 'mapBlock')
let dataContainer = svgContainer.append('g').attr('class', 'dataBlock')
let legendContainer = svgContainer.append('g').attr('class', 'legendBlock')
  .attr('transform', 'translate(800,0)')
  .attr('width', legendWidth)
  .attr('height', legendHeight)

let projection = d3.geo.mercator()
  .scale(projScale)
  .center(center);
let path = d3.geo.path().projection(projection)
let colorScale = d3.scale.linear()
  .domain(scaleDomain)
  .range(scaleColorRange)
let loaded = null


// 最初に1回のみ
function initMap() {
  let mapdata = loaded.mapdata
  mapContainer
    .selectAll('path')
    .data(topojson.feature(mapdata, mapdata.objects.Tokyo).features)
    .enter()  // これがあれば何回も実行されない模様...(要API調査)
    .append('path')
    .attr('id', d => d.properties.N03_007)
    .attr('d', path)
    .style('stroke', '#333')
    .style('stroke-width', '0.2px')
    .style('fill', '#fff')
}

// プルダウンの変更があるたびに
function updateMap(selectedPopulation) {
  let mapdata = loaded.mapdata
  mapContainer
    .selectAll('path')
    // .style('fill', function(d, i) {
    //   return colorScale(prev[i])
    // })
    .transition()
    .duration(500)
    .style('fill', (d, i) => {
      // 変化させた後の色
      let population = +selectedPopulation[0][d.properties.N03_007] || 0
      return colorScale(population)
    })
}

function initMenu() {
  let years = loaded.themedata.map(data => data.date)
  let menu = d3.select('#menuBlock select').on('change', onChangeYear)
  menu
    .selectAll('option')
    .data(years)
    .enter()
    .append('option')
    .attr('value', (d, i) => i)
    .text(d => d)
}

function onChangeYear(isOnInit) {
  let years = loaded.themedata.map(data => data.date)
  let idx = isOnInit ? 0 : +this.value
  selectedPopulation = loaded.themedata.filter(d => d.date === years[idx])
  updateMap(selectedPopulation)
}

function initLegend() {
  const steps = [0, 200000, 400000, 600000, 800000, 1000000]
  let legendObj = d3.legend.color()
    .shapeWidth(15)
    .shapeHeight(15)
    .labelFormat(d3.format('.0f'))
    .cells(steps)
    .orient('vertical')
    .scale(colorScale)
  legendContainer.call(legendObj)
}

function mainFunc(err, mapdata, themedata) {
  if (err) {
    console.log(err)
    return
  }
  loaded = {
    mapdata,
    themedata
  }
  initMap()
  initMenu()
  initLegend()
  onChangeYear(true)
}

// 外部ファイル読み込み
queue()
  .defer(d3.json, 'tokyo_poppycocker.topojson')
  .defer(d3.tsv, 'population.tsv')
  .await(mainFunc)
