/** One building on the world map. */
export type MapUpgrade = {
	_id: string;
	region: string;
	/** `base`, `bunker` or `pacificationCenter` on 2026-11-09. */
	upgradeType: string;
	level: number;
	/** `active`, `pending` or `disabled` on 2026-11-09. */
	status: string;
};

export type UpgradeCustomEndpoints = {
	/** Every building on the map: 1,407 rows, about 175 KB, on 2026-11-09. Answers without an API key. */
	"upgrade.getMapUpgrades": { output: MapUpgrade[] };
};
