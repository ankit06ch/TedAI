import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  // Typewriter state
  const words = useMemo(() => {
    const list = [
      'medicine.',
      'psychology.',
      'science.',
      'education.',
      'innovation.',
    ]
    // Shuffle once per mount
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [])
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const handleHoverStart = useCallback(() => {
    const video = backgroundVideoRef.current
    if (video) video.playbackRate = 2
    setIsHovering(true)
    // Add hovered class to Ted GIF container
    const tedContainer = document.querySelector('.ted-gif-container') as HTMLElement
    if (tedContainer) {
      tedContainer.classList.add('hovered')
    }
  }, [])
  const handleHoverEnd = useCallback(() => {
    const video = backgroundVideoRef.current
    if (video) video.playbackRate = 1
    setIsHovering(false)
    // Remove hovered class from Ted GIF container
    const tedContainer = document.querySelector('.ted-gif-container') as HTMLElement
    if (tedContainer) {
      tedContainer.classList.remove('hovered')
    }
  }, [])
  
  // Add mouse enter/leave handlers to prevent hover loss
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleHoverStart()
  }, [handleHoverStart])
  
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleHoverEnd()
  }, [handleHoverEnd])
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

  // Typewriter effect
  useEffect(() => {
    if (words.length === 0) return
    const current = words[phraseIndex % words.length] ?? ''
    const isComplete = charIndex === current.length
    const isEmpty = charIndex === 0
    const baseDelay = isDeleting ? 50 : 120
    const nextDelay = (!isDeleting && isComplete) ? 2000 : (isDeleting && isEmpty) ? 500 : baseDelay
    const t = window.setTimeout(() => {
      if (!isDeleting && charIndex < current.length) {
        setCharIndex((v) => v + 1)
      } else if (!isDeleting && isComplete) {
        setIsDeleting(true)
      } else if (isDeleting && charIndex > 0) {
        setCharIndex((v) => v - 1)
      } else {
        setIsDeleting(false)
        setPhraseIndex((i) => (i + 1) % words.length)
      }
    }, nextDelay)
    return () => window.clearTimeout(t)
  }, [words, phraseIndex, charIndex, isDeleting])
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
    <div className={`app-stage ${currentUser ? 'authed' : 'guest'}${isHovering ? ' cta-hover' : ''}`}>
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
          <div className={`overlay${isModalOpen ? ' modal-open' : ''}`}>
            <img src="/3.png" alt="Ted.AI logo" className="logo" />
            {(() => {
              const current = words[phraseIndex % words.length] ?? ''
              const display = current.slice(0, charIndex)
              return (
                <div className="typewriter" aria-live="polite" aria-atomic="true">
                  <span className="tw-text">AI meets {display}</span>
                  <span className="tw-caret" aria-hidden="true"></span>
                </div>
              )
            })()}
            <button
              className="cta"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={openModal}
            >
              Launch
            </button>
          </div>
          {/* Ted gif in bottom left */}
          <div className="ted-gif-container">
            <img
              className="ted-gif"
              src="/ted.gif"
              alt="Ted animation"
            />
          </div>
          {/* Made with love text */}
          <div className="made-with-love">
            Made with ❤️ with students at Georgia Tech
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
        <Dashboard email={currentUser?.email ?? null} uid={currentUser?.uid ?? null} onSignOut={handleSignOut} />
      </section>
    </div>
  )
}


