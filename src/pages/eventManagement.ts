export const eventManagementPage = () => `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ניהול אירוע | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <!-- jsPDF and plugins -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <!-- html2canvas for Hebrew PDF support -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      
      /* Prevent horizontal scroll */
      html, body {
        overflow-x: hidden !important;
        max-width: 100vw !important;
      }
      
      * {
        max-width: 100%;
      }
      
      .tab-active { 
        border-bottom: 3px solid #ec4899; 
        color: #ec4899; 
        background-color: #fdf2f8;
      }
      .tab-inactive { 
        color: #6b7280; 
        border-bottom: 3px solid transparent;
      }
      .toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 300px;
        max-width: 90vw;
        animation: slideDown 0.3s ease-out;
      }
      #toast-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        pointer-events: none;
        z-index: 9999;
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      .dragging { opacity: 0.5; cursor: move; }
      .drag-over { border: 2px dashed #ec4899; background-color: #fdf2f8; }
      
      /* Mobile Responsive Fixes */
      @media (max-width: 768px) {
        /* Force sticky positioning to work */
        nav.sticky, .sticky {
          position: -webkit-sticky !important;
          position: sticky !important;
        }
        
        h1, h2, h3 { 
          font-size: 1.25rem !important; 
          line-height: 1.5 !important;
        }
        .text-3xl { font-size: 1.5rem !important; }
        .text-2xl { font-size: 1.25rem !important; }
        .text-xl { font-size: 1.125rem !important; }
        .px-6 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
        .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        
        /* Fix long text overflow */
        .truncate-mobile {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        
        /* Make error messages wrap properly */
        .text-red-600, .text-red-500 {
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        /* Fix stats cards */
        .grid.md\\:grid-cols-4 {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        
        /* Hide any rogue white divs */
        body > div:empty {
          display: none !important;
        }
        div[style*="background: white"]:empty,
        div[style*="background-color: white"]:empty,
        div[style*="background:#fff"]:empty,
        div[style*="background-color:#fff"]:empty {
          display: none !important;
        }
      }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <nav class="bg-white shadow-lg sticky top-0 z-40">
        <div class="w-full px-2 md:container md:mx-auto md:px-4 py-2 md:py-4">
            <div class="flex justify-between items-center gap-2">
                <div class="flex items-center gap-2 md:gap-4 flex-shrink min-w-0">
                    <a href="/dashboard" class="text-gray-600 hover:text-pink-500 flex items-center flex-shrink-0">
                        <i class="fas fa-arrow-right text-base md:text-xl"></i>
                    </a>
                    <div class="flex items-center gap-1 md:gap-2 min-w-0 flex-shrink">
                        <i class="fas fa-heart text-pink-500 text-lg md:text-2xl flex-shrink-0"></i>
                        <h1 class="text-sm md:text-xl font-bold text-gray-800 truncate" id="event-title">מוזמנים בקליק</h1>
                    </div>
                </div>
                <div class="flex items-center gap-1 md:gap-3 flex-shrink-0">
                    <button onclick="copyRsvpLink()" class="bg-blue-500 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg hover:bg-blue-600 transition text-sm md:text-base flex items-center gap-1">
                        <span class="hidden md:inline">לינק</span>
                        <span class="md:hidden text-xs">RSVP</span>
                        <i class="fas fa-link text-xs md:text-base"></i>
                    </button>
                    <button onclick="logout()" class="bg-red-500 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg hover:bg-red-600 transition text-sm md:text-base flex items-center gap-1">
                        <span class="hidden md:inline">התנתק</span>
                        <i class="fas fa-sign-out-alt text-xs md:text-base"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Tabs Navigation -->
    <div class="bg-white border-b sticky top-[46px] md:top-[73px] z-30">
        <div class="w-full px-2 md:container md:mx-auto md:px-4">
            <div class="flex space-x-reverse overflow-x-auto scrollbar-hide">
                <button onclick="switchTab('overview')" id="tab-overview" class="tab-active px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-chart-line ml-1 md:ml-2"></i>
                    סקירה
                </button>
                <button onclick="switchTab('rsvps')" id="tab-rsvps" class="tab-inactive px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-envelope ml-1 md:ml-2 hidden md:inline"></i>
                    אישורי הגעה
                </button>
                <button onclick="switchTab('guests')" id="tab-guests" class="tab-inactive px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-users ml-1 md:ml-2 hidden md:inline"></i>
                    מוזמנים
                </button>
                <button onclick="switchTab('seating')" id="tab-seating" class="tab-inactive px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-chair ml-1 md:ml-2"></i>
                    הושבה
                </button>
                <button onclick="switchTab('checkin')" id="tab-checkin" class="tab-inactive px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-clipboard-check ml-1 md:ml-2 hidden md:inline"></i>
                    צ'ק-אין
                </button>
                <button onclick="switchTab('walkins')" id="tab-walkins" class="tab-inactive px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-person-walking ml-1 md:ml-2 hidden md:inline"></i>
                    Walk-ins
                </button>
                <button onclick="switchTab('messages')" id="tab-messages" class="tab-inactive px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-comment-dots ml-1 md:ml-2 hidden md:inline"></i>
                    הודעות
                </button>
                <button onclick="switchTab('settings')" id="tab-settings" class="tab-inactive px-3 py-3 md:px-6 md:py-4 font-semibold transition whitespace-nowrap text-sm md:text-base">
                    <i class="fas fa-cog ml-1 md:ml-2"></i>
                    הגדרות
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
        <!-- Loading State -->
        <div id="loading" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-pink-500"></i>
            <p class="text-gray-600 mt-4">טוען נתונים...</p>
        </div>

        <!-- Error State -->
        <div id="error-state" class="hidden bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h3 class="text-xl font-bold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
            <p class="text-red-600 mb-4" id="error-message"></p>
            <button onclick="location.reload()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                נסה שוב
            </button>
        </div>

        <!-- Tab Content: Overview -->
        <div id="content-overview" class="tab-content hidden">
            <!-- Stats Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                <div class="bg-white rounded-lg md:rounded-xl shadow-lg p-3 md:p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs md:text-sm mb-1">אישורי הגעה</p>
                            <p class="text-xl md:text-3xl font-bold text-green-600" id="stat-rsvps">0</p>
                        </div>
                        <i class="fas fa-check-circle text-2xl md:text-4xl text-green-200"></i>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg md:rounded-xl shadow-lg p-3 md:p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs md:text-sm mb-1">אורחים מוזמנים</p>
                            <p class="text-xl md:text-3xl font-bold text-blue-600" id="stat-guests">0</p>
                        </div>
                        <i class="fas fa-users text-2xl md:text-4xl text-blue-200"></i>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg md:rounded-xl shadow-lg p-3 md:p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs md:text-sm mb-1">שולחנות</p>
                            <p class="text-xl md:text-3xl font-bold text-purple-600" id="stat-tables">0</p>
                        </div>
                        <i class="fas fa-chair text-2xl md:text-4xl text-purple-200"></i>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg md:rounded-xl shadow-lg p-3 md:p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-gray-500 text-xs md:text-sm mb-1">הגיעו לאירוע</p>
                            <p class="text-xl md:text-3xl font-bold text-orange-600" id="stat-checkins">0</p>
                        </div>
                        <i class="fas fa-clipboard-check text-2xl md:text-4xl text-orange-200"></i>
                    </div>
                </div>
            </div>

            <!-- Analytics Charts -->
            <div class="grid md:grid-cols-2 gap-6 mb-8">
                <!-- RSVP Status Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6" style="max-height: 350px; overflow: hidden; position: relative;">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-pie text-pink-500 ml-2"></i>
                        סטטוס אישורי הגעה
                    </h3>
                    <div style="height: 250px; max-height: 250px; overflow: hidden; position: relative;">
                        <canvas id="rsvp-chart" height="250"></canvas>
                    </div>
                </div>
                
                <!-- Guest Groups Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6" style="max-height: 350px;">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-bar text-purple-500 ml-2"></i>
                        פילוח קבוצות אורחים
                    </h3>
                    <div style="height: 250px; max-height: 250px; overflow: hidden; position: relative;">
                        <canvas id="groups-chart"></canvas>
                    </div>
                </div>
                
                <!-- Seating Progress Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6" style="max-height: 350px; overflow: hidden; position: relative;">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-line text-blue-500 ml-2"></i>
                        התקדמות הושבה
                    </h3>
                    <div style="height: 250px; max-height: 250px; overflow: hidden; position: relative;">
                        <canvas id="seating-chart" height="250"></canvas>
                    </div>
                </div>
                
                <!-- Side Distribution Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6" style="max-height: 350px; overflow: hidden; position: relative;">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-pie text-green-500 ml-2"></i>
                        חלוקה לפי צד (חתן/כלה)
                    </h3>
                    <div style="height: 250px; max-height: 250px; overflow: hidden; position: relative;">
                        <canvas id="side-chart" height="250"></canvas>
                    </div>
                </div>
            </div>

            <!-- Insights -->
            <div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl shadow-lg p-6 mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-lightbulb text-yellow-500 ml-2"></i>
                    תובנות ומלצות
                </h3>
                <div id="insights-list" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">טוען תובנות...</p>
                </div>
            </div>

            <!-- Event Details -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">פרטי האירוע</h3>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">שם האירוע</p>
                        <p class="font-semibold" id="detail-eventName">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">שמות בני הזוג</p>
                        <p class="font-semibold" id="detail-coupleNames">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">תאריך ושעה</p>
                        <p class="font-semibold" id="detail-dateTime">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">מקום האירוע</p>
                        <p class="font-semibold" id="detail-venue">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">סטטוס RSVP</p>
                        <p class="font-semibold" id="detail-rsvpStatus">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">לינק RSVP</p>
                        <div class="flex items-center space-x-reverse space-x-2">
                            <code class="text-sm bg-gray-100 px-3 py-1 rounded flex-1 truncate" id="detail-slug">-</code>
                            <button onclick="copyRsvpLink()" class="text-blue-500 hover:text-blue-600">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">פעולות מהירות</h3>
                <div class="grid md:grid-cols-3 gap-4">
                    <button onclick="switchTab('rsvps')" class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition">
                        <i class="fas fa-envelope ml-2"></i>
                        צפייה באישורי הגעה
                    </button>
                    <button onclick="switchTab('guests')" class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
                        <i class="fas fa-user-plus ml-2"></i>
                        הוספת מוזמנים
                    </button>
                    <button onclick="switchTab('messages')" class="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition">
                        <i class="fas fa-comment-dots ml-2"></i>
                        הודעות לאורחים
                    </button>
                </div>
            </div>
        </div>

        <!-- Tab Content: RSVPs -->
        <div id="content-rsvps" class="tab-content hidden">
            <!-- Action Buttons - Mobile Optimized -->
            <div class="grid grid-cols-2 md:flex md:flex-row-reverse gap-2 md:gap-3 mb-6">
                <!-- Export Buttons -->
                <button onclick="exportRsvpsPDF()" class="bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition shadow-md flex items-center justify-center">
                    <i class="fas fa-file-pdf ml-2"></i>
                    <span class="hidden md:inline">ייצוא לקובץ </span>PDF
                </button>
                <button onclick="exportRsvps('excel')" class="bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition shadow-md flex items-center justify-center">
                    <i class="fas fa-file-excel ml-2"></i>
                    <span class="hidden md:inline">ייצוא ל-</span>Excel
                </button>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div class="grid md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">סטטוס</label>
                        <select id="filter-status" onchange="filterRsvps()" class="w-full px-4 py-2 border rounded-lg">
                            <option value="all">הכל</option>
                            <option value="confirmed">מאושר</option>
                            <option value="declined">לא מגיע</option>
                            <option value="pending">ממתין</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">בחירת מנה</label>
                        <select id="filter-meal" onchange="filterRsvps()" class="w-full px-4 py-2 border rounded-lg">
                            <option value="all">הכל</option>
                            <option value="meat">בשר</option>
                            <option value="fish">דג</option>
                            <option value="vegan">צמחוני</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">חיפוש</label>
                        <input type="text" id="filter-search" onkeyup="filterRsvps()" placeholder="שם, טלפון..." class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div class="flex items-end">
                        <button onclick="clearFilters()" class="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                            <i class="fas fa-times ml-2"></i>
                            נקה סינון
                        </button>
                    </div>
                </div>
            </div>

            <!-- RSVPs List -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="rsvps-loading" class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-pink-500"></i>
                    <p class="text-gray-600 mt-4">טוען אישורי הגעה...</p>
                </div>
                
                <div id="rsvps-empty" class="hidden text-center py-12">
                    <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-600 mb-2">אין אישורי הגעה</h3>
                    <p class="text-gray-500">ברגע שאורחים ימלאו את הטופס, הם יופיעו כאן</p>
                </div>
                
                <div id="rsvps-list" class="hidden overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">שם</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">טלפון</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">סטטוס</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">מלווים</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">מנה</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">אלרגיות</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">תאריך</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">פעולות</th>
                            </tr>
                        </thead>
                        <tbody id="rsvps-table-body">
                            <!-- Dynamic content -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab Content: Guests -->
        <div id="content-guests" class="tab-content hidden">
            <div class="mb-6">
                <!-- Action Buttons - Mobile Optimized -->
                <div class="grid grid-cols-2 md:flex md:flex-row-reverse gap-2 md:gap-3">
                    <!-- Primary Action -->
                    <button onclick="showAddGuestModal()" class="col-span-2 md:col-span-1 bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition shadow-md flex items-center justify-center font-semibold">
                        <i class="fas fa-plus ml-2"></i>
                        הוסף מוזמן
                    </button>
                    
                    <!-- Export Buttons -->
                    <button onclick="exportGuestsPDF()" class="bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition flex items-center justify-center">
                        <i class="fas fa-file-pdf ml-2"></i>
                        <span class="hidden md:inline">ייצוא לקובץ </span>PDF
                    </button>
                    <button onclick="exportGuests('csv')" class="bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition flex items-center justify-center">
                        <i class="fas fa-file-excel ml-2"></i>
                        <span class="hidden md:inline">ייצוא ל-</span>Excel
                    </button>
                    
                    <!-- Import Button -->
                    <button onclick="showImportModal()" class="bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition flex items-center justify-center">
                        <i class="fas fa-upload ml-2"></i>
                        <span class="hidden md:inline">ייבוא מ-</span>Excel
                    </button>
                    
                    <!-- Delete All Button -->
                    <button onclick="deleteAllGuests()" class="bg-white text-red-600 px-4 py-2.5 rounded-lg hover:bg-red-50 transition border-2 border-red-500 flex items-center justify-center">
                        <i class="fas fa-trash-alt ml-2"></i>
                        <span class="hidden md:inline">מחק הכל</span>
                        <span class="md:hidden">מחק</span>
                    </button>
                </div>
            </div>

            <!-- Guests List -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="guests-loading" class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-pink-500"></i>
                    <p class="text-gray-600 mt-4">טוען מוזמנים...</p>
                </div>
                
                <div id="guests-empty" class="hidden text-center py-12">
                    <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-600 mb-2">אין מוזמנים ברשימה</h3>
                    <p class="text-gray-500 mb-4">התחל בהוספת מוזמנים לאירוע שלך</p>
                    <button onclick="showAddGuestModal()" class="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition">
                        <i class="fas fa-plus ml-2"></i>
                        הוסף מוזמן ראשון
                    </button>
                </div>
                
                <div id="guests-list" class="hidden overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">שם</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">טלפון</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">אימייל</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">קבוצה</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">RSVP</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">פעולות</th>
                            </tr>
                        </thead>
                        <tbody id="guests-table-body">
                            <!-- Dynamic content -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab Content: Seating -->
        <div id="content-seating" class="tab-content hidden">
            <div class="mb-6">
                <!-- Action Buttons - Mobile Optimized -->
                <div class="grid grid-cols-2 md:flex md:flex-row-reverse gap-2 md:gap-3">
                    <!-- Primary Action -->
                    <button onclick="showAddTableModal()" class="col-span-2 md:col-span-1 bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition shadow-md flex items-center justify-center font-semibold">
                        <i class="fas fa-plus ml-2"></i>
                        הוסף שולחן
                    </button>
                    
                    <!-- Automation Dropdown -->
                    <div class="relative col-span-2 md:col-span-1" id="automation-dropdown">
                        <button onclick="toggleAutomationMenu()" 
                                class="w-full bg-purple-500 text-white px-4 py-2.5 rounded-lg hover:bg-purple-600 transition flex items-center justify-center">
                            <i class="fas fa-magic ml-2"></i>
                            <span class="hidden md:inline">אוטומציה</span>
                            <span class="md:hidden">אוטומטי</span>
                            <i class="fas fa-chevron-down mr-2 text-sm"></i>
                        </button>
                        <div id="automation-menu" class="hidden absolute left-0 mt-2 w-full md:w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                            <div class="py-2">
                                <button onclick="showAutoTableCreationModal(); closeAutomationMenu();" 
                                        class="w-full text-right px-4 py-3 hover:bg-purple-50 transition flex items-center">
                                    <i class="fas fa-table ml-3 text-purple-600 w-5"></i>
                                    <div>
                                        <div class="font-semibold text-gray-800">צור שולחנות אוטומטית</div>
                                        <div class="text-xs text-gray-500">לפי משפחות וקבוצות</div>
                                    </div>
                                </button>
                                <button onclick="autoFillSeating(); closeAutomationMenu();" 
                                        class="w-full text-right px-4 py-3 hover:bg-blue-50 transition flex items-center">
                                    <i class="fas fa-chair ml-3 text-blue-600 w-5"></i>
                                    <div>
                                        <div class="font-semibold text-gray-800">השב אורחים בשולחנות</div>
                                        <div class="text-xs text-gray-500">השלמה אוטומטית</div>
                                    </div>
                                </button>
                                <button onclick="autoCreateAndFill(); closeAutomationMenu();" 
                                        class="w-full text-right px-4 py-3 hover:bg-green-50 transition flex items-center border-t border-gray-100">
                                    <i class="fas fa-bolt ml-3 text-green-600 w-5"></i>
                                    <div>
                                        <div class="font-semibold text-gray-800">עשה הכל בלחיצה אחת</div>
                                        <div class="text-xs text-gray-500">צור שולחנות והושב אורחים</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Export Buttons -->
                    <button onclick="exportSeatingPDF()" class="bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition flex items-center justify-center">
                        <i class="fas fa-file-pdf ml-2"></i>
                        <span class="hidden md:inline">ייצוא לקובץ </span>PDF
                    </button>
                    <button onclick="exportSeating()" class="bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition flex items-center justify-center">
                        <i class="fas fa-file-excel ml-2"></i>
                        <span class="hidden md:inline">ייצוא ל-</span>Excel
                    </button>
                </div>
            </div>

            <div class="grid lg:grid-cols-3 gap-6">
                <!-- Unseated Guests -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">אורחים ללא הושבה (<span id="unseated-count">0</span>)</h3>
                    <div id="unseated-guests" class="space-y-2 max-h-96 overflow-y-auto">
                        <p class="text-sm text-gray-500 text-center py-4">טוען...</p>
                    </div>
                </div>

                <!-- Tables -->
                <div class="lg:col-span-2">
                    <div id="tables-loading" class="text-center py-12 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-spinner fa-spin text-4xl text-pink-500"></i>
                        <p class="text-gray-600 mt-4">טוען שולחנות...</p>
                    </div>
                    
                    <div id="tables-empty" class="hidden text-center py-12 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-chair text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-600 mb-2">אין שולחנות</h3>
                        <p class="text-gray-500 mb-4">צור שולחנות כדי להתחיל בהושבת אורחים</p>
                        <button onclick="showAddTableModal()" class="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition">
                            <i class="fas fa-plus ml-2"></i>
                            צור שולחן ראשון
                        </button>
                    </div>
                    
                    <div id="tables-grid" class="hidden grid md:grid-cols-2 gap-4">
                        <!-- Dynamic tables -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab Content: Check-in -->
        <div id="content-checkin" class="tab-content hidden">
            <!-- Stats -->
            <div class="grid md:grid-cols-3 gap-6 mb-6">
                <div class="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-green-700 text-sm mb-1">הגיעו</p>
                            <p class="text-4xl font-bold text-green-600" id="checkin-arrived">0</p>
                        </div>
                        <i class="fas fa-check-circle text-5xl text-green-300"></i>
                    </div>
                </div>
                
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-yellow-700 text-sm mb-1">צפוי להגיע</p>
                            <p class="text-4xl font-bold text-yellow-600" id="checkin-expected">0</p>
                        </div>
                        <i class="fas fa-clock text-5xl text-yellow-300"></i>
                    </div>
                </div>
                
                <div class="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-red-700 text-sm mb-1">לא מגיע</p>
                            <p class="text-4xl font-bold text-red-600" id="checkin-declined">0</p>
                        </div>
                        <i class="fas fa-times-circle text-5xl text-red-300"></i>
                    </div>
                </div>
            </div>

            <!-- Search -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">חיפוש מהיר</label>
                <input type="text" id="checkin-search" onkeyup="searchCheckin()" placeholder="הקלד שם, טלפון או מספר שולחן..." class="w-full px-4 py-3 text-lg border rounded-lg">
            </div>

            <!-- Check-in List -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="checkin-list" class="divide-y">
                    <p class="text-center py-12 text-gray-500">טוען רשימת אורחים...</p>
                </div>
            </div>
        </div>

        <!-- Tab Content: Walk-ins -->
        <div id="content-walkins" class="tab-content hidden">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p class="text-blue-800">
                    <i class="fas fa-info-circle ml-2"></i>
                    <strong>Walk-ins</strong> - אורחים שמגיעים לאירוע ללא הזמנה מראש. המערכת תוסיף אותם אוטומטית לרשימת המוזמנים.
                </p>
            </div>

            <!-- Quick Add Form -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-user-plus text-green-500 ml-2"></i>
                    רישום מהיר
                </h3>
                
                <form id="walkin-form" class="space-y-4">
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-user ml-1"></i>
                                שם מלא *
                            </label>
                            <input type="text" name="fullName" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                   placeholder="שם פרטי + משפחה">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-phone ml-1"></i>
                                טלפון
                            </label>
                            <input type="tel" name="phone"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                   placeholder="052-1234567">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-users ml-1"></i>
                                מספר מלווים
                            </label>
                            <input type="number" name="attendingCount" min="0" max="20" value="0"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-heart ml-1"></i>
                                צד
                            </label>
                            <select name="side" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                                <option value="both">משותף</option>
                                <option value="groom">חתן</option>
                                <option value="bride">כלה</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-tag ml-1"></i>
                                קבוצה
                            </label>
                            <select name="groupLabel" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                                <option value="other">אחרים</option>
                                <option value="family">משפחה</option>
                                <option value="friends">חברים</option>
                                <option value="work">עבודה</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-sticky-note ml-1"></i>
                            הערות
                        </label>
                        <textarea name="notes" rows="2"
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                  placeholder="הערות נוספות..."></textarea>
                    </div>
                    
                    <button type="submit" class="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition text-lg font-semibold">
                        <i class="fas fa-plus ml-2"></i>
                        הוסף Walk-in
                    </button>
                </form>
            </div>

            <!-- Walk-ins List -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="px-6 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-800">
                        <i class="fas fa-list ml-2"></i>
                        רשימת Walk-ins
                    </h3>
                    <span class="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold" id="walkins-count">0</span>
                </div>
                <div id="walkins-list" class="divide-y">
                    <p class="text-center py-12 text-gray-500">טוען רשימת Walk-ins...</p>
                </div>
            </div>
        </div>

        <!-- Tab Content: Messages -->
        <div id="content-messages" class="tab-content hidden">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p class="text-sm text-blue-800">
                    <i class="fas fa-info-circle ml-2"></i>
                    <strong>מצב טסט:</strong> כרגע אין אינטגרציה עם WhatsApp Business API. 
                    תוכלו להעתיק את ההודעות ולהדביק אותן ידנית בקבוצת וואטסאפ / לשלוח אותן לאורחים.
                </p>
            </div>

            <!-- Message Templates -->
            <div class="space-y-6">
                <!-- Invitation Message -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-envelope text-pink-500 ml-2"></i>
                        הודעת הזמנה
                    </h3>
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <p class="text-sm text-gray-600 mb-2 font-semibold">תצוגה מקדימה (דוגמה עם שם פרטי):</p>
                        <p class="whitespace-pre-wrap" id="preview-invitation"></p>
                    </div>
                    <textarea id="template-invitation" rows="8" class="w-full px-4 py-3 border rounded-lg mb-3 font-mono text-sm"></textarea>
                    <button onclick="copyMessage('invitation')" class="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition">
                        <i class="fas fa-copy ml-2"></i>
                        העתק הודעה
                    </button>
                </div>

                <!-- Reminder Message -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-bell text-yellow-500 ml-2"></i>
                        הודעת תזכורת
                    </h3>
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <p class="text-sm text-gray-600 mb-2 font-semibold">תצוגה מקדימה (דוגמה עם שם פרטי):</p>
                        <p class="whitespace-pre-wrap" id="preview-reminder"></p>
                    </div>
                    <textarea id="template-reminder" rows="6" class="w-full px-4 py-3 border rounded-lg mb-3 font-mono text-sm"></textarea>
                    <button onclick="copyMessage('reminder')" class="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition">
                        <i class="fas fa-copy ml-2"></i>
                        העתק הודעה
                    </button>
                </div>

                <!-- RSVP Closed Message -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-lock text-red-500 ml-2"></i>
                        הודעת סגירת RSVP
                    </h3>
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <p class="text-sm text-gray-600 mb-2 font-semibold">תצוגה מקדימה:</p>
                        <p class="whitespace-pre-wrap" id="preview-closed"></p>
                    </div>
                    <textarea id="template-closed" rows="5" class="w-full px-4 py-3 border rounded-lg mb-3 font-mono text-sm"></textarea>
                    <button onclick="copyMessage('closed')" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition">
                        <i class="fas fa-copy ml-2"></i>
                        העתק הודעה
                    </button>
                </div>
            </div>
        </div>

        <!-- Tab Content: Settings -->
        <div id="content-settings" class="tab-content hidden">
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">סטטוס RSVP</h3>
                <div class="flex items-center space-x-reverse space-x-4 mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="setting-rsvp-open" onchange="toggleRsvpStatus()" class="w-6 h-6 text-pink-500 rounded">
                        <span class="mr-3 font-semibold">RSVP פתוח לאורחים</span>
                    </label>
                </div>
                <p class="text-sm text-gray-600">כאשר RSVP סגור, אורחים לא יוכלו למלא את הטופס</p>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">מידע כללי</h3>
                <form id="settings-form" class="space-y-4">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">שם האירוע</label>
                        <input type="text" id="setting-eventName" class="w-full px-4 py-3 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">שמות בני הזוג</label>
                        <input type="text" id="setting-coupleNames" class="w-full px-4 py-3 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">תאריך ושעה</label>
                        <input type="datetime-local" id="setting-dateTime" class="w-full px-4 py-3 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">שם המקום</label>
                        <input type="text" id="setting-venueName" class="w-full px-4 py-3 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">כתובת</label>
                        <input type="text" id="setting-venueAddress" class="w-full px-4 py-3 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">קישור Waze</label>
                        <input type="url" id="setting-wazeLink" class="w-full px-4 py-3 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">הערות</label>
                        <textarea id="setting-notes" rows="3" class="w-full px-4 py-3 border rounded-lg"></textarea>
                    </div>
                    <button type="submit" class="bg-pink-500 text-white px-8 py-3 rounded-lg hover:bg-pink-600 transition font-semibold">
                        <i class="fas fa-save ml-2"></i>
                        שמור שינויים
                    </button>
                </form>
            </div>

            <!-- Danger Zone -->
            <div class="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 class="text-xl font-bold text-red-800 mb-4">
                    <i class="fas fa-exclamation-triangle ml-2"></i>
                    אזור מסוכן
                </h3>
                <p class="text-sm text-red-600 mb-4">פעולות בלתי הפיכות - שימו לב!</p>
                <button onclick="deleteEvent()" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
                    <i class="fas fa-trash ml-2"></i>
                    מחק אירוע לצמיתות
                </button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toast-container"></div>

    <!-- Modals will go here -->
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/event-management.js?v=${Date.now()}"></script>
</body>
</html>
`;
