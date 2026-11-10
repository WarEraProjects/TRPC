import type { UserLeveling, UserSkills, UserSkillsExpiration } from "../api/Responses";

export type UserGetUserSkillsInput = {
	userId: string;
};

/**
 * A user's skills, which `user.getUserLite` no longer returns. `user.getUserById` still carries
 * the same `skills` and `leveling`.
 */
export type UserGetUserSkillsResponse = {
	_id: string;
	skills: UserSkills;
	skillsExpiration?: UserSkillsExpiration;
	leveling: UserLeveling;
	/** An empty object for a user who never reset their skills. */
	dates: {
		lastSkillsResetAt?: string;
	};
};

/** Both `user` procedures here answer without an API key. */
export type UserCustomEndpoints = {
	"user.getUserSkills": {
		input: UserGetUserSkillsInput;
		output: UserGetUserSkillsResponse;
	};
	/** Not the key owner's count: it was the same number with and without an API key (11,315 on 2026-11-09). */
	"user.getTodayClaimCount": { output: number };
};
