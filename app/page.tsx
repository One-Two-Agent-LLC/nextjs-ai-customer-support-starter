import { getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { connected } from "@/lib/onetwoagent/config";
import { usage, readView } from "@/lib/onetwoagent/account-data";
import {
  SignOutButton,
  SwitchWorkspaceButton,
} from "@/components/onetwoagent-identity";
export const dynamic = "force-dynamic";
const PRODUCT_URL = "https://onetwoagent.com/ai-customer-support-for-nextjs";
const SOURCE_URL =
  "https://github.com/One-Two-Agent-LLC/nextjs-ai-customer-support-starter";
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
          <span className="demo-pill">DEMO</span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-current">
          <span className="avatar">N</span>
          <div>
            <strong>{active?.name ?? "Your demo workspace"}</strong>
            <small>
              {active ? `${active.plan} plan` : "A private space to explore"}
            </small>
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
            <span aria-hidden="true">⌘</span> Support integration
          </a>
        </nav>
        <div className="sidebar-bottom">
          <span className="tiny-label">BUILT WITH</span>
          <span className="built-with">OneTwoAgent + Next.js</span>
          <a className="exit-primary" href={PRODUCT_URL}>
            Add this support to your app →
          </a>
          <a href={SOURCE_URL}>View source ↗</a>
          <p>
            Your app. Your data.
            <br />
            Your permissions.
          </p>
        </div>
      </aside>
      <main id="main">
        <header>
          <div className="breadcrumb">
            Workspace <span>/</span> Overview
          </div>
          <span className="session-indicator">
            <i />
            {session ? "Isolated demo session" : "Demo preview"}
          </span>
        </header>
        <section className="intro">
          <div>
            <div className="eyebrow">YOUR WORKSPACE, IN FOCUS</div>
            <h1>
              {session ? "Good to see you." : "A small app. Real support."}
            </h1>
            <p>
              {session
                ? "Everything your support agent is allowed to know, right here."
                : "Explore signed-in support without connecting your real accounts."}
            </p>
          </div>
          {session && <SignOutButton />}
        </section>
        {!session ? (
          <section className="welcome">
            <div className="welcome-icon">✳</div>
            <h2>Make yourself at home.</h2>
            <p>
              Start a private demo with sample projects and usage. Your session
              and workspaces are separate from every other visitor.
            </p>
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
                ? "No email or password. Synthetic data only. Session expires in one hour."
                : "Demo access is disabled. Enable it in your own deployment to begin."}
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
                <p>Plan recorded in your app database</p>
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
                <span>Projects in this workspace</span>
                <div className="metric">{projects?.records.length ?? 0}</div>
                <p>Visible only within your current workspace</p>
              </section>
            </div>
            <section className="card projects" id="projects">
              <div className="section-heading">
                <div>
                  <h2>Projects</h2>
                  <p>A little context makes support more useful.</p>
                </div>
                <span className="count">
                  {projects?.records.length ?? 0} projects
                </span>
              </div>
              <div className="project-head">
                <span>PROJECT</span>
                <span>STATUS</span>
                <span>OPEN TASKS</span>
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
                <h2>See a fresh account read</h2>
                <p>
                  Record 10 demo credits of activity, then ask the widget how
                  many credits you have now. Your app changes the data; support
                  can only read it.
                </p>
                <form method="post" action="/activity">
                  <button className="secondary">Record demo activity</button>
                </form>
              </section>
              <section className="card change">
                <div className="card-icon">⇄</div>
                <h2>Try another workspace</h2>
                <p>
                  Switch context and ask about your projects again. The widget
                  forgets the previous identity before the switch.
                </p>
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
          <div className="section-heading">
            <div>
              <div className="eyebrow">UNDER THE HOOD</div>
              <h2>Your backend stays in control.</h2>
            </div>
            <span className="integration-state">
              {connected ? "Widget configured" : "Widget not connected"}
            </span>
          </div>
          <div className="flow">
            <div>
              <b>01</b>
              <strong>Your app session</strong>
              <p>Identity comes from the server.</p>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <b>02</b>
              <strong>Approved account reads</strong>
              <p>Usage and projects, scoped to you.</p>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <b>03</b>
              <strong>Real support + your team</strong>
              <p>Answers in the widget. Takeover in Inbox.</p>
            </div>
          </div>
          <div className="try">
            <strong>Try asking</strong>
            <span>“How many credits do I have?”</span>
            <span>“Which project needs attention?”</span>
            <span>“Can I speak to a person?”</span>
          </div>
          {!connected && (
            <p className="setup-note">
              Run the OneTwoAgent CLI to connect your own workspace. No
              simulated chatbot is shown.
            </p>
          )}
        </section>
        <footer>
          <div>
            <span>Demo data · No real billing or external actions</span>
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
              Integration documentation ↗
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
