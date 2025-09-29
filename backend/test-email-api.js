const axios = require('axios');

async function testEmailAPI() {
  try {
    const response = await axios.get('https://apikc.lead-schem.ru/api/email-settings/settings', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE'}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('ERROR Status:', error.response?.status);
    console.log('ERROR Headers:', error.response?.headers);
    console.log('ERROR Data:', error.response?.data);
    console.log('ERROR Message:', error.message);
  }
}

testEmailAPI();
