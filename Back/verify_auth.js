const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
    console.log('--- Testing Authentication ---');

    const endpoints = [
        { method: 'get', url: '/boards' },
        { method: 'post', url: '/boards', data: { title: 'Test' } },
        { method: 'get', url: '/lists?boardId=123' },
        { method: 'post', url: '/lists', data: { title: 'Test', boardId: '123' } },
        { method: 'post', url: '/cards', data: { title: 'Test', listId: '123' } },
    ];

    for (const endpoint of endpoints) {
        try {
            await axios({
                method: endpoint.method,
                url: `${BASE_URL}${endpoint.url}`,
                data: endpoint.data
            });
            console.error(`FAIL: ${endpoint.method.toUpperCase()} ${endpoint.url} should have been blocked`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`PASS: ${endpoint.method.toUpperCase()} ${endpoint.url} blocked with 401`);
            } else {
                console.error(`FAIL: ${endpoint.method.toUpperCase()} ${endpoint.url} returned ${error.response ? error.response.status : error.message}`);
            }
        }
    }
}

async function testOwnership() {
    console.log('\n--- Testing Ownership ---');

    try {
        // 1. Create User A
        console.log('Registering User A...');
        const userAEmail = `usera_${Date.now()}@test.com`;
        const userARes = await axios.post(`${BASE_URL}/auth/register`, {
            email: userAEmail,
            password: 'password123',
            name: 'User A'
        }).catch(err => {
            console.error('Registration A failed:', err.response ? err.response.data : err.message);
            throw err;
        });
        const tokenA = userARes.data.token;

        // 2. Create User B
        console.log('Registering User B...');
        const userBRes = await axios.post(`${BASE_URL}/auth/register`, {
            email: `userb_${Date.now()}@test.com`,
            password: 'password123',
            name: 'User B'
        });
        const tokenB = userBRes.data.token;
        const userBId = userBRes.data.user.id;

        // 3. User A creates Board A
        console.log('User A creating Board A...');
        const boardARes = await axios.post(`${BASE_URL}/boards`, { title: 'Board A' }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        const boardAId = boardARes.data.id;

        // 4. User B attempts to fetch Board A
        console.log('User B attempting to fetch Board A...');
        try {
            await axios.get(`${BASE_URL}/boards/${boardAId}`, {
                headers: { Authorization: `Bearer ${tokenB}` }
            });
            console.error('FAIL: User B should not be able to fetch Board A');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('PASS: User B blocked from fetching Board A (403)');
            } else {
                console.error(`FAIL: Fetching Board A returned ${error.response ? error.response.status : error.message}`);
            }
        }

        // 5. User B attempts to create List in Board A
        console.log('User B attempting to create list in Board A...');
        try {
            await axios.post(`${BASE_URL}/lists`, { title: 'List B', boardId: boardAId }, {
                headers: { Authorization: `Bearer ${tokenB}` }
            });
            console.error('FAIL: User B should not be able to create list in Board A');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('PASS: User B blocked from creating list in Board A (403)');
            } else {
                console.error(`FAIL: Creating list in Board A returned ${error.response ? error.response.status : error.message}`);
            }
        }

    } catch (error) {
        console.error('Error during ownership test:', error.response ? error.response.data : error.message);
    }
}

async function runTests() {
    await testAuth();
    await testOwnership();
}

runTests();
