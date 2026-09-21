import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  return (
    <main className="app">
      <header className="header">
        <h1>Email → Action Plan</h1>
        <p>5 emails · 1 action</p>
      </header>
      <section>
        <h2>Today</h2>
        <article className="email-card">
          <div className="card-top">
            <span className="priority high">HIGH</span>
            <span>Sep 30</span>
          </div>
          <h3>UC Berkeley Homecoming</h3>
          <p>Activate your ticket and register when registration opens.</p>
        </article>
      </section>
      <section>
        <h2>Waiting on</h2>
        <article className="email-card">
          <h3>No emails yet</h3>
          <p>Emails you're waiting for will appear here.</p>
        </article>
      </section>
      <section>
        <h2>FYI</h2>
        <article className="email-card">
          <h3>LinkedIn recommendation</h3>
          <p>Informational email with no action required.</p>
        </article>
      </section>
      <button className="refresh-button">↻ Refresh emails</button>
    </main>
  )
}
export default App