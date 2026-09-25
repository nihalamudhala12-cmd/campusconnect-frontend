/**
 * CampusConnect â€” Authentication Service
 * File: services/auth.js
 *
 * Manages JWT auth lifecycle: login, logout, session restore,
 * token storage, and 401 handling.
 */

(function () {
    'use strict';

    const TOKEN_KEY = 'cc_token';
    const USER_KEY = 'cc_user';
    const AUTH_SESSION_KEY = 'cc_auth_session';
    const MFA_CHALLENGE_KEY = 'cc_mfa_challenge';

    function getMfaChallenge() {
        return localStorage.getItem(MFA_CHALLENGE_KEY);
    }

    function setMfaChallenge(challenge) {
        if (challenge) {
            localStorage.setItem(MFA_CHALLENGE_KEY, challenge);
        } else {
            localStorage.removeItem(MFA_CHALLENGE_KEY);
        }
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    function getUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (_e) {
            return null;
        }
    }

    function setUser(user) {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_KEY);
        }
    }

    function isAuthenticated() {
        return !!getToken();
    }

    function isValidRole(role) {
        if (!role || typeof role !== 'string') return false;
        var validRoles = ['PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT', 'PARENT'];
        return validRoles.indexOf(role) !== -1;
    }

    function isStructurallyValidUser(user) {
        if (!user || typeof user !== 'object') return false;
        if (!user.id || typeof user.id !== 'string') return false;
        if (!user.role || !isValidRole(user.role)) return false;
        if (!user.email || typeof user.email !== 'string') return false;
        return true;
    }

    function clearAuthSession() {
        try { localStorage.removeItem(AUTH_SESSION_KEY); } catch(e) {}
    }

    /**
     * Completes an MFA login by adopting the session issued by the backend.
     * Called after POST /auth/mfa-verify returns a token. All session state is
     * written here so the login page never manipulates Auth internals directly.
     * @param {string} token - JWT issued by the backend
     * @param {Object} user - Backend-authenticated user record
     */
    function completeMfaSession(token, user) {
        if (!token) {
            throw new Error('MFA verification did not return a session token');
        }
        if (!isStructurallyValidUser(user)) {
            throw new Error('MFA verification returned an invalid user record');
        }

        setToken(token);
        setUser(user);
        setMfaChallenge(null);

        if (window.UIState) {
            window.UIState.setUser(user);
        }
        if (window.RolesAndPermissions) {
            window.RolesAndPermissions.setDeptScopesInitialized(true);
        }

        return { token: token, user: user };
    }

    function clearSessionState() {
        setToken(null);
        setUser(null);
        setMfaChallenge(null);
        clearAuthSession();

        if (window.UIState) {
            window.UIState.setUser(null);
            window.UIState.setRole(null);
        }

        if (window.RolesAndPermissions) {
            window.RolesAndPermissions.setDeptScopesInitialized(false);
        }
    }

    /**
     * Login with credentials object.
     * POST /auth/login â†’ { token, user, expiresIn }
     * @param {Object} credentials - { email, password }
     */
    async function login(credentials) {
        const email = credentials && credentials.email;
        const password = credentials && credentials.password;

        if (!email || !password) {
            const err = new Error('Email and password are required');
            err.type = 'VALIDATION_ERROR';
            throw err;
        }

        const result = await API.post('/auth/login', { email, password });

        if (!result || !result.success) {
            const err = new Error((result && result.message) || 'Login failed');
            err.type = 'AUTH_ERROR';
            throw err;
        }

        if (result.data && result.data.mfaRequired) {
            setUser(result.data.user);
            setMfaChallenge(result.data.mfaChallenge);
            if (window.UIState) {
                window.UIState.setUser(result.data.user);
            }
            if (window.RolesAndPermissions) {
                window.RolesAndPermissions.setDeptScopesInitialized(true);
            }
            return { token: null, user: result.data.user, mfaRequired: true };
        }

        if (!result.data || !result.data.token) {
            const err = new Error((result && result.message) || 'Login failed');
            err.type = 'AUTH_ERROR';
            throw err;
        }

        const token = result.data.token;
        const user = result.data.user;

        setToken(token);
        setUser(user);

        if (window.UIState) {
            window.UIState.setUser(user);
        }

        if (window.RolesAndPermissions) {
            window.RolesAndPermissions.setDeptScopesInitialized(true);
        }

        return { token: token, user: user };
    }

    function logout() {
        clearSessionState();
        window.location.href = 'log_in.html';
    }

    function handleUnauthorized() {
        clearSessionState();
        window.location.href = 'log_in.html';
    }

    /**
     * Restore session from localStorage on page load.
     */
    function restoreSession() {
        const token = getToken();
        const user = getUser();

        if (!token || !user) {
            return false;
        }

        if (!isStructurallyValidUser(user)) {
            setToken(null);
            setUser(null);
            return false;
        }

        if (!isValidRole(user.role)) {
            setToken(null);
            setUser(null);
            return false;
        }

        if (!user.id || typeof user.id !== 'string' || user.id.length === 0) {
            setToken(null);
            setUser(null);
            return false;
        }

        if (!user.email || typeof user.email !== 'string' || user.email.length === 0) {
            setToken(null);
            setUser(null);
            return false;
        }

        if (window.UIState) {
            window.UIState.setUser(user);
        }
        if (window.RolesAndPermissions) {
            window.RolesAndPermissions.setDeptScopesInitialized(true);
        }
        return true;
    }

    async function verifySession() {
        const token = getToken();
        if (!token) {
            return null;
        }

        if (!window.API) {
            return null;
        }

        try {
            const result = await API.get('/auth/me');
            if (result && result.success && result.data) {
                const authUser = result.data;
                if (authUser.status === 'ACTIVE') {
                    setUser(authUser);
                    if (window.UIState) {
                        window.UIState.setUser(authUser);
                    }
                    if (window.RolesAndPermissions) {
                        window.RolesAndPermissions.setDeptScopesInitialized(true);
                    }
                    return authUser;
                }
                clearSessionState();
                return null;
            }
            clearSessionState();
            return null;
        } catch (err) {
            clearSessionState();
            return null;
        }
    }

    const Auth = {
        getToken: getToken,
        getUser: getUser,
        isAuthenticated: isAuthenticated,
        getMfaChallenge: getMfaChallenge,
        setMfaChallenge: setMfaChallenge,
        login: login,
        completeMfaSession: completeMfaSession,
        logout: logout,
        handleUnauthorized: handleUnauthorized,
        restoreSession: restoreSession,
        verifySession: verifySession,
    };

    window.Auth = Auth;
})();
