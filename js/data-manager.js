// Lecture Manager for handling lecture operations
class LectureManager {
    constructor() {
        this.currentCourse = null;
        this.currentLecture = null;
        this.totalLectures = 0;
        this.lectureList = [];
    }

    // Initialize for a course
    init(courseId) {
        this.currentCourse = courseId;
        this.lectureList = DataManager.getLectures(courseId);
        this.totalLectures = this.lectureList.length;
        return this.lectureList;
    }

    // Get specific lecture
    getLecture(lectureId) {
        return DataManager.getLecture(this.currentCourse, lectureId);
    }

    // Get next lecture
    getNextLecture(currentId) {
        const currentIndex = this.lectureList.findIndex(l => l.id === currentId);
        if (currentIndex < this.lectureList.length - 1) {
            return this.lectureList[currentIndex + 1];
        }
        return null;
    }

    // Get previous lecture
    getPreviousLecture(currentId) {
        const currentIndex = this.lectureList.findIndex(l => l.id === currentId);
        if (currentIndex > 0) {
            return this.lectureList[currentIndex - 1];
        }
        return null;
    }

    // Get lecture progress
    getLectureProgress(lectureId) {
        const lecture = this.getLecture(lectureId);
        if (!lecture) return 0;
        
        // Check if user has completed this lecture
        const isCompleted = DataManager.userProgress.completedLectures.includes(
            `${this.currentCourse}-${lectureId}`
        );
        
        // If lecture has resources, check if downloaded
        const hasResources = lecture.resources && lecture.resources.length > 0;
        const resourcesDownloaded = hasResources ? 
            this.checkResourcesDownloaded(lecture) : true;
        
        // Calculate progress (0-100)
        let progress = 0;
        if (isCompleted) progress += 70; // Completion gives 70%
        if (resourcesDownloaded) progress += 30; // Resources give 30%
        
        return Math.min(progress, 100);
    }

    // Check if resources are downloaded
    checkResourcesDownloaded(lecture) {
        // In a real app, check localStorage or IndexedDB
        // For now, return true if user has visited the lecture
        const visited = localStorage.getItem(`lecture_${this.currentCourse}_${lecture.id}_visited`);
        return visited === 'true';
    }

    // Mark lecture as visited
    markAsVisited(lectureId) {
        localStorage.setItem(`lecture_${this.currentCourse}_${lectureId}_visited`, 'true');
        
        // Also update last accessed
        DataManager.userProgress.lastAccessed = {
            course: this.currentCourse,
            lecture: lectureId
        };
        DataManager.saveUserProgress();
    }

    // Mark lecture as completed
    markAsCompleted(lectureId) {
        DataManager.updateLectureStatus(this.currentCourse, lectureId, 'completed');
        this.markAsVisited(lectureId);
        
        // Show completion notification
        this.showCompletionNotification(lectureId);
        
        // Update progress bars
        this.updateProgressDisplays();
    }

    // Mark lecture as in-progress
    markAsInProgress(lectureId) {
        DataManager.updateLectureStatus(this.currentCourse, lectureId, 'in-progress');
        this.markAsVisited(lectureId);
    }

    // Show completion notification
    showCompletionNotification(lectureId) {
        const lecture = this.getLecture(lectureId);
        if (!lecture) return;
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'completion-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Lecture Completed!</h4>
                    <p>Great job completing "${lecture.title}"</p>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        
        content.querySelector('i').style.cssText = `
            font-size: 2rem;
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: auto;
            padding: 0 0 0 15px;
        `;
        
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        document.body.appendChild(notification);
        
        // Add keyframes for animation
        if (!document.getElementById('notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Update progress displays on page
    updateProgressDisplays() {
        // Update progress bars
        const progressBars = document.querySelectorAll('.progress-fill-lecture');
        progressBars.forEach(bar => {
            const lectureId = bar.closest('[data-lecture-id]')?.dataset.lectureId;
            if (lectureId) {
                const progress = this.getLectureProgress(parseInt(lectureId));
                bar.style.width = `${progress}%`;
            }
        });
        
        // Update percentage displays
        const percentDisplays = document.querySelectorAll('.progress-percent');
        percentDisplays.forEach(display => {
            const lectureId = display.closest('[data-lecture-id]')?.dataset.lectureId;
            if (lectureId) {
                const progress = this.getLectureProgress(parseInt(lectureId));
                display.textContent = `${progress}%`;
            }
        });
    }

    // Generate lecture navigation HTML
    generateNavigationHTML(currentLectureId) {
        const prevLecture = this.getPreviousLecture(currentLectureId);
        const nextLecture = this.getNextLecture(currentLectureId);
        
        let html = '<div class="lecture-navigation">';
        
        if (prevLecture) {
            html += `
                <a href="lecture.html?course=${this.currentCourse}&lecture=${prevLecture.id}" 
                   class="nav-link prev-link">
                    <i class="fas fa-arrow-left"></i>
                    <div>
                        <span>Previous</span>
                        <strong>${prevLecture.title}</strong>
                    </div>
                </a>
            `;
        } else {
            html += '<div class="nav-placeholder"></div>';
        }
        
        if (nextLecture) {
            html += `
                <a href="lecture.html?course=${this.currentCourse}&lecture=${nextLecture.id}" 
                   class="nav-link next-link">
                    <div>
                        <span>Next</span>
                        <strong>${nextLecture.title}</strong>
                    </div>
                    <i class="fas fa-arrow-right"></i>
                </a>
            `;
        } else {
            html += '<div class="nav-placeholder"></div>';
        }
        
        html += '</div>';
        
        return html;
    }

    // Generate lecture list HTML for course page
    generateLectureListHTML() {
        if (this.lectureList.length === 0) {
            return '<div class="empty-lectures">No lectures available yet.</div>';
        }
        
        let html = '<div class="lecture-list">';
        
        this.lectureList.forEach(lecture => {
            const progress = this.getLectureProgress(lecture.id);
            const isCompleted = DataManager.userProgress.completedLectures.includes(
                `${this.currentCourse}-${lecture.id}`
            );
            
            html += `
                <div class="lecture-list-item" data-lecture-id="${lecture.id}">
                    <div class="lecture-list-header">
                        <span class="lecture-number">Lecture ${lecture.id}</span>
                        <span class="lecture-status ${lecture.status}">
                            ${lecture.status === 'completed' ? '✓ Completed' : 
                              lecture.status === 'in-progress' ? '● In Progress' : '↑ Upcoming'}
                        </span>
                    </div>
                    
                    <h4>${lecture.title}</h4>
                    
                    <div class="lecture-list-meta">
                        <span><i class="far fa-calendar"></i> ${lecture.date}</span>
                        <span><i class="far fa-clock"></i> ${lecture.duration}</span>
                        <span class="progress-indicator">
                            <i class="fas fa-chart-line"></i> ${progress}%
                        </span>
                    </div>
                    
                    <div class="lecture-progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    
                    <div class="lecture-list-actions">
                        <a href="lecture.html?course=${this.currentCourse}&lecture=${lecture.id}" 
                           class="btn-read-lecture">
                            <i class="fas fa-book-open"></i> Read Notes
                        </a>
                        
                        <button class="btn-mark-complete ${isCompleted ? 'completed' : ''}" 
                                data-lecture-id="${lecture.id}">
                            <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>
                            ${isCompleted ? 'Completed' : 'Mark Complete'}
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        return html;
    }

    // Add event listeners for lecture interactions
    addEventListeners() {
        // Mark as complete buttons
        document.addEventListener('click', (e) => {
            const completeBtn = e.target.closest('.btn-mark-complete');
            if (completeBtn) {
                const lectureId = parseInt(completeBtn.dataset.lectureId);
                this.markAsCompleted(lectureId);
                
                // Update button state
                completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
                completeBtn.classList.add('completed');
            }
        });
        
        // Auto-save notes
        const noteTextareas = document.querySelectorAll('.lecture-notes');
        noteTextareas.forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const lectureId = e.target.dataset.lectureId;
                if (lectureId) {
                    DataManager.saveNote(this.currentCourse, lectureId, e.target.value);
                }
            });
        });
    }

    // Load saved notes for lecture
    loadNotes(lectureId) {
        return DataManager.getNote(this.currentCourse, lectureId);
    }

    // Get course completion statistics
    getCourseCompletionStats() {
        const total = this.totalLectures;
        const completed = this.lectureList.filter(lecture => 
            DataManager.userProgress.completedLectures.includes(
                `${this.currentCourse}-${lecture.id}`
            )
        ).length;
        
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            total,
            completed,
            percentage,
            remaining: total - completed
        };
    }

    // Export lecture data
    exportLectureData(lectureId) {
        const lecture = this.getLecture(lectureId);
        if (!lecture) return null;
        
        const course = DataManager.getCourse(this.currentCourse);
        const note = this.loadNotes(lectureId);
        
        return {
            lecture: {
                ...lecture,
                course: course?.name || this.currentCourse,
                teacher: course?.teacher || 'Unknown'
            },
            userData: {
                completed: DataManager.userProgress.completedLectures.includes(
                    `${this.currentCourse}-${lectureId}`
                ),
                note: note,
                lastAccessed: DataManager.userProgress.lastAccessed,
                progress: this.getLectureProgress(lectureId)
            },
            exportedAt: new Date().toISOString()
        };
    }
}

// Create global instance
window.LectureManager = new LectureManager();

// Initialize when data is loaded
document.addEventListener('dataLoaded', () => {
    // Auto-initialize if on course or lecture page
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course') || urlParams.get('id');
    
    if (courseId && window.location.pathname.includes('course.html')) {
        LectureManager.init(courseId);
        LectureManager.addEventListeners();
    }
});