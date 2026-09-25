/**
 * Campus Connect ERP - Data Models Layer
 * File: data-models.js
 * 
 * Strict Role Access: HOD, FACULTY
 * Architecture Layer: Data Models (Pure Frontend State/Storage, No Business Logic/UI/API)
 */

// ==================================================
// CENTRALIZED DATA MODEL STORE
// ==================================================
const DataModels = {
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
    notifications: []
};

// ==================================================
// INITIALIZATION
// ==================================================

// DataModels starts empty; populated from backend via Integration layer.
// The mockData constant has been removed - use services/integration.js
// for backend-backed data through the canonical window.DataModels path.

// ==================================================
// DATA ACCESS HELPERS (READ-ONLY)
// ==================================================
function getUserById(id) {
    return DataModels.users.find(user => user.id === id) || null;
}

function getDepartmentById(id) {
    return DataModels.departments.find(dept => dept.id === id) || null;
}

function getFacultyById(id) {
    return DataModels.faculty.find(fac => fac.id === id) || null;
}

function getStudentById(id) {
    return DataModels.students.find(student => student.id === id) || null;
}

function getClassById(id) {
    return DataModels.classes.find(cls => cls.id === id) || null;
}

function getCourseById(id) {
    return DataModels.courses.find(course => course.id === id) || null;
}

function getAttendanceByStudent(studentId) {
    return DataModels.attendance.filter(att => att.studentId === studentId);
}

function getResultsByStudent(studentId) {
    return DataModels.results.filter(res => res.studentId === studentId);
}

function getTimetableByClass(classId) {
    return DataModels.timetable.filter(tt => tt.classId === classId);
}