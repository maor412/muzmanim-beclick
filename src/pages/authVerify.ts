export const authVerifyPage = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>מאמת התחברות | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <!-- Loading State -->
        <div id="loading-state">
            <div class="mb-6">
                <i class="fas fa-spinner fa-spin text-pink-500 text-5xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-4">
                מאמת קישור...
            </h1>
            <p class="text-gray-600">
                אנא המתן רגע
            </p>
        </div>

        <!-- Error State -->
        <div id="error-state" class="hidden">
            <div class="mb-6">
                <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <i class="fas fa-exclamation-circle text-red-500 text-5xl"></i>
                </div>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-4">
                שגיאה באימות
            </h1>
            <p class="text-gray-600 mb-8" id="error-message">
                הקישור אינו תקף או פג תוקפו
            </p>
            <a 
                href="/login"
                class="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition"
            >
                חזור להתחברות
            </a>
        </div>
    </div>

    <script>
        async function verifyMagicLink() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (!token) {
                showError('לא נמצא קישור אימות');
                return;
            }
            
            try {
                const response = await axios.get(\`/api/auth/verify/\${token}\`);
                
                if (response.data.success && response.data.token) {
                    // Save token to localStorage
                    localStorage.setItem('auth_token', response.data.token);
                    
                    // Redirect to dashboard
                    window.location.href = '/auth/success?token=' + response.data.token;
                } else {
                    showError('שגיאה באימות הקישור');
                }
            } catch (error) {
                const message = error.response?.data?.error || 'שגיאה באימות הקישור';
                showError(message);
            }
        }
        
        function showError(message) {
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('error-state').classList.remove('hidden');
            document.getElementById('error-message').textContent = message;
        }
        
        // Start verification on page load
        verifyMagicLink();
    </script>
</body>
</html>
`;
