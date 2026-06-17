/** action keys มาตรฐานสำหรับ ActivityLog (workspace-scoped) */
export const ACTIVITY = {
  TX_CREATE: 'transaction.create',
  TX_UPDATE: 'transaction.update',
  TX_DELETE: 'transaction.delete',
  TX_RESTORE: 'transaction.restore',
  MEMBER_INVITE: 'member.invite',
  MEMBER_JOIN: 'member.join',
  MEMBER_ROLE_CHANGE: 'member.role_change',
  MEMBER_REMOVE: 'member.remove',
  INVITE_REVOKE: 'invitation.revoke',
} as const;

export type ActivityAction = (typeof ACTIVITY)[keyof typeof ACTIVITY];
