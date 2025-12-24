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
    const match = path.match(/\/event\/(\d+)/);
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
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content-overview').classList.remove('hidden');
    
    if (!currentEvent) return;
    
    try {
        // Load stats
        const [rsvpsRes, guestsRes, tablesRes, checkinsRes] = await Promise.all([
            axios.get(`/api/events/${currentEvent.id}/rsvps`),
            axios.get(`/api/events/${currentEvent.id}/guests`),
            axios.get(`/api/events/${currentEvent.id}/tables`),
            axios.get(`/api/events/${currentEvent.id}/checkins`)
        ]);
        
        // Update stats
        document.getElementById('stat-rsvps').textContent = rsvpsRes.data.rsvps?.filter(r => r.status === 'confirmed').length || 0;
        document.getElementById('stat-guests').textContent = guestsRes.data.guests?.length || 0;
        document.getElementById('stat-tables').textContent = tablesRes.data.tables?.length || 0;
        document.getElementById('stat-checkins').textContent = checkinsRes.data.checkins?.filter(c => c.arrived).length || 0;
        
        // Update event details
        document.getElementById('detail-eventName').textContent = currentEvent.eventName;
        document.getElementById('detail-coupleNames').textContent = currentEvent.coupleNames;
        document.getElementById('detail-dateTime').textContent = new Date(currentEvent.dateTime).toLocaleString('he-IL');
        document.getElementById('detail-venue').textContent = currentEvent.venueName || 'לא צוין';
        document.getElementById('detail-rsvpStatus').innerHTML = currentEvent.isRsvpOpen 
            ? '<span class="text-green-600"><i class="fas fa-check-circle ml-1"></i>פתוח</span>'
            : '<span class="text-red-600"><i class="fas fa-times-circle ml-1"></i>סגור</span>';
        document.getElementById('detail-slug').textContent = window.location.origin + '/e/' + currentEvent.slug;
    } catch (error) {
        console.error('Error loading overview:', error);
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
                <td class="px-6 py-4">${guest.guestGroup || '-'}</td>
                <td class="px-6 py-4">
                    ${guest.hasRsvp ? '<span class="text-green-600"><i class="fas fa-check ml-1"></i>אישר</span>' : '<span class="text-gray-400">טרם אישר</span>'}
                </td>
                <td class="px-6 py-4">
                    <button onclick="editGuest(${guest.id})" class="text-blue-500 hover:text-blue-600 ml-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteGuest(${guest.id})" class="text-red-500 hover:text-red-600">
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
        'קבוצה': guest.guestGroup || '',
        'RSVP': guest.hasRsvp ? 'אישר' : 'לא אישר'
    }));
    
    downloadCSV(data, `guests_${currentEvent.slug}_${Date.now()}.csv`);
    showToast(`הקובץ הורד בהצלחה (${allGuests.length} רשומות)`, 'success');
}

// Load Seating
async function loadSeating() {
    document.getElementById('tables-loading').classList.remove('hidden');
    document.getElementById('tables-empty').classList.add('hidden');
    document.getElementById('tables-grid').classList.add('hidden');
    
    try {
        const [tablesRes, seatingRes, rsvpsRes] = await Promise.all([
            axios.get(`/api/events/${currentEvent.id}/tables`),
            axios.get(`/api/events/${currentEvent.id}/seating`),
            axios.get(`/api/events/${currentEvent.id}/rsvps`)
        ]);
        
        allTables = tablesRes.data.tables || [];
        allSeating = seatingRes.data.seating || [];
        allRsvps = rsvpsRes.data.rsvps || [];
        
        document.getElementById('tables-loading').classList.add('hidden');
        
        if (allTables.length === 0) {
            document.getElementById('tables-empty').classList.remove('hidden');
        } else {
            document.getElementById('tables-grid').classList.remove('hidden');
            renderSeating();
        }
        
        renderUnseatedGuests();
    } catch (error) {
        console.error('Error loading seating:', error);
        document.getElementById('tables-loading').classList.add('hidden');
        showToast('שגיאה בטעינת הושבה', 'error');
    }
}

// Render Unseated Guests
function renderUnseatedGuests() {
    const seatedRsvpIds = allSeating.map(s => s.rsvpId);
    const unseated = allRsvps.filter(r => r.status === 'confirmed' && !seatedRsvpIds.includes(r.id));
    
    document.getElementById('unseated-count').textContent = unseated.length;
    
    const container = document.getElementById('unseated-guests');
    if (unseated.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">כל האורחים הושבו</p>';
    } else {
        container.innerHTML = unseated.map(rsvp => `
            <div draggable="true" ondragstart="drag(event)" data-rsvp-id="${rsvp.id}" 
                 class="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-move hover:bg-blue-100 transition">
                <p class="font-semibold text-sm">${rsvp.fullName}</p>
                <p class="text-xs text-gray-600">${rsvp.plusOnes > 0 ? `+${rsvp.plusOnes} מלווים` : 'ללא מלווים'}</p>
            </div>
        `).join('');
    }
}

// Render Seating Tables
function renderSeating() {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = allTables.map(table => {
        const tableSeating = allSeating.filter(s => s.tableId === table.id);
        const occupiedSeats = tableSeating.length;
        const availableSeats = table.capacity - occupiedSeats;
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-4 table-drop-zone" 
                 ondrop="drop(event)" ondragover="allowDrop(event)" data-table-id="${table.id}">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-bold text-lg">${table.tableName}</h4>
                    <span class="text-sm ${availableSeats > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${occupiedSeats}/${table.capacity}
                    </span>
                </div>
                <div class="space-y-2 min-h-[100px]">
                    ${tableSeating.map(seat => {
                        const rsvp = allRsvps.find(r => r.id === seat.rsvpId);
                        return rsvp ? `
                            <div class="bg-pink-50 border border-pink-200 rounded p-2 flex justify-between items-center">
                                <span class="text-sm font-semibold">${rsvp.fullName}</span>
                                <button onclick="unseatGuest(${seat.id})" class="text-red-500 hover:text-red-600 text-xs">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        ` : '';
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Drag and Drop functions
function drag(ev) {
    ev.dataTransfer.setData("rsvpId", ev.target.dataset.rsvpId);
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
    const tableId = ev.currentTarget.dataset.tableId;
    
    if (rsvpId && tableId) {
        seatGuest(rsvpId, tableId);
    }
    
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

// Seat Guest
async function seatGuest(rsvpId, tableId) {
    try {
        const response = await axios.post(`/api/events/${currentEvent.id}/seating`, {
            rsvpId: parseInt(rsvpId),
            tableId: parseInt(tableId)
        });
        
        if (response.data.success) {
            showToast('האורח הושב בהצלחה', 'success');
            loadSeating();
        } else {
            showToast(response.data.error || 'שגיאה בהושבת אורח', 'error');
        }
    } catch (error) {
        console.error('Error seating guest:', error);
        showToast('שגיאה בהושבת אורח', 'error');
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
    if (!confirm('פעולה זו תמלא אוטומטית את השולחנות הפנויים. האם להמשיך?')) return;
    
    const seatedRsvpIds = allSeating.map(s => s.rsvpId);
    const unseated = allRsvps.filter(r => r.status === 'confirmed' && !seatedRsvpIds.includes(r.id));
    
    if (unseated.length === 0) {
        showToast('אין אורחים להושיב', 'info');
        return;
    }
    
    let seated = 0;
    for (const table of allTables) {
        const tableSeating = allSeating.filter(s => s.tableId === table.id);
        const availableSeats = table.capacity - tableSeating.length;
        
        for (let i = 0; i < availableSeats && unseated.length > 0; i++) {
            const rsvp = unseated.shift();
            try {
                await axios.post(`/api/events/${currentEvent.id}/seating`, {
                    rsvpId: rsvp.id,
                    tableId: table.id
                });
                seated++;
            } catch (error) {
                console.error('Error auto-seating:', error);
            }
        }
    }
    
    showToast(`${seated} אורחים הושבו אוטומטית`, 'success');
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
        showToast('שגיאה במחיקת האירוע', 'error');
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

// Modals (placeholder functions)
function showAddGuestModal() {
    showToast('הוספת מוזמן - בפיתוח', 'info');
}

function showImportModal() {
    showToast('ייבוא CSV - בפיתוח', 'info');
}

function showAddTableModal() {
    showToast('הוספת שולחן - בפיתוח', 'info');
}

function viewRsvp(id) {
    showToast('צפייה ב-RSVP - בפיתוח', 'info');
}

function editGuest(id) {
    showToast('עריכת מוזמן - בפיתוח', 'info');
}

async function deleteGuest(id) {
    if (!confirm('האם למחוק את המוזמן?')) return;
    showToast('מחיקת מוזמן - בפיתוח', 'info');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEvent();
});
