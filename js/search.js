// Search functionality for Business Analytics Hub
class SearchManager {
    constructor() {
        this.searchIndex = null;
        this.searchResults = null;
        this.isInitialized = false;
        this.debounceTimer = null;
        this.minSearchLength = 2;
    }

    // Initialize search index
    async init() {
        if (this.isInitialized) return;
        
        try {
            await DataManager.init();
            this.buildSearchIndex();
            this.isInitialized = true;
            
            // Add search UI if not present
            this.addSearchUI();
            
            console.log('Search manager initialized');
        } catch (error) {
            console.error('Error initializing search:', error);
        }
    }

    // Build search index from data
    buildSearchIndex() {
        this.searchIndex = {
            courses: [],
            lectures: [],
            teachers: [],
            keywords: new Set()
        };
        
        // Index courses
        if (DataManager.coursesData?.semesters) {
            DataManager.coursesData.semesters.forEach(semester => {
                semester.courses.forEach(course => {
                    this.searchIndex.courses.push({
                        id: course.id,
                        name: course.name,
                        code: course.code,
                        description: course.description,
                        teacher: course.teacher,
                        semester: semester.name,
                        type: 'course'
                    });
                    
                    // Add keywords from course name and description
                    this.extractKeywords(course.name).forEach(kw => 
                        this.searchIndex.keywords.add(kw));
                    this.extractKeywords(course.description).forEach(kw => 
                        this.searchIndex.keywords.add(kw));
                });
            });
        }
        
        // Index lectures
        if (DataManager.lecturesData?.courses) {
            Object.entries(DataManager.lecturesData.courses).forEach(([courseId, courseData]) => {
                courseData.lectures.forEach(lecture => {
                    this.searchIndex.lectures.push({
                        id: lecture.id,
                        courseId: courseId,
                        title: lecture.title,
                        keywords: lecture.keywords || [],
                        date: lecture.date,
                        status: lecture.status,
                        type: 'lecture'
                    });
                    
                    // Add keywords
                    this.extractKeywords(lecture.title).forEach(kw => 
                        this.searchIndex.keywords.add(kw));
                    (lecture.keywords || []).forEach(kw => 
                        this.searchIndex.keywords.add(kw.toLowerCase()));
                });
            });
        }
        
        // Index teachers
        if (DataManager.teachersData?.teachers) {
            DataManager.teachersData.teachers.forEach(teacher => {
                this.searchIndex.teachers.push({
                    id: teacher.id,
                    name: teacher.name,
                    department: teacher.department,
                    qualification: teacher.qualification,
                    courses: teacher.courses,
                    type: 'teacher'
                });
                
                this.extractKeywords(teacher.name).forEach(kw => 
                    this.searchIndex.keywords.add(kw));
                this.extractKeywords(teacher.department).forEach(kw => 
                    this.searchIndex.keywords.add(kw));
            });
        }
    }

    // Extract keywords from text
    extractKeywords(text) {
        if (!text) return [];
        
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates
    }

    // Perform search
    search(query) {
        if (!query || query.length < this.minSearchLength) {
            this.searchResults = null;
            return null;
        }
        
        const searchTerm = query.toLowerCase().trim();
        const results = {
            courses: [],
            lectures: [],
            teachers: [],
            keywords: []
        };
        
        // Search courses
        results.courses = this.searchIndex.courses.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.code.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.teacher.toLowerCase().includes(searchTerm)
        );
        
        // Search lectures
        results.lectures = this.searchIndex.lectures.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.keywords.some(kw => kw.includes(searchTerm))
        );
        
        // Search teachers
        results.teachers = this.searchIndex.teachers.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.department.toLowerCase().includes(searchTerm) ||
            item.qualification.toLowerCase().includes(searchTerm)
        );
        
        // Find matching keywords
        results.keywords = Array.from(this.searchIndex.keywords)
            .filter(kw => kw.includes(searchTerm))
            .slice(0, 10); // Limit to 10 keywords
        
        this.searchResults = results;
        return results;
    }

    // Add search UI to page
    addSearchUI() {
        // Check if search already exists
        if (document.getElementById('global-search')) return;
        
        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.id = 'global-search';
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <i class="fas fa-search"></i>
                <input type="text" 
                       id="search-input" 
                       placeholder="Search courses, lectures, teachers..."
                       autocomplete="off">
                <button id="clear-search" class="clear-search-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="search-results" class="search-results"></div>
        `;
        
        // Insert after navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.parentNode.insertBefore(searchContainer, navbar.nextSibling);
        } else {
            document.body.insertBefore(searchContainer, document.body.firstChild);
        }
        
        // Add event listeners
        this.addSearchEventListeners();
        
        // Add styles
        this.addSearchStyles();
    }

    // Add search event listeners
    addSearchEventListeners() {
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-search');
        const resultsContainer = document.getElementById('search-results');
        
        // Search input handler with debounce
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            
            this.debounceTimer = setTimeout(() => {
                const query = e.target.value.trim();
                this.handleSearch(query, resultsContainer);
                
                // Show/hide clear button
                clearBtn.style.display = query ? 'flex' : 'none';
            }, 300);
        });
        
        // Clear search
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            clearBtn.style.display = 'none';
            this.hideResults();
        });
        
        // Handle keyboard shortcuts
        searchInput.addEventListener('keydown', (e) => {
            // Escape to clear
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.hideResults();
            }
            
            // Ctrl/Cmd + K to focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
        
        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    // Handle search and display results
    handleSearch(query, container) {
        if (!query || query.length < this.minSearchLength) {
            this.hideResults();
            return;
        }
        
        const results = this.search(query);
        if (!results) {
            this.hideResults();
            return;
        }
        
        const totalResults = 
            results.courses.length + 
            results.lectures.length + 
            results.teachers.length;
        
        if (totalResults === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No results found for "${query}"</p>
                    <small>Try different keywords or check spelling</small>
                </div>
            `;
            container.style.display = 'block';
            return;
        }
        
        // Build results HTML
        let html = '<div class="search-results-content">';
        
        // Courses section
        if (results.courses.length > 0) {
            html += `
                <div class="results-section">
                    <h4><i class="fas fa-book"></i> Courses (${results.courses.length})</h4>
                    ${this.renderCourseResults(results.courses)}
                </div>
            `;
        }
        
        // Lectures section
        if (results.lectures.length > 0) {
            html += `
                <div class="results-section">
                    <h4><i class="fas fa-chalkboard"></i> Lectures (${results.lectures.length})</h4>
                    ${this.renderLectureResults(results.lectures)}
                </div>
            `;
        }
        
        // Teachers section
        if (results.teachers.length > 0) {
            html += `
                <div class="results-section">
                    <h4><i class="fas fa-chalkboard-teacher"></i> Teachers (${results.teachers.length})</h4>
                    ${this.renderTeacherResults(results.teachers)}
                </div>
            `;
        }
        
        // Keywords suggestions
        if (results.keywords.length > 0) {
            html += `
                <div class="keywords-section">
                    <h4><i class="fas fa-tags"></i> Related Keywords</h4>
                    <div class="keywords-list">
                        ${results.keywords.map(keyword => `
                            <span class="keyword-tag" data-keyword="${keyword}">
                                ${keyword}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        // Add click handlers for keyword tags
        container.querySelectorAll('.keyword-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const keyword = e.target.dataset.keyword;
                document.getElementById('search-input').value = keyword;
                this.handleSearch(keyword, container);
            });
        });
    }

    // Render course results
    renderCourseResults(courses) {
        return courses.map(course => `
            <a href="course.html?id=${course.id}" class="result-item course-result">
                <div class="result-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="result-content">
                    <h5>${course.name} <span class="course-code">${course.code}</span></h5>
                    <p>${course.description.substring(0, 100)}...</p>
                    <div class="result-meta">
                        <span><i class="fas fa-user-graduate"></i> ${course.teacher}</span>
                        <span><i class="fas fa-layer-group"></i> ${course.semester}</span>
                    </div>
                </div>
            </a>
        `).join('');
    }

    // Render lecture results
    renderLectureResults(lectures) {
        return lectures.map(lecture => {
            const course = DataManager.getCourse(lecture.courseId);
            return `
                <a href="lecture.html?course=${lecture.courseId}&lecture=${lecture.id}" 
                   class="result-item lecture-result">
                    <div class="result-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="result-content">
                        <h5>${lecture.title}</h5>
                        <p>Lecture ${lecture.id} • ${course?.name || lecture.courseId}</p>
                        <div class="result-meta">
                            <span><i class="far fa-calendar"></i> ${lecture.date}</span>
                            <span class="status ${lecture.status}">${lecture.status}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    // Render teacher results
    renderTeacherResults(teachers) {
        return teachers.map(teacher => `
            <div class="result-item teacher-result">
                <div class="result-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="result-content">
                    <h5>${teacher.name}</h5>
                    <p>${teacher.department}</p>
                    <div class="result-meta">
                        <span><i class="fas fa-graduation-cap"></i> ${teacher.qualification}</span>
                        <span><i class="fas fa-book"></i> ${teacher.courses.length} courses</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Hide results
    hideResults() {
        const container = document.getElementById('search-results');
        if (container) {
            container.style.display = 'none';
        }
    }

    // Add search styles
    addSearchStyles() {
        const styleId = 'search-styles';
        if (document.getElementById(styleId)) return;
        
        const styles = `
            .search-container {
                position: relative;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                z-index: 1000;
            }
            
            .search-input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
                background: var(--white);
                border-radius: 50px;
                padding: 10px 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border: 2px solid transparent;
                transition: var(--transition);
            }
            
            .search-input-wrapper:focus-within {
                border-color: var(--secondary-color);
                box-shadow: 0 4px 20px rgba(52, 152, 219, 0.2);
            }
            
            .search-input-wrapper i {
                color: var(--gray-color);
                font-size: 1.2rem;
                margin-right: 10px;
            }
            
            #search-input {
                flex: 1;
                border: none;
                outline: none;
                font-size: 1rem;
                background: transparent;
                padding: 8px 0;
                color: var(--dark-color);
                font-family: 'Roboto', sans-serif;
            }
            
            #search-input::placeholder {
                color: var(--light-gray);
            }
            
            .clear-search-btn {
                background: none;
                border: none;
                color: var(--gray-color);
                cursor: pointer;
                padding: 5px;
                display: none;
                align-items: center;
                justify-content: center;
                transition: var(--transition);
            }
            
            .clear-search-btn:hover {
                color: var(--accent-color);
            }
            
            .search-results {
                position: absolute;
                top: 100%;
                left: 20px;
                right: 20px;
                background: var(--white);
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                margin-top: 10px;
                max-height: 500px;
                overflow-y: auto;
                display: none;
                z-index: 1001;
                border: 1px solid var(--light-gray);
            }
            
            .search-results-content {
                padding: 20px;
            }
            
            .results-section {
                margin-bottom: 25px;
            }
            
            .results-section h4 {
                color: var(--primary-color);
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid var(--light-color);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .result-item {
                display: flex;
                align-items: flex-start;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                text-decoration: none;
                color: inherit;
                transition: var(--transition);
                border: 1px solid transparent;
            }
            
            .result-item:hover {
                background: rgba(52, 152, 219, 0.05);
                border-color: var(--secondary-color);
                transform: translateX(5px);
            }
            
            .result-icon {
                width: 40px;
                height: 40px;
                background: var(--light-color);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                color: var(--secondary-color);
                font-size: 1.2rem;
            }
            
            .result-content h5 {
                margin: 0 0 5px 0;
                color: var(--primary-color);
            }
            
            .course-code {
                background: var(--primary-color);
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                margin-left: 8px;
            }
            
            .result-content p {
                margin: 0 0 10px 0;
                color: var(--gray-color);
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .result-meta {
                display: flex;
                gap: 15px;
                font-size: 0.8rem;
                color: var(--gray-color);
            }
            
            .result-meta span {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .status {
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.7rem;
                font-weight: 500;
            }
            
            .status.completed {
                background: #d5f4e6;
                color: var(--success-color);
            }
            
            .status.in-progress {
                background: #fff3cd;
                color: var(--warning-color);
            }
            
            .status.upcoming {
                background: #e2e3e5;
                color: var(--gray-color);
            }
            
            .keywords-section {
                margin-top: 25px;
                padding-top: 25px;
                border-top: 2px solid var(--light-color);
            }
            
            .keywords-list {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 10px;
            }
            
            .keyword-tag {
                background: var(--light-color);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: var(--transition);
            }
            
            .keyword-tag:hover {
                background: var(--secondary-color);
                color: white;
            }
            
            .no-results {
                text-align: center;
                padding: 40px 20px;
                color: var(--gray-color);
            }
            
            .no-results i {
                font-size: 3rem;
                margin-bottom: 15px;
                color: var(--light-gray);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .search-container {
                    padding: 10px;
                }
                
                .search-results {
                    left: 10px;
                    right: 10px;
                }
                
                .result-item {
                    flex-direction: column;
                }
                
                .result-icon {
                    margin-bottom: 10px;
                }
                
                .result-meta {
                    flex-direction: column;
                    gap: 5px;
                }
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
}

// Create global instance
window.SearchManager = new SearchManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SearchManager.init();
});

// Keyboard shortcut help
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});