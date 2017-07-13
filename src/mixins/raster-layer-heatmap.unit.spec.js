import {expect} from "chai"
import rasterLayerHeatmapMixin from "./raster-layer-heatmap-mixin"

describe("rasterLayerHeatmapMixin", () => {
  it("should accept a layer and return the layer", () => {
    const layer = {}
    expect(rasterLayerHeatmapMixin(layer)).to.equal(layer)
  })

  describe("_genVega", () => {
    it("should return JSON", () => {
      const layer = rasterLayerHeatmapMixin({})
      expect(typeof layer._genVega()).to.equal("object")
    })
  })
})
