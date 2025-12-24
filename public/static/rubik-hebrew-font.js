// Simplified Hebrew Support for jsPDF
// Uses default font with manual text reversal for Hebrew

window.addRubikFont = function(doc) {
    // Use default font
    doc.setFont("helvetica");
    
    // Note: We don't use setR2L because it doesn't work without proper font
    // Instead, we'll reverse Hebrew text manually in the export functions
    
    console.log('✅ Hebrew support initialized (manual text reversal)');
    return true;
};

// Helper function to reverse Hebrew text for display
window.reverseHebrewText = function(text) {
    if (!text) return text;
    
    // Simple reversal - works for pure Hebrew text
    return text.split('').reverse().join('');
};

console.log('✅ Rubik font helper loaded');
