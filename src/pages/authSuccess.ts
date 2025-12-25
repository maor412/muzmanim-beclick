export const authSuccessPage = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>התחברות הצליחה | מוזמנים בקליק</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <!-- Success Icon -->
        <div class="mb-6">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <i class="fas fa-check-circle text-green-500 text-5xl"></i>
            </div>
        </div>

        <h1 class="text-3xl font-bold text-gray-800 mb-4">
            התחברת בהצלחה!
        </h1>
        
        <p class="text-gray-600 mb-8">
            מעביר אותך למערכת...
        </p>

        <div class="flex items-center justify-center">
            <i class="fas fa-spinner fa-spin text-pink-500 text-2xl"></i>
        </div>
    </div>

    <script>
        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            // Save token to localStorage
            localStorage.setItem('auth_token', token);
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            // No token - redirect to login
            window.location.href = '/login?error=' + encodeURIComponent('Authentication failed');
        }
    </script>
</body>
</html>
`;
