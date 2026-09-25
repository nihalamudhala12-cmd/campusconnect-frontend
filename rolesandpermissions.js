/**
 * Campus Connect ERP - Roles & Permissions Centralized System
 * File: rolesandpermissions.js
 */

(function () {
    'use strict';

    // Canonical System Roles
    const ROLES = {
        PRINCIPAL: 'PRINCIPAL',
        HOD: 'HOD',
        FACULTY: 'FACULTY',
        STUDENT: 'STUDENT',
        PARENT: 'PARENT'
    };

    const VALID_ROLES = Object.values(ROLES);

    // Standard Action Types
    const PERMISSION_ACTIONS = {
        VIEW: 'view',
        VIEWROOMS: 'viewRooms',
        VIEWMESSAGES: 'viewMessages',
        CREATE: 'create',
        EDIT: 'edit',
        DELETE: 'delete',
        APPROVE: 'approve',
        MANAGE: 'manage',
        AUTHORIZE: 'authorize',
        PUBLISH_DEPARTMENT: 'publish_department',
        REQUEST_INSTITUTION_SHARE: 'request_institution_share',
        APPROVE_INSTITUTION_SHARE: 'approve_institution_share',
        PUBLISH_INSTITUTION_WIDE: 'publish_institution_wide'
    };

    // Centralized Permission Mapping per Role
    const Permissions = {
        [ROLES.PRINCIPAL]: {
            dashboard: { view: true, manage: true },
            classes: { view: true, create: true, edit: true, delete: true, manage: true },
            students: { view: true, create: true, edit: true, delete: true, manage: true },
            attendance: { view: true, create: true, edit: true, manage: true },
            results: { view: true, create: true, edit: true, delete: true, approve: true, manage: true },
            timetable: { view: true, create: true, edit: true, delete: true, manage: true },
            analytics: { view: true, manage: true },
            messages: { view: true, create: true, delete: true, manage: true },
            chat: { view: true, viewRooms: true, viewMessages: true, create: true, manage: true },
            announcements: { view: true, create: true, edit: true, delete: true, manage: true, publish_department: true, request_institution_share: true, approve_institution_share: true, publish_institution_wide: true },
            alerts: { view: true, create: true, edit: true, delete: true, manage: true, publish_department: true, request_institution_share: true, approve_institution_share: true, publish_institution_wide: true },
            approvals: { view: true, approve: true, manage: true },
            department: { view: true, create: true, edit: true, delete: true, manage: true },
            profile: { view: true, edit: true },
            settings: { view: true, edit: true, manage: true },
            user_management: { view: true, create: true, edit: true, delete: true, manage: true },
            institution_management: { view: true, create: true, edit: true, delete: true, manage: true }
        },
        [ROLES.HOD]: {
            dashboard: { view: true },
            classes: { view: true, create: true, edit: true, delete: true, manage: true },
            students: { view: true, create: true, edit: true, delete: true, manage: true },
            attendance: { view: true, create: true, edit: true, manage: true },
            results: { view: true, create: true, edit: true, approve: true, manage: true },
            timetable: { view: true, create: true, edit: true, manage: true },
            analytics: { view: true, manage: true },
            messages: { view: true, create: true, delete: true },
            chat: { view: true, viewRooms: true, viewMessages: true, create: true },
            announcements: { view: true, create: true, edit: true, delete: true, publish_department: true, request_institution_share: true },
            alerts: { view: true, create: true, edit: true, delete: true, publish_department: true, request_institution_share: true },
            approvals: { view: true, approve: true },
            department: { view: true, edit: true, manage: true },
            profile: { view: true, edit: true },
            settings: { view: true, edit: true },
            user_management: { view: false },
            institution_management: { view: false }
        },
        [ROLES.FACULTY]: {
            dashboard: { view: true },
            classes: { view: true },
            students: { view: true },
            attendance: { view: true, create: true, edit: true },
            results: { view: true, create: true, edit: true },
            timetable: { view: true },
            analytics: { view: true },
            messages: { view: true, create: true },
            chat: { view: true, viewRooms: true, viewMessages: true, create: true },
            announcements: { view: true },
            alerts: { view: true },
            approvals: { view: true, create: true },
            department: { view: true },
            profile: { view: true, edit: true },
            settings: { view: true },
            user_management: { view: false },
            institution_management: { view: false }
        },
        [ROLES.STUDENT]: {
            dashboard: { view: true },
            classes: { view: true },
            students: { view: false },
            attendance: { view: true },
            results: { view: true },
            timetable: { view: true },
            analytics: { view: false },
            messages: { view: true, create: true },
            chat: { view: false, viewRooms: false, viewMessages: false, create: false },
            announcements: { view: true },
            alerts: { view: true },
            approvals: { view: false },
            department: { view: false },
            profile: { view: true, edit: true },
            settings: { view: true },
            user_management: { view: false },
            institution_management: { view: false }
        },
        [ROLES.PARENT]: {
            dashboard: { view: true },
            classes: { view: false },
            students: { view: false },
            attendance: { view: true },
            results: { view: true },
            timetable: { view: true },
            analytics: { view: false },
            messages: { view: true, create: true },
            chat: { view: false, viewRooms: false, viewMessages: false, create: false },
            announcements: { view: true },
            alerts: { view: true },
            approvals: { view: false },
            department: { view: false },
            profile: { view: true, edit: true },
            settings: { view: true },
            user_management: { view: false },
            institution_management: { view: false }
        }
    };

    /**
     * Checks if targetRole matches or is included in assigned user role
     */
    function hasRole(assignedRole, requiredRole) {
        if (!assignedRole) return false;
        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(assignedRole);
        }
        return assignedRole === requiredRole;
    }

    /**
     * Checks if a role has specific permission for a resource and action
     */
    function hasPermission(role, resource, action = PERMISSION_ACTIONS.VIEW) {
        if (!role || !Permissions[role]) return false;
        const resourcePerms = Permissions[role][resource];
        if (!resourcePerms) return false;
        return !!resourcePerms[action];
    }

    /**
     * Department level authorization evaluation
     */
    function checkDepartmentAccess(userDept, targetDept, userRole) {
        // Principal has institution-wide access (only role authorized for institution-wide scope)
        if (userRole === ROLES.PRINCIPAL) return true;
        // Fail safely: missing target department must not grant access
        if (!targetDept) return false;
        // Fail safely if target department is specified but user department is missing
        if (!userDept) return false;
        // Only Principal may authorize institution-wide resources (targetDept === 'ALL')
        if (targetDept === 'ALL') return false;
        // Non-Principal users must not hold institution-wide authorization (userDept === 'ALL')
        if (userDept === 'ALL') return false;
        // Otherwise, user must belong to the same department as the target
        return userDept === targetDept;
    }

    /**
     * Evaluates access permissions considering user role, resource, action, and department context
     */
    function canAccess(resource, action = PERMISSION_ACTIONS.VIEW, context = {}) {
        // GUARD: Block department-sensitive authorization until syncDynamicDepartmentScopes()
        // has completed. This prevents authorization checks from running before the
        // department context is properly synchronized to DOM elements.
        // 
        // For Principal (institution-wide access) or when context explicitly provides
        // both userDepartment and targetDepartment, we bypass this guard to allow
        // programmatic authorization checks that don't depend on DOM state.
        const hasExplicitDepts = (context.userDepartment !== undefined || context.targetDepartment !== undefined || context.departmentId !== undefined);
        const isPrincipalWithExplicitContext = context.role === ROLES.PRINCIPAL || (window.UIState && window.UIState.currentRole) === ROLES.PRINCIPAL;
        
        if (!hasExplicitDepts && !isPrincipalWithExplicitContext && !_deptScopesInitialized) {
            // Fail-safe: deny access until department scopes are synchronized.
            // This prevents incorrect authorization before initAppIntegration() runs.
            return false;
        }

        const userRole = context.role || (window.UIState && window.UIState.currentRole) || null;
        const userDept = context.userDepartment !== undefined 
            ? context.userDepartment 
            : (window.UIState && window.UIState.currentDepartment) || null;
        
        const permitted = hasPermission(userRole, resource, action);
        if (!permitted) return false;

        // Resolve target department from context
        const targetDept = context.targetDepartment !== undefined 
            ? context.targetDepartment 
            : (context.departmentId !== undefined 
                ? context.departmentId 
                : (context.resourceData && context.resourceData.departmentId !== undefined 
                    ? context.resourceData.departmentId 
                    : null));

        // Enforce department access check whenever target department is present
        if (targetDept !== null && targetDept !== undefined) {
            return checkDepartmentAccess(userDept, targetDept, userRole);
        }

        // Implicitly require target department for sensitive operations to prevent unauthorized global access
        const deptSensitiveResources = ['classes', 'students', 'attendance', 'results', 'timetable', 'chat', 'approvals', 'department', 'announcements', 'alerts'];
        const isOperation = action !== PERMISSION_ACTIONS.VIEW;
        
        if ((context.requireTargetDepartment || (isOperation && deptSensitiveResources.includes(resource)) || !targetDept) && userRole !== ROLES.PRINCIPAL) {
            return false;
        }

        return true;
    }

    /**
     * Convenience method for action permissions
     */
    function canPerformAction(action, resource, context = {}) {
        return canAccess(resource, action, context);
    }

    /**
     * Gets all permission mappings for a role
     */
    function getRolePermissions(role) {
        return Permissions[role] || {};
    }

    /**
     * Gets list of pages viewable by role
     */
    function getAuthorizedPages(role) {
        const rolePerms = getRolePermissions(role);
        return Object.keys(rolePerms).filter(page => rolePerms[page] && rolePerms[page].view);
    }

    /**
     * Tracks whether dynamic department scopes have been synchronized.
     * Guard to prevent authorization checks from running before initialization.
     */
    let _deptScopesInitialized = false;

    // Export to global window
    window.RolesAndPermissions = {
        ROLES,
        VALID_ROLES,
        PERMISSION_ACTIONS,
        Permissions,
        hasRole,
        hasPermission,
        canAccess,
        checkDepartmentAccess,
        canPerformAction,
        getRolePermissions,
        getAuthorizedPages,

        /**
         * Marks department scopes as synchronized. Called by dashboard
         * initialization before any authorization checks execute.
         * @param {boolean} [value=true] - Set to true to mark as initialized
         * @returns {boolean} Current initialization state
         */
        setDeptScopesInitialized: function (value) {
            if (value !== undefined) {
                _deptScopesInitialized = !!value;
            }
            return _deptScopesInitialized;
        },

        /**
         * Checks if dynamic department scopes have been synchronized.
         * @returns {boolean} true if syncDynamicDepartmentScopes() has run
         */
        isDeptScopesInitialized: function () {
            return _deptScopesInitialized;
        }
    };

})();