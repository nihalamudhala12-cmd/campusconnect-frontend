/**
 * Campus Connect — Dashboard Data Layer
 * File: dashboard.js
 *
 * Provides window.getDashboardData() — backend-driven.
 * Replaces the inline mock-data getDashboardData in dashboard2.html.
 * NO business logic — pure data fetching and shaping.
 */

(function () {
    'use strict';

    let _cachedData = null;
    let _fetching = false;
    let _callbacks = [];

    async function _fetch() {
        if (_fetching) return;
        _fetching = true;
        try {
            const roleContext = await _getRoleContext();

            if (typeof window.Integration === 'undefined' || !window.Integration) {
                console.info('[dashboard.js] Integration service not available; using local fallback data (standalone mode)');
                _cachedData = { roleContext, summary: {}, attendance: {}, results: {}, upcomingClasses: [], announcements: [], notifications: [], messages: [], approvals: [] };
                _callbacks.forEach(function (cb) { cb(_cachedData); });
                _callbacks = [];
                return;
            }

            const [studentData, facultyData, classData, attendanceData, resultData, announcementData, notificationData, approvalData, messageData] = await Promise.allSettled([
                Integration.getStudents({ limit: 1 }),
                Integration.getFaculties({ limit: 1 }),
                Integration.getClasses({ limit: 1 }),
                Integration.getAttendances({ limit: 1 }),
                Integration.getResults({ limit: 1 }),
                Integration.getAnnouncements({ limit: 1 }),
                Integration.getNotifications({ limit: 1 }),
                Integration.getApprovals({ status: 'pending' }),
                Integration.getMessages({ limit: 1 }),
            ]);

            const s = studentData.status === 'fulfilled' ? studentData.value : null;
            const f = facultyData.status === 'fulfilled' ? facultyData.value : null;
            const c = classData.status === 'fulfilled' ? classData.value : null;
            const a = attendanceData.status === 'fulfilled' ? attendanceData.value : null;
            const r = resultData.status === 'fulfilled' ? resultData.value : null;
            const an = announcementData.status === 'fulfilled' ? announcementData.value : null;
            const n = notificationData.status === 'fulfilled' ? notificationData.value : null;
            const ap = approvalData.status === 'fulfilled' ? approvalData.value : null;
            const m = messageData.status === 'fulfilled' ? messageData.value : null;

            const summary = {
                totalStudents: (s && s.meta && s.meta.total) || (s && s.data && s.data.length) || 0,
                studentsCount: (s && s.meta && s.meta.total) || (s && s.data && s.data.length) || 0,
                totalFaculty: (f && f.meta && f.meta.total) || (f && f.data && f.data.length) || 0,
                facultyCount: (f && f.meta && f.meta.total) || (f && f.data && f.data.length) || 0,
                totalClasses: (c && c.meta && c.meta.total) || (c && c.data && c.data.length) || 0,
                pendingApprovals: (ap && ap.data && ap.data.length) || 0,
                approvalsCount: (ap && ap.data && ap.data.length) || 0,
                unreadNotifications: (n && n.data && n.data.length) || 0,
                notificationsCount: (n && n.data && n.data.length) || 0,
                attendanceRate: null,
                attendancePercentage: null,
                passPercentage: null,
            };

            const attendance = { totalRecords: null, present: null, absent: null, attendancePercentage: null };
            const results = { totalResults: null, averageScore: null, passed: null, failed: null, passPercentage: null };

            let upcomingClasses = [];
            if (c && c.data && Array.isArray(c.data)) {
                upcomingClasses = c.data.slice(0, 5);
            }

            _cachedData = {
                roleContext,
                summary,
                attendance,
                results,
                upcomingClasses,
                announcements: (an && an.data) || [],
                notifications: (n && n.data) || [],
                messages: (m && m.data) || [],
                approvals: (ap && ap.data) || [],
            };

            _callbacks.forEach(function (cb) {
                try { cb(_cachedData); } catch (e) { /* ignore */ }
            });
            _callbacks = [];

            window.dispatchEvent(new CustomEvent('dashboardDataReady', { detail: _cachedData }));
        } catch (err) {
            console.error('[dashboard.js] Fetch error:', err);
        } finally {
            _fetching = false;
        }
    }

    async function _getRoleContext() {
        // Role and department are backend-derived. No default role is assumed:
        // until the session is resolved the context carries null and the UI
        // renders empty states rather than another role's data.
        const currentRole = (typeof window.UIState !== 'undefined' && window.UIState.currentRole) ? window.UIState.currentRole : null;
        const currentDepartment = (typeof window.UIState !== 'undefined' && window.UIState.currentDepartment) ? window.UIState.currentDepartment : null;
        return { role: currentRole, department: currentDepartment, isHOD: currentRole === 'HOD', isFaculty: currentRole === 'FACULTY' };
    }

    function getDashboardData() {
        return _cachedData;
    }

    function onDashboardDataReady(callback) {
        if (_cachedData) {
            try { callback(_cachedData); } catch (e) { /* ignore */ }
            return;
        }
        _callbacks.push(callback);
    }

    function refreshDashboardData() {
        return _fetch();
    }

    window.getDashboardData = getDashboardData;
    window.onDashboardDataReady = onDashboardDataReady;
    window.refreshDashboardData = refreshDashboardData;

    // Fetch once the backend has confirmed the session, not on script load.
    // Firing at load time issued a batch of requests before the session was
    // resolved, which produced spurious 401s and empty dashboard data.
    (function startAfterSessionResolved() {
        if (typeof window.UIState === 'undefined' || typeof window.UIState.onStateChange !== 'function') {
            _fetch();
            return;
        }
        window.UIState.onStateChange(function (state, eventType) {
            if (eventType === 'USER_CHANGED' && state.currentUser) {
                _fetch();
            }
        });
    })();
})();
