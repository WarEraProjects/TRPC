export type WarGetByIdInput = { warId: string };
export type WarSide = {
	country: string;
	wonBattlesCount: number;
	wonRoundsCount: number;
	damages: number;
};
export type War = {
	_id: string;
	attacker: WarSide;
	defender: WarSide;
	isActive: boolean;
	/** The validated sample was empty; populated entries remain unverified. */
	battles: unknown[];
	priority?: string | null;
	priorityEndAt?: string | null;
	createdAt: string;
	updatedAt: string;
	__v: number;
};
export type WarCustomEndpoints = { "war.getById": { input: WarGetByIdInput; output: War } };
