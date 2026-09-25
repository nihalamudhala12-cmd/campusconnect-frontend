/**
 * CampusConnect — API Client Layer
 * File: services/api.js
 *
 * HTTP wrapper around fetch(). Injects JWT Bearer token,
 * handles auth errors, and returns parsed JSON responses.
 */

(function () {
    'use strict';

    const DEFAULT_BASE_URL = 'http://localhost:3000';

    function getBaseURL() {
        if (window.API_BASE_URL) return window.API_BASE_URL;
        return DEFAULT_BASE_URL;
    }

    function getToken() {
        if (window.Auth && typeof window.Auth.getToken === 'function') {
            return window.Auth.getToken();
        }
        return localStorage.getItem('cc_token');
    }

    /**
     * Core request helper.
     * @param {string} path - API path (e.g. /auth/login)
     * @param {object} options - fetch options
     * @returns {Promise<object>} parsed JSON response body
     */
    async function apiRequest(path, options) {
        const url = getBaseURL() + path;
        const opts = options || {};

        const headers = Object.assign({
            'Content-Type': 'application/json',
        }, opts.headers || {});

        const token = getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        const config = Object.assign({}, opts, { headers });

        let response;
        try {
            response = await fetch(url, config);
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
                console.warn('[api.js] Non-JSON response (status ' + response.status + '):', rawText.substring(0, 200));
            }
            if (response.status !== 204 && response.status !== 304) {
                const err = new Error('Malformed JSON response (status ' + response.status + ')');
                err.type = 'MALFORMED_RESPONSE';
                err.statusCode = response.status;
                err.body = rawText || null;
                throw err;
            }
        }

        if (response.status === 401) {
            if (window.Auth && typeof window.Auth.handleUnauthorized === 'function' && path !== '/auth/login' && path !== '/mfa-verify') {
                window.Auth.handleUnauthorized();
            }
            const err = new Error('Authentication required');
            err.type = 'UNAUTHORIZED';
            err.statusCode = 401;
            err.body = body;
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

         return body || { raw: rawText };
    }

    const api = {
        get: function (path, queryParams) {
            let url = path;
            if (queryParams && typeof queryParams === 'object') {
                const keys = Object.keys(queryParams).filter(function (k) { return queryParams[k] !== undefined && queryParams[k] !== null; });
                if (keys.length > 0) {
                    const qs = keys.map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(String(queryParams[k])); }).join('&');
                    url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
                }
            }
            return apiRequest(url, { method: 'GET' });
        },

        post: function (path, data) {
            return apiRequest(path, {
                method: 'POST',
                body: JSON.stringify(data || {}),
            });
        },

        put: function (path, data) {
            return apiRequest(path, {
                method: 'PUT',
                body: JSON.stringify(data || {}),
            });
        },

        patch: function (path, data) {
            return apiRequest(path, {
                method: 'PATCH',
                body: JSON.stringify(data || {}),
            });
        },

        delete: function (path) {
            return apiRequest(path, { method: 'DELETE' });
        },
    };

    window.API = api;
})();