// Markdown to HTML Converter with Table of Contents
class MarkdownConverter {
    constructor() {
        this.headings = [];
        this.tocGenerated = false;
    }

    // Convert markdown to HTML
    convert(markdown) {
        this.headings = [];
        
        // Split into lines
        let lines = markdown.split('\n');
        let html = '';
        let inCodeBlock = false;
        let codeBlockLanguage = '';
        let inList = false;
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Skip empty lines
            if (line === '' && !inCodeBlock) {
                if (inList) {
                    html += '</ul>\n';
                    inList = false;
                }
                if (inTable) {
                    html += this.generateTableHTML(tableRows);
                    tableRows = [];
                    inTable = false;
                }
                html += '\n';
                continue;
            }
            
            // Code blocks
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    // Start code block
                    codeBlockLanguage = line.replace('```', '').trim();
                    html += `<pre><code class="language-${codeBlockLanguage}">`;
                    inCodeBlock = true;
                } else {
                    // End code block
                    html += '</code></pre>\n';
                    inCodeBlock = false;
                }
                continue;
            }
            
            if (inCodeBlock) {
                html += line + '\n';
                continue;
            }
            
            // Headings
            if (line.startsWith('# ')) {
                html += this.generateHeading(line.substring(2), 1);
            } else if (line.startsWith('## ')) {
                html += this.generateHeading(line.substring(3), 2);
            } else if (line.startsWith('### ')) {
                html += this.generateHeading(line.substring(4), 3);
            } else if (line.startsWith('#### ')) {
                html += this.generateHeading(line.substring(5), 4);
            }
            
            // Horizontal rule
            else if (line === '---' || line === '***' || line === '___') {
                html += '<hr>\n';
            }
            
            // Tables
            else if (line.includes('|') && line.split('|').length > 2) {
                if (!inTable) {
                    inTable = true;
                }
                tableRows.push(line.split('|').map(cell => cell.trim()).filter(cell => cell !== ''));
            }
            
            // Lists
            else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\./.test(line)) {
                if (!inList) {
                    const listType = /^\d+\./.test(line) ? 'ol' : 'ul';
                    html += `<${listType}>\n`;
                    inList = true;
                }
                const listItem = line.replace(/^[*-]\s+/, '').replace(/^\d+\.\s+/, '');
                html += `<li>${this.formatInlineMarkdown(listItem)}</li>\n`;
            }
            
            // Blockquotes
            else if (line.startsWith('> ')) {
                html += `<blockquote>${this.formatInlineMarkdown(line.substring(2))}</blockquote>\n`;
            }
            
            // Regular paragraph
            else {
                if (inList) {
                    html += `</ul>\n`;
                    inList = false;
                }
                if (inTable) {
                    html += this.generateTableHTML(tableRows);
                    tableRows = [];
                    inTable = false;
                }
                html += `<p>${this.formatInlineMarkdown(line)}</p>\n`;
            }
        }
        
        // Close any open tags
        if (inList) html += '</ul>\n';
        if (inTable) html += this.generateTableHTML(tableRows);
        
        return html;
    }

    // Generate heading with anchor
    generateHeading(text, level) {
        const id = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-');
        
        this.headings.push({ text, level, id });
        
        return `<h${level} id="${id}">${text}</h${level}>\n`;
    }

    // Format inline markdown (bold, italic, code, links)
    formatInlineMarkdown(text) {
        // Code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        
        // Italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Line breaks
        text = text.replace(/\\n/g, '<br>');
        
        return text;
    }

    // Generate table HTML
    generateTableHTML(rows) {
        if (rows.length < 2) return '';
        
        let html = '<div class="table-container"><table>\n';
        
        // Check if first row is header (based on separator row)
        const hasHeader = rows.length > 1 && rows[1].every(cell => 
            cell.replace(/[^-]/g, '').length === cell.length || 
            cell.includes('---')
        );
        
        if (hasHeader) {
            html += '<thead><tr>\n';
            rows[0].forEach(cell => {
                html += `<th>${cell}</th>\n`;
            });
            html += '</tr></thead>\n<tbody>\n';
            
            // Skip separator row
            for (let i = 2; i < rows.length; i++) {
                html += '<tr>\n';
                rows[i].forEach(cell => {
                    html += `<td>${cell}</td>\n`;
                });
                html += '</tr>\n';
            }
        } else {
            html += '<tbody>\n';
            rows.forEach(row => {
                html += '<tr>\n';
                row.forEach(cell => {
                    html += `<td>${cell}</td>\n`;
                });
                html += '</tr>\n';
            });
        }
        
        html += '</tbody>\n</table></div>\n';
        return html;
    }

    // Generate Table of Contents
    generateTableOfContents() {
        if (this.headings.length === 0) return '';
        
        let toc = '<div class="table-of-contents">\n';
        toc += '<h3><i class="fas fa-list"></i> Table of Contents</h3>\n';
        toc += '<ul>\n';
        
        let currentLevel = 1;
        
        this.headings.forEach(heading => {
            if (heading.level === 1) return; // Skip h1 for TOC
            
            const indent = (heading.level - 2) * 20;
            toc += `<li style="margin-left: ${indent}px;">\n`;
            toc += `<a href="#${heading.id}">${heading.text}</a>\n`;
            toc += '</li>\n';
        });
        
        toc += '</ul>\n</div>\n';
        this.tocGenerated = true;
        
        return toc;
    }

    // Extract metadata from markdown
    extractMetadata(markdown) {
        const metadata = {
            title: '',
            date: '',
            duration: '',
            instructor: '',
            course: '',
            objectives: []
        };
        
        const lines = markdown.split('\n');
        
        lines.forEach(line => {
            if (line.startsWith('# ')) {
                metadata.title = line.substring(2);
            } else if (line.startsWith('**Date:**')) {
                metadata.date = line.replace('**Date:**', '').trim();
            } else if (line.startsWith('**Duration:**')) {
                metadata.duration = line.replace('**Duration:**', '').trim();
            } else if (line.startsWith('**Instructor:**')) {
                metadata.instructor = line.replace('**Instructor:**', '').trim();
            } else if (line.startsWith('**Course:**')) {
                metadata.course = line.replace('**Course:**', '').trim();
            } else if (line.includes('## Learning Objectives')) {
                // Get next few lines for objectives
                const startIndex = lines.indexOf(line);
                for (let i = startIndex + 1; i < Math.min(startIndex + 10, lines.length); i++) {
                    if (lines[i].trim().startsWith('-')) {
                        metadata.objectives.push(lines[i].trim().substring(2));
                    } else if (lines[i].trim().startsWith('##')) {
                        break;
                    }
                }
            }
        });
        
        return metadata;
    }
}

// Export for use in other files
window.MarkdownConverter = MarkdownConverter;