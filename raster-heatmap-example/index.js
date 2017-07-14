const TABLE = "tweets_nov_feb"
const MAP_STYLE = 'mapbox://styles/mapbox/light-v8'
const WIDTH = document.documentElement.clientWidth - 30;
const HEIGHT = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 200;
const UPDATE_INTERVAL = 750

const Connector = new MapdCon()
  .protocol("https")
  .host("metis.mapd.com")
  .port("443")
  .dbName("mapd")
  .user("mapd")
  .password("HyperInteractive")

Connector.logging(true)

function connect () {
  return new Promise((resolve, reject) => {
    Connector.connect(function(error, connector) {
      if (error) {
        reject(error)
      } else {
        resolve(connector)
      }
    });
  })
}

function createCrossfilter (connector) {
  return crossfilter.crossfilter(connector, TABLE)
}

function countWidget (cf) {
  return dc.countWidget(".data-count")
    .dimension(cf)
    .group(cf.groupAll())
}

function rasterChart (cf) {
  var xDim = cf.dimension("lon")
  var yDim = cf.dimension("lat")
  const RasterChart = dc.rasterChart(document.getElementById("heatmap"), true)
  const HeatLayer = dc.rasterLayer("heat")

  HeatLayer
    .xDim(xDim)
    .yDim(yDim)

  RasterChart
    .con(Connector)
    .usePixelRatio(true)
    .useLonLat(true)
    .height(HEIGHT)
    .width(WIDTH)
    .mapUpdateInterval(UPDATE_INTERVAL)
    .mapStyle(MAP_STYLE)

  RasterChart.pushLayer("heat", HeatLayer)

  return RasterChart
}


function createCharts (cf) {
  const RasterChart = rasterChart(cf)
  countWidget(cf)

  return RasterChart
    .init()
    .then(dc.renderAllAsync)
}

document.addEventListener("DOMContentLoaded", function init() {
  return connect()
    .then(createCrossfilter)
    .then(createCharts)
})
