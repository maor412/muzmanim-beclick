export const publicRsvpPage = (slug: string) => `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אישור הגעה | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .honeypot { position: absolute; left: -9999px; }
    </style>
</head>
<body class="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto">
            <!-- Loading State -->
            <div id="loading-state" class="bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-5xl text-pink-500 mb-4"></i>
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">מוזמנים בקליק</h1>
                    <p class="text-gray-600">טוען את פרטי האירוע...</p>
                </div>
            </div>

            <!-- Error State -->
            <div id="error-state" class="hidden bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">שגיאה</h2>
                    <p class="text-gray-600 mb-4" id="error-message"></p>
                    <a href="/" class="inline-block bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition">
                        חזרה לדף הבית
                    </a>
                </div>
            </div>

            <!-- RSVP Closed State -->
            <div id="closed-state" class="hidden bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center">
                    <i class="fas fa-lock text-5xl text-gray-400 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">אישור הגעה נסגר</h2>
                    <p class="text-gray-600 mb-4">האפשרות לאשר הגעה לאירוע זה כבר לא פעילה.</p>
                    <p class="text-gray-500 text-sm">לשאלות, אנא פנו לבעלי השמחה ישירות.</p>
                </div>
            </div>

            <!-- RSVP Form -->
            <div id="form-container" class="hidden bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center mb-8">
                    <i class="fas fa-heart text-pink-500 text-5xl mb-4"></i>
                    <h1 class="text-4xl font-bold text-gray-800 mb-2" id="event-title">מוזמנים בקליק</h1>
                    <p class="text-xl text-gray-600" id="couple-names"></p>
                    <div class="mt-4 text-gray-600">
                        <p><i class="fas fa-calendar ml-2"></i><span id="event-date"></span></p>
                        <p id="venue-info" class="mt-1"></p>
                    </div>
                </div>

                <form id="rsvp-form" class="space-y-6">
                    <!-- Honeypot for spam prevention -->
                    <input type="text" name="website" class="honeypot" tabindex="-1" autocomplete="off">

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">שם מלא *</label>
                        <input type="text" name="fullName" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                               placeholder="הכנס את שמך המלא">
                    </div>

                    <div id="phone-field">
                        <label class="block text-gray-700 font-semibold mb-2">טלפון <span id="phone-required"></span></label>
                        <input type="tel" name="phone" 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                               placeholder="05X-XXXXXXX">
                        <p class="text-sm text-gray-500 mt-1">לשליחת עדכונים ותזכורות</p>
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">סטטוס הגעה *</label>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-pink-500 transition">
                                <input type="radio" name="status" value="confirmed" required class="ml-2">
                                <i class="fas fa-check-circle text-green-500 ml-2"></i>
                                <span>מגיע</span>
                            </label>
                            <label class="flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition">
                                <input type="radio" name="status" value="declined" required class="ml-2">
                                <i class="fas fa-times-circle text-red-500 ml-2"></i>
                                <span>לא מגיע</span>
                            </label>
                        </div>
                    </div>

                    <div id="confirmed-fields" class="hidden space-y-6">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">מספר מלווים (לא כולל אותך)</label>
                            <input type="number" name="plusOnes" min="0" max="10" value="0"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                            <p class="text-sm text-gray-500 mt-1">כמה אנשים מגיעים איתך?</p>
                        </div>

                        <div id="meal-choice-field" class="hidden">
                            <label class="block text-gray-700 font-semibold mb-2">בחירת מנה *</label>
                            <select name="mealChoice" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                                <option value="">בחר מנה</option>
                                <option value="meat">בשר</option>
                                <option value="fish">דג</option>
                                <option value="vegan">צמחוני</option>
                            </select>
                        </div>

                        <div id="allergies-field" class="hidden">
                            <label class="block text-gray-700 font-semibold mb-2">אלרגיות ומגבלות תזונתיות</label>
                            <textarea name="allergies" rows="2"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                      placeholder="למשל: אלרגיה לאגוזים, ללא גלוטן..."></textarea>
                        </div>
                    </div>

                    <div id="notes-field" class="hidden">
                        <label class="block text-gray-700 font-semibold mb-2">הערות או ברכות</label>
                        <textarea name="notes" rows="3"
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                  placeholder="שתפו אותנו בברכה או הערה..."></textarea>
                    </div>

                    <div id="consent-field" class="hidden">
                        <label class="flex items-start cursor-pointer">
                            <input type="checkbox" name="consent" class="mt-1 w-5 h-5 text-pink-500 rounded">
                            <span class="mr-3 text-sm text-gray-700" id="consent-message"></span>
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" class="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition font-semibold text-lg">
                        <i class="fas fa-paper-plane ml-2"></i>
                        שלח אישור הגעה
                    </button>
                </form>

                <p class="text-center text-sm text-gray-500 mt-6">
                    מופעל על ידי מוזמנים בקליק
                </p>
            </div>

            <!-- Success State -->
            <div id="success-state" class="hidden bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check text-4xl text-green-500"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">תודה רבה!</h2>
                    <p class="text-gray-600 mb-6" id="success-message"></p>
                    
                    <div id="calendar-download" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p class="text-sm text-blue-800 mb-3">
                            <i class="fas fa-calendar-plus ml-2"></i>
                            הוסף את האירוע ליומן שלך
                        </p>
                        <button onclick="downloadICS()" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
                            <i class="fas fa-download ml-2"></i>
                            הורד קובץ יומן (ICS)
                        </button>
                    </div>

                    <div id="update-info" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p class="text-sm text-yellow-800">
                            <i class="fas fa-info-circle ml-2"></i>
                            ניתן לעדכן את פרטי האישור בכל עת על ידי מילוי הטופס שוב עם אותו שם וטלפון
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        const slug = '${slug}';
        let eventData = null;
        let submittedRsvp = null;

        // Load event data
        async function loadEvent() {
            try {
                const response = await axios.get(\`/api/rsvp/\${slug}/event\`);
                
                if (response.data.success) {
                    eventData = response.data.event;
                    renderForm();
                } else {
                    showError(response.data.error || 'לא ניתן לטעון את פרטי האירוע');
                }
            } catch (error) {
                console.error('Error loading event:', error);
                if (error.response?.status === 404) {
                    showError('האירוע לא נמצא. אנא בדקו את הלינק שקיבלתם.');
                } else {
                    showError('שגיאה בטעינת פרטי האירוע. אנא נסו שוב מאוחר יותר.');
                }
            }
        }

        // Show error
        function showError(message) {
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('error-message').textContent = message;
            document.getElementById('error-state').classList.remove('hidden');
        }

        // Render form
        function renderForm() {
            document.getElementById('loading-state').classList.add('hidden');

            // Check if RSVP is closed
            if (!eventData.isRsvpOpen) {
                document.getElementById('closed-state').classList.remove('hidden');
                return;
            }

            // Show form
            document.getElementById('form-container').classList.remove('hidden');

            // Fill event details
            document.getElementById('event-title').textContent = eventData.eventName;
            document.getElementById('couple-names').textContent = eventData.coupleNames;
            
            const eventDate = new Date(eventData.dateTime);
            document.getElementById('event-date').textContent = eventDate.toLocaleDateString('he-IL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            if (eventData.venueName) {
                const venueHtml = \`<i class="fas fa-map-marker-alt ml-2"></i>\${eventData.venueName}\`;
                if (eventData.wazeLink) {
                    document.getElementById('venue-info').innerHTML = \`
                        <a href="\${eventData.wazeLink}" target="_blank" class="text-blue-500 hover:text-blue-600">
                            \${venueHtml} <i class="fas fa-external-link-alt mr-1 text-sm"></i>
                        </a>
                    \`;
                } else {
                    document.getElementById('venue-info').innerHTML = venueHtml;
                }
            }

            // Configure form fields based on event settings
            if (eventData.requirePhone) {
                document.getElementById('phone-required').textContent = '*';
                document.querySelector('[name="phone"]').required = true;
            }

            if (eventData.showMealChoice) {
                document.getElementById('meal-choice-field').classList.remove('hidden');
                document.querySelector('[name="mealChoice"]').required = true;
            }

            if (eventData.showAllergies) {
                document.getElementById('allergies-field').classList.remove('hidden');
            }

            if (eventData.showNotes) {
                document.getElementById('notes-field').classList.remove('hidden');
            }

            if (eventData.consentMessage) {
                document.getElementById('consent-field').classList.remove('hidden');
                document.getElementById('consent-message').textContent = eventData.consentMessage;
            }

            // Status change handler
            document.querySelectorAll('[name="status"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const confirmedFields = document.getElementById('confirmed-fields');
                    if (e.target.value === 'confirmed') {
                        confirmedFields.classList.remove('hidden');
                    } else {
                        confirmedFields.classList.add('hidden');
                    }
                });
            });

            // Form submission
            document.getElementById('rsvp-form').addEventListener('submit', submitRSVP);
        }

        // Submit RSVP
        async function submitRSVP(e) {
            e.preventDefault();

            // Check honeypot
            if (e.target.website.value) {
                showError('שגיאה באישור הטופס. אנא נסה שוב.');
                return;
            }

            const formData = new FormData(e.target);
            const data = {
                fullName: formData.get('fullName'),
                phone: formData.get('phone') || null,
                status: formData.get('status'),
                plusOnes: formData.get('status') === 'confirmed' ? parseInt(formData.get('plusOnes') || 0) : 0,
                mealChoice: formData.get('status') === 'confirmed' ? formData.get('mealChoice') : null,
                allergies: formData.get('status') === 'confirmed' ? formData.get('allergies') : null,
                notes: formData.get('notes') || null,
                consent: formData.get('consent') === 'on'
            };

            // Validate
            if (!data.fullName.trim()) {
                alert('אנא הכנס שם מלא');
                return;
            }

            if (eventData.requirePhone && !data.phone) {
                alert('אנא הכנס מספר טלפון');
                return;
            }

            if (data.status === 'confirmed' && eventData.showMealChoice && !data.mealChoice) {
                alert('אנא בחר מנה');
                return;
            }

            // Disable submit button
            const submitBtn = e.target.querySelector('[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>שולח...';

            try {
                const response = await axios.post(\`/api/rsvp/\${slug}\`, data);
                
                if (response.data.success) {
                    submittedRsvp = response.data.rsvp;
                    showSuccess();
                } else {
                    alert('שגיאה: ' + (response.data.error || 'לא ניתן לשלוח את האישור'));
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane ml-2"></i>שלח אישור הגעה';
                }
            } catch (error) {
                console.error('Error submitting RSVP:', error);
                alert('שגיאה בשליחת האישור. אנא נסה שוב.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane ml-2"></i>שלח אישור הגעה';
            }
        }

        // Show success
        function showSuccess() {
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('success-state').classList.remove('hidden');

            if (submittedRsvp.status === 'confirmed') {
                document.getElementById('success-message').textContent = 
                    'אישור ההגעה שלך נקלט בהצלחה! מצפים לראותכם באירוע.';
                document.getElementById('calendar-download').classList.remove('hidden');
            } else {
                document.getElementById('success-message').textContent = 
                    'תודה על עדכון. נצטער שלא תוכלו להגיע.';
            }

            if (eventData.allowUpdates) {
                document.getElementById('update-info').classList.remove('hidden');
            }
        }

        // Download ICS file
        function downloadICS() {
            const event = eventData;
            const startDate = new Date(event.dateTime);
            const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000); // +5 hours

            const formatDate = (date) => {
                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//מוזמנים בקליק//NONSGML v1.0//HE',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
                'BEGIN:VEVENT',
                \`UID:\${event.id}@mozmanim-beclick.com\`,
                \`DTSTAMP:\${formatDate(new Date())}\`,
                \`DTSTART:\${formatDate(startDate)}\`,
                \`DTEND:\${formatDate(endDate)}\`,
                \`SUMMARY:\${event.eventName} - \${event.coupleNames}\`,
                event.venueName ? \`LOCATION:\${event.venueName}\${event.venueAddress ? ', ' + event.venueAddress : ''}\` : '',
                \`DESCRIPTION:\${event.notes || 'מוזמנים לחתונה'}\`,
                'STATUS:CONFIRMED',
                'BEGIN:VALARM',
                'TRIGGER:-PT24H',
                'ACTION:DISPLAY',
                'DESCRIPTION:תזכורת: חתונה מחר!',
                'END:VALARM',
                'END:VEVENT',
                'END:VCALENDAR'
            ].filter(line => line).join('\\r\\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = \`\${event.slug}_wedding.ics\`;
            link.click();
        }

        // Load event on page load
        loadEvent();
    </script>
</body>
</html>
`;
