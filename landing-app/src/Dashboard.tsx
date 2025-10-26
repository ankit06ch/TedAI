import React, { useEffect, useState } from 'react'
import { Bell, MessageCircle, Search } from 'lucide-react'
import ConversationMap from './ConversationMap'
import { ConversationMeta, listConversations } from './firebase/conversations'

type Props = {
  email?: string | null
  uid?: string | null
  onSignOut: () => void
}

type View = 'dashboard' | 'conversation'

export default function Dashboard({ email, uid, onSignOut }: Props): React.JSX.Element {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!uid) { setConversations([]); return }
    ;(async () => {
      try {
        const list = await listConversations(uid)
        if (isMounted) setConversations(list)
      } catch {
        if (isMounted) setConversations([])
      }
    })()
    return () => { isMounted = false }
  }, [uid, activeView])
  return (
    <div className="dashboard">
      <div className="dash-shell">
        <aside className="sidebar">
          <div className="sb-profile">
            <div className="avatar" aria-hidden="true">JM</div>
            <div className="who">
              <div className="name">{email ?? 'Your Account'}</div>
              <div className="role">Member</div>
            </div>
          </div>
          <nav className="sb-nav">
            <button
              className={`nav-item${activeView === 'dashboard' ? ' active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-item${activeView === 'conversation' ? ' active' : ''}`}
              onClick={() => setActiveView('conversation')}
            >
              Conversation Map
            </button>
            <div className="grow" />
            <button className="nav-item">Profile</button>
            <button className="nav-item">Settings</button>
            <button className="nav-item danger" onClick={onSignOut}>Sign out</button>
          </nav>
        </aside>
        <main className="main">
          {activeView === 'dashboard' ? (
            <>
              <header className="topbar">
                <div className="search">
                  <Search size={18} color="#9CA3AF" aria-hidden="true" />
                  <input placeholder="Search for informations..." />
                </div>
                <div className="actions">
                  <button className="icon-btn" aria-label="Notifications"><Bell size={18} /></button>
                  <button className="icon-btn" aria-label="Chat"><MessageCircle size={18} /></button>
                  <button className="pill">Analyze Now</button>
                </div>
              </header>

              <section className="cards-grid">
                {/* Brain Usage hero */}
                <article className="card hero">
                  <div className="card-head">
                    <h3>Brain Usage</h3>
                    <p>Analyze recent cell activity</p>
                  </div>
                  <div className="brain-scene">
                    <div className="brain-pink" aria-hidden="true" />
                    <div className="brain-streak" aria-hidden="true" />
                    <img className="brain-gif" src="/brain.gif" alt="" aria-hidden="true" />
                    <div className="tag t1">
                      <span>Creative Processes</span>
                      <div className="bars"><i /><i /><i /><i /></div>
                    </div>
                    <div className="tag t2">
                      <span>Musical Hearing</span>
                      <div className="bars pink"><i /><i /><i /></div>
                    </div>
                    <div className="tag t3">
                      <span>Logical Thinking</span>
                      <div className="bars teal"><i /><i /><i /></div>
                    </div>
                  </div>
                </article>

                {/* Recommendations */}
                <article className="card reco">
                  <div className="card-head">
                    <h3>Recommend Activities</h3>
                    <p>Based on your lifestyle</p>
                  </div>
                  <ul className="reco-list">
                    <li><span className="dot" /><div><b>Yoga Practice</b><small>Calming Series</small></div></li>
                    <li><span className="dot" /><div><b>Focus Exercises</b><small>Training Series</small></div></li>
                    <li><span className="dot" /><div><b>Speed Reading</b><small>Training Series</small></div></li>
                    <li><span className="dot" /><div><b>Drawing</b><small>Creativity Series</small></div></li>
                  </ul>
                </article>

                {/* Recent Activities */}
                <article className="card table">
                  <div className="card-head">
                    <h3>Recent Activities</h3>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>No.</th><th>Date</th><th>Name</th><th>Hemisphere</th><th>∆</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>01</td><td>Jun 10, 2022</td><td>Reading</td><td>Right</td><td className="pos">+10%</td></tr>
                        <tr><td>02</td><td>Jun 08, 2022</td><td>Spatial Thinking</td><td>Left</td><td className="pos">+40%</td></tr>
                        <tr><td>03</td><td>Jun 08, 2022</td><td>Remote Work</td><td>Both</td><td className="neg">-20%</td></tr>
                      </tbody>
                    </table>
                  </div>
                </article>

                {/* Hemispheres gauge */}
                <article className="card gauge">
                  <div className="card-head">
                    <h3>The Hemispheres</h3>
                    <p>Reactions occurring</p>
                  </div>
                  <ul className="legend">
                    <li><span className="l l1" />Deja Vu</li>
                    <li><span className="l l2" />Deja Vecu</li>
                    <li><span className="l l3" />Deja Visite</li>
                  </ul>
                  <div className="g-wrap">
                    <svg viewBox="0 0 100 60" className="g-svg" aria-hidden="true">
                      <path d="M10,60 A40,40 0 0 1 90,60" fill="none" stroke="#1f2937" strokeWidth="10" strokeLinecap="round" />
                      <path d="M10,60 A40,40 0 0 1 70,20" fill="none" stroke="#34d399" strokeWidth="10" strokeLinecap="round" />
                      <path d="M70,20 A40,40 0 0 1 90,60" fill="none" stroke="#f472b6" strokeWidth="10" strokeLinecap="round" />
                    </svg>
                    <div className="g-label">
                      <div className="big">70%</div>
                      <div className="sub">over last month</div>
                    </div>
                  </div>
                </article>
              </section>

              {/* Conversation Map on dashboard */}
              <section className="conv-graph" style={{ marginTop: 24 }}>
                <div className="card-head"><h3>Conversation Graph</h3></div>
                <ConversationMap />
              </section>
            </>
          ) : (
            <section className="conv-layout">
              <section className="conv-graph">
                <div className="card-head"><h3>Conversation Graph</h3></div>
                <ConversationMap
                  ownerId={uid ?? undefined}
                  conversationId={selectedConversationId ?? undefined}
                  onConversationCreated={(id) => {
                    setSelectedConversationId(id)
                    // refresh list to include the newly created one at top
                    if (uid) {
                      listConversations(uid).then(setConversations).catch(() => {})
                    }
                  }}
                />
              </section>
              <aside className="conv-history">
                <div className="ch-head">Past conversations</div>
                <ul className="conv-list" aria-label="Past conversations list">
                  {conversations.map((c) => (
                    <li
                      key={c.id}
                      className={`conv-item${selectedConversationId === c.id ? ' active' : ''}`}
                      onClick={() => setSelectedConversationId(c.id)}
                    >
                      <b>{c.title}</b>
                      <small>{c.updatedAt ? c.updatedAt.toLocaleDateString() : ''}</small>
                    </li>
                  ))}
                  {conversations.length === 0 && <li className="conv-item"><b>No conversations yet</b><small>Start recording to create one</small></li>}
                </ul>
              </aside>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}


