/**
 * CampusConnect AI Assistant — Frontend API Client
 * File: services/ai-api.js
 *
 * Communicates with the backend AI endpoint (POST /api/ai/chat)
 * through the existing Auth and API services.
 * The frontend never communicates directly with any AI provider.
 * Provider credentials remain backend-only.
 */

(function () {
  'use strict';

  const AI_ENDPOINT = '/api/ai/chat';

  function getBaseURL() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    return 'http://localhost:3000';
  }

  function getToken() {
    if (window.Auth && typeof window.Auth.getToken === 'function') {
      return window.Auth.getToken();
    }
    return localStorage.getItem('cc_token');
  }

  function getUser() {
    if (window.Auth && typeof window.Auth.getUser === 'function') {
      return window.Auth.getUser();
    }
    return null;
  }

  function getCurrentModule() {
    if (window.UIState && typeof window.UIState.getCurrentPage === 'function') {
      return window.UIState.getCurrentPage();
    }
    return 'dashboard';
  }

  function getConversation() {
    if (window.UIState && typeof window.UIState.getAIConversation === 'function') {
      return window.UIState.getAIConversation();
    }
    return [];
  }

  function setConversation(conversation) {
    if (window.UIState && typeof window.UIState.setAIConversation === 'function') {
      window.UIState.setAIConversation(conversation);
    }
  }

  /**
   * Send a chat message to the backend AI assistant.
   * @param {string} message - User message
   * @param {object} options - Optional request options
   * @returns {Promise<object>} AI response
   */
  async function chat(message, options) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      const err = new Error('Message is required');
      err.type = 'VALIDATION_ERROR';
      throw err;
    }

    const token = getToken();
    if (!token) {
      const err = new Error('Authentication required');
      err.type = 'UNAUTHORIZED';
      throw err;
    }

    const user = getUser();
    if (!user) {
      const err = new Error('User session not found');
      err.type = 'UNAUTHORIZED';
      throw err;
    }

    const payload = {
      message: message,
      conversation: getConversation(),
      module: getCurrentModule(),
      timestamp: new Date().toISOString(),
    };

    const opts = Object.assign({}, options || {});
    opts.method = 'POST';
    opts.headers = Object.assign({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    }, opts.headers || {});
    opts.body = JSON.stringify(payload);

    let response;
    try {
      response = await fetch(getBaseURL() + AI_ENDPOINT, opts);
    } catch (networkError) {
      const err = new Error('Network error: ' + (networkError.message || 'Unknown'));
      err.type = 'NETWORK_ERROR';
      throw err;
    }

    let body = null;
    let rawText = null;
    try {
      rawText = await response.text();
      body = JSON.parse(rawText);
    } catch (_e) {
      body = null;
      if (rawText) {
        console.warn('[ai-api.js] Non-JSON response (status ' + response.status + '):', rawText.substring(0, 200));
      }
      const err = new Error('Malformed JSON response (status ' + response.status + ')');
      err.type = 'MALFORMED_RESPONSE';
      err.statusCode = response.status;
      throw err;
    }

    if (response.status === 401) {
      if (window.Auth && typeof window.Auth.handleUnauthorized === 'function') {
        window.Auth.handleUnauthorized();
      }
      const err = new Error('Authentication required');
      err.type = 'UNAUTHORIZED';
      err.statusCode = 401;
      throw err;
    }

    if (response.status === 403) {
      const err = new Error((body && body.error && body.error.message) || 'Access denied');
      err.type = 'FORBIDDEN';
      err.statusCode = 403;
      err.body = body;
      throw err;
    }

    if (response.status >= 400) {
      const err = new Error((body && body.error && body.error.message) || 'Request failed');
      err.type = 'HTTP_ERROR';
      err.statusCode = response.status;
      err.body = body;
      throw err;
    }

    if (!body || !body.success) {
      const err = new Error((body && body.error && body.error.message) || 'AI request failed');
      err.type = 'AI_ERROR';
      err.body = body;
      throw err;
    }

    // Update conversation memory (controlled session memory)
    const conversation = getConversation();
    conversation.push({ role: 'user', content: message });
    if (body.data && body.data.message) {
      conversation.push({ role: 'assistant', content: body.data.message });
    }
    setConversation(conversation);

    return body;
  }

  /**
   * Clear the current AI conversation.
   */
  function clearConversation() {
    setConversation([]);
  }

  /**
   * Get the current AI conversation.
   */
  function getAIConversation() {
    return getConversation();
  }

  /**
   * Check AI service health.
   */
  async function health() {
    let response;
    try {
      response = await fetch(getBaseURL() + '/api/ai/health', { method: 'GET' });
    } catch (networkError) {
      const err = new Error('Network error: ' + (networkError.message || 'Unknown'));
      err.type = 'NETWORK_ERROR';
      throw err;
    }

    let body = null;
    try {
      body = await response.json();
    } catch (_e) {
      body = null;
    }

    if (!response.ok || !body || !body.success) {
      const err = new Error('AI service unavailable');
      err.type = 'AI_UNAVAILABLE';
      err.statusCode = response.status;
      err.body = body;
      throw err;
    }

    return body;
  }

  window.AI_API = {
    chat: chat,
    clearConversation: clearConversation,
    getConversation: getAIConversation,
    health: health,
  };

  window.AI = window.AI_API;
})();