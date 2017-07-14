import {createParser} from "mapd-data-layer"

const TABLE = "tweets_nov_feb"
const MAP_STYLE = 'mapbox://styles/mapbox/light-v8'
const WIDTH = document.documentElement.clientWidth / 1.5;
const HEIGHT = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 200;
const UPDATE_INTERVAL = 750

const Connector = new MapdCon()
  .protocol("http")
  .host("kali.mapd.com")
  .port("9092")
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
  window.HeatLayer = HeatLayer
  HeatLayer
    .crossfilter(cf)
    .xDim(xDim)
    .yDim(yDim)
    .markSize(20)
    .spec({
      x: {
        field: "lon",
        bins: 50
      },
      y: {
        field: "lat",
        bins: 25
      },
      aggregate: "AVG(tweet_count)"
    })

  RasterChart
    .con(Connector)
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
    .then(() => dc.renderAllAsync())
}

document.addEventListener("DOMContentLoaded", function init() {
  return connect()
    .then(createCrossfilter)
    .then(createCharts)
    .then(() => {

      document.getElementById("size").addEventListener("change", function(e) {
        const value = parseInt(e.target.value)
        HeatLayer.markSize(value)
        dc.redrawAllAsync()
      })

      document.getElementById("xbin").addEventListener("change", function(e) {
        const value = parseInt(e.target.value)
        const spec = HeatLayer.spec()
        console.log(value)
        HeatLayer.spec({
          y: spec.y,
          aggregate: spec.aggregate,
          x: {
            field: "lon",
            bins: value
          }
        })
        dc.redrawAllAsync()
      })


      document.getElementById("ybin").addEventListener("change", function(e) {
        const value = parseInt(e.target.value)
        const spec = HeatLayer.spec()
        HeatLayer.spec({
          x: spec.x,
          aggregate: spec.aggregate,
          y: {
            field: "lat",
            bins: value
          }
        })
        dc.redrawAllAsync()
      })
    })


})
