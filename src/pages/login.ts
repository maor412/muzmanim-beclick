export const loginPage = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>התחברות | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
        <!-- Logo -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                מוזמנים בקליק
            </h1>
            <p class="text-gray-600 mt-2">מערכת ניהול אירועים חכמה</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
                התחבר למערכת
            </h2>

            <!-- Error Message -->
            <div id="error-message" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <i class="fas fa-exclamation-circle ml-2"></i>
                <span id="error-text"></span>
            </div>

            <!-- Success Message -->
            <div id="success-message" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                <i class="fas fa-check-circle ml-2"></i>
                <span id="success-text"></span>
            </div>

            <!-- Magic Link Form -->
            <form id="magic-link-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">
                        <i class="fas fa-envelope ml-2 text-pink-500"></i>
                        כתובת אימייל
                    </label>
                    <input 
                        type="email" 
                        id="email-input"
                        placeholder="your@email.com"
                        required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>

                <button 
                    type="submit"
                    id="magic-link-button"
                    class="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition flex items-center justify-center"
                >
                    <i class="fas fa-paper-plane ml-2"></i>
                    שלח לי קישור התחברות
                </button>
            </form>

            <!-- Divider -->
            <div class="flex items-center my-6">
                <div class="flex-1 border-t border-gray-300"></div>
                <span class="px-4 text-gray-500 text-sm">או</span>
                <div class="flex-1 border-t border-gray-300"></div>
            </div>

            <!-- Google OAuth -->
            <a 
                href="/api/auth/google"
                class="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center"
            >
                <svg class="w-5 h-5 ml-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                התחבר עם Google
            </a>

            <!-- Help Text -->
            <p class="text-center text-sm text-gray-500 mt-6">
                לא קיבלת את המייל?<br>
                בדוק בתיבת ספאם או נסה שוב
            </p>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 text-gray-600 text-sm">
            <p>© 2025 מוזמנים בקליק. כל הזכויות שמורות.</p>
        </div>
    </div>

    <script>
        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
            showError(decodeURIComponent(error));
        }

        // Magic Link Form Handler
        document.getElementById('magic-link-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email-input').value;
            const button = document.getElementById('magic-link-button');
            const originalText = button.innerHTML;
            
            // Disable button and show loading
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> שולח...';
            
            try {
                const response = await axios.post('/api/auth/magic-link', { email });
                
                if (response.data.success) {
                    showSuccess('קישור התחברות נשלח למייל שלך! בדוק את תיבת הדואר.');
                    document.getElementById('email-input').value = '';
                }
            } catch (error) {
                showError(error.response?.data?.error || 'שגיאה בשליחת המייל. נסה שוב.');
            } finally {
                button.disabled = false;
                button.innerHTML = originalText;
            }
        });

        function showError(message) {
            const errorDiv = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            const successDiv = document.getElementById('success-message');
            
            successDiv.classList.add('hidden');
            errorText.textContent = message;
            errorDiv.classList.remove('hidden');
        }

        function showSuccess(message) {
            const successDiv = document.getElementById('success-message');
            const successText = document.getElementById('success-text');
            const errorDiv = document.getElementById('error-message');
            
            errorDiv.classList.add('hidden');
            successText.textContent = message;
            successDiv.classList.remove('hidden');
        }
    </script>
</body>
</html>
`;
