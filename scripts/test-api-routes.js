// Simple test script to check API routes
const fetch = require('node-fetch');

async function testApiRoutes() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing API routes...');
  
  try {
    // Test basic API route
    console.log('\n1. Testing /api/test...');
    const testResponse = await fetch(`${baseUrl}/api/test`);
    const testData = await testResponse.text();
    console.log('Status:', testResponse.status);
    console.log('Response:', testData);
    
    // Test images API route
    console.log('\n2. Testing /api/admin/settings/images...');
    const imagesResponse = await fetch(`${baseUrl}/api/admin/settings/images`);
    const imagesData = await imagesResponse.text();
    console.log('Status:', imagesResponse.status);
    console.log('Response:', imagesData);
    
    // Test settings API route
    console.log('\n3. Testing /api/admin/settings...');
    const settingsResponse = await fetch(`${baseUrl}/api/admin/settings`);
    const settingsData = await settingsResponse.text();
    console.log('Status:', settingsResponse.status);
    console.log('Response:', settingsData);
    
  } catch (error) {
    console.error('Error testing API routes:', error);
  }
}

testApiRoutes();
