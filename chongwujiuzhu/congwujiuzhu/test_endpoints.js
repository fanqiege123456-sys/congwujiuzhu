const http = require('http');

const endpoints = [
  '/api/pets',
  '/api/community/posts',
  '/api/users/oPOlk17zv4e-0i9rT9w8IGToz7_U'
];

function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      timeout: 2000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${res.statusCode}] ${path} - Length: ${data.length}`);
        resolve(res.statusCode === 200);
      });
    }).on('error', (err) => {
      console.error(`[ERROR] ${path} - ${err.message}`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('Starting API Health Check...');
  let allPass = true;
  for (const ep of endpoints) {
    const pass = await checkEndpoint(ep);
    if (!pass) allPass = false;
  }
  
  if (allPass) {
    console.log('✅ All endpoints are reachable.');
  } else {
    console.log('❌ Some endpoints failed.');
  }
}

runTests();
