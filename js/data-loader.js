// Data Loader and Manager for Business Analytics Hub
class DataLoader {
    constructor() {
        this.coursesData = null;
        this.teachersData = null;
        this.lecturesData = null;
        this.userProgress = null;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
        this.cache = {};
    }

    // Initialize data loading
    async init() {
        try {
            await Promise.all([
                this.loadCourses(),
                this.loadTeachers(),
                this.loadLectures(),
                this.loadUserProgress()
            ]);
            console.log('All data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    // Load courses data
    async loadCourses() {
        const cacheKey = 'courses';
        if (this.isCacheValid(cacheKey)) {
            this.coursesData = this.cache[cacheKey].data;
            return;
        }

        try {
            const response = await fetch('data/courses.json');
            if (!response.ok) throw new Error('Failed to load courses data');
            
            this.coursesData = await response.json();
            this.updateCache(cacheKey, this.coursesData);
        } catch (error) {
            console.error('Error loading courses:', error);
            // Fallback to empty data
            this.coursesData = { semesters: [] };
        }
    }

    // Load teachers data
    async loadTeachers() {
        const cacheKey = 'teachers';
        if (this.isCacheValid(cacheKey)) {
            this.teachersData = this.cache[cacheKey].data;
            return;
        }

        try {
            const response = await fetch('data/teachers.json');
            if (!response.ok) throw new Error('Failed to load teachers data');
            
            this.teachersData = await response.json();
            this.updateCache(cacheKey, this.teachersData);
        } catch (error) {
            console.error('Error loading teachers:', error);
            this.teachersData = { teachers: [] };
        }
    }

    // Load lectures data
    async loadLectures() {
        const cacheKey = 'lectures';
        if (this.isCacheValid(cacheKey)) {
            this.lecturesData = this.cache[cacheKey].data;
            return;
        }

        try {
            const response = await fetch('data/lectures.json');
            if (!response.ok) throw new Error('Failed to load lectures data');
            
            this.lecturesData = await response.json();
            this.updateCache(cacheKey, this.lecturesData);
        } catch (error) {
            console.error('Error loading lectures:', error);
            this.lecturesData = { courses: {} };
        }
    }

    // Load user progress from localStorage
    async loadUserProgress() {
        try {
            const saved = localStorage.getItem('bahub_user_progress');
            if (saved) {
                this.userProgress = JSON.parse(saved);
            } else {
                // Initialize with default progress
                this.userProgress = this.initializeDefaultProgress();
                this.saveUserProgress();
            }
        } catch (error) {
            console.error('Error loading user progress:', error);
            this.userProgress = this.initializeDefaultProgress();
        }
    }

    // Initialize default progress
    initializeDefaultProgress() {
        return {
            completedLectures: [],
            lastAccessed: {
                course: 'BA101',
                lecture: 1
            },
            preferences: {
                theme: 'light',
                fontSize: 'medium',
                autoSave: true
            },
            bookmarks: [],
            notes: {}
        };
    }

    // Save user progress to localStorage
    saveUserProgress() {
        try {
            localStorage.setItem('bahub_user_progress', JSON.stringify(this.userProgress));
            return true;
        } catch (error) {
            console.error('Error saving user progress:', error);
            return false;
        }
    }

    // Cache management
    updateCache(key, data) {
        this.cache[key] = {
            data: data,
            timestamp: Date.now()
        };
    }

    isCacheValid(key) {
        if (!this.cache[key]) return false;
        return Date.now() - this.cache[key].timestamp < this.cacheDuration;
    }

    // Clear cache
    clearCache() {
        this.cache = {};
    }

    // Get all semesters
    getAllSemesters() {
        return this.coursesData?.semesters || [];
    }

    // Get semester by ID
    getSemester(id) {
        const semesterId = parseInt(id);
        return this.coursesData?.semesters?.find(s => s.id === semesterId) || null;
    }

    // Get course by ID
    getCourse(courseId) {
        if (!this.coursesData?.semesters) return null;
        
        for (const semester of this.coursesData.semesters) {
            const course = semester.courses.find(c => c.id === courseId);
            if (course) {
                course.semester = semester;
                return course;
            }
        }
        return null;
    }

    // Get teacher by name or course
    getTeacher(identifier) {
        if (!this.teachersData?.teachers) return null;
        
        // If identifier is a course ID, find teacher teaching that course
        if (identifier.startsWith('BA')) {
            return this.teachersData.teachers.find(t => 
                t.courses.includes(identifier)
            ) || null;
        }
        
        // Otherwise search by name
        return this.teachersData.teachers.find(t => 
            t.name.toLowerCase().includes(identifier.toLowerCase()) ||
            t.id === identifier
        ) || null;
    }

    // Get lectures for a course
    getLectures(courseId) {
        return this.lecturesData?.courses?.[courseId]?.lectures || [];
    }

    // Get lecture details
    getLecture(courseId, lectureId) {
        const lectures = this.getLectures(courseId);
        return lectures.find(l => l.id === parseInt(lectureId)) || null;
    }

    // Get course progress
    getCourseProgress(courseId) {
        const lectures = this.getLectures(courseId);
        if (lectures.length === 0) return { completed: 0, total: 0, percentage: 0 };
        
        const completed = lectures.filter(l => l.status === 'completed').length;
        const total = lectures.length;
        const percentage = Math.round((completed / total) * 100);
        
        return { completed, total, percentage };
    }

    // Get semester progress
    getSemesterProgress(semesterId) {
        const semester = this.getSemester(semesterId);
        if (!semester) return { completed: 0, total: 0, percentage: 0 };
        
        let totalLectures = 0;
        let completedLectures = 0;
        
        semester.courses.forEach(course => {
            const progress = this.getCourseProgress(course.id);
            totalLectures += progress.total;
            completedLectures += progress.completed;
        });
        
        const percentage = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
        
        return { completed: completedLectures, total: totalLectures, percentage };
    }

    // Update lecture status
    updateLectureStatus(courseId, lectureId, status) {
        // Update in-memory data
        const lecture = this.getLecture(courseId, lectureId);
        if (lecture) {
            lecture.status = status;
            
            // Update user progress
            if (status === 'completed') {
                if (!this.userProgress.completedLectures.includes(`${courseId}-${lectureId}`)) {
                    this.userProgress.completedLectures.push(`${courseId}-${lectureId}`);
                }
            } else {
                this.userProgress.completedLectures = this.userProgress.completedLectures.filter(
                    id => id !== `${courseId}-${lectureId}`
                );
            }
            
            // Save to localStorage
            this.saveUserProgress();
            
            // Update last accessed
            this.userProgress.lastAccessed = { course: courseId, lecture: lectureId };
            
            return true;
        }
        return false;
    }

    // Add bookmark
    addBookmark(courseId, lectureId, note = '') {
        const bookmark = {
            id: `${courseId}-${lectureId}-${Date.now()}`,
            courseId,
            lectureId,
            note,
            timestamp: new Date().toISOString()
        };
        
        this.userProgress.bookmarks.push(bookmark);
        this.saveUserProgress();
        return bookmark;
    }

    // Remove bookmark
    removeBookmark(bookmarkId) {
        this.userProgress.bookmarks = this.userProgress.bookmarks.filter(
            b => b.id !== bookmarkId
        );
        this.saveUserProgress();
    }

    // Save note for lecture
    saveNote(courseId, lectureId, note) {
        if (!this.userProgress.notes[courseId]) {
            this.userProgress.notes[courseId] = {};
        }
        this.userProgress.notes[courseId][lectureId] = note;
        this.saveUserProgress();
    }

    // Get note for lecture
    getNote(courseId, lectureId) {
        return this.userProgress.notes?.[courseId]?.[lectureId] || '';
    }

    // Search courses and lectures
    search(query) {
        const results = {
            courses: [],
            lectures: [],
            teachers: []
        };
        
        if (!query || query.trim() === '') return results;
        
        const searchTerm = query.toLowerCase().trim();
        
        // Search courses
        if (this.coursesData?.semesters) {
            this.coursesData.semesters.forEach(semester => {
                semester.courses.forEach(course => {
                    if (course.name.toLowerCase().includes(searchTerm) ||
                        course.description.toLowerCase().includes(searchTerm) ||
                        course.code.toLowerCase().includes(searchTerm)) {
                        results.courses.push({
                            ...course,
                            semester: semester.name
                        });
                    }
                });
            });
        }
        
        // Search lectures
        if (this.lecturesData?.courses) {
            Object.entries(this.lecturesData.courses).forEach(([courseId, courseData]) => {
                courseData.lectures.forEach(lecture => {
                    if (lecture.title.toLowerCase().includes(searchTerm) ||
                        lecture.keywords?.some(kw => kw.toLowerCase().includes(searchTerm))) {
                        results.lectures.push({
                            ...lecture,
                            courseId,
                            courseName: this.getCourse(courseId)?.name || courseId
                        });
                    }
                });
            });
        }
        
        // Search teachers
        if (this.teachersData?.teachers) {
            this.teachersData.teachers.forEach(teacher => {
                if (teacher.name.toLowerCase().includes(searchTerm) ||
                    teacher.department.toLowerCase().includes(searchTerm) ||
                    teacher.qualification.toLowerCase().includes(searchTerm)) {
                    results.teachers.push(teacher);
                }
            });
        }
        
        return results;
    }

    // Get statistics
    getStatistics() {
        let totalCourses = 0;
        let totalLectures = 0;
        let completedLectures = 0;
        let totalTeachers = new Set();
        
        // Count from courses data
        if (this.coursesData?.semesters) {
            this.coursesData.semesters.forEach(semester => {
                totalCourses += semester.courses.length;
                semester.courses.forEach(course => {
                    const teacher = this.getTeacher(course.id);
                    if (teacher) totalTeachers.add(teacher.id);
                    
                    const progress = this.getCourseProgress(course.id);
                    totalLectures += progress.total;
                    completedLectures += progress.completed;
                });
            });
        }
        
        return {
            totalCourses,
            totalLectures,
            completedLectures,
            totalTeachers: totalTeachers.size,
            completionRate: totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0
        };
    }

    // Export all data as JSON
    exportData() {
        return {
            courses: this.coursesData,
            lectures: this.lecturesData,
            teachers: this.teachersData,
            userProgress: this.userProgress,
            statistics: this.getStatistics(),
            exportedAt: new Date().toISOString()
        };
    }

    // Import data
    importData(data) {
        try {
            if (data.courses) this.coursesData = data.courses;
            if (data.lectures) this.lecturesData = data.lectures;
            if (data.teachers) this.teachersData = data.teachers;
            if (data.userProgress) this.userProgress = data.userProgress;
            
            this.clearCache();
            this.saveUserProgress();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global instance
window.DataManager = new DataLoader();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await DataManager.init();
    
    // Dispatch custom event when data is loaded
    document.dispatchEvent(new CustomEvent('dataLoaded', {
        detail: { success: true }
    }));
    
    // Update statistics on home page
    updateStatistics();
});

// Update statistics on home page
function updateStatistics() {
    const stats = DataManager.getStatistics();
    
    // Update stats on home page if elements exist
    const elements = {
        'total-courses': stats.totalCourses,
        'total-lectures': stats.totalLectures,
        'completed-lectures': stats.completedLectures,
        'completion-rate': `${stats.completionRate}%`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Helper function to format numbers
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// Export utility functions
window.BAHubData = {
    DataManager,
    updateStatistics,
    formatNumber
};