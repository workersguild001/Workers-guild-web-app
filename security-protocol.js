// The Workers Guild: Security Protocol & Route Guard
// This script checks for a valid Auth0 session or API token before allowing access.

async function verifyOwnerAccess() {
    // 1. Check if user is logged in via Auth0 (or your chosen provider)
    // Replace with actual Auth0 SDK check: await auth0.isAuthenticated()
    const isAuthenticated = localStorage.getItem('guild_owner_token') !== null;

    if (!isAuthenticated) {
        console.error("ACCESS_DENIED: Unauthorized direct URL navigation detected.");
        // Redirect to the Secure Gateway if not authenticated
        window.location.href = 'index.html'; 
        return;
    }

    // 2. Optional: Perform an API check to verify the token is still valid
    try {
        const response = await fetch('https://your-api-gateway.com/verify-owner', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('guild_owner_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("TOKEN_EXPIRED");
        }

        // Access Granted - Reveal the Command Center
        document.body.classList.remove('hidden');
        console.log("AUTHORIZATION_SUCCESS: Owner session verified.");

    } catch (error) {
        console.error("SECURITY_BREACH: Redirecting to lockdown gateway.");
        window.location.href = 'index.html';
    }
}

// Run the check immediately on script load
verifyOwnerAccess();
