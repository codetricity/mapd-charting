import {createRasterLayerGetterSetter} from "../utils/utils-vega"

export function heatmapVega (state) {
  return {}
}

export default function rasterLayerHeatmapMixin (_layer) {

  _layer.xDim = createRasterLayerGetterSetter(_layer, null)
  _layer.yDim = createRasterLayerGetterSetter(_layer, null)
  _layer._mandatoryAttributes([])

  _layer._genVega = function () {
    return {}
  }

  return _layer
}
