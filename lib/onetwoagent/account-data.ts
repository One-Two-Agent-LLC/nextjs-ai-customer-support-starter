import "server-only";
import {
  supportView,
  type IdentitySession,
  type Subject,
  type SupportGrant,
} from "@onetwoagent/integration/server";
import { query } from "../db";
export async function usage(workspaceId: string) {
  const rows = await query<{ used: number; quota: number }>(
    "SELECT used,quota FROM ota_starter.usage WHERE workspace_id=$1",
    [workspaceId],
  );
  return rows.map(({ used, quota }) => ({
    metric: "credits",
    used,
    limit: quota,
    remaining: quota - used,
  }));
}
export async function getAccount(session: IdentitySession) {
  const [row] = await query(
    `SELECT w.id,w.plan,m.role FROM ota_starter.sessions s
    JOIN ota_starter.workspaces w ON w.id=s.workspace_id JOIN ota_starter.memberships m ON m.user_id=s.user_id AND m.workspace_id=w.id
    JOIN ota_starter.visitors v ON v.id=s.user_id
    WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now() AND v.disabled_at IS NULL AND v.expires_at>now()`,
    [session.sessionId, session.userId],
  );
  return row
    ? {
        workspaceId: row.id,
        facts: {
          name: session.name,
          plan: row.plan,
          role: row.role,
          accountStatus: "active" as const,
          usage: await usage(row.id),
        },
      }
    : null;
}
export async function isSessionLive(grant: SupportGrant) {
  const [session] = await query(
    `SELECT 1 FROM ota_starter.sessions s JOIN ota_starter.visitors v ON v.id=s.user_id
    WHERE s.id=$1 AND s.user_id=$2 AND s.workspace_id=$3 AND s.revoked_at IS NULL AND s.expires_at>now()
    AND v.disabled_at IS NULL AND v.expires_at>now()`,
    [grant.sessionId, grant.userId, grant.workspaceId],
  );
  const [member] = await query(
    "SELECT 1 FROM ota_starter.memberships WHERE user_id=$1 AND workspace_id=$2",
    [grant.userId, grant.workspaceId],
  );
  return { session: Boolean(session), member: Boolean(member) };
}
export async function readSection(subject: Subject) {
  return { usage: await usage(subject.workspaceId) };
}
export async function readView(subject: Subject) {
  const rows = await query(
    `SELECT id,name,status,open_tasks,updated_at,description FROM ota_starter.projects
    WHERE workspace_id=$1 ORDER BY updated_at DESC,id LIMIT 6`,
    [subject.workspaceId],
  );
  const [{ total }] = await query<{ total: number }>(
    "SELECT count(*)::int AS total FROM ota_starter.projects WHERE workspace_id=$1",
    [subject.workspaceId],
  );
  return supportView({
    summary: total
      ? `${total} projects in this workspace`
      : "No projects in this workspace",
    total,
    records: rows.map((r) => ({
      id: r.id,
      type: "project",
      title: r.name,
      status: r.status,
      updatedAt: r.updated_at,
      summary: r.description,
      fields: { open_tasks: r.open_tasks },
    })),
  });
}
