import {expect} from "chai"
import rasterLayer from "./raster-layer"
import rasterLayerHeatmapMixin from "./raster-layer-heatmap-mixin"

describe("rasterLayerHeatmapMixin", () => {

  it("should have the correct getters/setters", () => {
    const layer = rasterLayer("heat")
    const xDim = "xDim"
    const yDim = "yDim"
    layer.xDim(xDim)
    layer.yDim(yDim)
    expect(layer.xDim()).to.equal(xDim)
    expect(layer.yDim()).to.equal(yDim)
  })

  describe("_genVega", () => {
    it("should return JSON", () => {
      const layer = rasterLayer("heat")
      expect(typeof layer._genVega()).to.equal("object")
    })
  })
})
