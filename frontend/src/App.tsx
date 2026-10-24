import { useEffect, useState } from 'react'
import './App.css'

type Email = {
  id: string
  sender: string
  subject: string
  actionable: boolean
  summary: string
  body: string
  action: string
  deadline: string | null
  priority: string
}

type ReplyQuestion = {
  id: string
  question: string
  type: 'multiple_choice' | 'short_answer'
  required: boolean
  options: string[]
  allow_custom_answer: boolean
}

function App() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [activeReplyEmail, setActiveReplyEmail] = useState<string | null>(null)
  const [replyQuestions, setReplyQuestions] = useState<ReplyQuestion[]>([])
  const [replyAnswers, setReplyAnswers] = useState<Record<string, string>>({})
  const [replySelections, setReplySelections] = useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [generatedReply, setGeneratedReply] = useState('')
  const [generateReplyLoading, setGenerateReplyLoading] = useState(false)

  const [draftSaving, setDraftSaving] = useState(false)
  const [draftSaveError, setDraftSaveError] = useState('')
  const [draftThreadId, setDraftThreadId] = useState('')
  const [draftMessageId, setDraftMessageId] = useState('')

  // Ask Claude what information is needed for a reply
  const draftReply = (email: Email) => {
    setActiveReplyEmail(email.id)
    setReplyQuestions([])
    setReplyAnswers({})
    setReplySelections({})
    setReplyError('')
    setGeneratedReply('')
    setDraftSaveError('')
    setDraftThreadId('')
    setReplyLoading(true)

    fetch('http://localhost:8000/reply/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: email.subject,
        sender: email.sender,
        body: email.body,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Question request failed')
        }

        return response.json()
      })
      .then((data: { questions: ReplyQuestion[] }) => {
        setReplyQuestions(data.questions)
      })
      .catch((error) => {
        console.error('Could not generate reply questions:', error)
        setReplyError('Could not load reply questions. Please try again.')
      })
      .finally(() => {
        setReplyLoading(false)
      })
  }

  // Save a typed answer
  const updateReplyAnswer = (questionId: string, answer: string) => {
    setReplyAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer,
    }))
  }

  // Save a selected option
  const updateReplySelection = (questionId: string, option: string) => {
    setReplySelections((currentSelections) => ({
      ...currentSelections,
      [questionId]: option,
    }))
  }

  // Close the questionnaire and clear its answers
  const closeReply = () => {
    setActiveReplyEmail(null)
    setReplyQuestions([])
    setReplyAnswers({})
    setReplySelections({})
    setReplyError('')
    setGeneratedReply('')
    setGenerateReplyLoading(false)
    setDraftSaving(false)
    setDraftSaveError('')
    setDraftThreadId('')
  }

  // Generate the reply using Claude
  const generateReply = async (email: Email) => {
    const missingAnswer = replyQuestions.some((question) => {
      if (!question.required) {
        return false
      }

      return !(
        replyAnswers[question.id]?.trim() ||
        replySelections[question.id]?.trim()
      )
    })

    if (missingAnswer) {
      setReplyError('Please answer all required questions.')
      return
    }

    setReplyError('')
    setGeneratedReply('')
    setDraftSaveError('')
    setDraftThreadId('')
    setGenerateReplyLoading(true)

    const answers: Record<string, string> = {}

    replyQuestions.forEach((question) => {
      const selected = replySelections[question.id]?.trim()
      const custom = replyAnswers[question.id]?.trim()

      answers[question.id] = [
        selected,
        custom ? `Additional details: ${custom}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    })

    try {
      const response = await fetch('http://localhost:8000/reply/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: email.subject,
          sender: email.sender,
          body: email.body,
          answers,
        }),
      })

      if (!response.ok) {
        const details = await response.text()
        console.error('Reply generation failed:', details)
        throw new Error('Could not generate the reply. Please try again.')
      }

      const data: { reply: string } = await response.json()

      if (!data.reply?.trim()) {
        throw new Error('Claude returned an empty reply. Please try again.')
      }

      setGeneratedReply(data.reply)
    } catch (error) {
      console.error('Could not generate reply:', error)
      setReplyError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while generating the reply.'
      )
    } finally {
      setGenerateReplyLoading(false)
    }
  }

  // Save the generated reply to Gmail Drafts
  const saveReplyDraft = async (email: Email) => {
    if (!generatedReply.trim()) {
      setDraftSaveError('Generate a reply before saving it.')
      return
    }

    setDraftSaving(true)
    setDraftSaveError('')
    setDraftThreadId('')

    try {
      const response = await fetch('http://localhost:8000/reply/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_id: email.id,
          reply: generatedReply,
        }),
      })

      const data: {
        success?: boolean
        error?: string
        thread_id?: string
        message_id?: string
      } = await response.json()

      if (
        !response.ok ||
        !data.success ||
        !data.thread_id ||
        !data.message_id
      ) {
        throw new Error(data.error || 'Could not save the Gmail draft.')
      }

      setDraftThreadId(data.thread_id)
      setDraftMessageId(data.message_id)
    } catch (error) {
      console.error('Could not save Gmail draft:', error)
      setDraftSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save the Gmail draft.'
      )
    } finally {
      setDraftSaving(false)
    }
  }

  // Display the questionnaire for either email section
  const renderReplyQuestionnaire = (email: Email) => {
    if (activeReplyEmail !== email.id) {
      return null
    }

    return (
      <div className="reply-questionnaire">
        <h3>Let's prepare your reply</h3>

        <p>
          Answer a few quick questions so your reply reflects your situation.
        </p>

        {replyLoading && (
          <p>Figuring out what information is needed...</p>
        )}

        {replyError && (
          <p className="error-message">{replyError}</p>
        )}

        {!replyLoading && !replyError && replyQuestions.length === 0 && (
          <p>
            No additional information is needed. You can generate your reply
            below.
          </p>
        )}

        {!replyLoading && !replyError && replyQuestions.length > 0 && (
          <div className="reply-questions">
            {replyQuestions.map((question) => (
              <div className="reply-question" key={question.id}>
                <label>
                  <span>
                    {question.question}
                    {question.required ? ' *' : ''}
                  </span>
                </label>

                {question.type === 'multiple_choice' && (
                  <div className="reply-options">
                    {question.options.map((option) => (
                      <label className="reply-option" key={option}>
                        <input
                          type="radio"
                          name={`${email.id}-${question.id}`}
                          value={option}
                          checked={replySelections[question.id] === option}
                          onChange={() =>
                            updateReplySelection(question.id, option)
                          }
                        />

                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'short_answer' && (
                  <textarea
                    value={replyAnswers[question.id] || ''}
                    onChange={(event) =>
                      updateReplyAnswer(question.id, event.target.value)
                    }
                    rows={2}
                    placeholder="Type a short answer..."
                  />
                )}

                {question.type === 'multiple_choice' &&
                  question.allow_custom_answer && (
                    <textarea
                      value={replyAnswers[question.id] || ''}
                      onChange={(event) =>
                        updateReplyAnswer(question.id, event.target.value)
                      }
                      rows={2}
                      placeholder="Optional: Add a different answer or clarification..."
                    />
                  )}
              </div>
            ))}

            <p className="questionnaire-note">* Required information</p>
          </div>
        )}

        <div className="card-actions">
          <button
            className="card-action"
            onClick={closeReply}
            disabled={generateReplyLoading || draftSaving}
          >
            Close
          </button>

          <button
            className="card-action"
            disabled={
              replyLoading ||
              generateReplyLoading ||
              !!replyError ||
              draftSaving
            }
            onClick={() => generateReply(email)}
          >
            {generateReplyLoading ? 'Generating Reply...' : 'Generate Reply'}
          </button>
        </div>

        {generatedReply && (
          <div className="reply-preview">
            <h3>Generated Reply</h3>

            <textarea
              value={generatedReply}
              onChange={(event) => {
                setGeneratedReply(event.target.value)
                setDraftThreadId('')
                setDraftMessageId('')
                setDraftSaveError('')
              }}
              rows={10}
              aria-label="Edit generated email reply"
            />

            <p>
              Review your reply, then save it to Gmail Drafts.
            </p>

            {draftSaveError && (
              <p className="error-message">{draftSaveError}</p>
            )}

            {draftThreadId ? (
              <div>
                <p>✓ Reply saved to Gmail Drafts.</p>

                <a
                  className="card-action"
                  href={`https://mail.google.com/mail/u/0/#drafts/${encodeURIComponent(draftMessageId)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open conversation in Gmail
                </a>
              </div>
            ) : (
              <button
                className="save-draft-button"
                onClick={() => saveReplyDraft(email)}
                disabled={draftSaving}
              >
                {draftSaving ? 'Saving Draft...' : 'Save to Gmail Drafts'}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Delete an email from Gmail
  const deleteEmail = (emailId: string) => {
    const confirmed = window.confirm('Delete this email from Gmail?')

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

        if (activeReplyEmail === emailId) {
          closeReply()
        }
      })
      .catch((error) => {
        console.error('Delete failed:', error)
        setError('Could not delete email')
      })
  }

  // Refresh the latest emails
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
      .then((data: Email[]) => {
        setEmails(data.slice(0, 5))
      })
      .catch((error) => {
        console.error('Refresh failed:', error)
        setError('Could not refresh emails')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Load emails when the app opens
  useEffect(() => {
    fetch('http://localhost:8000/gmail')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Load failed')
        }

        return response.json()
      })
      .then((data: Email[]) => {
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

          <p className="header-subtitle">Your latest inbox activity</p>
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
                    className="card-action"
                    onClick={() => draftReply(email)}
                    disabled={replyLoading && activeReplyEmail === email.id}
                  >
                    {replyLoading && activeReplyEmail === email.id
                      ? 'Preparing...'
                      : 'Draft Reply'}
                  </button>

                  <button
                    className="card-action delete-action"
                    onClick={() => deleteEmail(email.id)}
                  >
                    Delete
                  </button>
                </div>

                {renderReplyQuestionnaire(email)}
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
              <article className="email-card info-card" key={email.id}>
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
                    className="card-action"
                    onClick={() => draftReply(email)}
                    disabled={replyLoading && activeReplyEmail === email.id}
                  >
                    {replyLoading && activeReplyEmail === email.id
                      ? 'Preparing...'
                      : 'Draft Reply'}
                  </button>

                  <button
                    className="card-action delete-action"
                    onClick={() => deleteEmail(email.id)}
                  >
                    Delete
                  </button>
                </div>

                {renderReplyQuestionnaire(email)}
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