import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const refreshEmails = () => {
    setLoading(true)
    setError('')
    fetch('http://localhost:8000/gmail')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Refresh failed')
        }
        return response.json()
      })
      .then((data) => {
        setEmails(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Refresh failed:', error)
        setError('Could not refresh emails')
        setLoading(false)
      })
  }

  // Load the latest emails when the popup opens
  useEffect(() => {
    fetch('http://localhost:8000/gmail')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Load failed')
        }
        return response.json()
      })
      .then((data) => {
        setEmails(data.slice(0, 5))
      })
      .catch((error) => {
        console.error('Initial load failed:', error)
        setError('Could not load emails')
      })
  }, [])

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Email → Action Plan</h1>
          <p className="header-subtitle">
            Latest emails from your inbox
          </p>
        </div>
        <span className="email-count">
          {emails.length}
        </span>
      </header>
      {error && <p className="error-message">{error}</p>}

      {/* Action needed */}
      <section>
        <h2>Action needed</h2>
        {emails.filter((email) => email.actionable).length === 0 ? (
          <p className="empty-message">
            No action needed right now
          </p>
        ) : (
          emails
            .filter((email) => email.actionable)
            .map((email) => (
              <article className="email-card actionable-card" key={email.id}>

                <div className="status-row">
                  <span className="status-label">
                    ACTION NEEDED
                  </span>
                  <span className="action-status yes">
                    YES
                  </span>
                </div>
                <p className="sender">
                  {email.sender || 'Unknown sender'}
                </p>
                <h3 className="summary">
                  {email.summary || email.subject}
                </h3>
                <div className="action-block">
                  <span className="detail-label">DO</span>
                  <p>{email.action}</p>
                </div>
                <div className="details-row">
                  <div className="detail">
                    <span className="detail-label">DEADLINE</span>
                    <span>
                      {email.deadline || 'None'}
                    </span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">PRIORITY</span>
                    <span className={`priority ${email.priority}`}>
                      {email.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </article>
            ))
        )}
      </section>

      {/* No action needed */}
      <section>
        <h2>No action needed</h2>
        {emails.filter((email) => !email.actionable).length === 0 ? (
          <p className="empty-message">
            None
          </p>
        ) : (
          emails
            .filter((email) => !email.actionable)
            .map((email) => (
              <article className="email-card info-card" key={email.id}>

                <div className="status-row">
                  <span className="status-label">
                    ACTION NEEDED
                  </span>
                  <span className="action-status no">
                    NO
                  </span>
                </div>
                <p className="sender">
                  {email.sender || 'Unknown sender'}
                </p>
                <h3 className="summary">
                  {email.summary || email.subject}
                </h3>
              </article>
            ))
        )}
      </section>
      <button
        className="refresh-button"
        onClick={refreshEmails}
        disabled={loading}
      >
        {loading ? 'Refreshing...' : '↻ Refresh latest 5 emails'}
      </button>
    </main>
  )
}

export default App