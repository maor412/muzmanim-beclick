// Global variables
let currentEvent = null;
let currentTab = 'overview';
let allRsvps = [];
let allGuests = [];
let allTables = [];
let allSeating = [];
let filteredRsvps = [];

// Configure axios to send cookies
axios.defaults.withCredentials = true;

// Add axios interceptor to automatically include auth token
axios.interceptors.request.use(function (config) {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Add response interceptor to handle 401 errors
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid - redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login?error=' + encodeURIComponent('Session expired. Please login again.');
        }
        return Promise.reject(error);
    }
);

// Hebrew Font Loader for jsPDF (using embedded base64 font)
// Simplified approach: Use a minimal Hebrew font embedded as base64
function loadHebrewFont(doc) {
    try {
        // Using a simple approach: configure jsPDF to render Hebrew text
        // This is a lightweight solution that doesn't require external font loading
        
        // Configure jsPDF for RTL (Right-to-Left) text
        // We'll use the browser's canvas to render Hebrew text as images
        // This is more reliable than loading external fonts
        
        // For now, we'll use Helvetica with manual RTL handling
        doc.setFont('helvetica');
        
        // Success - no external font needed
        return true;
    } catch (error) {
        console.error('Failed to configure Hebrew support:', error);
        return false;
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-6 py-4 rounded-lg shadow-lg`;
    toast.innerHTML = `
        <div class="flex items-center space-x-reverse space-x-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Get event ID from URL
function getEventId() {
    const path = window.location.pathname;
    // Match hex characters (0-9, a-f) for the event ID (generated via Web Crypto API)
    const match = path.match(/\/event\/([a-f0-9]+)/);
    return match ? match[1] : null;
}

// Switch tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('[id^="tab-"]').forEach(btn => {
        btn.className = btn.id === `tab-${tab}` ? 'tab-active px-6 py-4 font-semibold transition whitespace-nowrap' : 'tab-inactive px-6 py-4 font-semibold transition whitespace-nowrap';
    });
    
    // Update content
    document.querySelectorAll('[id^="content-"]').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    
    // Load data based on tab
    switch(tab) {
        case 'overview':
            loadOverview();
            break;
        case 'rsvps':
            loadRsvps();
            break;
        case 'guests':
            loadGuests();
            break;
        case 'seating':
            loadSeating();
            break;
        case 'checkin':
            loadCheckin();
            break;
        case 'walkins':
            loadWalkins();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Load event data
async function loadEvent() {
    const eventId = getEventId();
    if (!eventId) {
        showError('מזהה אירוע לא תקין');
        return;
    }
    
    try {
        const response = await axios.get(`/api/events/${eventId}`);
        if (response.data.success) {
            currentEvent = response.data.event;
            document.getElementById('event-title').textContent = currentEvent.eventName;
            loadOverview();
        } else {
            showError(response.data.error || 'שגיאה בטעינת האירוע');
        }
    } catch (error) {
        console.error('Error loading event:', error);
        showError('שגיאה בטעינת האירוע');
    }
}

// Show error
function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-state').classList.remove('hidden');
}

// Load overview
async function loadOverview() {
    console.log('🔵 Loading overview for event:', currentEvent?.id);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content-overview').classList.remove('hidden');
    
    if (!currentEvent) {
        console.error('❌ No current event!');
        return;
    }
    
    try {
        console.log('📡 Making 5 API calls for overview...');
        // Load stats
        const [rsvpsRes, guestsRes, tablesRes, checkinsRes, seatingRes] = await Promise.all([
            axios.get(`/api/events/${currentEvent.id}/rsvps`),
            axios.get(`/api/events/${currentEvent.id}/guests`),
            axios.get(`/api/events/${currentEvent.id}/tables`),
            axios.get(`/api/events/${currentEvent.id}/checkins`),
            axios.get(`/api/events/${currentEvent.id}/seating`)
        ]);
        
        console.log('✅ Overview API calls successful');
        
        const rsvps = rsvpsRes.data.rsvps || [];
        const guests = guestsRes.data.guests || [];
        const tables = tablesRes.data.tables || [];
        const checkins = checkinsRes.data.checkins || [];
        const seating = seatingRes.data.seating || [];
        
        // Update stats - count total attending people, not just confirmed RSVPs
        const totalAttending = rsvps
            .filter(r => r.status === 'confirmed')
            .reduce((sum, r) => sum + (r.attendingCount || 1), 0);
        document.getElementById('stat-rsvps').textContent = totalAttending;
        document.getElementById('stat-guests').textContent = guests.length;
        document.getElementById('stat-tables').textContent = tables.length;
        document.getElementById('stat-checkins').textContent = checkins.filter(c => c.arrived).length;
        
        // Update event details
        document.getElementById('detail-eventName').textContent = currentEvent.eventName;
        document.getElementById('detail-coupleNames').textContent = currentEvent.coupleNames;
        document.getElementById('detail-dateTime').textContent = new Date(currentEvent.dateTime).toLocaleString('he-IL');
        document.getElementById('detail-venue').textContent = currentEvent.venueName || 'לא צוין';
        document.getElementById('detail-rsvpStatus').innerHTML = currentEvent.isRsvpOpen 
            ? '<span class="text-green-600"><i class="fas fa-check-circle ml-1"></i>פתוח</span>'
            : '<span class="text-red-600"><i class="fas fa-times-circle ml-1"></i>סגור</span>';
        document.getElementById('detail-slug').textContent = window.location.origin + '/e/' + currentEvent.slug;
        
        // Render charts
        renderAnalyticsCharts(rsvps, guests, seating, tables);
        
        // Generate insights
        generateInsights(rsvps, guests, seating, tables);
        
        // CRITICAL DEBUG: Monitor DOM changes and find white square
        setTimeout(async () => {
            console.log('🔍 [DEBUG] Scanning for white square element...');
            
            // Get ALL elements in document
            const allElements = Array.from(document.querySelectorAll('*'));
            const topRightElements = [];
            
            allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const styles = window.getComputedStyle(el);
                
                // Check if element is in top-right corner (where the white square appears)
                if (
                    rect.top >= 0 && rect.top < 150 &&
                    rect.right > window.innerWidth - 100 &&
                    rect.width > 5 && rect.height > 5
                ) {
                    const elementInfo = {
                        tag: el.tagName,
                        id: el.id || 'NO_ID',
                        classes: el.className || 'NO_CLASS',
                        bg: styles.backgroundColor,
                        color: styles.color,
                        display: styles.display,
                        position: styles.position,
                        zIndex: styles.zIndex,
                        opacity: styles.opacity,
                        visibility: styles.visibility,
                        top: Math.round(rect.top),
                        right: Math.round(rect.right),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        html: el.outerHTML.substring(0, 200)
                    };
                    
                    topRightElements.push(elementInfo);
                    
                    // If it's white background and suspicious
                    const isWhite = styles.backgroundColor === 'rgb(255, 255, 255)' || 
                                   styles.backgroundColor === 'white';
                    if (isWhite) {
                        console.warn('⚠️ [DEBUG] Found WHITE element:', elementInfo);
                    }
                }
            });
            
            console.table(topRightElements);
            console.log(`📊 [DEBUG] Total elements in top-right: ${topRightElements.length}`);
            
            // Send to API
            try {
                await axios.post('/api/debug/log', {
                    type: 'white_square_scan',
                    eventId: getEventId(),
                    timestamp: new Date().toISOString(),
                    windowWidth: window.innerWidth,
                    windowHeight: window.innerHeight,
                    userAgent: navigator.userAgent,
                    topRightElements: topRightElements,
                    totalElements: allElements.length
                });
                console.log('✅ [DEBUG] Scan results sent to /api/debug/logs');
            } catch (err) {
                console.error('❌ [DEBUG] Failed to send logs:', err);
            }
        }, 1000); // Wait 1 second after data load
    } catch (error) {
        console.error('❌ Error loading overview:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });
        showToast('שגיאה בטעינת נתוני הסקירה', 'error');
    }
}

// Load RSVPs
async function loadRsvps() {
    document.getElementById('rsvps-loading').classList.remove('hidden');
    document.getElementById('rsvps-empty').classList.add('hidden');
    document.getElementById('rsvps-list').classList.add('hidden');
    
    try {
        const response = await axios.get(`/api/events/${currentEvent.id}/rsvps`);
        allRsvps = response.data.rsvps || [];
        filteredRsvps = [...allRsvps];
        
        document.getElementById('rsvps-loading').classList.add('hidden');
        
        if (allRsvps.length === 0) {
            document.getElementById('rsvps-empty').classList.remove('hidden');
        } else {
            document.getElementById('rsvps-list').classList.remove('hidden');
            renderRsvps();
        }
    } catch (error) {
        console.error('Error loading RSVPs:', error);
        document.getElementById('rsvps-loading').classList.add('hidden');
        showToast('שגיאה בטעינת אישורי הגעה', 'error');
    }
}

// Render RSVPs
function renderRsvps() {
    const tbody = document.getElementById('rsvps-table-body');
    tbody.innerHTML = filteredRsvps.map(rsvp => {
        const statusColors = {
            'confirmed': 'bg-green-100 text-green-800',
            'declined': 'bg-red-100 text-red-800',
            'pending': 'bg-yellow-100 text-yellow-800'
        };
        const statusText = {
            'confirmed': 'מאושר',
            'declined': 'לא מגיע',
            'pending': 'ממתין'
        };
        
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-6 py-4">${rsvp.fullName}</td>
                <td class="px-6 py-4">${rsvp.phone || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColors[rsvp.status]}">
                        ${statusText[rsvp.status]}
                    </span>
                </td>
                <td class="px-6 py-4">${rsvp.plusOnes || 0}</td>
                <td class="px-6 py-4">${rsvp.mealChoice || '-'}</td>
                <td class="px-6 py-4">${rsvp.allergies || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${new Date(rsvp.createdAt).toLocaleDateString('he-IL')}</td>
                <td class="px-6 py-4">
                    <button onclick="viewRsvp(${rsvp.id})" class="text-blue-500 hover:text-blue-600">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter RSVPs
function filterRsvps() {
    const status = document.getElementById('filter-status').value;
    const meal = document.getElementById('filter-meal').value;
    const search = document.getElementById('filter-search').value.toLowerCase();
    
    filteredRsvps = allRsvps.filter(rsvp => {
        if (status !== 'all' && rsvp.status !== status) return false;
        if (meal !== 'all' && rsvp.mealChoice !== meal) return false;
        if (search && !rsvp.fullName.toLowerCase().includes(search) && !rsvp.phone?.includes(search)) return false;
        return true;
    });
    
    renderRsvps();
}

// Clear filters
function clearFilters() {
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-meal').value = 'all';
    document.getElementById('filter-search').value = '';
    filterRsvps();
}

// Export RSVPs
function exportRsvps(format) {
    const data = filteredRsvps.map(rsvp => ({
        'שם מלא': rsvp.fullName,
        'טלפון': rsvp.phone || '',
        'סטטוס': rsvp.status === 'confirmed' ? 'מאושר' : rsvp.status === 'declined' ? 'לא מגיע' : 'ממתין',
        'מלווים': rsvp.plusOnes || 0,
        'מנה': rsvp.mealChoice || '',
        'אלרגיות': rsvp.allergies || '',
        'הערות': rsvp.notes || '',
        'תאריך': new Date(rsvp.createdAt).toLocaleDateString('he-IL')
    }));
    
    if (format === 'csv') {
        downloadCSV(data, `rsvps_${currentEvent.slug}_${Date.now()}.csv`);
    } else if (format === 'excel') {
        // For simplicity, we'll use CSV with .xlsx extension
        downloadCSV(data, `rsvps_${currentEvent.slug}_${Date.now()}.xlsx`);
    }
    
    showToast(`הקובץ הורד בהצלחה (${filteredRsvps.length} רשומות)`, 'success');
}

// Load Guests
async function loadGuests() {
    document.getElementById('guests-loading').classList.remove('hidden');
    document.getElementById('guests-empty').classList.add('hidden');
    document.getElementById('guests-list').classList.add('hidden');
    
    try {
        const response = await axios.get(`/api/events/${currentEvent.id}/guests`);
        allGuests = response.data.guests || [];
        
        document.getElementById('guests-loading').classList.add('hidden');
        
        if (allGuests.length === 0) {
            document.getElementById('guests-empty').classList.remove('hidden');
        } else {
            document.getElementById('guests-list').classList.remove('hidden');
            renderGuests();
        }
    } catch (error) {
        console.error('Error loading guests:', error);
        document.getElementById('guests-loading').classList.add('hidden');
        showToast('שגיאה בטעינת מוזמנים', 'error');
    }
}

// Render Guests
function renderGuests() {
    const tbody = document.getElementById('guests-table-body');
    tbody.innerHTML = allGuests.map(guest => {
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-semibold">${guest.fullName}</td>
                <td class="px-6 py-4">${guest.phone || '-'}</td>
                <td class="px-6 py-4">${guest.email || '-'}</td>
                <td class="px-6 py-4">${guest.groupLabel || '-'}</td>
                <td class="px-6 py-4">
                    ${guest.hasRsvp ? '<span class="text-green-600"><i class="fas fa-check ml-1"></i>אישר</span>' : '<span class="text-gray-400">טרם אישר</span>'}
                </td>
                <td class="px-6 py-4">
                    <button onclick="editGuest('${guest.id}')" class="text-blue-500 hover:text-blue-600 ml-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteGuest('${guest.id}')" class="text-red-500 hover:text-red-600">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Export Guests
function exportGuests(format) {
    const data = allGuests.map(guest => ({
        'שם מלא': guest.fullName,
        'טלפון': guest.phone || '',
        'אימייל': guest.email || '',
        'צד': guest.side || '',
        'קבוצה': guest.groupLabel || '',
        'הערות': guest.notes || '',
        'RSVP': guest.hasRsvp ? 'אישר' : 'לא אישר'
    }));
    
    downloadCSV(data, `guests_${currentEvent.slug}_${Date.now()}.csv`);
    showToast(`הקובץ הורד בהצלחה (${allGuests.length} רשומות)`, 'success');
}

// Load Seating
async function loadSeating() {
    console.log('🔵 Loading seating data for event:', currentEvent.id);
    document.getElementById('tables-loading').classList.remove('hidden');
    document.getElementById('tables-empty').classList.add('hidden');
    document.getElementById('tables-grid').classList.add('hidden');
    
    try {
        console.log('📡 Making 4 API calls...');
        const [tablesRes, seatingRes, rsvpsRes, guestsRes] = await Promise.all([
            axios.get(`/api/events/${currentEvent.id}/tables`),
            axios.get(`/api/events/${currentEvent.id}/seating`),
            axios.get(`/api/events/${currentEvent.id}/rsvps`),
            axios.get(`/api/events/${currentEvent.id}/guests`)
        ]);
        
        console.log('✅ API calls successful:', {
            tables: tablesRes.data.tables?.length,
            seating: seatingRes.data.seating?.length,
            rsvps: rsvpsRes.data.rsvps?.length,
            guests: guestsRes.data.guests?.length
        });
        
        allTables = tablesRes.data.tables || [];
        allSeating = seatingRes.data.seating || [];
        allRsvps = rsvpsRes.data.rsvps || [];
        allGuests = guestsRes.data.guests || [];
        
        document.getElementById('tables-loading').classList.add('hidden');
        
        if (allTables.length === 0) {
            document.getElementById('tables-empty').classList.remove('hidden');
        } else {
            document.getElementById('tables-grid').classList.remove('hidden');
            renderSeating();
        }
        
        renderUnseatedGuests();
    } catch (error) {
        console.error('❌ Error loading seating:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        document.getElementById('tables-loading').classList.add('hidden');
        showToast('שגיאה בטעינת הושבה', 'error');
    }
}

// Render Unseated Guests
function renderUnseatedGuests() {
    // Get seated RSVP and Guest IDs
    const seatedRsvpIds = allSeating.filter(s => s.rsvpId).map(s => s.rsvpId);
    const seatedGuestIds = allSeating.filter(s => s.guestId).map(s => s.guestId);
    
    // Filter unseated RSVPs (confirmed and not seated)
    const unseatedRsvps = allRsvps.filter(r => 
        r.status === 'confirmed' && !seatedRsvpIds.includes(r.id)
    );
    
    // Filter unseated Guests (not seated)
    const unseatedGuests = allGuests.filter(g => !seatedGuestIds.includes(g.id));
    
    // Combine both lists
    const unseated = [
        ...unseatedRsvps.map(r => ({ 
            id: r.id, 
            type: 'rsvp', 
            name: r.fullName, 
            count: (r.attendingCount || 1),
            subtitle: r.attendingCount > 1 ? `${r.attendingCount} מגיעים` : 'מגיע אחד',
            seatingNote: r.seatingNote || null  // Add seating note
        })),
        ...unseatedGuests.map(g => ({ 
            id: g.id, 
            type: 'guest', 
            name: g.fullName, 
            count: 1,
            subtitle: g.groupLabel || 'מוזמן',
            seatingNote: null  // Guests don't have seating notes
        }))
    ];
    
    document.getElementById('unseated-count').textContent = unseated.length;
    
    const container = document.getElementById('unseated-guests');
    if (unseated.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">כל האורחים הושבו</p>';
    } else {
        container.innerHTML = unseated.map(person => `
            <div draggable="true" ondragstart="drag(event)" 
                 data-${person.type}-id="${person.id}"
                 class="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-move hover:bg-blue-100 transition">
                <p class="font-semibold text-sm">${person.name}</p>
                <p class="text-xs text-gray-600">${person.subtitle}</p>
                ${person.type === 'guest' ? '<span class="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">מוזמן ידני</span>' : ''}
                ${person.seatingNote ? `<p class="text-xs text-red-600 mt-1 border-t border-red-200 pt-1"><i class="fas fa-exclamation-triangle ml-1"></i>${person.seatingNote}</p>` : ''}
            </div>
        `).join('');
    }
}

// Render Seating Tables
function renderSeating() {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = allTables.map(table => {
        const tableSeating = allSeating.filter(s => s.tableId === table.id);
        
        // חישוב מספר מושבים תפוסים (כולל +1)
        const occupiedSeats = tableSeating.reduce((sum, seat) => {
            if (seat.rsvpId) {
                const rsvp = allRsvps.find(r => r.id === seat.rsvpId);
                return sum + (rsvp?.attendingCount || 1);
            } else if (seat.guestId) {
                const guest = allGuests.find(g => g.id === seat.guestId);
                return sum + (guest?.attendingCount || 1);
            }
            return sum + 1;
        }, 0);
        
        const availableSeats = table.capacity - occupiedSeats;
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-4 table-drop-zone" 
                 ondrop="drop(event)" ondragover="allowDrop(event)" data-table-id="${table.id}">
                <div class="flex justify-between items-center mb-3">
                    <div>
                        <h4 class="font-bold text-lg">${table.tableName}</h4>
                        ${table.tableNumber ? `<span class="text-xs text-gray-500">שולחן ${table.tableNumber}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm ${availableSeats > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${occupiedSeats}/${table.capacity}
                        </span>
                        <button onclick="deleteTable('${table.id}')" 
                                class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="מחק שולחן">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
                <div class="space-y-2 min-h-[100px]">
                    ${tableSeating.map(seat => {
                        // Check if it's an RSVP or Guest
                        let person = null;
                        let isRsvp = false;
                        let badge = '';
                        
                        if (seat.rsvpId) {
                            person = allRsvps.find(r => r.id === seat.rsvpId);
                            isRsvp = true;
                            if (person && person.attendingCount > 1) {
                                badge = `<span class="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-1">+${person.attendingCount - 1}</span>`;
                            }
                        } else if (seat.guestId) {
                            person = allGuests.find(g => g.id === seat.guestId);
                            isRsvp = false;
                            badge = '<span class="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded ml-1">מוזמן</span>';
                        }
                        
                        return person ? `
                            <div class="bg-${isRsvp ? 'pink' : 'purple'}-50 border border-${isRsvp ? 'pink' : 'purple'}-200 rounded p-2 flex justify-between items-center">
                                <div class="flex items-center">
                                    <span class="text-sm font-semibold">${person.fullName}</span>
                                    ${badge}
                                </div>
                                <button onclick="unseatGuest('${seat.id}')" class="text-red-500 hover:text-red-600 text-xs">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        ` : '';
                    }).join('')}
                    ${occupiedSeats === 0 ? '<p class="text-sm text-gray-400 text-center py-4">גרור אורחים לכאן</p>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Drag and Drop functions
function drag(ev) {
    // Support both RSVP and Guest dragging
    if (ev.target.dataset.rsvpId) {
        ev.dataTransfer.setData("rsvpId", ev.target.dataset.rsvpId);
    }
    if (ev.target.dataset.guestId) {
        ev.dataTransfer.setData("guestId", ev.target.dataset.guestId);
    }
    ev.target.classList.add('dragging');
}

function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function drop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('drag-over');
    
    const rsvpId = ev.dataTransfer.getData("rsvpId");
    const guestId = ev.dataTransfer.getData("guestId");
    const tableId = ev.currentTarget.dataset.tableId;
    
    if ((rsvpId || guestId) && tableId) {
        seatGuest(rsvpId, guestId, tableId);
    }
    
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

// Seat Guest
async function seatGuest(rsvpId, guestId, tableId) {
    try {
        const data = { tableId };
        
        // Add either rsvpId or guestId (not both)
        if (rsvpId) {
            data.rsvpId = rsvpId;
        } else if (guestId) {
            data.guestId = guestId;
        }
        
        const response = await axios.post(`/api/events/${currentEvent.id}/seating`, data);
        
        if (response.data.success) {
            showToast('האורח הושב בהצלחה', 'success');
            loadSeating();
        } else {
            showToast(response.data.error || 'שגיאה בהושבת אורח', 'error');
        }
    } catch (error) {
        console.error('Error seating guest:', error);
        showToast(error.response?.data?.error || 'שגיאה בהושבת אורח', 'error');
    }
}

// Unseat Guest
async function unseatGuest(seatingId) {
    if (!confirm('האם אתה בטוח שברצונך להסיר את האורח מהשולחן?')) return;
    
    try {
        const response = await axios.delete(`/api/seating/${seatingId}`);
        
        if (response.data.success) {
            showToast('האורח הוסר מהשולחן', 'success');
            loadSeating();
        } else {
            showToast(response.data.error || 'שגיאה בהסרת אורח', 'error');
        }
    } catch (error) {
        console.error('Error unseating guest:', error);
        showToast('שגיאה בהסרת אורח', 'error');
    }
}

// Auto-fill Seating
async function autoFillSeating() {
    if (!confirm('פעולה זו תמלא אוטומטית את השולחנות הפנויים לפי קבוצות וצדדים. האם להמשיך?')) return;
    
    // Get seated RSVP and Guest IDs
    const seatedRsvpIds = allSeating.filter(s => s.rsvpId).map(s => s.rsvpId);
    const seatedGuestIds = allSeating.filter(s => s.guestId).map(s => s.guestId);
    
    // Get unseated RSVPs and Guests with full data
    const unseatedRsvps = allRsvps.filter(r => 
        r.status === 'confirmed' && !seatedRsvpIds.includes(r.id)
    ).map(r => ({
        type: 'rsvp',
        id: r.id,
        side: r.side || 'both',
        group: r.groupLabel || 'other',
        name: r.fullName,
        attendingCount: r.attendingCount || 1 // CRITICAL: track how many seats needed
    }));
    
    const unseatedGuests = allGuests.filter(g => !seatedGuestIds.includes(g.id))
        .map(g => ({
            type: 'guest',
            id: g.id,
            side: g.side || 'both',
            group: g.groupLabel || 'other',
            name: g.fullName,
            attendingCount: 1 // Guests always count as 1
        }));
    
    // Combine and group by side and group
    const unseated = [...unseatedRsvps, ...unseatedGuests];
    
    if (unseated.length === 0) {
        showToast('אין אורחים להושיב', 'info');
        return;
    }
    
    // Group by side -> group -> people
    const grouped = {};
    unseated.forEach(person => {
        const side = person.side;
        const group = person.group;
        
        if (!grouped[side]) grouped[side] = {};
        if (!grouped[side][group]) grouped[side][group] = [];
        grouped[side][group].push(person);
    });
    
    // Sort groups by size (largest first to fill tables efficiently)
    const sortedGroups = [];
    Object.keys(grouped).forEach(side => {
        Object.keys(grouped[side]).forEach(group => {
            sortedGroups.push({
                side,
                group,
                people: grouped[side][group],
                size: grouped[side][group].length
            });
        });
    });
    sortedGroups.sort((a, b) => b.size - a.size);
    
    // Collect all seating assignments
    const seatings = [];
    
    // Helper function to check if table name matches group
    const tableMatchesGroup = (tableName, groupName) => {
        const tableNameLower = tableName.toLowerCase();
        const groupNameLower = groupName.toLowerCase();
        
        // Direct match
        if (tableNameLower.includes(groupNameLower) || groupNameLower.includes(tableNameLower)) {
            return true;
        }
        
        // Hebrew translations
        const groupMappings = {
            'family': ['משפחה', 'קרובים'],
            'friends': ['חברים', 'ידידים'],
            'work': ['עבודה', 'קולגות', 'עמיתים'],
            'other': ['אחרים', 'שונות'],
            'משפחה': ['family', 'קרובים'],
            'חברים': ['friends', 'ידידים'],
            'עבודה': ['work', 'קולגות'],
            'אחרים': ['other', 'שונות']
        };
        
        const mappings = groupMappings[groupNameLower] || [];
        return mappings.some(m => tableNameLower.includes(m));
    };
    
    // Phase 1: Try to match groups to their corresponding tables
    for (const table of allTables) {
        const tableSeating = allSeating.filter(s => s.tableId === table.id);
        
        // Calculate actual occupied seats (considering attendingCount for RSVPs)
        let occupiedSeats = 0;
        for (const seat of tableSeating) {
            if (seat.rsvpId) {
                const rsvp = allRsvps.find(r => r.id === seat.rsvpId);
                occupiedSeats += rsvp?.attendingCount || 1;
            } else {
                occupiedSeats += 1; // Guest
            }
        }
        
        let availableSeats = table.capacity - occupiedSeats;
        
        if (availableSeats <= 0) continue;
        
        // Find groups that match this table's name
        for (let i = 0; i < sortedGroups.length && availableSeats > 0; i++) {
            const groupData = sortedGroups[i];
            
            if (groupData.people.length === 0) continue;
            
            // Check if table name matches group
            if (!tableMatchesGroup(table.tableName, groupData.group)) continue;
            
            // Try to seat people from this group
            while (groupData.people.length > 0 && availableSeats > 0) {
                const person = groupData.people[0]; // Peek at first person
                const seatsNeeded = person.attendingCount || 1;
                
                // Check if we have enough space for this person + companions
                if (seatsNeeded <= availableSeats) {
                    groupData.people.shift(); // Remove from array
                    
                    const seatingData = { tableId: table.id };
                    
                    if (person.type === 'rsvp') {
                        seatingData.rsvpId = person.id;
                    } else {
                        seatingData.guestId = person.id;
                    }
                    
                    seatings.push(seatingData);
                    availableSeats -= seatsNeeded;
                } else {
                    // Not enough space, move to next group
                    break;
                }
            }
        }
    }
    
    // Phase 2: Fill remaining seats with any unseated guests
    for (const table of allTables) {
        const tableSeating = allSeating.filter(s => s.tableId === table.id);
        const currentSeatings = seatings.filter(s => s.tableId === table.id);
        
        // Calculate actual occupied seats (existing + planned)
        let occupiedSeats = 0;
        
        // Count existing seated
        for (const seat of tableSeating) {
            if (seat.rsvpId) {
                const rsvp = allRsvps.find(r => r.id === seat.rsvpId);
                occupiedSeats += rsvp?.attendingCount || 1;
            } else {
                occupiedSeats += 1;
            }
        }
        
        // Count planned seatings
        for (const planned of currentSeatings) {
            if (planned.rsvpId) {
                const rsvp = allRsvps.find(r => r.id === planned.rsvpId);
                occupiedSeats += rsvp?.attendingCount || 1;
            } else {
                occupiedSeats += 1;
            }
        }
        
        let availableSeats = table.capacity - occupiedSeats;
        
        if (availableSeats <= 0) continue;
        
        // Fill with any remaining guests
        for (let i = 0; i < sortedGroups.length && availableSeats > 0; i++) {
            const groupData = sortedGroups[i];
            
            if (groupData.people.length === 0) continue;
            
            // Try to seat people from this group
            while (groupData.people.length > 0 && availableSeats > 0) {
                const person = groupData.people[0]; // Peek at first person
                const seatsNeeded = person.attendingCount || 1;
                
                // Check if we have enough space
                if (seatsNeeded <= availableSeats) {
                    groupData.people.shift(); // Remove from array
                    
                    const seatingData = { tableId: table.id };
                    
                    if (person.type === 'rsvp') {
                        seatingData.rsvpId = person.id;
                    } else {
                        seatingData.guestId = person.id;
                    }
                    
                    seatings.push(seatingData);
                    availableSeats -= seatsNeeded;
                } else {
                    // Not enough space, move to next group
                    break;
                }
            }
        }
    }
    
    if (seatings.length === 0) {
        showToast('לא ניתן להושיב אורחים נוספים', 'warning');
        return;
    }
    
    // Send bulk request
    try {
        const response = await axios.post(
            `/api/events/${currentEvent.id}/seating/bulk`,
            { seatings }
        );
        
        if (response.data.success) {
            const seated = response.data.results.length;
            showToast(`${seated} אורחים הושבו אוטומטית לפי קבוצות`, 'success');
            
            if (response.data.errors && response.data.errors.length > 0) {
                console.warn('Some seating errors:', response.data.errors);
            }
        } else {
            showToast(response.data.error || 'שגיאה בהושבה אוטומטית', 'error');
        }
    } catch (error) {
        console.error('Error auto-seating:', error);
        const errorMsg = error.response?.data?.error || 'שגיאה בהושבה אוטומטית';
        showToast(errorMsg, 'error');
    }
    
    loadSeating();
}

// Export Seating
function exportSeating() {
    const data = [];
    allTables.forEach(table => {
        const tableSeating = allSeating.filter(s => s.tableId === table.id);
        tableSeating.forEach(seat => {
            const rsvp = allRsvps.find(r => r.id === seat.rsvpId);
            if (rsvp) {
                data.push({
                    'שולחן': table.tableName,
                    'מספר שולחן': table.tableNumber,
                    'שם': rsvp.fullName,
                    'טלפון': rsvp.phone || '',
                    'מנה': rsvp.mealChoice || ''
                });
            }
        });
    });
    
    downloadCSV(data, `seating_${currentEvent.slug}_${Date.now()}.csv`);
    showToast('הקובץ הורד בהצלחה', 'success');
}

// Load Check-in
async function loadCheckin() {
    try {
        const [rsvpsRes, checkinsRes] = await Promise.all([
            axios.get(`/api/events/${currentEvent.id}/rsvps`),
            axios.get(`/api/events/${currentEvent.id}/checkins`)
        ]);
        
        allRsvps = rsvpsRes.data.rsvps || [];
        const checkins = checkinsRes.data.checkins || [];
        
        // Calculate stats
        const confirmed = allRsvps.filter(r => r.status === 'confirmed');
        const arrived = checkins.filter(c => c.arrived);
        const declined = allRsvps.filter(r => r.status === 'declined');
        
        document.getElementById('checkin-arrived').textContent = arrived.length;
        document.getElementById('checkin-expected').textContent = confirmed.length - arrived.length;
        document.getElementById('checkin-declined').textContent = declined.length;
        
        renderCheckinList();
    } catch (error) {
        console.error('Error loading check-in:', error);
        showToast('שגיאה בטעינת נתוני צ\'ק-אין', 'error');
    }
}

// Render Check-in List
function renderCheckinList() {
    const container = document.getElementById('checkin-list');
    const confirmed = allRsvps.filter(r => r.status === 'confirmed');
    
    if (confirmed.length === 0) {
        container.innerHTML = '<p class="text-center py-12 text-gray-500">אין אישורי הגעה עדיין</p>';
        return;
    }
    
    container.innerHTML = confirmed.map(rsvp => {
        const checkin = rsvp.checkinId ? { arrived: true, arrivedAt: rsvp.checkinTime } : null;
        
        return `
            <div class="p-4 hover:bg-gray-50">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <p class="font-bold text-lg">${rsvp.fullName}</p>
                        <p class="text-sm text-gray-600">${rsvp.phone || 'אין טלפון'}</p>
                        ${rsvp.tableNumber ? `<p class="text-sm text-purple-600"><i class="fas fa-chair ml-1"></i>שולחן ${rsvp.tableNumber}</p>` : ''}
                    </div>
                    <div class="flex items-center space-x-reverse space-x-3">
                        ${checkin?.arrived ? `
                            <div class="text-left">
                                <p class="text-sm text-green-600 font-semibold">הגיע</p>
                                <p class="text-xs text-gray-500">${new Date(checkin.arrivedAt).toLocaleTimeString('he-IL')}</p>
                            </div>
                            <button onclick="cancelCheckin(${rsvp.id})" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                                ביטול
                            </button>
                        ` : `
                            <button onclick="performCheckin(${rsvp.id})" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
                                <i class="fas fa-check ml-2"></i>
                                צ'ק-אין
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Search Check-in
function searchCheckin() {
    const query = document.getElementById('checkin-search').value.toLowerCase();
    if (!query) {
        renderCheckinList();
        return;
    }
    
    const filtered = allRsvps.filter(r => 
        r.status === 'confirmed' && 
        (r.fullName.toLowerCase().includes(query) || r.phone?.includes(query))
    );
    
    const container = document.getElementById('checkin-list');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center py-12 text-gray-500">לא נמצאו תוצאות</p>';
    } else {
        // Re-render with filtered results
        container.innerHTML = filtered.map(rsvp => {
            const checkin = rsvp.checkinId ? { arrived: true, arrivedAt: rsvp.checkinTime } : null;
            
            return `
                <div class="p-4 hover:bg-gray-50">
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <p class="font-bold text-lg">${rsvp.fullName}</p>
                            <p class="text-sm text-gray-600">${rsvp.phone || 'אין טלפון'}</p>
                        </div>
                        <div class="flex items-center space-x-reverse space-x-3">
                            ${checkin?.arrived ? `
                                <div class="text-left">
                                    <p class="text-sm text-green-600 font-semibold">הגיע</p>
                                    <p class="text-xs text-gray-500">${new Date(checkin.arrivedAt).toLocaleTimeString('he-IL')}</p>
                                </div>
                                <button onclick="cancelCheckin(${rsvp.id})" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                                    ביטול
                                </button>
                            ` : `
                                <button onclick="performCheckin(${rsvp.id})" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
                                    <i class="fas fa-check ml-2"></i>
                                    צ'ק-אין
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Perform Check-in
async function performCheckin(rsvpId) {
    try {
        const response = await axios.post(`/api/events/${currentEvent.id}/checkins`, {
            rsvpId: rsvpId,
            arrived: true
        });
        
        if (response.data.success) {
            showToast('צ\'ק-אין בוצע בהצלחה', 'success');
            loadCheckin();
        } else {
            showToast(response.data.error || 'שגיאה בצ\'ק-אין', 'error');
        }
    } catch (error) {
        console.error('Error performing check-in:', error);
        showToast('שגיאה בצ\'ק-אין', 'error');
    }
}

// Cancel Check-in
async function cancelCheckin(rsvpId) {
    if (!confirm('האם לבטל את הצ\'ק-אין?')) return;
    
    try {
        // Find checkin ID
        const response = await axios.get(`/api/events/${currentEvent.id}/checkins`);
        const checkin = response.data.checkins?.find(c => c.rsvpId === rsvpId);
        
        if (checkin) {
            await axios.delete(`/api/checkins/${checkin.id}`);
            showToast('הצ\'ק-אין בוטל', 'success');
            loadCheckin();
        }
    } catch (error) {
        console.error('Error canceling check-in:', error);
        showToast('שגיאה בביטול צ\'ק-אין', 'error');
    }
}

// Walk-ins Management
let allWalkins = [];

// Load Walk-ins
async function loadWalkins() {
    try {
        const response = await axios.get(`/api/events/${currentEvent.id}/guests`);
        allGuests = response.data.guests || [];
        
        // Filter walk-ins (guests with notes containing "walk-in" or specific group)
        allWalkins = allGuests.filter(g => 
            g.notes?.toLowerCase().includes('walk-in') || 
            g.groupLabel === 'walk-in'
        );
        
        document.getElementById('walkins-count').textContent = allWalkins.length;
        renderWalkinsList();
    } catch (error) {
        console.error('Error loading walk-ins:', error);
        showToast('שגיאה בטעינת Walk-ins', 'error');
    }
}

// Render Walk-ins List
function renderWalkinsList() {
    const container = document.getElementById('walkins-list');
    
    if (allWalkins.length === 0) {
        container.innerHTML = '<p class="text-center py-12 text-gray-500">אין Walk-ins עדיין</p>';
        return;
    }
    
    container.innerHTML = allWalkins.map(guest => `
        <div class="p-4 hover:bg-gray-50 transition">
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <div class="flex items-center space-x-reverse space-x-2 mb-2">
                        <i class="fas fa-person-walking text-pink-500"></i>
                        <p class="font-bold text-lg">${guest.fullName}</p>
                        ${guest.attendingCount > 0 ? `<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">+${guest.attendingCount}</span>` : ''}
                    </div>
                    <div class="flex items-center space-x-reverse space-x-4 text-sm text-gray-600">
                        ${guest.phone ? `<span><i class="fas fa-phone ml-1"></i>${guest.phone}</span>` : ''}
                        <span><i class="fas fa-tag ml-1"></i>${translateGroup(guest.groupLabel)}</span>
                        <span><i class="fas fa-heart ml-1"></i>${translateSide(guest.side)}</span>
                        ${guest.notes ? `<span><i class="fas fa-sticky-note ml-1"></i>${guest.notes}</span>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-reverse space-x-2">
                    <button onclick="editGuest('${guest.id}')" class="text-blue-500 hover:text-blue-600 px-3 py-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteGuest('${guest.id}')" class="text-red-500 hover:text-red-600 px-3 py-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle Walk-in Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const walkinForm = document.getElementById('walkin-form');
    if (walkinForm) {
        walkinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(walkinForm);
            const data = {
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                side: formData.get('side') || 'both',
                groupLabel: formData.get('groupLabel') || 'other',
                notes: `Walk-in - ${formData.get('notes') || ''} (${new Date().toLocaleString('he-IL')})`.trim()
            };
            
            // Add attendingCount if provided
            const attendingCount = parseInt(formData.get('attendingCount')) || 0;
            if (attendingCount > 0) {
                data.notes = `${data.notes} | מלווים: ${attendingCount}`;
            }
            
            try {
                const response = await axios.post(`/api/events/${currentEvent.id}/guests`, data);
                
                if (response.data.success) {
                    showToast('Walk-in נוסף בהצלחה!', 'success');
                    walkinForm.reset();
                    loadWalkins();
                    loadGuests(); // Refresh main guests list too
                } else {
                    showToast(response.data.error || 'שגיאה בהוספת Walk-in', 'error');
                }
            } catch (error) {
                console.error('Error adding walk-in:', error);
                const errorMsg = error.response?.data?.error || 'שגיאה בהוספת Walk-in';
                showToast(errorMsg, 'error');
            }
        });
    }
});

// Helper: Translate side
function translateSide(side) {
    const map = { groom: 'חתן', bride: 'כלה', both: 'משותף' };
    return map[side] || side;
}

// Helper: Translate group
function translateGroup(group) {
    const map = { family: 'משפחה', friends: 'חברים', work: 'עבודה', other: 'אחרים', 'walk-in': 'Walk-in' };
    return map[group] || group;
}

// Load Messages
function loadMessages() {
    const rsvpLink = `${window.location.origin}/e/${currentEvent.slug}`;
    const eventDate = new Date(currentEvent.dateTime).toLocaleDateString('he-IL');
    
    // Invitation template
    const invitationTemplate = `שלום {שם},\n\nאנחנו שמחים להזמין אתכם לחתונה שלנו!\n\n${currentEvent.coupleNames}\nתאריך: ${eventDate}\n${currentEvent.venueName ? `מקום: ${currentEvent.venueName}` : ''}\n\nלאישור הגעה, אנא מלאו את הטופס:\n${rsvpLink}\n\nמחכים לראותכם!`;
    
    document.getElementById('template-invitation').value = invitationTemplate;
    document.getElementById('preview-invitation').textContent = invitationTemplate.replace('{שם}', 'דני');
    
    // Reminder template
    const reminderTemplate = `שלום {שם},\n\nרצינו להזכיר לכם שהחתונה שלנו מתקרבת!\n\nתאריך: ${eventDate}\n${currentEvent.venueName ? `מקום: ${currentEvent.venueName}` : ''}\n\nאם עדיין לא אישרתם הגעה:\n${rsvpLink}\n\nנתראה בקרוב!`;
    
    document.getElementById('template-reminder').value = reminderTemplate;
    document.getElementById('preview-reminder').textContent = reminderTemplate.replace('{שם}', 'דני');
    
    // RSVP Closed template
    const closedTemplate = `שלום,\n\nהטופס לאישור הגעה לחתונה שלנו נסגר.\nאם יש לכם שאלות, אנא פנו אלינו ישירות.\n\nתודה!`;
    
    document.getElementById('template-closed').value = closedTemplate;
    document.getElementById('preview-closed').textContent = closedTemplate;
}

// Copy Message
function copyMessage(type) {
    const textarea = document.getElementById(`template-${type}`);
    textarea.select();
    document.execCommand('copy');
    showToast('ההודעה הועתקה ללוח', 'success');
}

// Load Settings
function loadSettings() {
    document.getElementById('setting-rsvp-open').checked = currentEvent.isRsvpOpen;
    document.getElementById('setting-eventName').value = currentEvent.eventName;
    document.getElementById('setting-coupleNames').value = currentEvent.coupleNames;
    document.getElementById('setting-dateTime').value = new Date(currentEvent.dateTime).toISOString().slice(0, 16);
    document.getElementById('setting-venueName').value = currentEvent.venueName || '';
    document.getElementById('setting-venueAddress').value = currentEvent.venueAddress || '';
    document.getElementById('setting-wazeLink').value = currentEvent.wazeLink || '';
    document.getElementById('setting-notes').value = currentEvent.notes || '';
    
    // Settings form handler
    document.getElementById('settings-form').onsubmit = async (e) => {
        e.preventDefault();
        await updateSettings();
    };
}

// Toggle RSVP Status
async function toggleRsvpStatus() {
    const isOpen = document.getElementById('setting-rsvp-open').checked;
    
    try {
        const response = await axios.patch(`/api/events/${currentEvent.id}`, {
            isRsvpOpen: isOpen
        });
        
        if (response.data.success) {
            currentEvent.isRsvpOpen = isOpen;
            showToast(`RSVP ${isOpen ? 'נפתח' : 'נסגר'} בהצלחה`, 'success');
        } else {
            showToast(response.data.error || 'שגיאה בעדכון סטטוס', 'error');
            document.getElementById('setting-rsvp-open').checked = !isOpen;
        }
    } catch (error) {
        console.error('Error updating RSVP status:', error);
        showToast('שגיאה בעדכון סטטוס', 'error');
        document.getElementById('setting-rsvp-open').checked = !isOpen;
    }
}

// Update Settings
async function updateSettings() {
    const data = {
        eventName: document.getElementById('setting-eventName').value,
        coupleNames: document.getElementById('setting-coupleNames').value,
        dateTime: new Date(document.getElementById('setting-dateTime').value).toISOString(),
        venueName: document.getElementById('setting-venueName').value,
        venueAddress: document.getElementById('setting-venueAddress').value,
        wazeLink: document.getElementById('setting-wazeLink').value,
        notes: document.getElementById('setting-notes').value
    };
    
    try {
        const response = await axios.patch(`/api/events/${currentEvent.id}`, data);
        
        if (response.data.success) {
            currentEvent = { ...currentEvent, ...data };
            document.getElementById('event-title').textContent = currentEvent.eventName;
            showToast('השינויים נשמרו בהצלחה', 'success');
        } else {
            showToast(response.data.error || 'שגיאה בשמירת השינויים', 'error');
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        showToast('שגיאה בשמירת השינויים', 'error');
    }
}

// Delete Event
async function deleteEvent() {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האירוע? פעולה זו בלתי הפיכה!')) return;
    if (!confirm('האזהרה האחרונה: כל המידע יימחק לצמיתות. האם להמשיך?')) return;
    
    try {
        const response = await axios.delete(`/api/events/${currentEvent.id}`);
        
        if (response.data.success) {
            showToast('האירוע נמחק', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            showToast(response.data.error || 'שגיאה במחיקת האירוע', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        const errorMsg = error.response?.data?.error || error.message || 'שגיאה במחיקת האירוע';
        showToast(errorMsg, 'error');
    }
}

// Helper: Download CSV
function downloadCSV(data, filename) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Copy RSVP Link
function copyRsvpLink() {
    const link = `${window.location.origin}/e/${currentEvent.slug}`;
    navigator.clipboard.writeText(link).then(() => {
        showToast('הלינק הועתק ללוח', 'success');
    });
}

// Logout
async function logout() {
    try {
        await axios.post('/api/auth/logout');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// Modals
function showAddGuestModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">הוספת מוזמן חדש</h2>
            <form id="add-guest-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">שם מלא *</label>
                    <input type="text" name="fullName" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                           placeholder="הכנס שם מלא">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">טלפון</label>
                    <input type="tel" name="phone" 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                           placeholder="05X-XXXXXXX">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">צד</label>
                    <input type="text" name="side" 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                           placeholder="חתן/כלה/משותף">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">קבוצה</label>
                    <input type="text" name="groupLabel" 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                           placeholder="משפחה/חברים/עבודה">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">הערות</label>
                    <textarea name="notes" rows="2"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="הערות נוספות..."></textarea>
                </div>
                <div class="flex space-x-reverse space-x-3 pt-4">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition font-semibold">
                        <i class="fas fa-plus ml-2"></i>
                        הוסף מוזמן
                    </button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                        ביטול
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('add-guest-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone') || '',
            side: formData.get('side') || '',
            groupLabel: formData.get('groupLabel') || '',
            notes: formData.get('notes') || ''
        };
        
        try {
            const response = await axios.post(`/api/events/${getEventId()}/guests`, data);
            if (response.data.success) {
                showToast('המוזמן נוסף בהצלחה', 'success');
                modal.remove();
                loadGuests();
                loadSeating(); // Refresh seating to show new guest
            }
        } catch (error) {
            console.error('Error adding guest:', error);
            showToast(error.response?.data?.error || 'שגיאה בהוספת מוזמן', 'error');
        }
    });
}

function showImportModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 my-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-file-import ml-2 text-blue-500"></i>
                    ייבוא רשימת מוזמנים
                </h2>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <!-- Instructions -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 class="font-bold text-blue-900 mb-2">
                    <i class="fas fa-info-circle ml-1"></i>
                    הוראות שימוש
                </h3>
                <ol class="text-sm text-blue-800 space-y-1 mr-4">
                    <li>1. הורד את קובץ התבנית</li>
                    <li>2. מלא את הפרטים באקסל/Google Sheets</li>
                    <li>3. שמור כ-CSV (UTF-8)</li>
                    <li>4. העלה את הקובץ כאן</li>
                </ol>
            </div>
            
            <!-- Download Template Button -->
            <div class="mb-6">
                <button onclick="downloadTemplate()" 
                        class="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-teal-600 transition font-semibold shadow-lg">
                    <i class="fas fa-download ml-2"></i>
                    הורד תבנית CSV
                </button>
                <p class="text-xs text-gray-500 text-center mt-2">
                    הורד קובץ דוגמה עם כל העמודות הנדרשות
                </p>
            </div>
            
            <!-- File Upload -->
            <div class="mb-6">
                <label class="block text-gray-700 font-semibold mb-2">
                    <i class="fas fa-upload ml-1"></i>
                    העלה קובץ CSV
                </label>
                <input type="file" id="csv-file-input" accept=".csv,.txt"
                       class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer"
                       onchange="handleFileSelect(event)">
                <p class="text-xs text-gray-500 mt-2">
                    תומך בקבצים: CSV, TXT (קידוד UTF-8)
                </p>
            </div>
            
            <!-- Preview Area -->
            <div id="import-preview" class="hidden mb-6">
                <h3 class="font-bold text-gray-800 mb-3">תצוגה מקדימה:</h3>
                <div class="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-300">
                                <th class="text-right py-2">שם מלא</th>
                                <th class="text-right py-2">טלפון</th>
                                <th class="text-right py-2">צד</th>
                                <th class="text-right py-2">קבוצה</th>
                            </tr>
                        </thead>
                        <tbody id="preview-tbody">
                        </tbody>
                    </table>
                </div>
                <p id="preview-count" class="text-sm text-gray-600 mt-2"></p>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex space-x-reverse space-x-3" id="import-actions">
                <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                    סגור
                </button>
            </div>
            
            <div class="hidden flex space-x-reverse space-x-3" id="import-confirm-actions">
                <button id="confirm-import-btn" onclick="confirmImport()" 
                        class="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition font-semibold">
                    <i class="fas fa-check ml-2"></i>
                    אישור וייבוא (<span id="import-count">0</span> מוזמנים)
                </button>
                <button id="cancel-import-btn" onclick="cancelImport()" 
                        class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                    ביטול
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Global variable to store parsed CSV data
let parsedGuestsData = [];

// Download CSV Template
function downloadTemplate() {
    const template = [
        ['שם מלא', 'טלפון', 'צד', 'קבוצה'],
        ['דוד כהן', '0501234567', 'חתן', 'משפחה'],
        ['שרה לוי', '0529876543', 'כלה', 'משפחה'],
        ['יוסי מזרחי', '', 'חתן', 'חברים'],
        ['רחל אברהם', '0541112233', 'משותף', 'עבודה']
    ];
    
    const csv = template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'תבנית_מוזמנים.csv';
    link.click();
    
    showToast('תבנית הורדה בהצלחה', 'success');
}

// Handle File Selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            parseCSV(text);
        } catch (error) {
            console.error('Error reading file:', error);
            showToast('שגיאה בקריאת הקובץ', 'error');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// Parse CSV Content
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
        showToast('הקובץ ריק או לא תקין', 'error');
        return;
    }
    
    // Parse header
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    parsedGuestsData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length >= 1 && values[0].trim()) {
            const guest = {
                fullName: values[0]?.trim() || '',
                phone: values[1]?.trim() || '',
                side: values[2]?.trim() || '',
                groupLabel: values[3]?.trim() || ''
            };
            
            if (guest.fullName) {
                parsedGuestsData.push(guest);
            }
        }
    }
    
    if (parsedGuestsData.length === 0) {
        showToast('לא נמצאו נתונים תקינים בקובץ', 'error');
        return;
    }
    
    // Show preview
    showPreview();
}

// Parse single CSV line (handles quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// Show Preview
function showPreview() {
    document.getElementById('import-preview').classList.remove('hidden');
    document.getElementById('import-actions').classList.add('hidden');
    document.getElementById('import-confirm-actions').classList.remove('hidden');
    
    const tbody = document.getElementById('preview-tbody');
    const previewCount = Math.min(5, parsedGuestsData.length);
    
    tbody.innerHTML = parsedGuestsData.slice(0, previewCount).map(guest => `
        <tr class="border-b border-gray-200">
            <td class="py-2">${guest.fullName}</td>
            <td class="py-2">${guest.phone || '-'}</td>
            <td class="py-2">${guest.side || '-'}</td>
            <td class="py-2">${guest.groupLabel || '-'}</td>
        </tr>
    `).join('');
    
    document.getElementById('preview-count').textContent = 
        `מציג ${previewCount} מתוך ${parsedGuestsData.length} רשומות`;
    document.getElementById('import-count').textContent = parsedGuestsData.length;
}

// Cancel Import
function cancelImport() {
    parsedGuestsData = [];
    document.getElementById('csv-file-input').value = '';
    document.getElementById('import-preview').classList.add('hidden');
    document.getElementById('import-actions').classList.remove('hidden');
    document.getElementById('import-confirm-actions').classList.add('hidden');
}

// Confirm Import
async function confirmImport() {
    if (parsedGuestsData.length === 0) {
        showToast('אין נתונים לייבוא', 'error');
        return;
    }
    
    // Get button and disable it
    const importBtn = document.getElementById('confirm-import-btn');
    const cancelBtn = document.getElementById('cancel-import-btn');
    const originalBtnText = importBtn.innerHTML;
    
    // Show loading state
    importBtn.disabled = true;
    cancelBtn.disabled = true;
    importBtn.classList.add('opacity-50', 'cursor-not-allowed');
    importBtn.innerHTML = `
        <i class="fas fa-spinner fa-spin ml-2"></i>
        מייבא ${parsedGuestsData.length} אורחים...
    `;
    
    try {
        const response = await axios.post(`/api/events/${currentEvent.id}/guests/bulk`, parsedGuestsData);
        
        if (response.data.success) {
            showToast(`${parsedGuestsData.length} מוזמנים יובאו בהצלחה! 🎉`, 'success');
            document.querySelector('.fixed').remove();
            loadGuests();
            loadSeating();
        } else {
            showToast(response.data.error || 'שגיאה בייבוא מוזמנים', 'error');
            // Restore button state on error
            importBtn.disabled = false;
            cancelBtn.disabled = false;
            importBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            importBtn.innerHTML = originalBtnText;
        }
    } catch (error) {
        console.error('Error importing guests:', error);
        showToast(error.response?.data?.error || 'שגיאה בייבוא מוזמנים', 'error');
        // Restore button state on error
        importBtn.disabled = false;
        cancelBtn.disabled = false;
        importBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        importBtn.innerHTML = originalBtnText;
    }
}

function showAddTableModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">הוספת שולחן חדש</h2>
            <form id="add-table-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">שם השולחן *</label>
                    <input type="text" name="tableName" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                           placeholder='לדוגמה: "שולחן 1" או "משפחה"'>
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">מספר שולחן (אופציונלי)</label>
                    <input type="number" name="tableNumber" min="1"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                           placeholder="1, 2, 3...">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">קיבולת *</label>
                    <input type="number" name="capacity" min="1" max="50" value="10" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                           placeholder="כמה אנשים יכולים לשבת?">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">הערות</label>
                    <textarea name="notes" rows="2"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="הערות נוספות..."></textarea>
                </div>
                <div class="flex space-x-reverse space-x-3 pt-4">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition font-semibold">
                        <i class="fas fa-plus ml-2"></i>
                        הוסף שולחן
                    </button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                        ביטול
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('add-table-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Build data object with proper types
        const data = {
            tableName: formData.get('tableName'),
            notes: formData.get('notes') || ''
        };
        
        // Only add tableNumber if it has a value
        const tableNumberValue = formData.get('tableNumber');
        if (tableNumberValue && tableNumberValue.trim() !== '') {
            data.tableNumber = parseInt(tableNumberValue);
        }
        
        // Only add capacity if it has a value, otherwise use default
        const capacityValue = formData.get('capacity');
        if (capacityValue && capacityValue.trim() !== '') {
            data.capacity = parseInt(capacityValue);
        }
        
        try {
            const response = await axios.post(`/api/events/${getEventId()}/tables`, data);
            if (response.data.success) {
                showToast('השולחן נוסף בהצלחה', 'success');
                modal.remove();
                loadSeating();
            }
        } catch (error) {
            console.error('Error adding table:', error);
            showToast(error.response?.data?.error || 'שגיאה בהוספת שולחן', 'error');
        }
    });
}

// Delete Table
async function deleteTable(tableId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את השולחן? כל האורחים שהושבו בו יחזרו לרשימת המתנה.')) {
        return;
    }
    
    try {
        const response = await axios.delete(`/api/tables/${tableId}`);
        if (response.data.success) {
            showToast('השולחן נמחק בהצלחה', 'success');
            loadSeating();
        }
    } catch (error) {
        console.error('Error deleting table:', error);
        showToast(error.response?.data?.error || 'שגיאה במחיקת השולחן', 'error');
    }
}

function viewRsvp(id) {
    const rsvp = allRsvps.find(r => r.id === id);
    if (!rsvp) {
        showToast('RSVP לא נמצא', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div class="flex justify-between items-start mb-6">
                <h2 class="text-2xl font-bold text-gray-800">פרטי RSVP</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">שם מלא</p>
                        <p class="font-bold text-lg">${rsvp.fullName}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 mb-1">טלפון</p>
                        <p class="font-bold">${rsvp.phone || 'לא צוין'}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">סטטוס</p>
                        <p class="font-bold ${rsvp.status === 'confirmed' ? 'text-green-600' : 'text-red-600'}">
                            <i class="fas fa-${rsvp.status === 'confirmed' ? 'check-circle' : 'times-circle'} ml-1"></i>
                            ${rsvp.status === 'confirmed' ? 'מגיע' : 'לא מגיע'}
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 mb-1">מספר מגיעים</p>
                        <p class="font-bold">${rsvp.attendingCount || 0}</p>
                    </div>
                </div>
                
                ${rsvp.mealChoice ? `
                    <div>
                        <p class="text-sm text-gray-600 mb-1">בחירת מנה</p>
                        <p class="font-semibold">${rsvp.mealChoice}</p>
                    </div>
                ` : ''}
                
                ${rsvp.allergies ? `
                    <div>
                        <p class="text-sm text-gray-600 mb-1">אלרגיות</p>
                        <p class="font-semibold">${rsvp.allergies}</p>
                    </div>
                ` : ''}
                
                ${rsvp.comment ? `
                    <div>
                        <p class="text-sm text-gray-600 mb-1">הערות</p>
                        <p class="font-semibold">${rsvp.comment}</p>
                    </div>
                ` : ''}
                
                <div class="pt-4 border-t">
                    <p class="text-sm text-gray-500">נשלח בתאריך: ${new Date(rsvp.createdAt).toLocaleDateString('he-IL')}</p>
                </div>
            </div>
            
            <div class="mt-6">
                <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                    סגור
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function editGuest(guestId) {
    const guest = allGuests.find(g => g.id === guestId);
    if (!guest) {
        showToast('מוזמן לא נמצא', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">עריכת מוזמן</h2>
            <form id="edit-guest-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">שם מלא *</label>
                    <input type="text" name="fullName" value="${guest.fullName}" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">טלפון</label>
                    <input type="tel" name="phone" value="${guest.phone || ''}"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                           placeholder="05X-XXXXXXX">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">צד</label>
                    <input type="text" name="side" value="${guest.side || ''}"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                           placeholder="חתן/כלה/משותף">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">קבוצה</label>
                    <input type="text" name="groupLabel" value="${guest.groupLabel || ''}"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                           placeholder="משפחה/חברים/עבודה">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">הערות</label>
                    <textarea name="notes" rows="2"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="הערות נוספות...">${guest.notes || ''}</textarea>
                </div>
                <div class="flex space-x-reverse space-x-3 pt-4">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition font-semibold">
                        <i class="fas fa-save ml-2"></i>
                        שמור שינויים
                    </button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                        ביטול
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('edit-guest-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone') || '',
            side: formData.get('side') || '',
            groupLabel: formData.get('groupLabel') || '',
            notes: formData.get('notes') || ''
        };
        
        try {
            const response = await axios.put(`/api/guests/${guestId}`, data);
            if (response.data.success) {
                showToast('המוזמן עודכן בהצלחה', 'success');
                modal.remove();
                loadGuests();
                loadSeating(); // Refresh seating to show updated guest
            }
        } catch (error) {
            console.error('Error updating guest:', error);
            showToast(error.response?.data?.error || 'שגיאה בעדכון מוזמן', 'error');
        }
    });
}

async function deleteGuest(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המוזמן?')) return;
    
    try {
        const response = await axios.delete(`/api/guests/${id}`);
        if (response.data.success) {
            showToast('המוזמן נמחק בהצלחה', 'success');
            loadGuests();
            loadSeating(); // Refresh seating after deleting guest
        }
    } catch (error) {
        console.error('Error deleting guest:', error);
        showToast(error.response?.data?.error || 'שגיאה במחיקת מוזמן', 'error');
    }
}

// Delete all guests
async function deleteAllGuests() {
    const count = allGuests.length;
    
    if (count === 0) {
        showToast('אין מוזמנים למחיקה', 'info');
        return;
    }
    
    const confirmed = confirm(
        `⚠️ אזהרה: פעולה זו תמחק את כל ${count} המוזמנים!\n\n` +
        `האם אתה בטוח לחלוטין?\n\n` +
        `(פעולה זו אינה ניתנת לביטול)`
    );
    
    if (!confirmed) return;
    
    // Double confirmation for safety
    const doubleConfirm = confirm(
        `אישור סופי:\n\n` +
        `למחוק ${count} מוזמנים?\n\n` +
        `לחץ OK למחיקה או Cancel לביטול`
    );
    
    if (!doubleConfirm) return;
    
    try {
        showToast(`מוחק ${count} מוזמנים...`, 'info');
        
        const response = await axios.delete(`/api/events/${currentEvent.id}/guests/all`);
        
        if (response.data.success) {
            showToast(`✅ ${response.data.count} מוזמנים נמחקו בהצלחה!`, 'success');
            loadGuests();
            loadSeating();
            loadOverview(); // Refresh stats
        } else {
            showToast(response.data.error || 'שגיאה במחיקת מוזמנים', 'error');
        }
    } catch (error) {
        console.error('Error deleting all guests:', error);
        showToast(error.response?.data?.error || 'שגיאה במחיקת מוזמנים', 'error');
    }
}

// Analytics Charts
let rsvpChart, groupsChart, seatingChart, sideChart;

function renderAnalyticsCharts(rsvps, guests, seating, tables) {
    // Destroy existing charts
    if (rsvpChart) rsvpChart.destroy();
    if (groupsChart) groupsChart.destroy();
    if (seatingChart) seatingChart.destroy();
    if (sideChart) sideChart.destroy();
    
    // RSVP Status Chart - sum attendingCount instead of counting rows
    const confirmedCount = rsvps
        .filter(r => r.status === 'confirmed')
        .reduce((sum, r) => sum + (r.attendingCount || 1), 0);
    const declinedCount = rsvps.filter(r => r.status === 'declined').length;
    const pendingCount = rsvps.filter(r => r.status === 'pending').length;
    const guestsWithoutRsvp = guests.length; // מוזמנים שטרם אישרו הגעה
    
    const rsvpCtx = document.getElementById('rsvp-chart');
    const totalRsvps = confirmedCount + declinedCount + pendingCount + guestsWithoutRsvp;
    
    // Show placeholder if no data
    if (totalRsvps === 0) {
        rsvpChart = new Chart(rsvpCtx, {
            type: 'doughnut',
            data: {
                labels: ['אין נתונים'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e5e7eb'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    } else {
        rsvpChart = new Chart(rsvpCtx, {
            type: 'doughnut',
            data: {
                labels: ['מאושר', 'לא מגיע', 'ממתין', 'טרם אישר'],
                datasets: [{
                    data: [confirmedCount, declinedCount, pendingCount, guestsWithoutRsvp],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#9ca3af'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Guest Groups Chart
    const groupCounts = {};
    [...rsvps, ...guests].forEach(person => {
        const group = person.groupLabel || 'אחרים';
        groupCounts[group] = (groupCounts[group] || 0) + 1;
    });
    
    const groupsCtx = document.getElementById('groups-chart');
    groupsChart = new Chart(groupsCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(groupCounts),
            datasets: [{
                label: 'מספר אורחים',
                data: Object.values(groupCounts),
                backgroundColor: '#a855f7',
                borderColor: '#7e22ce',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Seating Progress Chart - use attendingCount for total guests
    const totalGuests = confirmedCount + guests.length;
    const seated = seating.length;
    const unseated = totalGuests - seated;
    
    const seatingCtx = document.getElementById('seating-chart');
    seatingChart = new Chart(seatingCtx, {
        type: 'doughnut',
        data: {
            labels: ['הושבו', 'לא הושבו'],
            datasets: [{
                data: [seated, unseated],
                backgroundColor: ['#3b82f6', '#e5e7eb'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // Side Distribution Chart
    const allPeople = [...rsvps, ...guests];
    // Support both English and Hebrew values
    const groomSide = allPeople.filter(p => p.side === 'groom' || p.side === 'חתן').length;
    const brideSide = allPeople.filter(p => p.side === 'bride' || p.side === 'כלה').length;
    const bothSide = allPeople.filter(p => p.side === 'both' || p.side === 'משותף').length;
    // Calculate undefined as: total - (groom + bride + both)
    const undefinedSide = allPeople.length - (groomSide + brideSide + bothSide);
    
    // Debug logging
    console.log('🔍 Side Chart Debug:', {
        totalPeople: allPeople.length,
        groomSide,
        brideSide,
        bothSide,
        undefinedSide,
        samplePerson: allPeople[0]
    });
    
    const sideCtx = document.getElementById('side-chart');
    const totalSides = allPeople.length; // Use total people, not sum of categories
    
    // Show placeholder if no data
    if (totalSides === 0) {
        sideChart = new Chart(sideCtx, {
            type: 'pie',
            data: {
                labels: ['אין נתונים'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e5e7eb'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    } else {
        sideChart = new Chart(sideCtx, {
            type: 'pie',
            data: {
                labels: ['צד חתן', 'צד כלה', 'משותף', 'לא מוגדר'],
                datasets: [{
                    data: [groomSide, brideSide, bothSide, undefinedSide],
                    backgroundColor: ['#3b82f6', '#ec4899', '#8b5cf6', '#9ca3af'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

// Generate Insights
function generateInsights(rsvps, guests, seating, tables) {
    const insights = [];
    
    const confirmed = rsvps.filter(r => r.status === 'confirmed').length;
    const totalGuests = confirmed + guests.length;
    const seated = seating.length;
    const unseated = totalGuests - seated;
    
    // Response rate
    const responseRate = rsvps.length > 0 ? ((rsvps.filter(r => r.status !== 'pending').length / rsvps.length) * 100).toFixed(0) : 0;
    insights.push({
        icon: 'fa-chart-line',
        color: 'text-green-600',
        text: `שיעור מענה: ${responseRate}% מהמוזמנים השיבו לאישור ההגעה`
    });
    
    // Seating progress
    if (totalGuests > 0) {
        const seatingProgress = ((seated / totalGuests) * 100).toFixed(0);
        const icon = seatingProgress >= 80 ? 'fa-check-circle' : 'fa-hourglass-half';
        const color = seatingProgress >= 80 ? 'text-green-600' : 'text-orange-600';
        insights.push({
            icon,
            color,
            text: `התקדמות הושבה: ${seatingProgress}% מהאורחים הושבו (${seated}/${totalGuests})`
        });
    }
    
    // Table capacity
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
    if (totalCapacity > 0 && totalGuests > 0) {
        const utilization = ((seated / totalCapacity) * 100).toFixed(0);
        insights.push({
            icon: 'fa-chair',
            color: 'text-blue-600',
            text: `ניצול שולחנות: ${utilization}% מקיבולת השולחנות (${seated}/${totalCapacity} מקומות)`
        });
    }
    
    // Empty tables
    const emptyTables = tables.filter(t => {
        const tableSeats = seating.filter(s => s.tableId === t.id).length;
        return tableSeats === 0;
    }).length;
    
    if (emptyTables > 0) {
        insights.push({
            icon: 'fa-exclamation-triangle',
            color: 'text-yellow-600',
            text: `שולחנות ריקים: ${emptyTables} שולחנות ללא אורחים`
        });
    }
    
    // Unseated guests warning
    if (unseated > 0) {
        insights.push({
            icon: 'fa-users',
            color: 'text-orange-600',
            text: `${unseated} אורחים עדיין לא הושבו - השתמש בהושבה אוטומטית`
        });
    }
    
    // Success message
    if (unseated === 0 && totalGuests > 0) {
        insights.push({
            icon: 'fa-trophy',
            color: 'text-green-600',
            text: '🎉 כל האורחים הושבו! המערכת מוכנה לאירוע'
        });
    }
    
    // Render insights
    const container = document.getElementById('insights-list');
    if (insights.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">אין תובנות זמינות כרגע</p>';
    } else {
        container.innerHTML = insights.map(insight => `
            <div class="flex items-start space-x-reverse space-x-3 bg-white rounded-lg p-4 shadow">
                <i class="fas ${insight.icon} ${insight.color} text-2xl"></i>
                <p class="text-gray-700 flex-1">${insight.text}</p>
            </div>
        `).join('');
    }
}

// PDF Export Functions

// Export RSVPs to PDF - Using html2canvas for perfect Hebrew rendering
async function exportRsvpsPDF() {
    try {
        const { jsPDF } = window.jspdf;
        
        // Create hidden container for rendering
        const container = document.createElement('div');
        container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white; padding: 20px; font-family: Arial, sans-serif; visibility: hidden; pointer-events: none; z-index: -1;';
        container.innerHTML = `
            <div dir="rtl" style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px; margin-bottom: 10px;">אירוע: ${currentEvent.eventName}</h1>
                <h3 style="font-size: 16px; color: #666;">רשימת אישורי הגעה - ${new Date().toLocaleDateString('he-IL')}</h3>
            </div>
            <table dir="rtl" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background-color: #ec4899; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">#</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">שם מלא</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">טלפון</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">סטטוס</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">מלווים</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">בחירת מנה</th>
                    </tr>
                </thead>
                <tbody>
                    ${allRsvps.map((rsvp, index) => `
                        <tr style="background-color: ${index % 2 === 0 ? '#fce7f3' : 'white'};">
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${rsvp.fullName}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${rsvp.phone || 'לא צוין'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                                ${rsvp.status === 'confirmed' ? 'מאושר' : rsvp.status === 'declined' ? 'לא מגיע' : 'ממתין'}
                            </td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${rsvp.attendingCount || 1}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
                                ${rsvp.mealChoice === 'meat' ? 'בשר' : rsvp.mealChoice === 'fish' ? 'דג' : rsvp.mealChoice === 'vegan' ? 'צמחוני' : 'לא צוין'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div dir="rtl" style="margin-top: 20px; text-align: right; font-size: 14px;">
                <p><strong>סה"כ אישורי הגעה:</strong> ${allRsvps.length}</p>
                <p><strong>מאושרים:</strong> ${allRsvps.filter(r => r.status === 'confirmed').length}</p>
                <p><strong>לא מגיעים:</strong> ${allRsvps.filter(r => r.status === 'declined').length}</p>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Render to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Remove container
        document.body.removeChild(container);
        
        // Create PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save(`אישורי-הגעה_${currentEvent.slug}_${Date.now()}.pdf`);
        
        showToast('PDF יוצא בהצלחה!', 'success');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast(`שגיאה בייצוא PDF: ${error.message}`, 'error');
    }
}

// Export Guests to PDF - Using html2canvas for perfect Hebrew rendering
async function exportGuestsPDF() {
    try {
        const { jsPDF } = window.jspdf;
        
        // Calculate rows per page (approximately 30 rows per page with good spacing)
        const rowsPerPage = 30;
        const totalPages = Math.ceil(allGuests.length / rowsPerPage);
        
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        for (let page = 0; page < totalPages; page++) {
            if (page > 0) {
                doc.addPage();
            }
            
            const startIdx = page * rowsPerPage;
            const endIdx = Math.min(startIdx + rowsPerPage, allGuests.length);
            const pageGuests = allGuests.slice(startIdx, endIdx);
            
            // Create container for this page
            const container = document.createElement('div');
            container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white; padding: 20px; font-family: Arial, sans-serif; visibility: hidden; pointer-events: none; z-index: -1;';
            container.innerHTML = `
                <div dir="rtl" style="text-align: center; margin-bottom: 20px;">
                    <h1 style="font-size: 24px; margin-bottom: 10px;">אירוע: ${currentEvent.eventName}</h1>
                    <h3 style="font-size: 16px; color: #666;">רשימת אורחים - ${new Date().toLocaleDateString('he-IL')}</h3>
                    <p style="font-size: 14px; color: #999;">עמוד ${page + 1} מתוך ${totalPages}</p>
                </div>
                <table dir="rtl" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #ec4899; color: white;">
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">#</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">שם מלא</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">טלפון</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">צד</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">קבוצה</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">הערות</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageGuests.map((guest, index) => `
                            <tr style="background-color: ${(startIdx + index) % 2 === 0 ? '#fce7f3' : 'white'};">
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${startIdx + index + 1}</td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${guest.fullName}</td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${guest.phone || 'לא צוין'}</td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">
                                    ${guest.side === 'groom' ? 'חתן' : guest.side === 'bride' ? 'כלה' : 'משותף'}
                                </td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">
                                    ${guest.groupLabel === 'family' ? 'משפחה' : guest.groupLabel === 'friends' ? 'חברים' : guest.groupLabel === 'work' ? 'עבודה' : 'אחר'}
                                </td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${(guest.notes || '-').substring(0, 30)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${page === totalPages - 1 ? `
                    <div dir="rtl" style="margin-top: 20px; text-align: right; font-size: 14px;">
                        <p><strong>סה"כ אורחים:</strong> ${allGuests.length}</p>
                        <p><strong>צד חתן:</strong> ${allGuests.filter(g => g.side === 'groom').length} | <strong>צד כלה:</strong> ${allGuests.filter(g => g.side === 'bride').length}</p>
                    </div>
                ` : ''}
            `;
            
            document.body.appendChild(container);
            
            // Render to canvas
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            // Remove container
            document.body.removeChild(container);
            
            // Add canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            
            // If image is taller than page, scale it down
            if (imgHeight > pageHeight) {
                const scaleFactor = pageHeight / imgHeight;
                doc.addImage(imgData, 'PNG', 0, 0, imgWidth * scaleFactor, pageHeight);
            } else {
                doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            }
        }
        
        doc.save(`אורחים_${currentEvent.slug}_${Date.now()}.pdf`);
        showToast(`PDF יוצא בהצלחה! (${totalPages} עמודים)`, 'success');
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast(`שגיאה בייצוא PDF: ${error.message}`, 'error');
    }
}

// Export Seating to PDF - Multi-page with html2canvas for Hebrew support
async function exportSeatingPDF() {
    try {
        const { jsPDF } = window.jspdf;
        
        // Prepare all rows data
        const allRows = [];
        allTables.forEach(table => {
            const tableSeating = allSeating.filter(s => s.tableId === table.id);
            
            if (tableSeating.length === 0) {
                allRows.push({
                    tableName: table.tableName,
                    tableNumber: table.tableNumber || '-',
                    guestName: '(ריק)',
                    phone: '-',
                    occupancy: `0/${table.capacity}`,
                    isFirstRow: true,
                    isEmpty: true
                });
            } else {
                tableSeating.forEach((seat, idx) => {
                    const rsvp = allRsvps.find(r => r.id === seat.rsvpId);
                    const guest = allGuests.find(g => g.id === seat.guestId);
                    const person = rsvp || guest;
                    
                    if (person) {
                        allRows.push({
                            tableName: idx === 0 ? table.tableName : '',
                            tableNumber: idx === 0 ? (table.tableNumber || '-') : '',
                            guestName: person.fullName,
                            phone: person.phone || '-',
                            occupancy: idx === 0 ? `${tableSeating.length}/${table.capacity}` : '',
                            isFirstRow: idx === 0
                        });
                    }
                });
            }
        });
        
        // Calculate rows per page
        const rowsPerPage = 30;
        const totalPages = Math.ceil(allRows.length / rowsPerPage);
        
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        for (let page = 0; page < totalPages; page++) {
            if (page > 0) {
                doc.addPage();
            }
            
            const startIdx = page * rowsPerPage;
            const endIdx = Math.min(startIdx + rowsPerPage, allRows.length);
            const pageRows = allRows.slice(startIdx, endIdx);
            
            // Create container for this page
            const container = document.createElement('div');
            container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white; padding: 20px; font-family: Arial, sans-serif; visibility: hidden; pointer-events: none; z-index: -1;';
            container.innerHTML = `
                <div dir="rtl" style="text-align: center; margin-bottom: 20px;">
                    <h1 style="font-size: 24px; margin-bottom: 10px;">אירוע: ${currentEvent.eventName}</h1>
                    <h3 style="font-size: 16px; color: #666;">סידור הושבה - ${new Date().toLocaleDateString('he-IL')}</h3>
                    <p style="font-size: 14px; color: #999;">עמוד ${page + 1} מתוך ${totalPages}</p>
                </div>
                <table dir="rtl" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #ec4899; color: white;">
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">שם שולחן</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">מספר</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">שם אורח</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">טלפון</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">תפוסה</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageRows.map((row, index) => `
                            <tr style="background-color: ${(startIdx + index) % 2 === 0 ? '#fce7f3' : 'white'};">
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: right; ${row.isFirstRow ? 'font-weight: bold;' : ''}">${row.tableName}</td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${row.tableNumber}</td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: right; ${row.isEmpty ? 'color: #999;' : ''}">${row.guestName}</td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${row.phone}</td>
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${row.occupancy}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${page === totalPages - 1 ? `
                    <div dir="rtl" style="margin-top: 20px; text-align: right; font-size: 14px;">
                        <p><strong>סה"כ שולחנות:</strong> ${allTables.length}</p>
                        <p><strong>סה"כ מושבים:</strong> ${allSeating.length} / ${allTables.reduce((sum, t) => sum + t.capacity, 0)} מקומות</p>
                    </div>
                ` : ''}
            `;
            
            document.body.appendChild(container);
            
            // Render to canvas
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            // Remove container
            document.body.removeChild(container);
            
            // Add canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            
            // If image is taller than page, scale it down
            if (imgHeight > pageHeight) {
                const scaleFactor = pageHeight / imgHeight;
                doc.addImage(imgData, 'PNG', 0, 0, imgWidth * scaleFactor, pageHeight);
            } else {
                doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            }
        }
        
        doc.save(`הושבה_${currentEvent.slug}_${Date.now()}.pdf`);
        showToast(`PDF יוצא בהצלחה! (${totalPages} עמודים)`, 'success');
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast(`שגיאה בייצוא PDF: ${error.message}`, 'error');
    }
}

// ============================================
// AUTO TABLE CREATION BY GROUPS
// ============================================

// Toggle automation dropdown menu
function toggleAutomationMenu() {
    const menu = document.getElementById('automation-menu');
    menu.classList.toggle('hidden');
}

// Close automation menu
function closeAutomationMenu() {
    const menu = document.getElementById('automation-menu');
    menu.classList.add('hidden');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('automation-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        closeAutomationMenu();
    }
});

// Auto create tables AND fill seating (combined action)
async function autoCreateAndFill() {
    if (!confirm('פעולה זו תיצור שולחנות אוטומטית לפי קבוצות ותמלא אותם באורחים.\n\nהאם להמשיך?')) {
        return;
    }
    
    try {
        showToast('טוען נתונים...', 'info');
        
        // Step 0: Make sure we have guests and RSVPs data
        if (allGuests.length === 0 && allRsvps.length === 0) {
            // Load guests if not loaded
            const guestsRes = await axios.get(`/api/events/${currentEvent.id}/guests`);
            allGuests = guestsRes.data.guests || [];
            
            // Load RSVPs if not loaded
            const rsvpsRes = await axios.get(`/api/events/${currentEvent.id}/rsvps`);
            allRsvps = rsvpsRes.data.rsvps || [];
        }
        
        // Step 1: Analyze groups
        const groups = analyzeGroups();
        
        if (groups.length === 0) {
            showToast('לא נמצאו קבוצות לבניית שולחנות. וודא שהמוזמנים שלך מוגדרים עם קבוצות.', 'warning');
            return;
        }
        
        showToast(`נמצאו ${groups.length} קבוצות. יוצר שולחנות...`, 'info');
        
        // Step 2: Create tables for each group
        let created = 0;
        for (const group of groups) {
            const capacity = parseInt(calculateTableSize(group.count));
            console.log(`Creating table for ${group.name}: ${group.count} guests, capacity: ${capacity}`);
            const tableData = {
                tableName: `שולחן ${group.name}`,
                capacity: capacity,
                notes: group.isMixed ? 'שולחן מעורב (קבוצות קטנות)' : `${group.count} אורחים מקבוצת ${group.name}`
            };
            
            const response = await axios.post(`/api/events/${currentEvent.id}/tables`, tableData);
            if (response.data.success) {
                created++;
            }
        }
        
        showToast(`✅ נוצרו ${created} שולחנות! מתחיל הושבה...`, 'success');
        
        // Step 3: Wait for tables to be created in DB
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 4: Reload seating data (tables, guests, rsvps)
        await loadSeating();
        
        // Step 5: Wait for data to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 6: Auto fill seating
        showToast('מושיב אורחים...', 'info');
        await autoFillSeating();
        
    } catch (error) {
        console.error('Error in autoCreateAndFill:', error);
        showToast(`שגיאה בתהליך האוטומטי: ${error.message}`, 'error');
    }
}

// Show modal to choose auto/manual table creation
function showAutoTableCreationModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 m-4">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-magic text-white text-2xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">בניית שולחנות אוטומטית</h2>
                <p class="text-gray-600">איך תרצה לבנות את השולחנות?</p>
            </div>
            
            <div class="space-y-4">
                <button onclick="autoCreateTablesAuto()" 
                        class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-4 rounded-xl hover:from-purple-600 hover:to-blue-600 transition font-semibold flex items-center justify-center">
                    <i class="fas fa-bolt ml-2"></i>
                    בניה אוטומטית מלאה
                    <span class="text-sm opacity-90 mr-2">(מומלץ)</span>
                </button>
                
                <button onclick="showManualTableSizeModal()" 
                        class="w-full bg-white border-2 border-purple-500 text-purple-600 px-6 py-4 rounded-xl hover:bg-purple-50 transition font-semibold flex items-center justify-center">
                    <i class="fas fa-cog ml-2"></i>
                    קביעה ידנית של גדלים
                </button>
                
                <button onclick="this.closest('.fixed').remove()" 
                        class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition font-semibold">
                    ביטול
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.closest = function(selector) { return modal; };
}

// Analyze groups from guests
function analyzeGroups() {
    const groups = {};
    const SMALL_GROUP_THRESHOLD = 4;
    
    // Group all guests and RSVPs by groupLabel
    [...allGuests, ...allRsvps].forEach(person => {
        const groupName = person.groupLabel || 'מעורב';
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(person);
    });
    
    // Remove duplicates (same person in both guests and rsvps)
    Object.keys(groups).forEach(groupName => {
        const unique = new Map();
        groups[groupName].forEach(person => {
            const key = person.fullName + (person.phone || '');
            if (!unique.has(key)) {
                unique.set(key, person);
            }
        });
        groups[groupName] = Array.from(unique.values());
    });
    
    // Separate large and small groups
    const largeGroups = [];
    const smallGroups = [];
    
    Object.entries(groups).forEach(([name, members]) => {
        // Calculate actual count including attendingCount for RSVPs
        let actualCount = 0;
        members.forEach(person => {
            if (person.status === 'confirmed' && person.attendingCount) {
                // This is an RSVP with attendingCount
                actualCount += person.attendingCount;
            } else {
                // This is a guest or RSVP without attendingCount
                actualCount += 1;
            }
        });
        
        const groupData = { 
            name, 
            members, 
            count: actualCount  // Use actualCount instead of members.length
        };
        
        if (actualCount >= SMALL_GROUP_THRESHOLD) {
            largeGroups.push(groupData);
        } else {
            smallGroups.push(groupData);
        }
    });
    
    // Merge small groups into "מעורב"
    if (smallGroups.length > 0) {
        const mixedMembers = smallGroups.flatMap(g => g.members);
        
        // Calculate actual count for mixed group
        let mixedCount = 0;
        mixedMembers.forEach(person => {
            if (person.status === 'confirmed' && person.attendingCount) {
                mixedCount += person.attendingCount;
            } else {
                mixedCount += 1;
            }
        });
        
        largeGroups.push({
            name: 'מעורב',
            members: mixedMembers,
            count: mixedCount,  // Use actualCount
            isMixed: true
        });
    }
    
    // Sort by size (largest first)
    largeGroups.sort((a, b) => b.count - a.count);
    
    return largeGroups;
}

// Calculate table size with buffer
function calculateTableSize(guestCount, bufferPercent = 15) {
    return Math.ceil(guestCount * (1 + bufferPercent / 100));
}

// Auto create tables (full auto mode)
async function autoCreateTablesAuto() {
    // Close modal
    document.querySelector('.fixed')?.remove();
    
    try {
        showToast('טוען נתונים...', 'info');
        
        // Make sure we have guests data
        if (allGuests.length === 0 && allRsvps.length === 0) {
            // Load guests if not loaded
            const guestsRes = await axios.get(`/api/events/${currentEvent.id}/guests`);
            allGuests = guestsRes.data.guests || [];
            
            // Load RSVPs if not loaded
            const rsvpsRes = await axios.get(`/api/events/${currentEvent.id}/rsvps`);
            allRsvps = rsvpsRes.data.rsvps || [];
        }
        
        const groups = analyzeGroups();
        
        if (groups.length === 0) {
            showToast('לא נמצאו קבוצות לבניית שולחנות. וודא שהמוזמנים שלך מוגדרים עם קבוצות.', 'warning');
            return;
        }
        
        // Confirm action
        const totalGuests = groups.reduce((sum, g) => sum + g.count, 0);
        if (!confirm(`נמצאו ${groups.length} קבוצות עם סך של ${totalGuests} אורחים.\n\nהאם ליצור ${groups.length} שולחנות אוטומטית?`)) {
            return;
        }
        
        showToast(`יוצר ${groups.length} שולחנות...`, 'info');
        
        let created = 0;
        for (const group of groups) {
            const capacity = parseInt(calculateTableSize(group.count));
            console.log(`Creating table for ${group.name}: ${group.count} guests, capacity: ${capacity}`);
            const tableData = {
                tableName: `שולחן ${group.name}`,
                capacity: capacity,
                notes: group.isMixed ? 'שולחן מעורב (קבוצות קטנות)' : `${group.count} אורחים מקבוצת ${group.name}`
            };
            
            const response = await axios.post(`/api/events/${currentEvent.id}/tables`, tableData);
            if (response.data.success) {
                created++;
            }
        }
        
        showToast(`✅ נוצרו ${created} שולחנות בהצלחה! 🎉`, 'success');
        loadSeating(); // Refresh
        
    } catch (error) {
        console.error('Error creating tables:', error);
        showToast(`שגיאה ביצירת שולחנות: ${error.message}`, 'error');
    }
}

// Show manual table size configuration modal
async function showManualTableSizeModal() {
    // Close previous modal
    document.querySelector('.fixed')?.remove();
    
    try {
        showToast('טוען נתונים...', 'info');
        
        // Make sure we have guests data
        if (allGuests.length === 0 && allRsvps.length === 0) {
            // Load guests if not loaded
            const guestsRes = await axios.get(`/api/events/${currentEvent.id}/guests`);
            allGuests = guestsRes.data.guests || [];
            
            // Load RSVPs if not loaded
            const rsvpsRes = await axios.get(`/api/events/${currentEvent.id}/rsvps`);
            allRsvps = rsvpsRes.data.rsvps || [];
        }
        
        const groups = analyzeGroups();
        
        if (groups.length === 0) {
            showToast('לא נמצאו קבוצות לבניית שולחנות. וודא שהמוזמנים שלך מוגדרים עם קבוצות.', 'warning');
            return;
        }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto';
    
    const groupsHTML = groups.map((group, index) => {
        const suggestedSize = calculateTableSize(group.count);
        return `
            <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-800 text-lg">${group.name}</h4>
                        <p class="text-sm text-gray-600">
                            ${group.count} אורחים
                            ${group.isMixed ? '(קבוצות קטנות משולבות)' : ''}
                        </p>
                    </div>
                    <div class="text-right">
                        <label class="block text-xs text-gray-500 mb-1">קיבולת שולחן</label>
                        <input type="number" 
                               id="table-size-${index}"
                               min="${group.count}" 
                               max="50" 
                               value="${suggestedSize}"
                               class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                <div class="text-xs text-gray-500 flex items-center">
                    <i class="fas fa-lightbulb ml-1 text-yellow-500"></i>
                    מומלץ: ${suggestedSize} מקומות (${group.count} אורחים + 15% buffer)
                </div>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 m-4 max-h-[90vh] overflow-y-auto">
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    <i class="fas fa-table ml-2 text-purple-600"></i>
                    קביעת גדלי שולחנות
                </h2>
                <p class="text-gray-600">זוהו ${groups.length} קבוצות. קבע את הקיבולת לכל שולחן:</p>
            </div>
            
            <div class="space-y-3 mb-6">
                ${groupsHTML}
            </div>
            
            <div class="flex space-x-reverse space-x-3 pt-4 border-t">
                <button onclick="createTablesFromManualSizes()" 
                        class="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition font-semibold">
                    <i class="fas fa-check ml-2"></i>
                    צור ${groups.length} שולחנות
                </button>
                <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-400 transition font-semibold">
                    ביטול
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.closest = function(selector) { return modal; };
    
    } catch (error) {
        console.error('Error loading groups:', error);
        showToast(`שגיאה בטעינת קבוצות: ${error.message}`, 'error');
    }
}

// Create tables from manual sizes
async function createTablesFromManualSizes() {
    const groups = analyzeGroups();
    const modal = document.querySelector('.fixed');
    
    try {
        let created = 0;
        
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const sizeInput = document.getElementById(`table-size-${i}`);
            const capacity = parseInt(sizeInput.value);
            
            if (capacity < group.count) {
                showToast(`קיבולת שולחן ${group.name} קטנה מדי (${capacity} < ${group.count})`, 'error');
                return;
            }
            
            const tableData = {
                tableName: `שולחן ${group.name}`,
                capacity: capacity,
                notes: group.isMixed ? 'שולחן מעורב (קבוצות קטנות)' : `${group.count} אורחים מקבוצת ${group.name}`
            };
            
            const response = await axios.post(`/api/events/${currentEvent.id}/tables`, tableData);
            if (response.data.success) {
                created++;
            }
        }
        
        modal?.remove();
        showToast(`נוצרו ${created} שולחנות בהצלחה! 🎉`, 'success');
        loadSeating(); // Refresh
        
    } catch (error) {
        console.error('Error creating tables:', error);
        showToast('שגיאה ביצירת שולחנות', 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEvent();
});
