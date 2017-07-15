import { expect } from "chai"
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
    const layer = rasterLayer("heat")

    layer.setVegaSpec(() => ({
      data: {
        name: "heatmap_query",
        sql: {
          type: "root",
          source: "flights",
          transform: [
            {
              type: "rect_pixel_bin",
              x: {
                field: "lon",
                bins: [50, 50]
              },
              y: {
                field: "lat",
                bins: [25, 25]
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

    it("should return JSON", () => {
      const spec = layer._genVega(100, 100, "lon = 100")
      expect(spec.data.sql).to.equal(
        "SELECT rect_pixel_bin(conv_4326_900913_x(lon)," +
          "(SELECT MIN(conv_4326_900913_x(lon)) from flights WHERE (lon = 100)), " +
          "(SELECT MAX(conv_4326_900913_x(lon)) from flights WHERE (lon = 100)), 50, 100) as x, " +
          "rect_pixel_bin(conv_4326_900913_y(lat)," +
          "(SELECT MIN(conv_4326_900913_y(lat)) from flights WHERE (lon = 100)), " +
          "(SELECT MAX(conv_4326_900913_y(lat)) from flights WHERE (lon = 100)), 25, 100) as y, " +
          "COUNT(DISTINCT lang) as cnt FROM flights WHERE (lon = 100) GROUP BY x, y"
      )
    })
  })
})
