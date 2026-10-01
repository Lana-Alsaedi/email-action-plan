import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const deleteEmail = (emailId) => {
    const confirmed = window.confirm(
      'Delete this email from Gmail?'
    )
    if (!confirmed) {
      return
    }
    fetch(`http://localhost:8000/gmail/${emailId}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Delete failed')
        }
        setEmails((currentEmails) =>
          currentEmails.filter((email) => email.id !== emailId)
        )
      })
      .catch((error) => {
        console.error('Delete failed:', error)
        setError('Could not delete email')
      })
  }
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
        setEmails(data.slice(0, 5))
        setLoading(false)
      })
      .catch((error) => {
        console.error('Refresh failed:', error)
        setError('Could not refresh emails')
        setLoading(false)
      })
  }

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

  const actionableEmails = emails.filter((email) => email.actionable)
  const informationalEmails = emails.filter((email) => !email.actionable)

  return (
    <main className="app">
      <header className="header">
        <div>
          <div className="title-row">
            <h1>Email → Action Plan</h1>
            <span className="email-count">{emails.length}</span>
          </div>
          <p className="header-subtitle">
            Your latest inbox activity
          </p>
        </div>
      </header>
      {error && <p className="error-message">{error}</p>}
      <section className="email-section">
        <div className="section-header">
          <div>
            <h2>Action needed</h2>
            <p>{actionableEmails.length} requiring attention</p>
          </div>
        </div>
        {actionableEmails.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            <p>No action needed right now</p>
          </div>
        ) : (
          <div className="email-list">
            {actionableEmails.map((email) => (
              <article
                className="email-card actionable-card"
                key={email.id}
              >
                <div className="card-top">
                  <div className="sender-info">
                    <span className="sender">
                      {email.sender || 'Unknown sender'}
                    </span>
                  </div>
                  <span className={`priority ${email.priority}`}>
                    {email.priority}
                  </span>
                </div>
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
                    <span>{email.deadline || 'None'}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <a
                    href={`https://mail.google.com/mail/u/0/#all/${email.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="card-action"
                  >
                    Open in Gmail
                  </a>

                  <button
                    className="card-action delete-action"
                    onClick={() => deleteEmail(email.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="email-section">
        <div className="section-header">
          <div>
            <h2>No action needed</h2>
            <p>{informationalEmails.length} informational</p>
          </div>
        </div>
        {informationalEmails.length === 0 ? (
          <div className="empty-state">
            <p>None</p>
          </div>
        ) : (
          <div className="email-list">
            {informationalEmails.map((email) => (
              <article
                className="email-card info-card"
                key={email.id}
              >
                <span className="sender">
                  {email.sender || 'Unknown sender'}
                </span>
                <h3 className="summary">
                  {email.summary || email.subject}
                </h3>
                <div className="card-actions">
                  <a
                    href={`https://mail.google.com/mail/u/0/#all/${email.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="card-action"
                  >
                    Open in Gmail
                  </a>
                  <button
                    className="card-action delete-action"
                    onClick={() => deleteEmail(email.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <button
        className="refresh-button"
        onClick={refreshEmails}
        disabled={loading}
      >
        {loading ? 'Refreshing...' : '↻ Refresh latest 5'}
      </button>
    </main>
  )
}

export default App