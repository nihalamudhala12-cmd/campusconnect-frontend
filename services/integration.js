/**
 * CampusConnect — Integration / DTO Mapping Layer
 * File: services/integration.js
 *
 * Bridges backend DTOs → frontend DataModels format.
 * Orchestrates API calls per module.
 * NO business logic — pure mapping and orchestration.
 */

(function () {
    'use strict';

    // =====================================================================
    // DTO → Frontend Mappers
    // Maps backend camelCase DTO fields to frontend DataModels fields.
    // =====================================================================

    function mapUser(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            name: dto.name,
            email: dto.email,
            role: dto.role,
            departmentId: dto.departmentId,
            status: dto.status,
            createdAt: dto.createdAt,
        };
    }

    function mapDepartment(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            name: dto.name,
            code: dto.code,
            description: dto.description,
            status: dto.status,
            createdBy: dto.createdBy,
            createdAt: dto.createdAt,
        };
    }

    function mapClass(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            name: dto.name,
            code: dto.code,
            departmentId: dto.departmentId,
            semester: dto.semester,
            section: dto.section,
            status: dto.status,
            academicYear: dto.academicYear,
            createdAt: dto.createdAt,
        };
    }

    function mapAttendance(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            studentId: dto.studentId,
            facultyId: dto.facultyId,
            classId: dto.classId,
            courseId: dto.courseId,
            status: dto.status,
            date: dto.attendanceDate || dto.date,
            remarks: dto.remarks,
            createdAt: dto.createdAt,
        };
    }

    function mapResult(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            studentId: dto.studentId,
            courseId: dto.courseId,
            assessmentType: dto.assessmentType,
            marks: dto.marksObtained,
            maximumMarks: dto.maxMarks,
            grade: dto.grade,
            status: dto.status,
            createdAt: dto.createdAt,
        };
    }

    function mapAnnouncement(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            title: dto.title,
            content: dto.content,
            createdBy: dto.createdBy,
            departmentId: dto.departmentId,
            audience: dto.audience,
            priority: dto.priority,
            status: dto.status,
            type: dto.type,
            createdAt: dto.createdAt,
            publishAt: dto.publishAt,
        };
    }

    function mapApproval(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            type: dto.type,
            requestedBy: dto.requestedBy,
            departmentId: dto.departmentId,
            description: dto.description,
            status: dto.status,
            reviewedBy: dto.reviewedBy,
            reviewedAt: dto.reviewedAt,
            remarks: dto.remarks,
            createdAt: dto.createdAt,
        };
    }

    function mapNotification(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            userId: dto.userId,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            relatedAnnouncementId: dto.relatedAnnouncementId,
            isRead: dto.isRead,
            read: dto.isRead,
            priority: dto.priority,
            createdAt: dto.createdAt,
            timestamp: dto.createdAt,
            time: dto.createdAt,
        };
    }

    function mapMessage(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            senderId: dto.senderId,
            receiverId: dto.receiverId,
            subject: dto.subject,
            content: dto.body,
            body: dto.body,
            isRead: dto.isRead,
            read: dto.isRead,
            createdAt: dto.createdAt,
            timestamp: dto.createdAt,
        };
    }

    function mapFaculty(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            userId: dto.userId,
            employeeId: dto.employeeId,
            name: dto.userName || dto.name,
            email: dto.userEmail || dto.email,
            departmentId: dto.departmentId,
            designation: dto.designation,
            status: dto.status,
            createdAt: dto.createdAt,
        };
    }

    function mapStudent(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            userId: dto.userId,
            name: dto.userName || dto.name,
            email: dto.userEmail || dto.email,
            departmentId: dto.departmentId,
            rollNumber: dto.rollNumber,
            admissionNumber: dto.admissionNumber,
            semester: dto.semester,
            status: dto.status,
            createdAt: dto.createdAt,
        };
    }

    function mapAnalytics(dto, type) {
        if (!dto) return null;
        if (type === 'attendance' || dto.attendance) {
            return {
                totalRecords: dto.totalRecords || 0,
                present: dto.present || 0,
                absent: dto.absent || 0,
                attendancePercentage: dto.attendancePercentage || dto.percentage || '0',
            };
        }
        if (type === 'results' || dto.averageScore !== undefined || dto.passPercentage !== undefined) {
            return {
                totalResults: dto.totalResults || 0,
                averageScore: dto.averageScore || '0',
                passed: dto.passed || 0,
                failed: dto.failed || 0,
                passPercentage: dto.passPercentage || dto.percentage || '0',
            };
        }
        if (dto.labels && dto.datasets) {
            return {
                labels: dto.labels,
                datasets: dto.datasets,
            };
        }
        return dto;
    }

    function mapChat(dto) {
        if (!dto) return null;
        return {
            id: dto.id || dto.roomId,
            roomId: dto.roomId || dto.id,
            name: dto.name,
            type: dto.type,
            departmentId: dto.departmentId,
            participantIds: dto.participantIds || [],
            lastMessage: dto.lastMessage ? mapChatMessage(dto.lastMessage) : null,
            unreadCount: dto.unreadCount || 0,
            updatedAt: dto.updatedAt,
            createdAt: dto.createdAt,
        };
    }

    function mapChatMessage(dto) {
        if (!dto) return null;
        return {
            id: dto.id,
            roomId: dto.roomId,
            senderId: dto.senderId,
            content: dto.content || dto.message,
            isRead: dto.isRead || dto.read || false,
            createdAt: dto.createdAt,
            timestamp: dto.createdAt,
        };
    }

    // =====================================================================
    // Module API Wrappers
    // =====================================================================

    function getSessionInfo() {
        if (Auth && typeof Auth.isAuthenticated === 'function' && Auth.isAuthenticated()) {
            return Promise.resolve(Auth.getUser());
        }
        return Promise.resolve(null);
    }

    async function getDashboardSummary() {
        const token = Auth.getToken();
        if (!token) return null;

        const results = await Promise.allSettled([
            API.get('/students', { limit: 1 }),
            API.get('/faculties', { limit: 1 }),
            API.get('/classes', { limit: 1 }),
            API.get('/attendance', { limit: 1 }),
            API.get('/results', { limit: 1 }),
            API.get('/announcements', { limit: 1 }),
            API.get('/notifications', { limit: 1 }),
            API.get('/approvals/pending'),
        ]);

        const studentData = results[0].status === 'fulfilled' ? results[0].value : null;
        const facultyData = results[1].status === 'fulfilled' ? results[1].value : null;
        const classData = results[2].status === 'fulfilled' ? results[2].value : null;
        const attendanceData = results[3].status === 'fulfilled' ? results[3].value : null;
        const resultData = results[4].status === 'fulfilled' ? results[4].value : null;
        const announcementData = results[5].status === 'fulfilled' ? results[5].value : null;
        const notificationData = results[6].status === 'fulfilled' ? results[6].value : null;
        const approvalData = results[7].status === 'fulfilled' ? results[7].value : null;

        return {
            totalStudents: (studentData && studentData.meta && studentData.meta.total) || (studentData && studentData.data && studentData.data.length) || 0,
            totalFaculty: (facultyData && facultyData.meta && facultyData.meta.total) || (facultyData && facultyData.data && facultyData.data.length) || 0,
            totalClasses: (classData && classData.meta && classData.meta.total) || (classData && classData.data && classData.data.length) || 0,
            attendanceRate: '0',
            attendancePercentage: '0',
            pendingApprovals: (approvalData && approvalData.data && approvalData.data.length) || 0,
            approvalsCount: (approvalData && approvalData.data && approvalData.data.length) || 0,
            unreadNotifications: (notificationData && notificationData.data && notificationData.data.length) || 0,
            notificationsCount: (notificationData && notificationData.data && notificationData.data.length) || 0,
            studentsCount: (studentData && studentData.meta && studentData.meta.total) || (studentData && studentData.data && studentData.data.length) || 0,
            facultyCount: (facultyData && facultyData.meta && facultyData.meta.total) || (facultyData && facultyData.data && facultyData.data.length) || 0,
            summary: {
                totalStudents: (studentData && studentData.meta && studentData.meta.total) || (studentData && studentData.data && studentData.data.length) || 0,
                totalFaculty: (facultyData && facultyData.meta && facultyData.meta.total) || (facultyData && facultyData.data && facultyData.data.length) || 0,
                pendingApprovals: (approvalData && approvalData.data && approvalData.data.length) || 0,
                unreadNotifications: (notificationData && notificationData.data && notificationData.data.length) || 0,
            },
            attendance: {
                totalRecords: 0,
                present: 0,
                absent: 0,
                attendancePercentage: '0',
            },
            results: {
                totalResults: 0,
                averageScore: '0',
                passed: 0,
                failed: 0,
                passPercentage: '0',
            },
            announcements: (announcementData && announcementData.data) || [],
            notifications: (notificationData && notificationData.data) || [],
            approvals: (approvalData && approvalData.data) || [],
        };
    }

    async function getStudents(options) {
        const query = options || {};
        const result = await API.get('/students', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapStudent),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getFaculties(options) {
        const query = options || {};
        const result = await API.get('/faculties', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapFaculty),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getClasses(options) {
        const query = options || {};
        const result = await API.get('/classes', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapClass),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getAttendances(options) {
        const query = options || {};
        const result = await API.get('/attendance', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapAttendance),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getResults(options) {
        const query = options || {};
        const result = await API.get('/results', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapResult),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getAnnouncements(options) {
        const query = options || {};
        const result = await API.get('/announcements', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapAnnouncement),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getMessages(options) {
        const query = options || {};
        const result = await API.get('/messages', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapMessage),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getNotifications(options) {
        const query = options || {};
        const result = await API.get('/notifications', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapNotification),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getDepartments(options) {
        const query = options || {};
        const result = await API.get('/departments', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapDepartment),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getChat(options) {
        const query = options || {};
        const result = await API.get('/chat', query);
        if (result && result.data) {
            return {
                data: result.data.map(mapChat),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getApprovals(options) {
        const query = options || {};
        let path = '/approvals';
        if (options && options.status === 'pending') {
            path = '/approvals/pending';
        } else if (options && options.me) {
            path = '/approvals/me';
        }
        const result = await API.get(path, query);
        if (result && result.data) {
            return {
                data: result.data.map(mapApproval),
                meta: result.meta,
            };
        }
        return { data: [], meta: {} };
    }

    async function getAnalytics(type, options) {
        const validTypes = ['student-performance', 'faculty-stats', 'attendance', 'results', 'department-comparison'];
        const analyticsType = validTypes.indexOf(type) !== -1 ? type : 'student-performance';
        const result = await API.get('/analytics/' + analyticsType, options || {});
        if (result && result.data) {
            if (Array.isArray(result.data)) {
                return result.data.map(function (d) { return mapAnalytics(d, analyticsType); });
            }
            return mapAnalytics(result.data, analyticsType);
        }
        return null;
    }

    async function createAnnouncement(data) {
        return API.post('/announcements', data);
    }

    async function createMessage(data) {
        return API.post('/messages', data);
    }

    async function createResult(data) {
        return API.post('/results', data);
    }

    async function createAttendance(data) {
        return API.post('/attendance', data);
    }

    async function updateAnnouncement(id, data) {
        return API.put('/announcements/' + encodeURIComponent(id), data);
    }

    async function updateMessage(id, data) {
        return API.put('/messages/' + encodeURIComponent(id), data);
    }

    // Approvals are mutated through the dedicated review action. The backend
    // exposes PUT /approvals/:id/review (module: approvals) — there is no
    // generic PUT /approvals/:id route.
    async function updateApproval(id, data) {
        return API.put('/approvals/' + encodeURIComponent(id) + '/review', data);
    }

    async function updateResult(id, data) {
        return API.put('/results/' + encodeURIComponent(id), data);
    }

    async function updateAttendance(id, data) {
        return API.put('/attendance/' + encodeURIComponent(id), data);
    }

    async function deleteAnnouncement(id) {
        return API.delete('/announcements/' + encodeURIComponent(id));
    }

    async function deleteMessage(id) {
        return API.delete('/messages/' + encodeURIComponent(id));
    }

    async function deleteApproval(id) {
        return API.delete('/approvals/' + encodeURIComponent(id));
    }

    async function deleteResult(id) {
        return API.delete('/results/' + encodeURIComponent(id));
    }

    async function deleteAttendance(id) {
        return API.delete('/attendance/' + encodeURIComponent(id));
    }

    async function updateNotification(id, data) {
        return API.put('/notifications/' + encodeURIComponent(id), data);
    }

    // Marks a notification as read. Maps to the canonical backend route
    // PATCH /notifications/:id/read (module: notifications).
    async function updateNotificationRead(id) {
        return API.patch('/notifications/' + encodeURIComponent(id) + '/read');
    }

    async function deleteNotification(id) {
        return API.delete('/notifications/' + encodeURIComponent(id));
    }

    async function updateUser(id, data) {
        return API.put('/users/' + encodeURIComponent(id), data);
    }

    async function deleteUser(id) {
        return API.delete('/users/' + encodeURIComponent(id));
    }

    async function updateFaculty(id, data) {
        return API.put('/faculties/' + encodeURIComponent(id), data);
    }

    async function deleteFaculty(id) {
        return API.delete('/faculties/' + encodeURIComponent(id));
    }

    async function updateStudent(id, data) {
        return API.put('/students/' + encodeURIComponent(id), data);
    }

    async function deleteStudent(id) {
        return API.delete('/students/' + encodeURIComponent(id));
    }

    async function updateClass(id, data) {
        return API.put('/classes/' + encodeURIComponent(id), data);
    }

    async function deleteClass(id) {
        return API.delete('/classes/' + encodeURIComponent(id));
    }


    // =====================================================================
    // Canonical DataModels Initialization
    // This is the SINGLE authoritative runtime path for window.DataModels.
    // Backend-backed ERP data flows through this function only.
    // =====================================================================
    function initializeDataModels() {
        if (typeof window.DataModels === 'undefined' || !window.DataModels) {
            window.DataModels = {
                users: [],
                departments: [],
                faculty: [],
                students: [],
                classes: [],
                courses: [],
                attendance: [],
                results: [],
                timetable: [],
                messages: [],
                chatRooms: [],
                announcements: [],
                approvals: [],
                notifications: [],

                getUserById: function(id) { return this.users.find(u => u.id === id) || null; },
                getStudentById: function(id) { return this.students.find(s => s.id === id) || null; },
                getFacultyById: function(id) { return this.faculty.find(f => f.id === id) || null; },
                getDepartmentById: function(id) { return this.departments.find(d => d.id === id) || null; },
                getDepartmentByCode: function(code) { return this.departments.find(d => d.code.toLowerCase() === code.toLowerCase()) || null; },
                getCourseById: function(id) { return this.courses.find(c => c.id === id) || null; },
                getClassById: function(id) { return this.classes.find(c => c.id === id) || null; },

                getStudentsByDepartment: function(deptId) { return this.students.filter(s => s.departmentId === deptId); },
                getFacultyByDepartment: function(deptId) { return this.faculty.filter(f => f.departmentId === deptId); },
                getCoursesByDepartment: function(deptId) { return this.courses.filter(c => c.departmentId === deptId); }
            };
        }
        // Ensure all expected arrays exist (defensive)
        ['users','departments','faculty','students','classes','courses','attendance','results','timetable','messages','chatRooms','announcements','approvals','notifications'].forEach(function(key) {
            if (!Array.isArray(window.DataModels[key])) window.DataModels[key] = [];
        });
        return window.DataModels;
    }

    function populateDataModels(summaryData) {
        if (!summaryData) return window.DataModels;
        // Populate from backend-backed summary data
        if (summaryData.studentsCount !== undefined) window.DataModels.users = window.DataModels.users || [];
        if (summaryData.facultyCount !== undefined) window.DataModels.faculty = window.DataModels.faculty || [];
        // Arrays are populated by individual module fetches (getStudents, getFaculties, etc.)
        return window.DataModels;
    }

    const Integration = {
        mapUser: mapUser,
        mapDepartment: mapDepartment,
        mapClass: mapClass,
        mapAttendance: mapAttendance,
        mapResult: mapResult,
        mapAnnouncement: mapAnnouncement,
        mapApproval: mapApproval,
        mapNotification: mapNotification,
        mapMessage: mapMessage,
        mapFaculty: mapFaculty,
        mapStudent: mapStudent,
        mapAnalytics: mapAnalytics,
        mapChat: mapChat,
        mapChatMessage: mapChatMessage,
        getDashboardSummary: getDashboardSummary,
        getSessionInfo: getSessionInfo,
        getStudents: getStudents,
        getFaculties: getFaculties,
        getClasses: getClasses,
        getAttendances: getAttendances,
        getResults: getResults,
        getAnnouncements: getAnnouncements,
        getMessages: getMessages,
        getNotifications: getNotifications,
        getDepartments: getDepartments,
        getChat: getChat,
        getApprovals: getApprovals,
        getAnalytics: getAnalytics,
        createAnnouncement: createAnnouncement,
        createMessage: createMessage,
        createResult: createResult,
        createAttendance: createAttendance,
        updateAnnouncement: updateAnnouncement,
        updateMessage: updateMessage,
        updateApproval: updateApproval,
        updateResult: updateResult,
        updateAttendance: updateAttendance,
        deleteAnnouncement: deleteAnnouncement,
        deleteMessage: deleteMessage,
        deleteApproval: deleteApproval,
        deleteResult: deleteResult,
        deleteAttendance: deleteAttendance,
        updateNotificationRead: updateNotificationRead,
        updateNotification: updateNotification,
        deleteNotification: deleteNotification,
        updateUser: updateUser,
        deleteUser: deleteUser,
        updateFaculty: updateFaculty,
        deleteFaculty: deleteFaculty,
        updateStudent: updateStudent,
        deleteStudent: deleteStudent,
        updateClass: updateClass,
        deleteClass: deleteClass,
    };

    Integration.initializeDataModels = initializeDataModels;
    Integration.populateDataModels = populateDataModels;

    window.Integration = Integration;

    // Auto-initialize DataModels on load (single canonical path)
    if (typeof window.DataModels === 'undefined') {
        initializeDataModels();
    }
})();
