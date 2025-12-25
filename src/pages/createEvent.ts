export const createEventPage = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>יצירת אירוע | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .step-active { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; }
      .step-completed { background: #10b981; color: white; }
      .step-inactive { background: #e5e7eb; color: #9ca3af; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <nav class="bg-white shadow-lg">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-reverse space-x-2">
                    <i class="fas fa-heart text-pink-500 text-3xl"></i>
                    <h1 class="text-2xl font-bold text-gray-800">מוזמנים בקליק</h1>
                </div>
                <a href="/dashboard" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-arrow-right ml-2"></i>
                    חזרה לדשבורד
                </a>
            </div>
        </div>
    </nav>

    <!-- Wizard Container -->
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Progress Steps -->
        <div class="mb-8">
            <div class="flex justify-between items-center">
                <!-- Step 1 -->
                <div class="flex-1 text-center">
                    <div class="relative">
                        <div id="step-1-circle" class="step-active w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-lg mb-2 transition duration-300">
                            1
                        </div>
                        <p id="step-1-label" class="text-sm font-semibold">פרטי האירוע</p>
                    </div>
                </div>
                <div class="flex-1 h-1 bg-gray-300 -mx-2"></div>
                
                <!-- Step 2 -->
                <div class="flex-1 text-center">
                    <div class="relative">
                        <div id="step-2-circle" class="step-inactive w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-lg mb-2 transition duration-300">
                            2
                        </div>
                        <p id="step-2-label" class="text-sm text-gray-500">תאריך ושעה</p>
                    </div>
                </div>
                <div class="flex-1 h-1 bg-gray-300 -mx-2"></div>
                
                <!-- Step 3 -->
                <div class="flex-1 text-center">
                    <div class="relative">
                        <div id="step-3-circle" class="step-inactive w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-lg mb-2 transition duration-300">
                            3
                        </div>
                        <p id="step-3-label" class="text-sm text-gray-500">מקום האירוע</p>
                    </div>
                </div>
                <div class="flex-1 h-1 bg-gray-300 -mx-2"></div>
                
                <!-- Step 4 -->
                <div class="flex-1 text-center">
                    <div class="relative">
                        <div id="step-4-circle" class="step-inactive w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-lg mb-2 transition duration-300">
                            4
                        </div>
                        <p id="step-4-label" class="text-sm text-gray-500">הגדרות RSVP</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
            <form id="wizard-form">
                <!-- Step 1: Event Details -->
                <div id="step-1-content" class="step-content">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">פרטי האירוע</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">שם האירוע *</label>
                            <input type="text" name="eventName" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                   placeholder="לדוגמה: חתונת דני ורונית">
                            <p class="text-sm text-gray-500 mt-1">זה השם שיופיע בראש הדף</p>
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">שמות בני הזוג *</label>
                            <input type="text" name="coupleNames" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                   placeholder="לדוגמה: דני כהן ורונית לוי">
                        </div>
                    </div>
                </div>

                <!-- Step 2: Date & Time -->
                <div id="step-2-content" class="step-content hidden">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">תאריך ושעה</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">תאריך ושעת האירוע *</label>
                            <input type="datetime-local" name="dateTime" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                            <p class="text-sm text-gray-500 mt-1">כולל שעת ההתחלה המתוכננת</p>
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">הערות נוספות</label>
                            <textarea name="notes" rows="3"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                      placeholder="הערות כלליות על האירוע (אופציונלי)"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Venue -->
                <div id="step-3-content" class="step-content hidden">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">מקום האירוע</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">שם המקום</label>
                            <input type="text" name="venueName"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                   placeholder="לדוגמה: גן אירועים הפרחים">
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">כתובת</label>
                            <input type="text" name="venueAddress"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                   placeholder="רחוב ומספר, עיר">
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">קישור ל-Waze / Google Maps</label>
                            <input type="url" name="wazeLink"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                   placeholder="https://waze.com/...">
                            <p class="text-sm text-gray-500 mt-1">יוצג כלחצן ניווט בעמוד RSVP</p>
                        </div>
                    </div>
                </div>

                <!-- Step 4: RSVP Settings -->
                <div id="step-4-content" class="step-content hidden">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">הגדרות אישור הגעה (RSVP)</h2>
                    
                    <div class="space-y-4">
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p class="text-sm text-blue-800">
                                <i class="fas fa-info-circle ml-2"></i>
                                בחרו אילו שדות יופיעו בטופס RSVP הציבורי
                            </p>
                        </div>

                        <div class="space-y-3">
                            <label class="flex items-center space-x-reverse space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                <input type="checkbox" name="requirePhone" class="w-5 h-5 text-pink-500 rounded">
                                <div class="flex-1">
                                    <span class="font-semibold text-gray-800">טלפון (מומלץ)</span>
                                    <p class="text-sm text-gray-600">לשליחת עדכונים ותזכורות בעתיד</p>
                                </div>
                            </label>

                            <label class="flex items-center space-x-reverse space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                <input type="checkbox" name="showMealChoice" checked class="w-5 h-5 text-pink-500 rounded">
                                <div class="flex-1">
                                    <span class="font-semibold text-gray-800">בחירת מנה</span>
                                    <p class="text-sm text-gray-600">בשר / דג / צמחוני</p>
                                </div>
                            </label>

                            <label class="flex items-center space-x-reverse space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                <input type="checkbox" name="showAllergies" checked class="w-5 h-5 text-pink-500 rounded">
                                <div class="flex-1">
                                    <span class="font-semibold text-gray-800">אלרגיות ומגבלות תזונתיות</span>
                                    <p class="text-sm text-gray-600">שדה טקסט חופשי</p>
                                </div>
                            </label>

                            <label class="flex items-center space-x-reverse space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                <input type="checkbox" name="showNotes" checked class="w-5 h-5 text-pink-500 rounded">
                                <div class="flex-1">
                                    <span class="font-semibold text-gray-800">הערות כלליות</span>
                                    <p class="text-sm text-gray-600">שדה טקסט לברכות והערות</p>
                                </div>
                            </label>

                            <label class="flex items-center space-x-reverse space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                <input type="checkbox" name="allowUpdates" checked class="w-5 h-5 text-pink-500 rounded">
                                <div class="flex-1">
                                    <span class="font-semibold text-gray-800">אפשר עדכון RSVP</span>
                                    <p class="text-sm text-gray-600">אורחים יוכלו לעדכן את התשובה שלהם</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">הודעת הסכמה לעדכונים</label>
                            <textarea name="consentMessage" rows="2"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                      placeholder='לדוגמה: "מסכים/ה לקבל עדכונים על האירוע בוואטסאפ"'></textarea>
                        </div>
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between items-center mt-8 pt-6 border-t">
                    <button type="button" id="prev-btn" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        <i class="fas fa-arrow-right ml-2"></i>
                        הקודם
                    </button>
                    
                    <div class="text-center">
                        <p class="text-sm text-gray-500">שלב <span id="current-step">1</span> מתוך 4</p>
                    </div>

                    <button type="button" id="next-btn" class="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
                        הבא
                        <i class="fas fa-arrow-left mr-2"></i>
                    </button>

                    <button type="submit" id="submit-btn" class="hidden px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition font-semibold">
                        <i class="fas fa-check ml-2"></i>
                        סיים ושלח
                    </button>
                </div>
            </form>

            <!-- Loading State -->
            <div id="loading-state" class="hidden text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl text-pink-500 mb-4"></i>
                <p class="text-gray-600">יוצר את האירוע...</p>
            </div>
        </div>
    </div>

    <!-- Success Modal -->
    <div id="success-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div class="text-center mb-6">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-4xl text-green-500"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-800 mb-2">האירוע נוצר בהצלחה!</h2>
                <p class="text-gray-600">כעת אתה יכול לשלוח את הלינק למוזמנים</p>
            </div>

            <div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">לינק RSVP לשיתוף:</label>
                <div class="flex space-x-reverse space-x-2">
                    <input type="text" id="rsvp-link" readonly
                           class="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white">
                    <button onclick="copyLink()" class="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>

            <div class="flex space-x-reverse space-x-3">
                <a id="manage-event-btn" href="#" class="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition text-center font-semibold">
                    <i class="fas fa-cog ml-2"></i>
                    נהל את האירוע
                </a>
                <a href="/dashboard" class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition text-center font-semibold">
                    <i class="fas fa-home ml-2"></i>
                    חזרה לדשבורד
                </a>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Configure axios to send cookies
        axios.defaults.withCredentials = true;
        
        // Add axios interceptor to automatically include auth token
        axios.interceptors.request.use(function (config) {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = \`Bearer \${token}\`;
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
        
        let currentStep = 1;
        const totalSteps = 4;
        let createdEventId = null;
        let createdEventSlug = null;

        // Elements
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        const form = document.getElementById('wizard-form');
        const loadingState = document.getElementById('loading-state');
        const successModal = document.getElementById('success-modal');

        // Update UI
        function updateUI() {
            // Hide all steps
            document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            
            // Show current step
            document.getElementById(\`step-\${currentStep}-content\`).classList.remove('hidden');
            
            // Update step indicator
            document.getElementById('current-step').textContent = currentStep;
            
            // Update buttons
            prevBtn.disabled = currentStep === 1;
            nextBtn.classList.toggle('hidden', currentStep === totalSteps);
            submitBtn.classList.toggle('hidden', currentStep !== totalSteps);
            
            // Update step circles
            for (let i = 1; i <= totalSteps; i++) {
                const circle = document.getElementById(\`step-\${i}-circle\`);
                const label = document.getElementById(\`step-\${i}-label\`);
                
                circle.classList.remove('step-active', 'step-completed', 'step-inactive');
                
                if (i < currentStep) {
                    circle.classList.add('step-completed');
                    circle.innerHTML = '<i class="fas fa-check"></i>';
                } else if (i === currentStep) {
                    circle.classList.add('step-active');
                    circle.textContent = i;
                } else {
                    circle.classList.add('step-inactive');
                    circle.textContent = i;
                }
                
                label.classList.toggle('font-semibold', i === currentStep);
                label.classList.toggle('text-gray-500', i !== currentStep);
            }
        }

        // Validate current step
        function validateStep() {
            const stepContent = document.getElementById(\`step-\${currentStep}-content\`);
            const requiredFields = stepContent.querySelectorAll('[required]');
            
            for (const field of requiredFields) {
                if (!field.value.trim()) {
                    field.focus();
                    alert('אנא מלא את כל השדות החובה');
                    return false;
                }
            }
            return true;
        }

        // Next button
        nextBtn.addEventListener('click', () => {
            if (validateStep()) {
                currentStep++;
                updateUI();
            }
        });

        // Previous button
        prevBtn.addEventListener('click', () => {
            currentStep--;
            updateUI();
        });

        // Form submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateStep()) return;
            
            const formData = new FormData(form);
            
            // Convert datetime-local to ISO 8601
            const dateTimeValue = formData.get('dateTime');
            const dateTimeISO = dateTimeValue ? new Date(dateTimeValue).toISOString() : '';
            
            const data = {
                eventName: formData.get('eventName'),
                coupleNames: formData.get('coupleNames'),
                dateTime: dateTimeISO,
                venueName: formData.get('venueName') || '',
                venueAddress: formData.get('venueAddress') || '',
                wazeLink: formData.get('wazeLink') || '',
                notes: formData.get('notes') || '',
                isRsvpOpen: true,
                requirePhone: formData.get('requirePhone') === 'on',
                showMealChoice: formData.get('showMealChoice') === 'on',
                showAllergies: formData.get('showAllergies') === 'on',
                showNotes: formData.get('showNotes') === 'on',
                allowUpdates: formData.get('allowUpdates') === 'on',
                consentMessage: formData.get('consentMessage') || ''
            };
            
            try {
                form.classList.add('hidden');
                loadingState.classList.remove('hidden');
                
                const response = await axios.post('/api/events', data);
                
                if (response.data.success) {
                    createdEventId = response.data.event.id;
                    createdEventSlug = response.data.event.slug;
                    
                    document.getElementById('rsvp-link').value = window.location.origin + '/e/' + createdEventSlug;
                    document.getElementById('manage-event-btn').href = '/event/' + createdEventId;
                    
                    successModal.classList.remove('hidden');
                } else {
                    alert('שגיאה: ' + (response.data.error || 'לא ניתן ליצור את האירוע'));
                    form.classList.remove('hidden');
                    loadingState.classList.add('hidden');
                }
            } catch (error) {
                console.error('Error creating event:', error);
                let errorMessage = 'שגיאה ביצירת האירוע. אנא נסה שוב.';
                
                if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                }
                
                alert(errorMessage);
                form.classList.remove('hidden');
                loadingState.classList.add('hidden');
            }
        });

        // Copy link
        function copyLink() {
            const input = document.getElementById('rsvp-link');
            input.select();
            document.execCommand('copy');
            alert('הלינק הועתק ללוח!');
        }

        // Initialize
        updateUI();
    </script>
</body>
</html>
`;
