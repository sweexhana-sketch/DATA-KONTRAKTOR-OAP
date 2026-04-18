async function testSignup() {
    try {
        console.log('Testing Signup POST...');
        const response = await fetch('http://127.0.0.1:4000/api/auth/signin/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test' + Date.now() + '@example.com',
                password: 'password123',
                name: 'Test User',
                redirect: false,
                callbackUrl: '/',
            }),
        });

        console.log('Status:', response.status);
        console.log('Response URL:', response.url);
        const text = await response.text();
        console.log('Raw Response (first 100 chars):', text.substring(0, 100));
        try {
            const data = JSON.parse(text);
            console.log('Parsed Response:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Response is not JSON');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}
testSignup();
