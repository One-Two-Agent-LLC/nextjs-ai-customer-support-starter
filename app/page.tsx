import { getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { config, connected } from "@/lib/onetwoagent/config";
import { usage, readView } from "@/lib/onetwoagent/account-data";
import {
  SignOutButton,
  SwitchWorkspaceButton,
} from "@/components/onetwoagent-identity";
import { AskSupport } from "@/components/ask-support";
export const dynamic = "force-dynamic";
const PRODUCT_URL = "https://onetwoagent.com/ai-customer-support-for-nextjs";
const SOURCE_URL =
  "https://github.com/One-Two-Agent-LLC/nextjs-ai-customer-support-starter";
const QUESTIONS = [
  "How many credits do I have?",
  "Which project needs attention?",
  "Can I speak to a person?",
] as const;
export default async function Page() {
  const session = await getCurrentSession();
  const workspaces = session
    ? await query(
        "SELECT w.name,w.slot,w.id,w.plan FROM ota_starter.workspaces w JOIN ota_starter.memberships m ON m.workspace_id=w.id WHERE m.user_id=$1 ORDER BY w.slot",
        [session.user.id],
      )
    : [];
  const active = workspaces.find((w) => w.id === session?.workspaceId);
  const credits = session ? (await usage(session.workspaceId))[0] : null;
  const projects = session
    ? await readView({
        userId: session.user.id,
        workspaceId: session.workspaceId,
      })
    : null;
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Northstar home">
          <span className="brand-icon">✳</span> northstar
          <span className="demo-pill">demo</span>
        </a>
        <div className="workspace-current">
          <span className="avatar">N</span>
          <div>
            <strong>{active?.name ?? "Your demo workspace"}</strong>
            <small>{active ? `${active.plan} plan` : "Sample data"}</small>
          </div>
        </div>
        <nav aria-label="Main">
          <a className="nav-active" href="/">
            <span aria-hidden="true">▦</span> Overview
          </a>
          <a href="#projects">
            <span aria-hidden="true">▱</span> Projects
          </a>
          <a href="#integration">
            <span aria-hidden="true">⌘</span> Support
          </a>
        </nav>
        <div className="sidebar-bottom">
          <span className="built-with">Built with OneTwoAgent + Next.js</span>
          <a className="exit-primary" href={PRODUCT_URL}>
            Add this support to your app →
          </a>
          <a href={SOURCE_URL}>View source ↗</a>
        </div>
      </aside>
      <main id="main">
        <header>
          <div className="breadcrumb">
            Workspace <span>/</span> Overview
          </div>
          <span className="session-indicator">
            <i />
            {session ? "Private demo session" : "Demo"}
          </span>
        </header>
        <section className="intro">
          <div>
            <h1>{session ? active?.name : "A small app. Real support."}</h1>
            <p>
              {session
                ? "Your plan, usage and projects. Support sees the same."
                : "Signed-in support on sample data. No real accounts."}
            </p>
          </div>
          {session && <SignOutButton />}
        </section>
        {session && (
          <AskSupport
            questions={QUESTIONS}
            publicId={connected ? config.publicId : null}
          />
        )}
        {!session ? (
          <section className="welcome">
            <div className="welcome-icon">✳</div>
            <h2>Make yourself at home.</h2>
            <p>A private workspace with sample projects and usage.</p>
            <form method="post" action="/login">
              <button
                className="primary"
                disabled={process.env.DEMO_ACCESS_ENABLED !== "true"}
              >
                Start my demo <span aria-hidden="true">→</span>
              </button>
            </form>
            <small>
              {process.env.DEMO_ACCESS_ENABLED === "true"
                ? "No sign-up. Sample data. Ends after an hour."
                : "Demo access is off. Enable it in your own deployment."}
            </small>
          </section>
        ) : (
          <>
            <div className="stats">
              <section className="card stat">
                <span>Current plan</span>
                <div className="metric">
                  {active?.plan}
                  <em>Demo</em>
                </div>
                <p>From your app database</p>
              </section>
              <section className="card stat">
                <span>Credits remaining</span>
                <div className="metric">
                  {credits?.remaining?.toLocaleString("en-US")}
                </div>
                <div className="meter">
                  <span
                    style={{
                      width: `${Math.min(100, ((credits?.used ?? 0) / (credits?.limit || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p>
                  {credits?.used.toLocaleString("en-US")} of{" "}
                  {credits?.limit?.toLocaleString("en-US")} used
                </p>
              </section>
              <section className="card stat">
                <span>Projects</span>
                <div className="metric">{projects?.records.length ?? 0}</div>
                <p>In this workspace only</p>
              </section>
            </div>
            <section className="card projects" id="projects">
              <div className="section-heading">
                <h2>Projects</h2>
                <span className="count">
                  {projects?.records.length ?? 0} projects
                </span>
              </div>
              <div className="project-head">
                <span>Project</span>
                <span>Status</span>
                <span>Open tasks</span>
              </div>
              {projects?.records.length ? (
                projects.records.map((r, i) => (
                  <div className="project-row" key={r.id}>
                    <div className="project-title">
                      <span className={`project-icon icon-${i}`}>
                        {i === 0 ? "◈" : "↗"}
                      </span>
                      <div>
                        <strong>{r.title}</strong>
                        <small>{r.summary}</small>
                      </div>
                    </div>
                    <span
                      className={`status ${r.status === "At risk" ? "risk" : "track"}`}
                    >
                      {r.status}
                    </span>
                    <span className="tasks">
                      {String(
                        r.fields?.find((f) => f.key === "open_tasks")?.value ??
                          0,
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty">
                  A clean slate. This workspace has no projects yet.
                </div>
              )}
            </section>
            <div className="two-col">
              <section className="card change">
                <div className="card-icon">↻</div>
                <h2>Use 10 credits</h2>
                <p>Then ask support how many are left.</p>
                <form method="post" action="/activity">
                  <button className="secondary">Record activity</button>
                </form>
              </section>
              <section className="card change">
                <div className="card-icon">⇄</div>
                <h2>Switch workspace</h2>
                <p>Support follows you to the other one.</p>
                {workspaces
                  .filter((w) => w.id !== session.workspaceId)
                  .map((w) => (
                    <SwitchWorkspaceButton
                      key={w.slot}
                      slot={w.slot}
                      label={`Switch to ${w.name}`}
                    />
                  ))}
              </section>
            </div>
          </>
        )}
        <section className="integration" id="integration">
          <h2>Your backend stays in control.</h2>
          <ol className="pipeline" aria-label="How support connects">
            <li>Your session</li>
            <li>Read-only account data</li>
            <li>OneTwoAgent support</li>
            <li>Your team</li>
          </ol>
          <span className="integration-state">
            {connected ? "Widget connected" : "Widget not connected"}
          </span>
          {!connected && (
            <p className="setup-note">
              Run the OneTwoAgent CLI to connect your own workspace.
            </p>
          )}
        </section>
        <footer>
          <div>
            <span>Sample data · no real billing</span>
            <small>
              Open-source starter code (MIT). The AI support is OneTwoAgent.
            </small>
          </div>
          <div className="footer-links">
            <a className="exit-primary mobile-only" href={PRODUCT_URL}>
              Add this support to your app →
            </a>
            <a className="mobile-only" href={SOURCE_URL}>
              View source ↗
            </a>
            <a href="https://docs.onetwoagent.com/docs/widget/logged-in-users">
              Integration docs ↗
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
