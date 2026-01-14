const axios = require('axios');

async function test() {
    try {
        const response = await axios.get('http://localhost:3001/api/boards', {
            headers: {
                // Need a valid token. I'll try to find one or just check the code again.
            }
        });
        console.log(response.data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}
// Actually, I can't easily get a token here. 
// I'll just check the controller code again for potential bugs.
