/**
 * Days after its last visit that an anonymous tracker account (no linked email
 * or phone) and all its data are deleted by /api/cron/prune-anonymous. The
 * privacy notice quotes this number, so change both together.
 */
export const ANONYMOUS_RETENTION_DAYS = 180;
