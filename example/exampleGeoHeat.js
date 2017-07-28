import { createParser } from "mapd-data-layer"
import R from "ramda"

const TABLE = "tweets_nov_feb"
const MAP_STYLE = "mapbox://styles/mapbox/light-v8"

const WIDTH = document.documentElement.clientWidth / 1.5
const HEIGHT =
  Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 200

const UPDATE_INTERVAL = 750
const INITIAL_X_BINS = 10
const INITIAL_Y_BINS = 10

let GAP_SIZE = 0
const shapeSize = (bins, size, gap = GAP_SIZE) => size/bins - gap

let HeatLayer

const Connector = new MapdCon()
  .protocol("http")
  .host("kali.mapd.com")
  .port("9092")
  .dbName("mapd")
  .user("mapd")
  .password("HyperInteractive")

Connector.logging(true)

function connect() {
  return new Promise((resolve, reject) => {
    Connector.connect(function(error, connector) {
      if (error) {
        reject(error)
      } else {
        resolve(connector)
      }
    })
  })
}

function createCrossfilter(connector) {
  return crossfilter.crossfilter(connector, TABLE)
}

function countWidget(cf) {
  return dc.countWidget(".data-count").dimension(cf).group(cf.groupAll())
}

function rasterChart(cf) {
  var xDim = cf.dimension("lon")
  var yDim = cf.dimension("lat")
  const RasterChart = dc.rasterChart(document.getElementById("heatmap"), true)
  HeatLayer = dc.rasterLayer("heat")
  console.log(INITIAL_X_BINS, WIDTH)
  HeatLayer.crossfilter(cf).xDim(xDim).yDim(yDim).setVegaSpec(() => ({
    data: {
      name: "heatmap_query",
      sql: {
        type: "root",
        source: TABLE,
        transform: [
          {
            type: "rect_pixel_bin",
            x: {
              field: "lon",
              bins: [INITIAL_X_BINS, WIDTH]
            },
            y: {
              field: "lat",
              bins: [INITIAL_Y_BINS, HEIGHT]
            },
            aggregate: "COUNT(DISTINCT lang)"
          }
        ]
      }
    },
    scales: [
      {
        name: "heat_color",
        type: "quantize",
        domain: [0, 25],
        range: [
          "#0d0887",
          "#2a0593",
          "#41049d",
          "#5601a4",
          "#6a00a8",
          "#7e03a8",
          "#8f0da4",
          "#a11b9b",
          "#b12a90",
          "#bf3984",
          "#cb4679",
          "#d6556d",
          "#e16462",
          "#ea7457",
          "#f2844b",
          "#f89540",
          "#fca636",
          "#feba2c",
          "#fcce25",
          "#f7e425",
          "#f0f921"
        ],
        default: "#0d0887",
        nullValue: "#0d0887"
      }
    ],
    mark: {
      type: "symbol",
      from: {
        data: "heatmap_query"
      },
      properties: {
        shape: "square",
        x: {
          field: "x"
        },
        y: {
          field: "y"
        },
        width: shapeSize(INITIAL_X_BINS, WIDTH),
        height: shapeSize(INITIAL_Y_BINS, HEIGHT),
        fillColor: {
          scale: "heat_color",
          field: "cnt"
        }
      }
    }
  }))

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

function createCharts(cf) {
  const RasterChart = rasterChart(cf)
  countWidget(cf)
  return RasterChart.init().then(() => dc.renderAllAsync())
}

const makeBinLens = (prop) => R.compose(
  R.lensPath(["data", "sql", "transform"]),
  R.lensIndex(1),
  R.lensPath([prop, "bins"])
)

const xBinLens = makeBinLens("x")
const yBinLens = makeBinLens("y")

function setupListeners () {
  document.getElementById("size").addEventListener("change", function(e) {
    const value = parseInt(e.target.value)
    GAP_SIZE = value
    HeatLayer.setVegaSpec(spec => ({
      ...spec,
      mark: {
        ...spec.mark,
        properties: {
          ...spec.mark.properties,
          width: shapeSize(spec.data.sql.transform[1].x.bins[0], WIDTH, value),
          height: shapeSize(spec.data.sql.transform[1].y.bins[0], HEIGHT, value)
        }
      }
    }))
    dc.redrawAllAsync()
  })

  document.getElementById("xbin").addEventListener("change", function(e) {
    const value = parseInt(e.target.value)
    HeatLayer.setVegaSpec(R.over(xBinLens, (bins) => [value, bins[1]]))
    HeatLayer.setVegaSpec(spec => ({
      ...spec,
      mark: {
        ...spec.mark,
        properties: {
          ...spec.mark.properties,
          width: shapeSize(value, WIDTH),
        }
      }
    }))
    dc.redrawAllAsync()
  })

  document.getElementById("ybin").addEventListener("change", function(e) {
    const value = parseInt(e.target.value)
    HeatLayer.setVegaSpec(R.over(yBinLens, (bins) => [value, bins[1]]))
    HeatLayer.setVegaSpec(spec => ({
      ...spec,
      mark: {
        ...spec.mark,
        properties: {
          ...spec.mark.properties,
          height: shapeSize(value, HEIGHT),
        }
      }
    }))
    dc.redrawAllAsync()
  })
}

document.addEventListener("DOMContentLoaded", function init() {
  return connect()
    .then(createCrossfilter)
    .then(createCharts)
    .then(setupListeners)
})
