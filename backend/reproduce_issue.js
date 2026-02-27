const axios = require('axios');

async function testEndpoints() {
  const endpoints = [
    'http://localhost:5000/api/weather?location=Nashik',
    'http://localhost:5000/api/advisory/grape',
    'http://localhost:5000/api/advisory/grape?stage=flowering'
  ];

  for (const url of endpoints) {
    console.log(`Testing ${url}...`);
    try {
      const response = await axios.get(url);
      console.log(`Success: ${response.status}`);
      // Log specific fields we added
      if (url.includes('weather')) {
        console.log('Weather:', {
          temp: response.data.temperature,
          humidity: response.data.humidity,
          wind: response.data.windSpeed,
          isMock: response.data.isMock
        });
      }
      if (url.includes('advisory')) {
        console.log('Advisory:', {
          stage: response.data.stage,
          fertilizer: response.data.fertilizerAdvice,
          weather: response.data.weatherSnapshot
        });
      }
    } catch (error) {
      if (error.response) {
        console.log(`Error: ${error.response.status}`);
        console.log('Response data:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
    console.log('---');
  }
}

testEndpoints();
