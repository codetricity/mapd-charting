import {createRasterLayerGetterSetter} from "../utils/utils-vega"

export function heatmapVega (state) {
  return {
    "data": {
      "name": "heatmap_query",
      "sql": state.query
    },
    "scales": [
      {
        "name": "heat_color",
        "type": "quantize",
        "domain": [
          0, 25
        ],
        "range": [ "#0d0887", "#2a0593", "#41049d", "#5601a4", "#6a00a8", "#7e03a8", "#8f0da4", "#a11b9b", "#b12a90", "#bf3984", "#cb4679", "#d6556d", "#e16462", "#ea7457", "#f2844b", "#f89540", "#fca636", "#feba2c", "#fcce25", "#f7e425", "#f0f921" ],
        "default": "#0d0887",
        "nullValue": "#0d0887"
      }
    ],
    "mark": {
      "type": "symbol",
      "from": {
        "data": "heatmap_query"
      },
      "properties": {
        "shape": "square",
        "x": {
          "field": "x"
        },
        "y": {
          "field": "y"
        },
        "width": state.size,
        "height": state.size,
        "fillColor": {
          "scale": "heat_color",
          "field": "cnt"
        }
      }
    }
  }
}

export default function rasterLayerHeatmapMixin (_layer) {
  _layer.markSize = createRasterLayerGetterSetter(_layer, null)
  _layer.spec = createRasterLayerGetterSetter(_layer, null)
  _layer.crossfilter = createRasterLayerGetterSetter(_layer, null)
  _layer.xDim = createRasterLayerGetterSetter(_layer, null)
  _layer.yDim = createRasterLayerGetterSetter(_layer, null)
  _layer._mandatoryAttributes([])

  _layer._genVega = function (chart, layerName, group, query) {
    return heatmapVega({
      query: query,
      size: _layer.markSize() || 1,
    })
  }

  return _layer
}
