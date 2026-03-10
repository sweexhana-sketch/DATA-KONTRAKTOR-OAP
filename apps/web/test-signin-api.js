async function testAuth() {
    try {
        const email = 'login_test' + Date.now() + '@example.com';
        const password = 'password123';

        console.log('1. Testing Signup POST...');
        const signupRes = await fetch('http://127.0.0.1:4000/api/auth/callback/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name: 'Login Test',
                redirect: false,
                callbackUrl: '/',
            }),
        });
        console.log('Signup Status:', signupRes.status);
        const signupText = await signupRes.text();
        try {
            console.log('Signup Res JSON:', JSON.parse(signupText));
        } catch (e) {
            console.log('Signup Res Raw:', signupText.substring(0, 100));
        }

        console.log('\n2. Testing Signin POST...');
        const signinRes = await fetch('http://127.0.0.1:4000/api/auth/callback/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                redirect: false,
                callbackUrl: '/',
            }),
        });
        console.log('Signin Status:', signinRes.status);
        const signinText = await signinRes.text();
        try {
            console.log('Signin Res JSON:', JSON.parse(signinText));
        } catch (e) {
            console.log('Signin Res Raw:', signinText.substring(0, 100));
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}
testAuth();
