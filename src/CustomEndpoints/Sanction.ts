export type SanctionGetPaginatedInput = {
  targetUserId?: string;
  type?: string;
  /** Between 1 and 100. */
  limit?: number;
  cursor?: string;
};
/** Fields vary by sanction type; unobserved variants retain unknown fields. */
export type SanctionData = {
  type: string;
  messageId?: string;
  reason?: string;
  banDurationInDays?: number;
  unbannedAt?: string;
  [field: string]: unknown;
};
export type Sanction = {
  _id: string;
  targetUser: string;
  data: SanctionData;
  createdAt: string;
  updatedAt: string;
  __v: number;
};
export type SanctionGetPaginatedResponse = { items: Sanction[]; nextCursor?: string | null };
export type SanctionCustomEndpoints = {
  "sanction.getPaginated": { input: SanctionGetPaginatedInput; output: SanctionGetPaginatedResponse };
};
