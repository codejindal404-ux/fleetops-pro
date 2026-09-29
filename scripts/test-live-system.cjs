const http = require('http');
const { io } = require('socket.io-client');

async function testFullFlow() {
  console.log('--- 1. Testing Login API ---');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@fleetops.com',
      password: 'Password123!'
    })
  });

  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status, loginData);

  if (!loginData.pendingToken && !loginData.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }

  let token = loginData.token;
  if (loginData.pendingToken) {
    console.log('--- 2. Testing OTP Verification API ---');
    const otpRes = await fetch('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@fleetops.com',
        code: '123456',
        pendingToken: loginData.pendingToken
      })
    });
    const otpData = await otpRes.json();
    console.log('OTP Response Status:', otpRes.status, otpData);
    token = otpData.token || otpData.data?.token || otpData.accessToken;
    if (!token) throw new Error('No token returned from OTP verification: ' + JSON.stringify(otpData));
  }

  console.log('--- 3. Testing Customer Dashboard API ---');
  const dashRes = await fetch('http://localhost:3000/api/customer/dashboard', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const dashData = await dashRes.json();
  console.log('Customer Dashboard Status:', dashRes.status);
  console.log('Customer Dashboard Data Keys:', Object.keys(dashData));
  console.log('Customer Stats:', dashData.stats);
  console.log('Customer Vehicles count:', dashData.vehicles?.length);
  console.log('Customer Bookings count:', dashData.bookings?.length);

  console.log('--- 4. Testing Socket.IO Connection ---');
  await new Promise((resolve, reject) => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket connection timed out'));
    }, 5000);

    socket.on('connect', () => {
      console.log('Socket connected successfully! ID:', socket.id);
      clearTimeout(timer);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(err);
    });
  });

  console.log('\n✅ ALL VERIFICATION TESTS PASSED!');
}

testFullFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
