/**
 * Campus Connect ERP - UI State Management Layer
 * File: uistate.js
 */

(function () {
    'use strict';

// Canonical role NAMES only. This is a domain constant, not user data.
// No user identity (name / email / id / department) is hardcoded in this file —
// the authenticated identity always comes from the backend via services/auth.js.
const CANONICAL_ROLE_NAMES = ['PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT', 'PARENT'];

function getValidRoles() {
    if (typeof window.RolesAndPermissions !== 'undefined'
        && Array.isArray(window.RolesAndPermissions.VALID_ROLES)
        && window.RolesAndPermissions.VALID_ROLES.length > 0) {
        return window.RolesAndPermissions.VALID_ROLES;
    }
    return CANONICAL_ROLE_NAMES;
}

    // Central UI State Object
    const state = {
        currentUser: null,
        currentRole: null,
        currentDepartment: null,
        selectedDepartment: null,
        currentPage: 'dashboard',
        sidebarCollapsed: false,
        theme: 'light',
        activeChatRoomId: null,
        activeAnnouncementId: null,
        announcementComposer: null,
        announcementShareScope: 'DEPARTMENT',
        aiConversation: []
    };

    // Valid announcement share scope values
    const VALID_SHARE_SCOPES = ['DEPARTMENT', 'INSTITUTION_REQUEST'];

    // Helper: Reset temporary announcement workflow state
    function resetAnnouncementWorkflowState() {
        state.activeAnnouncementId = null;
        state.announcementComposer = null;
        state.announcementShareScope = 'DEPARTMENT';
    }

    // Helper: Reset per-session AI conversation memory
    function resetAIConversationState() {
        state.aiConversation = [];
    }

    function isValidShareScope(scope) {
        return typeof scope === 'string' && VALID_SHARE_SCOPES.indexOf(scope) !== -1;
    }

    const listeners = [];

    function notifyListeners(eventType) {
        listeners.forEach(cb => {
            try {
                cb(state, eventType);
            } catch (err) {
                console.error('[UIState] Listener error:', err);
            }
        });
    }

    function clearActiveChatRoom(reasonEventType) {
        if (state.activeChatRoomId === null) return;
        state.activeChatRoomId = null;
        notifyListeners(reasonEventType || 'CHAT_ROOM_CLEARED');
    }

    function isValidDepartment(deptId) {
        if (deptId === 'ALL' || deptId === null || deptId === undefined) return true;

        // The authenticated user's own department is always valid.
        if (state.currentDepartment !== null
            && state.currentDepartment !== undefined
            && state.currentDepartment === deptId) return true;

        // Otherwise the department must exist in the backend-loaded collection.
        if (typeof window.DataModels !== 'undefined' && window.DataModels && Array.isArray(window.DataModels.departments)) {
            if (window.DataModels.departments.some(dept => dept && dept.id === deptId)) return true;
        }

        return false;
    }

    const UIState = {
        get currentUser() { return state.currentUser; },
        get currentRole() { return state.currentRole; },
        get currentDepartment() { return state.currentDepartment; },
        get selectedDepartment() { return state.selectedDepartment; },
        get currentPage() { return state.currentPage; },
        get sidebarCollapsed() { return state.sidebarCollapsed; },
        get theme() { return state.theme; },
        get activeChatRoomId() { return state.activeChatRoomId; },
        get activeAnnouncementId() { return state.activeAnnouncementId; },
        get announcementComposer() { return state.announcementComposer; },
        get announcementShareScope() { return state.announcementShareScope; },

        getState: function () {
            return { ...state };
        },

        setUser: function (userObj) {
            if (!userObj) {
                state.currentUser = null;
                state.currentRole = null;
                state.currentDepartment = null;
                clearActiveChatRoom('CHAT_ROOM_CLEARED');
                resetAnnouncementWorkflowState();
                resetAIConversationState();
                notifyListeners('USER_CHANGED');
                return;
            }

            if (userObj.role) {
                const validRoles = getValidRoles();

                if (validRoles.indexOf(userObj.role) === -1) return;
            }

            // Deep clone before modification to prevent external object mutation
            state.currentUser = JSON.parse(JSON.stringify(userObj));
            if (userObj.role) state.currentRole = userObj.role;
            if (userObj.departmentId !== undefined) state.currentDepartment = userObj.departmentId;
            clearActiveChatRoom('CHAT_ROOM_CLEARED');
            resetAnnouncementWorkflowState();
            notifyListeners('USER_CHANGED');
        },

        setRole: function (role) {
            if (!role) return;

            const validRoles = getValidRoles();

            if (validRoles.indexOf(role) === -1) return;

            state.currentRole = role;
            if (state.currentUser) {
                state.currentUser.role = role;
            }
            clearActiveChatRoom('CHAT_ROOM_CLEARED');
            resetAnnouncementWorkflowState();
            notifyListeners('ROLE_CHANGED');
        },

        setDepartment: function (deptId) {
            if (!isValidDepartment(deptId)) return;
            state.selectedDepartment = deptId;
            clearActiveChatRoom('CHAT_ROOM_CLEARED');
            resetAnnouncementWorkflowState();
            notifyListeners('DEPARTMENT_CHANGED');
        },

        setCurrentPage: function (pageId) {
            if (!pageId) return;
            state.currentPage = pageId;
            notifyListeners('PAGE_CHANGED');
        },

        /**
         * Returns the current page identifier.
         * Consumed by services/ai-api.js to scope the assistant to the active module.
         */
        getCurrentPage: function () {
            return state.currentPage;
        },

        // --- AI Assistant session memory ---
        // Conversation memory only. It carries no authorization meaning: the
        // backend re-derives user, role, department and permissions on every
        // AI request and never trusts this payload.
        getAIConversation: function () {
            return state.aiConversation.slice();
        },

        setAIConversation: function (conversation) {
            state.aiConversation = Array.isArray(conversation)
                ? JSON.parse(JSON.stringify(conversation))
                : [];
        },

        clearAIConversation: function () {
            state.aiConversation = [];
        },


        toggleSidebar: function () {
            state.sidebarCollapsed = !state.sidebarCollapsed;
            notifyListeners('SIDEBAR_TOGGLED');
        },

        setTheme: function (themeName) {
            state.theme = themeName;
            notifyListeners('THEME_CHANGED');
        },

        setActiveChatRoom: function (chatRoomId) {
            // Accept only non-empty strings (trimmed). Reject null/undefined/numbers/etc.
            // Authorization for accessing the room is enforced by RolesAndPermissions
            // before this setter is called by the Chat UI in dashboard2.html.
            if (typeof chatRoomId !== 'string') return;
            const trimmed = chatRoomId.trim();
            if (trimmed.length === 0) return;
            if (state.activeChatRoomId === trimmed) return;

            state.activeChatRoomId = trimmed;
            notifyListeners('CHAT_ROOM_CHANGED');
        },

        getActiveChatRoom: function () {
            return state.activeChatRoomId;
        },

        clearActiveChatRoom: function () {
            if (state.activeChatRoomId === null) return;
            state.activeChatRoomId = null;
            notifyListeners('CHAT_ROOM_CLEARED');
        },

        // --- Announcement UI State Methods ---
        // Authorization (e.g. whether HOD can create or request institution-wide sharing)
        // is enforced by RolesAndPermissions BEFORE these setters are called by the UI.

        setActiveAnnouncement: function (announcementId) {
            // Accept only non-empty strings (trimmed). Reject null/undefined/numbers/etc.
            if (typeof announcementId !== 'string') return;
            const trimmed = announcementId.trim();
            if (trimmed.length === 0) return;
            if (state.activeAnnouncementId === trimmed) return;

            state.activeAnnouncementId = trimmed;
            notifyListeners('ANNOUNCEMENT_CHANGED');
        },

        getActiveAnnouncement: function () {
            return state.activeAnnouncementId;
        },

        clearActiveAnnouncement: function () {
            if (state.activeAnnouncementId === null) return;
            state.activeAnnouncementId = null;
            notifyListeners('ANNOUNCEMENT_CLEARED');
        },

        openAnnouncementComposer: function (composerState) {
            // composerState is optional UI state for the composer (e.g. draft fields).
            // Persist a deep clone to avoid external mutation.
            if (composerState === null || composerState === undefined) {
                state.announcementComposer = {};
            } else if (typeof composerState === 'object') {
                state.announcementComposer = JSON.parse(JSON.stringify(composerState));
            } else {
                return;
            }
            notifyListeners('ANNOUNCEMENT_COMPOSER_OPENED');
        },

        closeAnnouncementComposer: function () {
            if (state.announcementComposer === null) return;
            state.announcementComposer = null;
            notifyListeners('ANNOUNCEMENT_COMPOSER_CLOSED');
        },

        setAnnouncementShareScope: function (scope) {
            // Validate: only allow DEPARTMENT or INSTITUTION_REQUEST.
            // INSTITUTION_REQUEST only means the user requested institution-wide
            // sharing; the approval/publication decision is handled elsewhere.
            if (!isValidShareScope(scope)) return;
            if (state.announcementShareScope === scope) return;

            state.announcementShareScope = scope;
            notifyListeners('ANNOUNCEMENT_SHARE_SCOPE_CHANGED');
        },

        getAnnouncementShareScope: function () {
            return state.announcementShareScope;
        },

        onStateChange: function (callback) {
            if (typeof callback === 'function') {
                listeners.push(callback);
            }
        }
    };

    window.UIState = UIState;

})();
