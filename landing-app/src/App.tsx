import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from './firebase/config'
import Dashboard from './Dashboard'

export default function App(): React.JSX.Element {
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSignInMode, setIsSignInMode] = useState(true)
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const handleHoverStart = useCallback(() => {
    const video = backgroundVideoRef.current
    if (video) video.playbackRate = 2
  }, [])
  const handleHoverEnd = useCallback(() => {
    const video = backgroundVideoRef.current
    if (video) video.playbackRate = 1
  }, [])
  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])
  const toggleAuthMode = useCallback(() => setIsSignInMode((v) => !v), [])
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user))
    return unsubscribe
  }, [])
  const handleSignOut = useCallback(async () => {
    try { await signOut(auth) } catch (_) { /* ignore */ }
  }, [])
  useEffect(() => {
    const video = backgroundVideoRef.current
    if (!video) return
    if (showDashboard && !isTransitioning) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [showDashboard, isTransitioning])
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (isSignInMode) {
        await signInWithEmailAndPassword(auth, formEmail.trim(), formPassword)
      } else {
        await createUserWithEmailAndPassword(auth, formEmail.trim(), formPassword)
      }
      // accelerate video and start fade transition
      const video = backgroundVideoRef.current
      if (video) {
        try { video.playbackRate = 6 } catch (_) {}
      }
      setIsTransitioning(true)
      setIsModalOpen(false)
      setFormEmail('')
      setFormPassword('')
    } catch (err: unknown) {
      const fallback = isSignInMode ? 'Failed to sign in' : 'Failed to create account'
      const message = err instanceof Error ? err.message : fallback
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formEmail, formPassword, isSignInMode])

  // When auth becomes authed during transition, finish fade then reset
  useEffect(() => {
    if (currentUser && isTransitioning) {
      const timeout = setTimeout(() => {
        const video = backgroundVideoRef.current
        if (video) {
          try { video.playbackRate = 1 } catch (_) {}
        }
        setIsTransitioning(false)
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [currentUser, isTransitioning])
  return (
    <div className={`app-stage ${currentUser ? 'authed' : 'guest'}`}>
      <section className="landing-layer">
        <div className="page-root">
          <video
            className="bg-video"
            src="/hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            ref={backgroundVideoRef}
          />
          <div className="overlay">
            <h1 className="typewriter" aria-label="Ted.Ai"><span>Ted.Ai</span></h1>
            <button
              className="cta"
              onMouseEnter={handleHoverStart}
              onMouseLeave={handleHoverEnd}
              onClick={openModal}
            >
              Launch
            </button>
          </div>
          {/* Modal */}
          <div
            className={`modal-backdrop${isModalOpen ? ' show' : ''}`}
            onClick={closeModal}
            aria-hidden={!isModalOpen}
          />
          <aside
            className={`modal-panel${isModalOpen ? ' open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">{isSignInMode ? 'Sign in' : 'Create account'}</h2>
              <button className="modal-close" aria-label="Close" onClick={closeModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  autoComplete={isSignInMode ? 'current-password' : 'new-password'}
                  minLength={6}
                />
              </label>
              {submitError ? <div className="form-error" role="alert">{submitError}</div> : null}
              <button type="submit" className="primary" disabled={isSubmitting}>
                {isSubmitting ? (isSignInMode ? 'Signing in…' : 'Creating…') : (isSignInMode ? 'Sign in' : 'Create account')}
              </button>
              <div className="switch-line">
                {isSignInMode ? 'No account yet?' : 'Already have an account?'}{' '}
                <button type="button" className="link-button" onClick={toggleAuthMode}>
                  {isSignInMode ? 'Create one' : 'Sign in'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </section>
      <div className={`stage-fade${isTransitioning ? ' show' : ''}`} aria-hidden="true" />
      <section className="dashboard-layer">
        <Dashboard email={currentUser?.email ?? null} onSignOut={handleSignOut} />
      </section>
    </div>
  )
}


