/**
 * src/utils/session.js — Ghost Auth utility.
 *
 * Implements a "no-login" session identity:
 *   - On first visit: generates a UUID and saves it to localStorage.
 *   - On subsequent visits: retrieves the existing UUID.
 *
 * The session_id is included in every API request body so the backend
 * can tie all messages to a single persistent conversation.
 */

const SESSION_KEY = 'vb_session_id';

/**
 * Retrieve the current session_id from localStorage.
 * If none exists, generate a new UUID, persist it, and return it.
 *
 * @returns {string} A stable UUID string for this browser session.
 */
export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);

  if (!id) {
    // crypto.randomUUID() is supported in all modern browsers (Chrome 92+, Safari 15.4+)
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }

  return id;
}

/**
 * Clear the current session and generate a fresh one.
 * Useful for a "New Conversation" button.
 *
 * @returns {string} The newly generated session_id.
 */
export function resetSessionId() {
  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}
