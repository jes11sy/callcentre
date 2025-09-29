const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('https://apikc.lead-schem.ru/api/auth/login', {
      login: 'admin',
      password: 'admin123',
      role: 'admin'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('ERROR:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testLogin();
