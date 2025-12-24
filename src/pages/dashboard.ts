export const dashboardPage = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>דשבורד | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .tab-active { border-bottom: 3px solid #ec4899; color: #ec4899; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-reverse space-x-2">
                    <i class="fas fa-heart text-pink-500 text-3xl"></i>
                    <h1 class="text-2xl font-bold text-gray-800">מוזמנים בקליק</h1>
                </div>
                <div class="flex items-center space-x-reverse space-x-4">
                    <span id="user-name" class="text-gray-600"></span>
                    <button onclick="logout()" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                        <i class="fas fa-sign-out-alt ml-2"></i>
                        התנתק
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
        <!-- Welcome Section -->
        <div id="welcome-section" class="mb-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">ברוכים הבאים!</h2>
            <p class="text-gray-600">התחל לנהל את האירועים שלך</p>
        </div>

        <!-- Events List -->
        <div id="events-container">
            <!-- Loading -->
            <div id="loading" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-pink-500"></i>
                <p class="text-gray-600 mt-4">טוען אירועים...</p>
            </div>

            <!-- No Events -->
            <div id="no-events" class="hidden bg-white rounded-2xl shadow-lg p-12 text-center">
                <i class="fas fa-calendar-plus text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">אין לך עדיין אירועים</h3>
                <p class="text-gray-600 mb-6">צור את האירוע הראשון שלך ותתחיל לנהל מוזמנים</p>
                <a href="/create-event" class="inline-block bg-pink-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-pink-600 transition">
                    <i class="fas fa-plus ml-2"></i>
                    צור אירוע חדש
                </a>
            </div>

            <!-- Events List -->
            <div id="events-list" class="hidden">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">האירועים שלי</h3>
                    <a href="/create-event" class="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition">
                        <i class="fas fa-plus ml-2"></i>
                        אירוע חדש
                    </a>
                </div>
                <div id="events-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- יטען דינמית -->
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let currentUser = null;

        // בדיקת התחברות
        async function checkAuth() {
            try {
                const response = await axios.get('/api/auth/me');
                if (response.data.authenticated) {
                    currentUser = response.data.user;
                    document.getElementById('user-name').textContent = currentUser.name;
                    loadEvents();
                } else {
                    window.location.href = '/dev-login';
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                window.location.href = '/dev-login';
            }
        }

        // טעינת אירועים
        async function loadEvents() {
            try {
                const response = await axios.get('/api/events');
                
                document.getElementById('loading').classList.add('hidden');
                
                if (response.data.success && response.data.events.length > 0) {
                    document.getElementById('events-list').classList.remove('hidden');
                    renderEvents(response.data.events);
                } else {
                    document.getElementById('no-events').classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error loading events:', error);
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('no-events').classList.remove('hidden');
            }
        }

        // הצגת אירועים
        function renderEvents(events) {
            const grid = document.getElementById('events-grid');
            
            grid.innerHTML = events.map(event => {
                const eventDate = new Date(event.dateTime);
                const formattedDate = new Intl.DateTimeFormat('he-IL', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                }).format(eventDate);
                
                return \`
                    <div class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="text-xl font-bold text-gray-800 mb-1">\${event.eventName}</h4>
                                <p class="text-gray-600">\${event.coupleNames}</p>
                            </div>
                            <span class="px-3 py-1 bg-\${event.isRsvpOpen ? 'green' : 'red'}-100 text-\${event.isRsvpOpen ? 'green' : 'red'}-600 rounded-full text-sm">
                                \${event.isRsvpOpen ? 'פתוח' : 'סגור'}
                            </span>
                        </div>
                        
                        <div class="space-y-2 mb-4">
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-calendar ml-2"></i>
                                <span class="text-sm">\${formattedDate}</span>
                            </div>
                            \${event.venueName ? \`
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-map-marker-alt ml-2"></i>
                                    <span class="text-sm">\${event.venueName}</span>
                                </div>
                            \` : ''}
                        </div>
                        
                        <div class="flex space-x-reverse space-x-2">
                            <a href="/event/\${event.id}" class="flex-1 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition text-center">
                                <i class="fas fa-cog ml-1"></i>
                                ניהול
                            </a>
                            <button onclick="copyRsvpLink('\${event.slug}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                                <i class="fas fa-link"></i>
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // העתקת לינק RSVP
        function copyRsvpLink(slug) {
            const link = window.location.origin + '/e/' + slug;
            navigator.clipboard.writeText(link).then(() => {
                alert('הלינק הועתק ללוח!\\n' + link);
            });
        }

        // התנתקות
        async function logout() {
            try {
                await axios.post('/api/auth/logout');
                window.location.href = '/';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/';
            }
        }

        // אתחול
        checkAuth();
    </script>
</body>
</html>
`;
