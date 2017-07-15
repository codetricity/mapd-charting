import { createParser } from "mapd-data-layer"

const TABLE = "tweets_nov_feb"
const MAP_STYLE = "mapbox://styles/mapbox/light-v8"
const WIDTH = document.documentElement.clientWidth / 1.5
const HEIGHT =
  Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 200
const UPDATE_INTERVAL = 750

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
  const HeatLayer = dc.rasterLayer("heat")
  window.HeatLayer = HeatLayer

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
              bins: [50, WIDTH]
            },
            y: {
              field: "lat",
              bins: [25, HEIGHT]
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
        width: 30,
        height: 30,
        fillColor: {
          scale: "heat_color",
          field: "cnt"
        }
      }
    }
  }))

  RasterChart.usePixelRatio(true)
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

document.addEventListener("DOMContentLoaded", function init() {
  return connect().then(createCrossfilter).then(createCharts).then(() => {
    document.getElementById("size").addEventListener("change", function(e) {
      const value = parseInt(e.target.value)
      HeatLayer.setVegaSpec(spec => ({
        ...spec,
        mark: {
          ...spec.mark,
          properties: {
            ...spec.mark.properties,
            width: value,
            height: value
          }
        }
      }))
      dc.redrawAllAsync()
    })

    document.getElementById("xbin").addEventListener("change", function(e) {
      const value = parseInt(e.target.value)
      const spec = HeatLayer.spec()

      HeatLayer.setVegaSpec(spec => ({
        ...spec,
        data: {
          ...spec.data,
          sql: {
            ...spec.data.sql,
            transform: []
          }
        }
      }))
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
