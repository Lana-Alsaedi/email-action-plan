import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [emails, setEmails] = useState([])

  // Get saved emails from our backend
  useEffect(() => {
    fetch('http://localhost:8000/emails')
      .then((response) => response.json())
      .then((data) => setEmails(data))
  }, [])

  // Main popup layout
  return (
    <main className="app">
      {/* Popup header */}
      <header className="header">
        <h1>Email → Action Plan</h1>
        <p>{emails.length} emails</p>
      </header>

      {/* Show the emails we need to act on */}
      <section>
        <h2>Today</h2>

        {emails
          .filter((email) => email.actionable)
          .map((email) => (
            <article className="email-card" key={email.id}>
              <div className="card-top">
                <span className={`priority ${email.priority}`}>
                  {email.priority.toUpperCase()}
                </span>
                <span>{email.deadline}</span>
              </div>

              <h3>{email.subject}</h3>
              <p>{email.action}</p>
            </article>
          ))}
      </section>

      {/* Show informational emails */}
      <section>
        <h2>FYI</h2>

        {emails
          .filter((email) => !email.actionable)
          .map((email) => (
            <article className="email-card" key={email.id}>
              <h3>{email.subject}</h3>
              <p>{email.reason}</p>
            </article>
          ))}
      </section>

      {/* Refresh button for later */}
      <button className="refresh-button">
        ↻ Refresh emails
      </button>
    </main>
  )
}

export default App