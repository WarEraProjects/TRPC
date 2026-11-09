import { integrationTest, assert, client } from "./helpers/context";

integrationTest("map.getMapData", async () => {
  const value = await client.map.getMapData();

  assert(value.map.type === "Topology" && value.map.arcs.length > 0, "expected a TopoJSON topology");
  const [region] = value.map.objects.regions.geometries;
  assert(region && region.id === region.properties.regionId, "expected region geometries keyed by region id");
  assert(value.map.objects.regionLabels.geometries.every((label) => label.type === "Point"), "expected point labels");
  assert(value.innerCountriesTopo.type === "Topology", "expected the inner-countries topology");
  assert(value.overseasLinks.type === "FeatureCollection", "expected the overseas links");
  assert(!Number.isNaN(Date.parse(value.updatedAt)), "expected an updatedAt date");
});
