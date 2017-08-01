import {createRasterLayerGetterSetter} from "../utils/utils-vega"
import {parser} from "../utils/utils"

const MIN_AREA_IN_METERS = 30
const EARTH_DIAMETER = 40075000

function getPixelSize (neLat, width, zoom) {
  return Math.max(
    MIN_AREA_IN_METERS / (EARTH_DIAMETER * Math.cos(neLat * Math.PI / 180) / (width * Math.pow(2, zoom))),
    1.0
  )
}

export default function rasterLayerHeatmapMixin (_layer) {
  let state = {}

  _layer.type = "heatmap"
  _layer.crossfilter = createRasterLayerGetterSetter(_layer, null)
  _layer.xDim = createRasterLayerGetterSetter(_layer, null)
  _layer.yDim = createRasterLayerGetterSetter(_layer, null)
  _layer.dynamicSize = createRasterLayerGetterSetter(_layer, null)
  _layer.dynamicBinning = createRasterLayerGetterSetter(_layer, null)
  _layer._mandatoryAttributes([])

  _layer.setState = function (setterOrState) {
    if (typeof setter === "function") {
      state = setterOrState(state)
    } else {
      state = setterOrState
    }
  }

  _layer.getState = function () {
    return JSON.parse(JSON.stringify(state))
  }

  _layer._genVega = function ({table, width, height, min, max, filter, neLat, zoom}) {
    const pixelSize = getPixelSize(neLat, width, zoom)
    const numBinsX = Math.round(width / pixelSize)
    const numBinsY = Math.round(height * numBinsX / width)

    return {
      data: {
        name: "heatmap_query",
        sql: parser.writeSQL({
          type: "root",
          source: table,
          transform: [
            {
              type: "filter",
              expr: filter
            },
            {
              type: "aggregate",
              fields: [state.encoding.color.field],
              ops: [state.encoding.color.aggregate],
              as: ["color"],
              groupby: [
                {
                  type: "project",
                  expr: {
                    type: "pixel_bin",
                    shape: "rect",
                    field: `conv_4326_900913_x(${state.encoding.x.field})`,
                    domain: [min[0], max[0]],
                    bin: {
                      num: numBinsX,
                      size: width
                    }
                  },
                  as: "x"
                },
                {
                  type: "project",
                  expr: {
                    type: "pixel_bin",
                    shape: "rect",
                    field: `conv_4326_900913_y(${state.encoding.y.field})`,
                    domain: [min[1], max[1]],
                    bin: {
                      num: numBinsY,
                      size: height
                    }
                  },
                  as: "y"
                }
              ]
            }
          ]
        })
      },
      scales: [
        {
          name: "heat_color",
          type: state.encoding.color.type,
          domain: state.encoding.color.scale.domain,
          range: state.encoding.color.scale.range,
          default: state.encoding.color.scale.default,
          nullValue: state.encoding.color.scale.nullValue
        }
      ],
      mark: {
        type: "symbol",
        from: {
          data: "heatmap_query"
        },
        properties: {
          shape: state.mark,
          x: {
            field: "x"
          },
          y: {
            field: "y"
          },
          width: width / numBinsX,
          height: height / numBinsY,
          fillColor: {
            scale: "heat_color",
            field: "color"
          }
        }
      }
    }
  }

  return _layer
}
