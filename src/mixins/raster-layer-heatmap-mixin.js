export function heatmapVega (state) {
  return {}
}

export default function rasterLayerHeatmapMixin (_layer) {

  _layer._genVega = function () {
    return {}
  }

  return _layer
}
