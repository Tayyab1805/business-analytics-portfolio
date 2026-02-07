// PDF Generator using jsPDF with html2canvas
class PDFGenerator {
    constructor() {
        this.pdf = null;
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margin = 20;
        this.currentY = this.margin;
        this.pageNumber = 1;
        this.isGenerating = false;
    }

    // Initialize jsPDF
    init() {
        // Load jsPDF and html2canvas if not already loaded
        return new Promise((resolve, reject) => {
            if (window.jspdf && window.jspdf.jsPDF) {
                this.pdf = new window.jspdf.jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                resolve();
            } else {
                // Load jsPDF dynamically
                this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
                    .then(() => this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'))
                    .then(() => {
                        this.pdf = new window.jspdf.jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: 'a4'
                        });
                        resolve();
                    })
                    .catch(reject);
            }
        });
    }

    // Load external script
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Generate PDF from lecture content
    async generateFromLecture(lectureData) {
        if (this.isGenerating) return;
        this.isGenerating = true;
        
        try {
            await this.init();
            
            // Reset position
            this.currentY = this.margin;
            this.pageNumber = 1;
            
            // Add header
            await this.addHeader(lectureData);
            
            // Add table of contents
            await this.addTableOfContents(lectureData.toc);
            
            // Add main content
            await this.addContent(lectureData.content);
            
            // Add footer to all pages
            this.addFooter();
            
            // Save PDF
            const fileName = this.generateFileName(lectureData.title);
            this.pdf.save(fileName);
            
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            this.isGenerating = false;
        }
    }

    // Add header with course info
    async addHeader(lectureData) {
        // University/Institution header
        this.pdf.setFontSize(16);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(44, 62, 80); // Dark blue
        this.pdf.text('Business Analytics Hub', this.pageWidth / 2, this.currentY, { align: 'center' });
        
        this.currentY += 8;
        
        // Course and lecture title
        this.pdf.setFontSize(14);
        this.pdf.setTextColor(52, 152, 219); // Blue
        this.pdf.text(lectureData.course, this.pageWidth / 2, this.currentY, { align: 'center' });
        
        this.currentY += 8;
        
        // Lecture title
        this.pdf.setFontSize(18);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(0, 0, 0); // Black
        this.pdf.text(lectureData.title, this.pageWidth / 2, this.currentY, { align: 'center' });
        
        this.currentY += 12;
        
        // Metadata table
        const metadata = [
            ['Date:', lectureData.date],
            ['Duration:', lectureData.duration],
            ['Instructor:', lectureData.instructor],
            ['Course Code:', lectureData.courseCode || '']
        ];
        
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        
        metadata.forEach(([label, value]) => {
            if (value) {
                this.pdf.setTextColor(100, 100, 100); // Gray
                this.pdf.text(label, this.margin, this.currentY);
                
                this.pdf.setTextColor(0, 0, 0); // Black
                this.pdf.text(value, this.margin + 25, this.currentY);
                
                this.currentY += 6;
            }
        });
        
        this.currentY += 10;
        
        // Horizontal line
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        
        this.currentY += 15;
    }

    // Add table of contents
    async addTableOfContents(tocItems) {
        if (!tocItems || tocItems.length === 0) return;
        
        this.pdf.setFontSize(14);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(44, 62, 80); // Dark blue
        this.pdf.text('Table of Contents', this.margin, this.currentY);
        
        this.currentY += 10;
        
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        
        tocItems.forEach((item, index) => {
            // Check if we need a new page
            if (this.currentY > this.pageHeight - 30) {
                this.addNewPage();
            }
            
            const indent = (item.level - 1) * 5;
            const xPos = this.margin + indent;
            
            // Item text
            this.pdf.setTextColor(0, 0, 0); // Black
            this.pdf.text(item.text, xPos, this.currentY);
            
            // Dotted line
            const dotStart = xPos + this.pdf.getTextWidth(item.text) + 2;
            const dotEnd = this.pageWidth - this.margin - 15;
            const dotCount = Math.floor((dotEnd - dotStart) / 2);
            
            for (let i = 0; i < dotCount; i++) {
                this.pdf.text('.', dotStart + (i * 2), this.currentY);
            }
            
            // Page number
            this.pdf.text(item.page.toString(), this.pageWidth - this.margin - 10, this.currentY, { align: 'right' });
            
            this.currentY += 6;
        });
        
        this.currentY += 15;
        
        // Another horizontal line
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        
        this.currentY += 20;
    }

    // Add main content
    async addContent(contentElement) {
        if (!contentElement) return;
        
        // Convert HTML content to canvas and add to PDF
        try {
            const canvas = await html2canvas(contentElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = this.pageWidth - (2 * this.margin);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Split content across pages if needed
            let remainingHeight = imgHeight;
            let position = 0;
            
            while (remainingHeight > 0) {
                const pageHeight = this.pageHeight - this.currentY - 20;
                const heightOnPage = Math.min(remainingHeight, pageHeight);
                
                this.pdf.addImage(
                    imgData,
                    'PNG',
                    this.margin,
                    this.currentY,
                    imgWidth,
                    heightOnPage,
                    '',
                    'FAST'
                );
                
                remainingHeight -= heightOnPage;
                position += heightOnPage;
                
                if (remainingHeight > 0) {
                    this.addNewPage();
                }
            }
            
            this.currentY += imgHeight;
            
        } catch (error) {
            console.error('Error converting content to image:', error);
            // Fallback: Add text content
            this.addTextContent(contentElement.textContent);
        }
    }

    // Fallback: Add text content
    addTextContent(text) {
        const lines = this.pdf.splitTextToSize(text, this.pageWidth - (2 * this.margin));
        
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setTextColor(0, 0, 0);
        
        lines.forEach(line => {
            // Check if we need a new page
            if (this.currentY > this.pageHeight - 20) {
                this.addNewPage();
            }
            
            this.pdf.text(line, this.margin, this.currentY);
            this.currentY += 6;
        });
    }

    // Add new page
    addNewPage() {
        this.pdf.addPage();
        this.pageNumber++;
        this.currentY = this.margin;
        
        // Add header to new page
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.setTextColor(150, 150, 150);
        this.pdf.text(`Business Analytics Hub - Lecture Notes`, this.margin, 10);
        this.pdf.text(`Page ${this.pageNumber}`, this.pageWidth - this.margin, 10, { align: 'right' });
    }

    // Add footer to all pages
    addFooter() {
        const totalPages = this.pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= totalPages; i++) {
            this.pdf.setPage(i);
            
            this.pdf.setFontSize(8);
            this.pdf.setFont('helvetica', 'normal');
            this.pdf.setTextColor(150, 150, 150);
            
            // Footer text
            const footerY = this.pageHeight - 10;
            this.pdf.text('Generated by Business Analytics Course Hub', this.pageWidth / 2, footerY, { align: 'center' });
            this.pdf.text(`github.com/yourusername`, this.pageWidth - this.margin, footerY, { align: 'right' });
            
            // Page number
            this.pdf.text(`Page ${i} of ${totalPages}`, this.margin, footerY);
        }
    }

    // Generate file name
    generateFileName(title) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const safeTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .substring(0, 50);
        
        return `lecture_${safeTitle}_${dateStr}.pdf`;
    }

    // Quick PDF generation from HTML element
    async generateQuickPDF(elementId, title = 'Lecture Notes') {
        const element = document.getElementById(elementId);
        if (!element) {
            alert('Content not found for PDF generation');
            return;
        }
        
        const lectureData = {
            title: title,
            course: document.getElementById('course-name')?.textContent || 'Business Analytics',
            date: new Date().toLocaleDateString(),
            duration: '1.5 hours',
            instructor: document.getElementById('teacher-fullname')?.textContent || 'Instructor',
            content: element,
            toc: this.extractHeadings(element)
        };
        
        await this.generateFromLecture(lectureData);
    }

    // Extract headings for TOC
    extractHeadings(element) {
        const headings = [];
        const headingElements = element.querySelectorAll('h2, h3, h4');
        
        headingElements.forEach((heading, index) => {
            headings.push({
                text: heading.textContent,
                level: parseInt(heading.tagName.charAt(1)),
                page: Math.floor(index / 5) + 2 // Simple page estimation
            });
        });
        
        return headings;
    }
}

// Create global instance
window.PDFGenerator = new PDFGenerator();