/** `[longitude, latitude]`. */
export type MapPosition = [number, number];

export type MapTransform = {
	scale: [number, number];
	translate: [number, number];
};

/**
 * A TopoJSON topology. Geometries reference `arcs` by index, where a negative index `~i` is arc `i`
 * reversed. Arc points are quantized and delta-encoded; decode them with `transform`.
 *
 * `Point` geometries (`regionLabels`, `countryLabels`) are not quantized: their `coordinates` are
 * already `[longitude, latitude]`, and a region label's equal its `properties.position` (all 742 on
 * 2026-11-09). Do not apply `transform` to them; `topojson-client`'s `feature()` would, and so would
 * misplace the labels.
 */
export type MapTopology<TObjects> = {
	type: "Topology";
	arcs: Array<Array<[number, number]>>;
	transform: MapTransform;
	bbox?: [number, number, number, number];
	objects: TObjects;
};

export type MapGeometryCollection<TGeometry> = {
	type: "GeometryCollection";
	geometries: TGeometry[];
};

export type MapPolygon = { type: "Polygon"; arcs: number[][] };
export type MapMultiPolygon = { type: "MultiPolygon"; arcs: number[][][] };
export type MapMultiLineString = { type: "MultiLineString"; arcs: number[][] };
/** `coordinates` are plain `[longitude, latitude]`, not quantized. */
export type MapPoint = { type: "Point"; coordinates: MapPosition };

export type MapRegionProperties = {
	regionId: string;
	regionCode: string;
	countryId: string;
	initialCountryId: string;
	position: MapPosition;
	scheme: string;
	mapAccent: string;
	/** A strategic resource code such as `gold` or `uranium`; absent on most regions. */
	resourceType?: string;
	neighbors: string[];
	isLinkedToCapital: boolean;
	development: number;
	revenue: number;
	population: number;
	residents: number;
	employees: number;
	biome: string;
	climate: string;
	resistance?: number;
	activeBattleId?: string;
};

export type MapCountryProperties = {
	countryId: string;
	countryData: { id: string; code: string; name: string };
	mapData: { centroid: MapPosition; textSize: number; area: number };
	scheme: string;
	mapAccent: string;
	allianceScheme?: string;
	allianceMapAccent?: string;
};

export type MapRegionsMeshProperties = {
	scheme: string;
	mapAccent: string;
	allianceScheme?: string;
	allianceMapAccent?: string;
};

export type MapBorderProperties = {
	/** `neutral`, `enemy`, `ally` or `water`. */
	borderType: string;
};

export type MapRegionLabelProperties = {
	regionId: string;
	name: string;
	position: MapPosition;
	isCapital: boolean;
	countryCode: string;
	scheme: string;
	allianceScheme?: string;
	climate: string;
	biome: string;
	/** An empty string on every label on 2026-11-09. */
	depositTimeRemaining: string;
	development: number;
	revenue: number;
	population: number;
	residents: number;
	employees: number;
	isResistance: boolean;
	/** Icon keys such as `resource-gold`. */
	labelIcons: string[];
	strategicResource?: string;
	resistance?: number;
	activeBunkerLevel?: number;
	activeBaseLevel?: number;
	activeBattleId?: string;
	attackerScheme?: string;
	attackerCountryCode?: string;
};

export type MapCountryLabelProperties = {
	countryId: string;
	countryCode: string;
	countryName: string;
	textSize: number;
	flagSize: number;
	scheme: string;
	allianceName?: string;
	allianceScheme?: string;
};

export type MapObjects = {
	lands: MapGeometryCollection<MapMultiPolygon>;
	/** `id` is the region id. */
	regions: MapGeometryCollection<MapMultiPolygon & { id: string; properties: MapRegionProperties }>;
	/** `id` is the country id; a country can span several geometries. */
	countries: MapGeometryCollection<MapMultiPolygon & { id: string; properties: MapCountryProperties }>;
	regionsMeshes: MapGeometryCollection<MapMultiLineString & { properties: MapRegionsMeshProperties }>;
	countriesMesh: MapGeometryCollection<MapMultiLineString>;
	countriesNeutralMesh: MapGeometryCollection<MapMultiLineString & { properties: MapBorderProperties }>;
	countriesEnemiesMesh: MapGeometryCollection<MapMultiLineString & { properties: MapBorderProperties }>;
	countriesAlliesMesh: MapGeometryCollection<MapMultiLineString & { properties: MapBorderProperties }>;
	countriesWaterMesh: MapGeometryCollection<MapMultiLineString & { properties: MapBorderProperties }>;
	regionLabels: MapGeometryCollection<MapPoint & { properties: MapRegionLabelProperties }>;
	countryLabels: MapGeometryCollection<MapPoint & { properties: MapCountryLabelProperties }>;
};

export type MapInnerCountriesObjects = {
	innerCountries: MapGeometryCollection<
		(MapPolygon | MapMultiPolygon) & { properties: { countryId: string; scheme: string; mapAccent: string } }
	>;
};

export type MapAttackLine = { from: MapPosition; to: MapPosition };

export type MapOverseasLink = {
	type: "Feature";
	properties: { fromRegionId: string; toRegionId: string };
	geometry: { type: "LineString"; coordinates: MapPosition[] };
};

/** The world map as TopoJSON plus GeoJSON overseas links: about 2.7 MB on 2026-11-09. */
export type MapGetMapDataResponse = {
	map: MapTopology<MapObjects>;
	dynamicData: { attackLines: MapAttackLine[] };
	innerCountriesTopo: MapTopology<MapInnerCountriesObjects>;
	overseasLinks: { type: "FeatureCollection"; features: MapOverseasLink[] };
	updatedAt: string;
};

export type MapCustomEndpoints = {
	/** Answers without an API key. */
	"map.getMapData": { output: MapGetMapDataResponse };
};
