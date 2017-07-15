import {createRasterLayerGetterSetter} from "../utils/utils-vega"
import {parser} from "../utils/utils"

const getBinTransform = spec =>
  spec.data.sql.transform.reduce((accum, t) => {
    if (t.type === "rect_pixel_bin") {
      accum = t
    }
    return accum
  }, {})

const setTransforms = transform => spec => ({
  ...spec,
  data: {
    name: "heatmap_query",
    sql: {
      ...spec.data.sql,
      transform
    }
  }
})

function writeSQL (spec) {
  return {
    ...spec,
    data: {
      name: "heatmap_query",
      sql: parser.writeSQL(spec.data.sql)
    }
  }
}

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

  _layer._genVega = function (width, height, filterExpr) {
    const {x, y, ...binTransform} = getBinTransform(vegaSpec)
    const transforms = [
      {
        type: "filter",
        expr: filterExpr
      },
      {
        ...binTransform,
        x: {
          field: x.field,
          bins: [x.bins[0], width]
        },
        y: {
          field: y.field,
          bins: [y.bins[1], height]
        }
      }
    ]

    _layer.setVegaSpec(setTransforms(transforms))

    return writeSQL(_layer.getVegaSpec())
  }

  return _layer
}
