export const devLoginPage = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>התחברות למצב פיתוח | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
        <!-- Logo & Title -->
        <div class="text-center mb-8">
            <i class="fas fa-code text-blue-500 text-5xl mb-4"></i>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">מצב פיתוח (Dev Mode)</h1>
            <p class="text-gray-600">בחרו משתמש לטסטים</p>
        </div>

        <!-- Dev Users List -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">משתמשים זמינים</h2>
            
            <div id="users-list" class="space-y-3">
                <!-- יטען דינמית -->
            </div>

            <!-- Loading State -->
            <div id="loading" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
                <p class="text-gray-600 mt-2">טוען...</p>
            </div>

            <!-- Error State -->
            <div id="error" class="hidden bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                <i class="fas fa-exclamation-circle ml-2"></i>
                <span id="error-message">שגיאה בטעינת משתמשים</span>
            </div>
        </div>

        <!-- Info -->
        <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800">
                <i class="fas fa-info-circle ml-2"></i>
                <strong>שים לב:</strong> זהו מצב פיתוח בלבד. לא נדרשת סיסמה. בפרודקשן ייעשה שימוש באימות אמיתי.
            </p>
        </div>

        <!-- Back to Home -->
        <div class="mt-4 text-center">
            <a href="/" class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-arrow-right ml-1"></i>
                חזרה לדף הבית
            </a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        const loading = document.getElementById('loading');
        const usersList = document.getElementById('users-list');
        const errorDiv = document.getElementById('error');
        const errorMessage = document.getElementById('error-message');

        // טעינת משתמשים
        async function loadUsers() {
            try {
                const response = await axios.get('/api/auth/dev-users');
                
                if (response.data.success) {
                    loading.classList.add('hidden');
                    renderUsers(response.data.users);
                } else {
                    showError('לא ניתן לטעון משתמשים');
                }
            } catch (error) {
                console.error('Error loading users:', error);
                showError('שגיאת תקשורת');
            }
        }

        // הצגת משתמשים
        function renderUsers(users) {
            usersList.innerHTML = users.map(user => \`
                <button 
                    onclick="login('\${user.id}')"
                    class="w-full bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-4 text-right transition duration-200 group"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-reverse space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                \${user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-800 group-hover:text-blue-600">\${user.name}</h3>
                                <p class="text-sm text-gray-500">\${user.email}</p>
                                <span class="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                                    \${user.role === 'admin' ? 'מנהל' : 'משתמש'}
                                </span>
                            </div>
                        </div>
                        <i class="fas fa-arrow-left text-gray-400 group-hover:text-blue-600"></i>
                    </div>
                </button>
            \`).join('');
        }

        // התחברות
        async function login(userId) {
            try {
                const button = event.target.closest('button');
                button.disabled = true;
                button.classList.add('opacity-50');
                
                const response = await axios.post('/api/auth/login', { userId });
                
                if (response.data.success) {
                    // הצלחה! מעבר לדשבורד
                    window.location.href = '/dashboard';
                } else {
                    alert(response.data.error || 'שגיאה בהתחברות');
                    button.disabled = false;
                    button.classList.remove('opacity-50');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('שגיאה בהתחברות. אנא נסה שוב.');
                const button = event.target.closest('button');
                button.disabled = false;
                button.classList.remove('opacity-50');
            }
        }

        // הצגת שגיאה
        function showError(message) {
            loading.classList.add('hidden');
            errorMessage.textContent = message;
            errorDiv.classList.remove('hidden');
        }

        // טעינה אוטומטית
        loadUsers();
    </script>
</body>
</html>
`;
