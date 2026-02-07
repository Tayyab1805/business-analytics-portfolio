// Main JavaScript File
console.log('Business Analytics Hub loaded');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Set current year in footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // Initialize tooltips
    initTooltips();
    
    // Load any saved preferences
    loadPreferences();
});

// Tooltip functionality
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            
            this.tooltipElement = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this.tooltipElement) {
                this.tooltipElement.remove();
                this.tooltipElement = null;
            }
        });
    });
}

// Load user preferences from localStorage
function loadPreferences() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    document.body.style.fontSize = fontSize;
}

// Save user preferences
function savePreferences(key, value) {
    localStorage.setItem(key, value);
}

// Semester functions
function getSemesterProgress(semesterId) {
    // This will be expanded in Part 4
    return {
        completed: 0,
        total: 0,
        percentage: 0
    };
}

// Course functions
function getCourseDetails(courseId) {
    // This will be expanded in Part 4
    return {
        name: 'Course Name',
        teacher: 'Teacher Name',
        lectures: 0,
        description: 'Course description'
    };
}

// Utility function to format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Export functions for use in other files
window.BAHub = {
    formatDate,
    getSemesterProgress,
    getCourseDetails,
    savePreferences
};