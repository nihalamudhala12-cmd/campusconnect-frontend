/**
 * dashboard-ui.js
 * -----------------------------------------------------------------------------
 * Presentation and Integration Layer for the Dashboard UI.
 * Connects data provided by `dashboard.js` to existing DOM elements.
 * 
 * Strict Architecture Constraints:
 * - NO business logic or calculations (handled by dashboard.js)
 * - NO state modification (handled by ui-state.js / permissions.js)
 * - NO API calls or module redesign
 * - ONLY reads data via getDashboardData() and populates existing HTML DOM
 */

(function () {
    'use strict';

    /**
     * Helper utility to safely assign text content to a DOM element.
     * Prevents displaying null, undefined, or missing values.
     * 
     * @param {string} elementId - ID of target element
     * @param {string|number} value - Value to display
     * @param {string|number} fallback - Fallback if value is null/undefined
     */
    function setSafeText(elementId, value, fallback = '—') {
        const el = document.getElementById(elementId);
        if (el) {
            if (value !== null && value !== undefined && value !== '') {
                el.textContent = String(value);
            } else {
                el.textContent = String(fallback);
            }
        }
    }

    /**
     * Helper utility to safely query elements by selector and update text content.
     * 
     * @param {string} selector - CSS selector
     * @param {string|number} value - Value to display
     * @param {string|number} fallback - Fallback if value is null/undefined
     */
    function setSafeTextBySelector(selector, value, fallback = '—') {
        const el = document.querySelector(selector);
        if (el) {
            if (value !== null && value !== undefined && value !== '') {
                el.textContent = String(value);
            } else {
                el.textContent = String(fallback);
            }
        }
    }

    /**
     * 1. Summary Cards Renderer
     * Updates top-level statistical metrics in existing dashboard cards.
     */
    function renderDashboardSummary(summaryData) {
        if (!summaryData) return;

        // Populate summary metrics by canonical DOM IDs if present
        setSafeText('total-students', summaryData.totalStudents ?? summaryData.studentsCount);
        setSafeText('total-faculty', summaryData.totalFaculty ?? summaryData.facultyCount);
        setSafeText('total-classes', summaryData.totalClasses ?? summaryData.classesCount);
        setSafeText('total-courses', summaryData.totalCourses ?? summaryData.coursesCount);
        setSafeText('overall-attendance', summaryData.attendanceRate ?? summaryData.attendancePercentage ? `${summaryData.attendanceRate || summaryData.attendancePercentage}%` : null, '0%');
        setSafeText('overall-results', summaryData.passPercentage ? `${summaryData.passPercentage}%` : null, '0%');
        setSafeText('pending-approvals-count', summaryData.pendingApprovals ?? summaryData.approvalsCount);
        setSafeText('notifications-count', summaryData.unreadNotifications ?? summaryData.notificationsCount);

        // Fallback checks using standard class selectors for summary metric cards
        setSafeTextBySelector('.card-total-students .stat-value', summaryData.totalStudents ?? summaryData.studentsCount);
        setSafeTextBySelector('.card-total-faculty .stat-value', summaryData.totalFaculty ?? summaryData.facultyCount);
        setSafeTextBySelector('.card-total-classes .stat-value', summaryData.totalClasses ?? summaryData.classesCount);
        setSafeTextBySelector('.card-total-courses .stat-value', summaryData.totalCourses ?? summaryData.coursesCount);
    }

    /**
     * 2. Attendance Overview Renderer
     */
    function renderAttendance(attendanceData) {
        if (!attendanceData) return;

        setSafeText('attendance-total-records', attendanceData.totalRecords);
        setSafeText('attendance-present-count', attendanceData.present);
        setSafeText('attendance-absent-count', attendanceData.absent);
        
        const pct = attendanceData.attendancePercentage ?? attendanceData.percentage;
        setSafeText('attendance-percentage', pct !== undefined && pct !== null ? `${pct}%` : null, '0%');
    }

    /**
     * 3. Academic Results Renderer
     */
    function renderResults(resultsData) {
        if (!resultsData) return;

        setSafeText('results-total-count', resultsData.totalResults);
        setSafeText('results-average-score', resultsData.averageScore);
        setSafeText('results-passed-count', resultsData.passed);
        setSafeText('results-failed-count', resultsData.failed);

        const passPct = resultsData.passPercentage ?? resultsData.percentage;
        setSafeText('results-pass-percentage', passPct !== undefined && passPct !== null ? `${passPct}%` : null, '0%');
    }

    /**
     * 4. Upcoming Classes Renderer
     */
    function renderUpcomingClasses(upcomingClasses) {
        const container = document.getElementById('upcoming-classes-list') || 
                          document.getElementById('today-schedule-list') ||
                          document.querySelector('.upcoming-classes-container');

        if (!container) return;

        container.innerHTML = ''; // Clear container for dynamic list mapping

        if (!Array.isArray(upcomingClasses) || upcomingClasses.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state-item text-muted p-3 text-center';
            emptyState.textContent = 'No upcoming classes';
            container.appendChild(emptyState);
            return;
        }

        const fragment = document.createDocumentFragment();
        upcomingClasses.forEach((cls) => {
            const item = document.createElement('div');
            item.className = 'upcoming-class-item class-card p-2 mb-2 border-bottom';

            const title = document.createElement('strong');
            title.className = 'class-title d-block';
            title.textContent = cls.subject || cls.title || cls.courseName || 'Class Session';

            const meta = document.createElement('small');
            meta.className = 'class-meta text-muted d-block';
            const timeStr = cls.time || cls.scheduleTime || 'Scheduled';
            const roomStr = cls.room || cls.location ? ` | Room: ${cls.room || cls.location}` : '';
            const deptStr = cls.department ? ` | Dept: ${cls.department}` : '';
            meta.textContent = `${timeStr}${roomStr}${deptStr}`;

            item.appendChild(title);
            item.appendChild(meta);
            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }

    /**
     * 5. Announcements Renderer
     */
    function renderAnnouncements(announcements) {
        const container = document.getElementById('announcements-list') || 
                          document.querySelector('.announcements-container');

        if (!container) return;

        container.innerHTML = '';

        if (!Array.isArray(announcements) || announcements.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state-item text-muted p-3 text-center';
            emptyState.textContent = 'No announcements';
            container.appendChild(emptyState);
            return;
        }

        const fragment = document.createDocumentFragment();
        announcements.forEach((ann) => {
            const item = document.createElement('div');
            item.className = 'announcement-item p-2 mb-2 border-bottom';

            const title = document.createElement('h6');
            title.className = 'announcement-title mb-1';
            title.textContent = ann.title || 'Announcement';

            const body = document.createElement('p');
            body.className = 'announcement-body small text-secondary mb-1';
            body.textContent = ann.content || ann.message || ann.body || '';

            const meta = document.createElement('small');
            meta.className = 'announcement-meta text-muted d-block';
            const dateStr = ann.date || ann.timestamp || ann.createdAt || '';
            const deptStr = ann.department ? ` | ${ann.department}` : '';
            meta.textContent = `${dateStr}${deptStr}`;

            item.appendChild(title);
            if (body.textContent) item.appendChild(body);
            item.appendChild(meta);
            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }

    /**
     * 6. Notifications Renderer
     */
    function renderNotifications(notifications) {
        const container = document.getElementById('notifications-list') || 
                          document.querySelector('.notifications-container');

        if (!container) return;

        container.innerHTML = '';

        if (!Array.isArray(notifications) || notifications.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state-item text-muted p-3 text-center';
            emptyState.textContent = 'No new notifications';
            container.appendChild(emptyState);
            return;
        }

        const fragment = document.createDocumentFragment();
        notifications.forEach((notif) => {
            const item = document.createElement('div');
            item.className = `notification-item p-2 mb-1 ${notif.read ? 'read' : 'unread font-weight-bold'}`;

            const text = document.createElement('span');
            text.className = 'notification-text d-block small';
            text.textContent = notif.message || notif.title || 'Notification';

            const time = document.createElement('small');
            time.className = 'notification-time text-muted d-block';
            time.textContent = notif.timestamp || notif.time || '';

            item.appendChild(text);
            if (time.textContent) item.appendChild(time);
            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }

    /**
     * 7. Messages Renderer
     */
    function renderMessages(messages) {
        const container = document.getElementById('recent-messages-list') || 
                          document.getElementById('messages-list') ||
                          document.querySelector('.messages-container');

        if (!container) return;

        container.innerHTML = '';

        if (!Array.isArray(messages) || messages.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state-item text-muted p-3 text-center';
            emptyState.textContent = 'No recent messages';
            container.appendChild(emptyState);
            return;
        }

        const fragment = document.createDocumentFragment();
        messages.forEach((msg) => {
            const item = document.createElement('div');
            item.className = 'message-item p-2 mb-1 border-bottom';

            const sender = document.createElement('strong');
            sender.className = 'message-sender d-block small';
            sender.textContent = msg.sender || msg.from || 'Unknown Sender';

            const snippet = document.createElement('span');
            snippet.className = 'message-snippet text-muted d-block small text-truncate';
            snippet.textContent = msg.text || msg.content || msg.subject || '';

            item.appendChild(sender);
            item.appendChild(snippet);
            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }

    /**
     * 8. Pending Approvals Renderer
     */
    function renderApprovals(approvals) {
        const container = document.getElementById('pending-approvals-list') || 
                          document.getElementById('approvals-list') ||
                          document.querySelector('.approvals-container');

        if (!container) return;

        container.innerHTML = '';

        if (!Array.isArray(approvals) || approvals.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state-item text-muted p-3 text-center';
            emptyState.textContent = 'No pending approvals';
            container.appendChild(emptyState);
            return;
        }

        const fragment = document.createDocumentFragment();
        approvals.forEach((app) => {
            const item = document.createElement('div');
            item.className = 'approval-item p-2 mb-2 border-left-warning';

            const title = document.createElement('span');
            title.className = 'approval-title d-block small font-weight-bold';
            title.textContent = app.title || app.requestType || 'Pending Approval';

            const requester = document.createElement('small');
            requester.className = 'approval-requester text-muted d-block';
            requester.textContent = `Requested by: ${app.requestedBy || app.applicant || 'N/A'}`;

            item.appendChild(title);
            item.appendChild(requester);
            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }

    var _renderDone = false;
    var _waitingForData = false;

    /**
     * Orchestrates rendering of all dashboard components from a single data source object.
     * 
     * @param {Object} data - Result of getDashboardData()
     */
    function renderDashboard(data) {
        if (!data) return;

        renderDashboardSummary(data.summary);
        renderAttendance(data.attendance);
        renderResults(data.results);
        renderUpcomingClasses(data.upcomingClasses);
        renderAnnouncements(data.announcements);
        renderNotifications(data.notifications);
        renderMessages(data.messages);
        renderApprovals(data.approvals);
    }

    /**
     * Entry Point: Fetch data from dashboard.js and populate the UI.
     * Safely checks for UIState and getDashboardData availability.
     */
    function initializeDashboardUI() {
        if (typeof window.UIState === 'undefined') {
            console.warn('[dashboard-ui.js] UIState is not defined.');
        }

        if (typeof window.getDashboardData !== 'function') {
            console.warn('[dashboard-ui.js] getDashboardData() function from dashboard.js is missing.');
            return;
        }

        try {
            const data = window.getDashboardData();
            if (data) {
                renderDashboard(data);
                _renderDone = true;
            } else if (typeof window.onDashboardDataReady === 'function' && !_waitingForData) {
                _waitingForData = true;
                window.onDashboardDataReady(function (readyData) {
                    _waitingForData = false;
                    if (!_renderDone) {
                        renderDashboard(readyData);
                        _renderDone = true;
                    }
                });
            }
        } catch (error) {
            console.error('[dashboard-ui.js] Error initializing Dashboard UI:', error);
        }
    }

    /**
     * Re-fetches the dashboard data and updates all UI elements without reloading the page.
     */
    function refreshDashboardUI() {
        initializeDashboardUI();
    }

    // Expose public API functions globally
    window.initializeDashboardUI = initializeDashboardUI;
    window.refreshDashboardUI = refreshDashboardUI;
    window.renderDashboardUI = renderDashboard;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboardUI);
    } else {
        initializeDashboardUI();
    }

    if (typeof window.addEventListener === 'function') {
        window.addEventListener('dashboardDataReady', function (e) {
            if (_renderDone) return;
            try { renderDashboard(e.detail); _renderDone = true; } catch (err) {
                console.error('[dashboard-ui.js] Error on async data update:', err);
            }
        });
    }

})();