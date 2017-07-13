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

function createCharts (cf) {
  const RasterChart = dc.rasterChart(document.getElementById("heatmap"), true)

  RasterChart
    .con(Connector)
    .usePixelRatio(true)
    .useLonLat(true)
    .height(HEIGHT)
    .width(WIDTH)
    .mapUpdateInterval(UPDATE_INTERVAL)
    .mapStyle(MAP_STYLE)

  return RasterChart.init()
}

document.addEventListener("DOMContentLoaded", function init() {
  return connect()
    .then(createCrossfilter)
    .then(createCharts)
})
