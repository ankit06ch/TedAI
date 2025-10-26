import React, { useEffect, useRef, useState } from 'react'
import { Download, User } from 'lucide-react'
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

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
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      if (!isUserMenuOpen) return
      const target = e.target as Node | null
      if (userMenuRef.current && target && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false)
      }
    }
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [isUserMenuOpen])

  return (
    <div className="dashboard">
      <div className="dash-shell">
        <main className="main">
          {activeView === 'dashboard' ? (
            <>
              <header className="topbar">
                <div className="welcome-area">
                  <h2 className="welcome-title">Welcome, Ankit.</h2>
                  <span className="role-badge">Pediatric Psychologist</span>
                </div>
                <div className="actions">
                  <button className="icon-btn" aria-label="Download"><Download size={18} /></button>
                  <div className={`user-menu${isUserMenuOpen ? ' open' : ''}`} ref={userMenuRef}>
                    <button
                      className="icon-btn"
                      aria-label="User menu"
                      aria-haspopup="menu"
                      aria-expanded={isUserMenuOpen}
                      onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen((v) => !v) }}
                    >
                      <User size={18} />
                    </button>
                    <div className="user-menu-popover" role="menu" aria-hidden={!isUserMenuOpen}>
                      <div className="user-menu-head">
                        <div className="user-avatar" aria-hidden="true">{(email?.[0] ?? 'U').toUpperCase()}</div>
                        <div className="user-ident">
                          <b>{email ?? 'User'}</b>
                          <small>Profile</small>
                        </div>
                      </div>
                      <button className="user-menu-item" role="menuitem" onClick={() => { /* reserved for profile navigation */ setIsUserMenuOpen(false) }}>Profile</button>
                      <button className="user-menu-item danger" role="menuitem" onClick={() => { setIsUserMenuOpen(false); onSignOut() }}>Sign out</button>
                    </div>
                  </div>
                </div>
              </header>
              <section className="four-grid">
                <aside className="card rt-panel">
                  <div className="card-head"><h3>Recorded Transcript</h3></div>
                  <div className="rt-body">
                    {/* Content goes here */}
                  </div>
                </aside>

                <div className="card center-image">
                  <img src="/2.png" alt="Center visual" />
                </div>

                <section className="card insights">
                  <div className="card-head duo"><h3>Insights</h3><span className="role-badge">Powered by AI</span></div>
                  <div className="insights-body">
                    {/* Content goes here */}
                  </div>
                </section>

                <section className="card sentiment">
                  <div className="card-head"><h3>Sentiment Analysis</h3></div>
                  <div className="sentiment-body">
                    {/* Content goes here */}
                  </div>
                </section>
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


