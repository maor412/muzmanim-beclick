// Hebrew PDF Export Utility - Using HTML tables rendered as images
// This ensures perfect Hebrew rendering by using browser's native text rendering

async function generateHebrewPDF(title, headers, data, filename, summaryText) {
    try {
        const { jsPDF } = window.jspdf;
        
        // Create a hidden container for rendering
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            left: -9999px;
            top: 0;
            width: 800px;
            background: white;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
        `;
        
        // Create HTML table
        let html = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="font-size: 24px; margin: 10px 0;">${title}</h2>
                <p style="font-size: 14px; color: #666;">${new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; direction: rtl;">
                <thead>
                    <tr style="background-color: #ec4899; color: white;">
                        ${headers.map(h => `<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map((row, idx) => `
                        <tr style="background-color: ${idx % 2 === 0 ? '#fce7f3' : 'white'};">
                            ${row.map(cell => `<td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                ${summaryText}
            </div>
        `;
        
        container.innerHTML = html;
        document.body.appendChild(container);
        
        // Wait for fonts to load
        await document.fonts.ready;
        
        // Use html2canvas if available, otherwise create simple PDF
        if (typeof html2canvas !== 'undefined') {
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            doc.save(filename);
        } else {
            // Fallback: Create simple text PDF (without Hebrew support)
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(title, 105, 20, { align: 'center' });
            
            // Add table using autoTable
            doc.autoTable({
                startY: 30,
                head: [headers],
                body: data,
                styles: { 
                    fontSize: 10,
                    halign: 'right'
                },
                headStyles: { 
                    fillColor: [236, 72, 153],
                    halign: 'center'
                }
            });
            
            doc.save(filename);
        }
        
        // Cleanup
        document.body.removeChild(container);
        
        return true;
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
}

// Make it available globally
window.generateHebrewPDF = generateHebrewPDF;
