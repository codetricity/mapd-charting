import {createRasterLayerGetterSetter} from "../utils/utils-vega"
import {parser} from "../utils/utils"
import R from "ramda"

const sqlLense = R.lensPath(["data", "sql"])
const transformLense = R.compose(sqlLense, R.lensProp("transform"))

const setTransforms = R.set(transformLense)
const writeSQL = R.over(sqlLense, parser.writeSQL)
const getBinTransform = R.compose(
  R.find(R.propEq("type", "rect_pixel_bin")),
  R.view(transformLense)
)

export default function rasterLayerHeatmapMixin (_layer) {
  let vegaSpec = {}

  _layer.type = "heatmap"
  _layer.crossfilter = createRasterLayerGetterSetter(_layer, null)
  _layer.xDim = createRasterLayerGetterSetter(_layer, null)
  _layer.yDim = createRasterLayerGetterSetter(_layer, null)
  _layer._mandatoryAttributes([])

  _layer.setVegaSpec = function (setter) {
    vegaSpec = setter(vegaSpec)
  }

  _layer.getVegaSpec = function () {
    return JSON.parse(JSON.stringify(vegaSpec))
  }

  _layer._genVega = function ({width, height, min, max, filter, numBinsX, numBinsY}) {
    const {x, y, ...binTransform} = getBinTransform(vegaSpec)

    _layer.setVegaSpec(setTransforms([
      {
        type: "filter",
        expr: filter
      },
      {
        ...binTransform,
        x: {
          field: x.field,
          domain: [min[0], max[0]],
          bins: [numBinsX, width]
        },
        y: {
          field: y.field,
          domain: [min[1], max[1]],
          bins: [numBinsY, height]
        }
      }
    ]))
    _layer.setVegaSpec(spec => ({
      ...spec,
      mark: {
        ...spec.mark,
        properties: {
          ...spec.mark.properties,
          width: width / numBinsX,
          height: height / numBinsY
        }
      }
    }))

    return writeSQL(_layer.getVegaSpec())
  }

  return _layer
}
