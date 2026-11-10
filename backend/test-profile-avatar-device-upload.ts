const BASE_URL = 'http://localhost:8085/api/v1';

const SAMPLE_DEVICE_AVATAR_DATA_URI =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function request(method: string, endpoint: string, body?: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function runTest() {
  console.log('\n======================================================================');
  console.log('📷 WayRivo AI: Profile Picture Device Upload Verification Suite');
  console.log(`Backend Target: ${BASE_URL}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();

    // 1. TRAVELER AVATAR UPLOAD TEST
    console.log('--- Testing Traveler Device Avatar Upload ---');
    const travelerEmail = `traveler_avatar_${timestamp}@test.com`;
    const regTravelerRes = await request('POST', '/auth/register', {
      name: 'Priya Sharma',
      email: travelerEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const travelerToken = regTravelerRes.data.token;
    assert(!!travelerToken, '1. Traveler registered successfully');

    // Update profile with device library data URI
    const updateTravelerRes = await request(
      'PATCH',
      '/users/profile',
      {
        avatarUrl: SAMPLE_DEVICE_AVATAR_DATA_URI,
        phone: '+91 98765 43210',
      },
      travelerToken
    );
    assert(updateTravelerRes.success === true, '2. Traveler profile accepted device data:image/jpeg upload');

    // Fetch traveler profile and verify avatarUrl
    const getTravelerRes = await request('GET', '/users/profile', undefined, travelerToken);
    assert(
      getTravelerRes.data.avatarUrl === SAMPLE_DEVICE_AVATAR_DATA_URI,
      '3. GET /users/profile persists and returns device avatar URL for Traveler'
    );

    // 2. TRAVEL EXPERT AVATAR UPLOAD TEST
    console.log('\n--- Testing Travel Expert Agency Device Avatar Upload ---');
    const expertEmail = `expert_avatar_${timestamp}@test.com`;
    const regExpertRes = await request('POST', '/auth/register', {
      name: 'Himachal Peaks Adventures',
      email: expertEmail,
      password: 'Password123!',
      role: 'EXPERT',
      agencyName: 'Himachal Peaks Adventures',
    });
    const expertToken = regExpertRes.data.token;
    assert(!!expertToken, '4. Travel Expert registered successfully');

    // Update expert profile with device library photo
    const updateExpertRes = await request(
      'PUT',
      '/experts/profile',
      {
        agencyName: 'Himachal Peaks Adventures',
        avatarUrl: SAMPLE_DEVICE_AVATAR_DATA_URI,
        description: 'Premier trekking and luxury Himalayan expeditions.',
      },
      expertToken
    );
    assert(updateExpertRes.success === true, '5. Travel Expert PUT /experts/profile accepted device avatar upload');

    // Fetch expert profile and verify avatarUrl
    const getExpertRes = await request('GET', '/experts/profile', undefined, expertToken);
    assert(
      getExpertRes.data.avatarUrl === SAMPLE_DEVICE_AVATAR_DATA_URI,
      '6. GET /experts/profile persists and returns device avatar URL for Travel Expert'
    );

    // 3. ADMIN AVATAR UPLOAD TEST
    console.log('\n--- Testing Administrator Device Avatar Upload ---');
    let adminToken = '';
    try {
      const loginAdminRes = await request('POST', '/auth/login', {
        email: 'admin@wayrivo.com',
        password: 'Password123!',
      });
      adminToken = loginAdminRes.data.token;
    } catch {
      const regAdminRes = await request('POST', '/auth/register', {
        name: 'Super Administrator',
        email: `admin_avatar_${timestamp}@test.com`,
        password: 'Password123!',
        role: 'ADMIN',
      });
      adminToken = regAdminRes.data.token;
    }
    assert(!!adminToken, '7. Administrator authenticated successfully');

    // Update admin profile with device library photo
    const updateAdminRes = await request(
      'PATCH',
      '/users/profile',
      {
        avatarUrl: SAMPLE_DEVICE_AVATAR_DATA_URI,
        phone: '+91 98000 00001',
      },
      adminToken
    );
    assert(updateAdminRes.success === true, '8. Admin profile accepted device data:image/jpeg upload');

    // Fetch admin profile and verify avatarUrl
    const getAdminRes = await request('GET', '/users/profile', undefined, adminToken);
    assert(
      getAdminRes.data.avatarUrl === SAMPLE_DEVICE_AVATAR_DATA_URI,
      '9. GET /users/profile persists and returns device avatar URL for Administrator'
    );

    console.log('\n======================================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================================\n');
  } catch (err: any) {
    console.error('Test run failed with error:', err.data || err.message);
    process.exit(1);
  }
}

runTest();
