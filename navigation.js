/**
 * Campus Connect ERP - Navigation Layer
 * File: navigation.js
 * 
 * Manages navigation state and access validation across application modules.
 * Leverages UIState for active state storage and permissions.js for access validation.
 * Performs no DOM manipulation, URL routing, or business module logic.
 */

// ==========================================
// NAVIGATION DEFINITIONS
// ==========================================

const NavigationItems = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'icon-dashboard',
        targetPage: 'dashboard',
        permissionModule: 'dashboard',
        order: 1
    },
    {
        id: 'students',
        label: 'Students',
        icon: 'icon-students',
        targetPage: 'students',
        permissionModule: 'students',
        order: 2
    },
    {
        id: 'faculty',
        label: 'Faculty',
        icon: 'icon-faculty',
        targetPage: 'faculty',
        permissionModule: 'faculty',
        order: 3
    },
    {
        id: 'classes',
        label: 'Classes',
        icon: 'icon-classes',
        targetPage: 'classes',
        permissionModule: 'classes',
        order: 4
    },
    {
        id: 'courses',
        label: 'Courses',
        icon: 'icon-courses',
        targetPage: 'courses',
        permissionModule: 'courses',
        order: 5
    },
    {
        id: 'attendance',
        label: 'Attendance',
        icon: 'icon-attendance',
        targetPage: 'attendance',
        permissionModule: 'attendance',
        order: 6
    },
    {
        id: 'results',
        label: 'Results',
        icon: 'icon-results',
        targetPage: 'results',
        permissionModule: 'results',
        order: 7
    },
    {
        id: 'timetable',
        label: 'Timetable',
        icon: 'icon-timetable',
        targetPage: 'timetable',
        permissionModule: 'timetable',
        order: 8
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: 'icon-analytics',
        targetPage: 'analytics',
        permissionModule: 'analytics',
        order: 9
    },
    {
        id: 'messages',
        label: 'Messages',
        icon: 'icon-messages',
        targetPage: 'messages',
        permissionModule: 'messages',
        order: 10
    },
    {
        id: 'chat',
        label: 'Chat',
        icon: 'icon-chat',
        targetPage: 'chat',
        permissionModule: 'chatRooms',
        order: 11
    },
    {
        id: 'announcements',
        label: 'Announcements',
        icon: 'icon-announcements',
        targetPage: 'announcements',
        permissionModule: 'announcements',
        order: 12
    },
    {
        id: 'approvals',
        label: 'Approvals',
        icon: 'icon-approvals',
        targetPage: 'approvals',
        permissionModule: 'approvals',
        order: 13
    },
    {
        id: 'department',
        label: 'Department',
        icon: 'icon-department',
        targetPage: 'department',
        permissionModule: 'departments',
        order: 14
    },
    {
        id: 'profile',
        label: 'My Profile',
        icon: 'icon-profile',
        targetPage: 'profile',
        permissionModule: 'profile',
        order: 15
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: 'icon-settings',
        targetPage: 'settings',
        permissionModule: 'settings',
        order: 16
    }
];

// ==========================================
// NAVIGATION VALIDATION
// ==========================================

/**
 * Checks whether a page identifier exists within defined navigation items.
 * @param {string} pageId - Target page identifier.
 * @returns {boolean}
 */
function isValidPage(pageId) {
    if (typeof pageId !== 'string') return false;
    return NavigationItems.some(item => item.targetPage === pageId);
}

/**
 * Verifies if a given role is allowed to access a target page via permissions.js layer.
 * @param {string} role - Active user role ('HOD' or 'FACULTY').
 * @param {string} pageId - Target page identifier.
 * @returns {boolean}
 */
function canNavigateTo(role, pageId) {
    if (!isValidPage(pageId)) return false;

    const navItem = NavigationItems.find(item => item.targetPage === pageId);
    if (!navItem) return false;

    if (typeof canAccessModule === 'function') {
        return canAccessModule(role, navItem.permissionModule);
    }
    
    if (typeof hasPermission === 'function') {
        return hasPermission(role, navItem.permissionModule, 'view');
    }

    return false;
}

// ==========================================
// ACCESSIBLE NAVIGATION
// ==========================================

/**
 * Returns all static navigation definitions regardless of permissions.
 * @returns {Array<Object>}
 */
function getNavigationItems() {
    return NavigationItems.slice().sort((a, b) => a.order - b.order);
}

/**
 * Filters navigation items accessible for the specified role based on permissions.js.
 * @param {string} role - Active user role ('HOD' or 'FACULTY').
 * @returns {Array<Object>} Array of accessible navigation item objects.
 */
function getAccessibleNavigationItems(role) {
    if (!role) return [];

    return getNavigationItems().filter(item => {
        if (typeof canAccessModule === 'function') {
            return canAccessModule(role, item.permissionModule);
        }
        if (typeof hasPermission === 'function') {
            return hasPermission(role, item.permissionModule, 'view');
        }
        return false;
    });
}

// ==========================================
// NAVIGATION ACTIONS
// ==========================================

/**
 * Navigates to a target page by updating UIState.currentPage if validation passes.
 * @param {string} pageId - Target page identifier.
 * @returns {boolean} True if navigation succeeded, false otherwise.
 */
function navigateTo(pageId) {
    if (!isValidPage(pageId)) {
        return false;
    }

    const currentRole = (typeof UIState !== 'undefined' && UIState) ? UIState.currentRole : null;

    if (!canNavigateTo(currentRole, pageId)) {
        return false;
    }

    if (typeof setCurrentPage === 'function') {
        setCurrentPage(pageId);
    } else if (typeof UIState !== 'undefined' && UIState) {
        UIState.currentPage = pageId;
    }

    return true;
}

// ==========================================
// CURRENT PAGE HELPERS
// ==========================================

/**
 * Retrieves the current active page identifier from UIState.
 * @returns {string|null}
 */
function getCurrentPage() {
    if (typeof UIState !== 'undefined' && UIState) {
        return UIState.currentPage;
    }
    return null;
}

/**
 * Checks if the provided page identifier matches the currently active page in UIState.
 * @param {string} pageId - Target page identifier.
 * @returns {boolean}
 */
function isCurrentPage(pageId) {
    return getCurrentPage() === pageId;
}