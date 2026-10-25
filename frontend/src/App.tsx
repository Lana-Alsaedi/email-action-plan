import { useEffect, useState } from 'react'
import type { SVGProps, ReactNode } from 'react'
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

type IconName =
  | 'sparkles'
  | 'refresh'
  | 'inbox'
  | 'check'
  | 'clock'
  | 'arrow-up-right'
  | 'mail'
  | 'trash'
  | 'reply'
  | 'close'
  | 'send'
  | 'file'
  | 'calendar'
  | 'alert'
  | 'chevron'
  | 'edit'
  | 'loader'
  | 'check-circle'
  | 'clipboard'
  | 'arrow-right'
  | 'shield'
  | 'message'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  size?: number
}

const API_URL = 'http://localhost:8000'

// Keep icons lightweight without adding another package
function Icon({ name, size = 18, ...props }: IconProps) {
  const paths: Record<IconName, ReactNode> = {
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.9-3L4 10" />
        <path d="M4 5v5h5" />
        <path d="M4 13a8 8 0 0 0 14.9 3L20 14" />
        <path d="M20 19v-5h-5" />
      </>
    ),
    inbox: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 13h5l2 3h4l2-3h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    'arrow-up-right': (
      <>
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 10v6M14 10v6" />
      </>
    ),
    reply: (
      <>
        <path d="m9 17-5-5 5-5" />
        <path d="M4 12h10a6 6 0 0 1 6 6" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z" />
      </>
    ),
    loader: (
      <>
        <path d="M21 12a9 9 0 0 1-9 9" />
        <path d="M3 12a9 9 0 0 1 9-9" />
      </>
    ),
    'check-circle': (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" />
      </>
    ),
    'arrow-right': (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    message: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

function InboxLogo() {
  return (
    <svg
      className="inbox-logo"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 12.5V23a2.5 2.5 0 0 0 2.5 2.5h18a2.5 2.5 0 0 0 2.5-2.5V12.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m5 12 11 8 7-5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 12.5 11 8"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M22 4.5c.5 2.1 1.4 3 3.5 3.5-2.1.5-3 1.4-3.5 3.5-.5-2.1-1.4-3-3.5-3.5 2.1-.5 3-1.4 3.5-3.5Z"
        fill="#8CEBFF"
        stroke="#8CEBFF"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <circle cx="27.5" cy="13" r="1" fill="#8CEBFF" />
    </svg>
  )
}

function App() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeReplyEmail, setActiveReplyEmail] = useState<Email | null>(null)
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

  const [refreshing, setRefreshing] = useState(false)

  // Keep the inbox list up to date
  async function refreshEmails() {
    setRefreshing(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/gmail`)

      if (!response.ok) {
        throw new Error('Unable to load emails. Please try again.')
      }

      const data = await response.json()
      setEmails(Array.isArray(data) ? data.slice(0, 5) : [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the email service.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void refreshEmails()
  }, [])

  // Get the questions needed to prepare a reply
  async function draftReply(email: Email) {
    setActiveReplyEmail(email)
    setReplyQuestions([])
    setReplyAnswers({})
    setReplySelections({})
    setReplyError('')
    setGeneratedReply('')
    setDraftSaveError('')
    setDraftThreadId('')
    setDraftMessageId('')
    setReplyLoading(true)

    try {
      const response = await fetch(`${API_URL}/reply/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          sender: email.sender,
          body: email.body,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not prepare reply questions.')
      }

      setReplyQuestions(data.questions || [])
    } catch (err) {
      setReplyError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while preparing your reply.',
      )
    } finally {
      setReplyLoading(false)
    }
  }

  function updateReplyAnswer(questionId: string, answer: string) {
    setReplyAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }))
  }

  function updateReplySelection(questionId: string, selection: string) {
    setReplySelections((previous) => ({
      ...previous,
      [questionId]: selection,
    }))
  }

  function closeReply() {
    setActiveReplyEmail(null)
    setReplyQuestions([])
    setReplyAnswers({})
    setReplySelections({})
    setReplyError('')
    setGeneratedReply('')
    setDraftSaveError('')
    setDraftThreadId('')
    setDraftMessageId('')
  }

  // Turn the answers into a personalized reply
  async function generateReply(email: Email) {
    const missingAnswer = replyQuestions.some((question) => {
      if (!question.required) return false

      if (question.type === 'multiple_choice') {
        return !(
          replySelections[question.id] ||
          replyAnswers[question.id]?.trim()
        )
      }

      return !replyAnswers[question.id]?.trim()
    })

    if (missingAnswer) {
      setReplyError('Please answer each required question before continuing.')
      return
    }

    const answers = replyQuestions.map((question) => {
      if (question.type === 'multiple_choice') {
        const selected = replySelections[question.id] || ''
        const custom = replyAnswers[question.id]?.trim() || ''

        return {
          question: question.question,
          answer: [selected, custom ? `Additional details: ${custom}` : '']
            .filter(Boolean)
            .join('\n'),
        }
      }

      return {
        question: question.question,
        answer: replyAnswers[question.id]?.trim() || '',
      }
    })

    setGenerateReplyLoading(true)
    setReplyError('')
    setDraftSaveError('')

    try {
      const response = await fetch(`${API_URL}/reply/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          sender: email.sender,
          body: email.body,
          answers,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not generate the reply.')
      }

      if (!data.reply) {
        throw new Error('The reply service returned an empty response.')
      }

      setGeneratedReply(data.reply)
    } catch (err) {
      setReplyError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while generating your reply.',
      )
    } finally {
      setGenerateReplyLoading(false)
    }
  }

  // Save the edited reply as a Gmail draft
  async function saveReplyDraft(email: Email) {
    if (!generatedReply.trim()) {
      setDraftSaveError('Write a reply before saving your draft.')
      return
    }

    setDraftSaving(true)
    setDraftSaveError('')

    try {
      const response = await fetch(`${API_URL}/reply/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_id: email.id,
          reply: generatedReply,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(data.detail || data.error || 'Could not save the draft.')
      }

      setDraftThreadId(data.thread_id || '')
      setDraftMessageId(data.message_id || '')
    } catch (err) {
      setDraftSaveError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving the draft.',
      )
    } finally {
      setDraftSaving(false)
    }
  }

  // Remove an email after the backend confirms deletion
  async function deleteEmail(emailId: string) {
    const confirmed = window.confirm(
      'Remove this email from your action plan?',
    )

    if (!confirmed) return

    try {
      const response = await fetch(`${API_URL}/gmail/${emailId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Could not delete this email.')
      }

      setEmails((previous) =>
        previous.filter((email) => email.id !== emailId),
      )

      if (activeReplyEmail?.id === emailId) {
        closeReply()
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while deleting the email.',
      )
    }
  }

  const actionableEmails = emails.filter((email) => email.actionable)
  const informationalEmails = emails.filter((email) => !email.actionable)

  function renderReplyQuestionnaire(email: Email) {
    if (activeReplyEmail?.id !== email.id) return null

    const answeredCount = replyQuestions.filter((question) => {
      if (question.type === 'multiple_choice') {
        return Boolean(
          replySelections[question.id] ||
            replyAnswers[question.id]?.trim(),
        )
      }

      return Boolean(replyAnswers[question.id]?.trim())
    }).length

    const allRequiredAnswered = replyQuestions.every((question) => {
      if (!question.required) return true

      if (question.type === 'multiple_choice') {
        return Boolean(
          replySelections[question.id] ||
            replyAnswers[question.id]?.trim(),
        )
      }

      return Boolean(replyAnswers[question.id]?.trim())
    })

    return (
      <div className="reply-workspace">
        <div className="reply-workspace-header">
          <div className="reply-workspace-icon">
            <Icon name="sparkles" size={20} />
          </div>

          <div className="reply-workspace-heading">
            <span className="eyebrow">AI REPLY ASSISTANT</span>
            <h3>Let's prepare your reply</h3>
            <p>A few quick details will help personalize your response.</p>
          </div>

          <button
            className="icon-button close-workspace"
            type="button"
            onClick={closeReply}
            aria-label="Close reply assistant"
            title="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="reply-steps">
          <div className="reply-step active">
            <span className="step-number">1</span>
            <span>Personalize</span>
          </div>

          <span className="step-connector" />

          <div className={`reply-step ${generatedReply ? 'complete' : ''}`}>
            <span className="step-number">
              {generatedReply ? <Icon name="check" size={13} /> : '2'}
            </span>
            <span>Review reply</span>
          </div>
        </div>

        {replyLoading ? (
          <div className="workflow-loading">
            <span className="loading-spinner" />
            <div>
              <strong>Preparing your questions</strong>
              <p>Getting the details needed for a thoughtful reply.</p>
            </div>
          </div>
        ) : replyError && replyQuestions.length === 0 ? (
          <div className="inline-error" role="alert">
            <Icon name="alert" size={18} />
            <span>{replyError}</span>
          </div>
        ) : (
          <>
            {!generatedReply && replyQuestions.length > 0 && (
              <div className="question-progress">
                <span>
                  Your details{' '}
                  <strong>
                    {answeredCount} of {replyQuestions.length}
                  </strong>
                </span>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Reply questions answered"
                  aria-valuemin={0}
                  aria-valuemax={replyQuestions.length}
                  aria-valuenow={answeredCount}
                >
                  <span
                    style={{
                      width: `${
                        (answeredCount / replyQuestions.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {!generatedReply && replyQuestions.length === 0 && !replyLoading && (
              <div className="empty-questions">
                <Icon name="message" size={22} />
                <p>No additional questions are needed for this email.</p>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => void generateReply(email)}
                  disabled={generateReplyLoading}
                >
                  <Icon name="sparkles" size={16} />
                  Generate reply
                </button>
              </div>
            )}

            {!generatedReply &&
              replyQuestions.map((question, index) => (
                <div className="reply-question" key={question.id}>
                  <label className="question-label">
                    <span className="question-number">{index + 1}</span>

                    <span>
                      {question.question}
                      {question.required && (
                        <span className="required-mark"> *</span>
                      )}
                    </span>
                  </label>

                  {question.type === 'multiple_choice' ? (
                    <div className="choice-list">
                      {question.options.map((option) => (
                        <label
                          className={`choice-option ${
                            replySelections[question.id] === option
                              ? 'selected'
                              : ''
                          }`}
                          key={option}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={replySelections[question.id] === option}
                            onChange={() => {
                              updateReplySelection(question.id, option)
                              setReplyError('')
                            }}
                          />

                          <span className="custom-radio" />
                          <span>{option}</span>
                        </label>
                      ))}

                      {question.allow_custom_answer && (
                        <textarea
                          className="custom-answer"
                          placeholder="Add context or other details (optional)"
                          value={replyAnswers[question.id] || ''}
                          onChange={(event) =>
                            updateReplyAnswer(question.id, event.target.value)
                          }
                          rows={2}
                        />
                      )}
                    </div>
                  ) : (
                    <textarea
                      className="answer-input"
                      placeholder="Type your answer..."
                      value={replyAnswers[question.id] || ''}
                      onChange={(event) => {
                        updateReplyAnswer(question.id, event.target.value)
                        setReplyError('')
                      }}
                      rows={3}
                    />
                  )}
                </div>
              ))}

            {replyError && (
              <div className="inline-error" role="alert">
                <Icon name="alert" size={17} />
                <span>{replyError}</span>
              </div>
            )}

            {!generatedReply && replyQuestions.length > 0 && (
              <div className="workflow-footer">
                <p className="required-note">* Required to continue</p>

                <div className="workflow-actions">
                  <button
                    className="button button-quiet"
                    type="button"
                    onClick={closeReply}
                  >
                    Cancel
                  </button>

                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => void generateReply(email)}
                    disabled={
                      generateReplyLoading ||
                      !allRequiredAnswered
                    }
                  >
                    {generateReplyLoading ? (
                      <>
                        <span className="button-spinner" />
                        Writing...
                      </>
                    ) : (
                      <>
                        <Icon name="sparkles" size={16} />
                        Generate reply
                        <Icon name="arrow-right" size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {generatedReply && (
          <div className="generated-reply">
            <div className="generated-reply-heading">
              <div>
                <span className="eyebrow">READY FOR YOUR REVIEW</span>
                <h4>
                  <Icon name="check-circle" size={19} />
                  Your reply is ready
                </h4>
              </div>

              <span className="editable-badge">
                <Icon name="edit" size={13} />
                Editable
              </span>
            </div>

            <div className="reply-recipient">
              <span>To</span>
              <strong>{email.sender}</strong>
            </div>

            <div className="reply-subject">
              <span>Subject</span>
              <strong>
                {email.subject.toLowerCase().startsWith('re:')
                  ? email.subject
                  : `Re: ${email.subject}`}
              </strong>
            </div>

            <label className="editor-label" htmlFor={`reply-${email.id}`}>
              Message
            </label>

            <textarea
              id={`reply-${email.id}`}
              className="generated-reply-editor"
              value={generatedReply}
              onChange={(event) => {
                setGeneratedReply(event.target.value)
                setDraftThreadId('')
                setDraftMessageId('')
                setDraftSaveError('')
              }}
              rows={10}
              spellCheck
            />

            <p className="editor-hint">
              Review the message and make any changes before saving it to Gmail.
            </p>

            {draftSaveError && (
              <div className="inline-error" role="alert">
                <Icon name="alert" size={17} />
                <span>{draftSaveError}</span>
              </div>
            )}

            {draftMessageId ? (
              <div className="draft-success" role="status">
                <div className="success-icon">
                  <Icon name="check" size={17} />
                </div>

                <div className="draft-success-copy">
                  <strong>Draft saved</strong>
                  <p>Your reply is in Gmail Drafts.</p>
                </div>

                <a
                  className="button button-primary gmail-draft-link"
                  href={`https://mail.google.com/mail/u/0/#drafts/${encodeURIComponent(
                    draftMessageId,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open draft
                  <Icon name="arrow-up-right" size={15} />
                </a>
              </div>
            ) : (
              <div className="editor-actions">
                <button
                  className="button button-secondary back-to-questions-button"
                  type="button"
                  onClick={() => {
                    setGeneratedReply('')
                    setDraftSaveError('')
                  }}
                >
                  Back to questions
                </button>

                <button
                  className="button button-primary save-draft-button"
                  type="button"
                  onClick={() => void saveReplyDraft(email)}
                  disabled={draftSaving || !generatedReply.trim()}
                >
                  {draftSaving ? (
                    <>
                      <span className="button-spinner" />
                      Saving draft...
                    </>
                  ) : (
                    <>
                      <Icon name="file" size={16} />
                      Save draft
                      <Icon name="arrow-right" size={15} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {draftThreadId && draftMessageId && (
          <span className="sr-only">
            Draft thread: {draftThreadId}
          </span>
        )}
      </div>
    )
  }

  function renderEmailCard(email: Email, actionable: boolean) {
    const isReplyOpen = activeReplyEmail?.id === email.id

    return (
      <article
        className={`email-card ${actionable ? 'actionable-card' : 'informational-card'} ${
          isReplyOpen ? 'email-card-expanded' : ''
        }`}
        key={email.id}
      >
        <div className="email-card-top">
          <div className="sender-avatar" aria-hidden="true">
            {(email.sender.trim()[0] || '?').toUpperCase()}
          </div>

          <div className="sender-details">
            <span className="sender-name">{email.sender}</span>
            <span className="email-subject">{email.subject}</span>
          </div>

          {actionable ? (
            <span
              className={`priority-badge priority-${email.priority.toLowerCase()}`}
            >
              <span className="priority-dot" />
              {email.priority}
            </span>
          ) : (
            <span className="informational-badge">
              <Icon name="check-circle" size={14} />
              All set
            </span>
          )}
        </div>

        <div className="email-card-content">
          <h3>{email.summary || email.subject}</h3>

          {actionable && email.action && (
            <div className="action-summary">
              <div className="action-summary-icon">
                <Icon name="alert" size={17} />
              </div>

              <div className="action-summary-copy">
                <span className="eyebrow">NEXT BEST ACTION</span>
                <p>{email.action}</p>
              </div>
            </div>
          )}

          {email.deadline && (
            <div className="deadline-row">
              <Icon name="calendar" size={16} />
              <span>Deadline</span>
              <strong>{email.deadline}</strong>
            </div>
          )}
        </div>

        <div className="email-card-actions">
          <a
            className="button button-secondary"
            href={`https://mail.google.com/mail/u/0/#all/${encodeURIComponent(
              email.id,
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="arrow-up-right" size={16} />
            Open email
          </a>

          <button
            className={`button ${
              isReplyOpen ? 'button-active' : 'button-primary'
            } reply-button`}
            type="button"
            onClick={() => {
              if (isReplyOpen) {
                closeReply()
              } else {
                void draftReply(email)
              }
            }}
          >
            {isReplyOpen ? (
              <>
                <Icon name="close" size={16} />
                Close assistant
              </>
            ) : (
              <>
                <Icon name="reply" size={16} />
                Draft reply
              </>
            )}
          </button>

          <button
            className="icon-button delete-button"
            type="button"
            onClick={() => void deleteEmail(email.id)}
            aria-label={`Remove email from action plan: ${email.subject}`}
            title="Remove from action plan"
          >
            <Icon name="trash" size={17} />
          </button>
        </div>

        {renderReplyQuestionnaire(email)}
      </article>
    )
  }

  return (
    <main className="app">
      <header className="app-header">
        <div className="brand-row">
          <div className="brand-mark">
            <InboxLogo />
          </div>

          <div className="brand-copy">
            <span className="brand-name">InboxPilot</span>
            <span className="brand-caption">Your inbox, made actionable.</span>
          </div>

          <button
            className={`icon-button refresh-icon ${
              refreshing ? 'is-refreshing' : ''
            }`}
            type="button"
            onClick={() => void refreshEmails()}
            disabled={refreshing}
            aria-label="Refresh emails"
            title="Refresh emails"
          >
            <Icon name="refresh" size={19} />
          </button>
        </div>
      </header>

      <section className="overview" aria-label="Inbox overview">
        <div className="overview-heading">
          <div>
            <h2>Inbox overview</h2>
            {loading && <p>Checking your latest messages...</p>}
          </div>

          <span className="live-indicator">
            <span />
            {loading ? 'Connecting' : 'Inbox'}
          </span>
        </div>

        <div className="overview-grid">
          <div className="overview-card overview-card-primary">
            <div className="overview-card-top">
              <span className="overview-icon">
                <Icon name="alert" size={19} />
              </span>
              <span className="overview-card-label">Action needed</span>
            </div>

            <strong className="overview-number">
              {loading ? '—' : actionableEmails.length}
            </strong>

            <span className="overview-card-caption">
              {actionableEmails.length === 1
                ? 'email needs your attention'
                : 'emails need your attention'}
            </span>
          </div>

          <div className="overview-card">
            <div className="overview-card-top">
              <span className="overview-icon overview-icon-green">
                <Icon name="check-circle" size={19} />
              </span>
              <span className="overview-card-label">In the clear</span>
            </div>

            <strong className="overview-number">
              {loading ? '—' : informationalEmails.length}
            </strong>

            <span className="overview-card-caption">
              {informationalEmails.length === 1
                ? 'email, no action needed'
                : 'emails, no action needed'}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <div className="error-banner-icon">
            <Icon name="alert" size={19} />
          </div>

          <div className="error-banner-copy">
            <strong>Couldn't update your inbox</strong>
            <p>{error}</p>
          </div>

          <button
            className="button button-secondary error-retry"
            type="button"
            onClick={() => void refreshEmails()}
            disabled={refreshing}
          >
            Try again
          </button>
        </div>
      )}

      <div className="email-content">
        <section className="email-section">
          <div className="section-heading">
            <div className="section-heading-icon section-icon-action">
              <Icon name="alert" size={19} />
            </div>

            <div className="section-heading-copy">
              <h2>Action needed</h2>
              <p>Start here to keep things moving.</p>
            </div>

            <span className="section-count action-count">
              {actionableEmails.length}
            </span>
          </div>

          {loading ? (
            <div className="loading-card">
              <span className="loading-spinner" />
              <span>Finding your latest emails...</span>
            </div>
          ) : actionableEmails.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon empty-state-icon-green">
                <Icon name="check-circle" size={26} />
              </div>

              <h3>You're all caught up</h3>
              <p>No emails currently need an action. Enjoy the breathing room.</p>
            </div>
          ) : (
            <div className="email-list">
              {actionableEmails.map((email) =>
                renderEmailCard(email, true),
              )}
            </div>
          )}
        </section>

        <section className="email-section informational-section">
          <div className="section-heading">
            <div className="section-heading-icon section-icon-info">
              <Icon name="inbox" size={19} />
            </div>

            <div className="section-heading-copy">
              <h2>No action needed</h2>
              <p>Useful updates, without the extra work.</p>
            </div>

            <span className="section-count info-count">
              {informationalEmails.length}
            </span>
          </div>

          {loading ? (
            <div className="loading-card">
              <span className="loading-spinner" />
              <span>Sorting your inbox...</span>
            </div>
          ) : informationalEmails.length === 0 ? (
            <div className="empty-state empty-state-compact">
              <div className="empty-state-icon">
                <Icon name="inbox" size={24} />
              </div>

              <h3>Nothing else to show</h3>
              <p>Informational emails will appear here.</p>
            </div>
          ) : (
            <div className="email-list">
              {informationalEmails.map((email) =>
                renderEmailCard(email, false),
              )}
            </div>
          )}
        </section>
      </div>

      <button
        className="bottom-refresh-button"
        type="button"
        onClick={() => void refreshEmails()}
        disabled={refreshing}
      >
        <Icon
          name="refresh"
          size={17}
          className={refreshing ? 'is-refreshing' : ''}
        />
        {refreshing ? 'Refreshing inbox...' : 'Refresh latest 5 emails'}
      </button>
    </main>
  )
}

export default App