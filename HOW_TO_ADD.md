# How to Add Content to Business Analytics Hub

## 1. Adding a New Semester

### Method 1: Using the Website
1. Go to the home page
2. Click "Add New Semester" button
3. The new semester will be added automatically
4. To add courses to it, edit `data/courses.json`

### Method 2: Manual Edit
Edit `data/courses.json`:
```json
{
  "id": 5,
  "name": "Semester 5",
  "status": "upcoming",
  "description": "Your semester description",
  "courses": [
    {
      "id": "BA501",
      "name": "Course Name",
      "code": "BA501",
      "teacher": "Teacher Name",
      "teacherEmail": "teacher@email.com",
      "lectures": 0,
      "description": "Course description",
      "image": "course-image.jpg",
      "color": "#3498db"
    }
  ]
}