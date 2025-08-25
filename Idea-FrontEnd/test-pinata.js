// Test Pinata connection
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2OTczM2NmMi1kYjJhLTRmNWItODI2Yy04YzE5NTBkNzZlZmYiLCJlbWFpbCI6InZpamF5YWxheWFuazI2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJmYmRmMGY2ZGEzODU5MDVkZjViNSIsInNjb3BlZEtleVNlY3JldCI6IjgyMzEzNjlhOGNlNDBkYzViZDIyODY4OWM2ZjMyMTQ3NTAwNDYzMDg2ODhjNDRjZjM4MWJmNTM1YTUxNTU3ZTYiLCJleHAiOjE3ODc2MzI5NzF9.oEgHV9P_dQl2a0k6ccQdICSHODkxNfi52pPMWo6MYZE";

async function testPinata() {
  try {
    console.log('🧪 Testing Pinata connection...');
    
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Pinata connection successful!');
      console.log('📊 Result:', result);
      
      // Test JSON upload
      console.log('\n📤 Testing JSON upload...');
      const testData = {
        message: "Hello from Idea Protection Platform!",
        timestamp: new Date().toISOString(),
        test: true
      };

      const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: testData,
          pinataMetadata: {
            name: 'test-upload',
            keyvalues: {
              type: 'test'
            }
          }
        })
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log('✅ JSON upload successful!');
        console.log('📄 IPFS Hash:', uploadResult.IpfsHash);
        console.log('🔗 URL:', `https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`);
        
        // Test retrieval
        console.log('\n📥 Testing content retrieval...');
        const retrieveResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`);
        if (retrieveResponse.ok) {
          const retrievedData = await retrieveResponse.json();
          console.log('✅ Content retrieval successful!');
          console.log('📋 Retrieved data:', retrievedData);
        } else {
          console.log('❌ Content retrieval failed');
        }
        
      } else {
        const error = await uploadResponse.json();
        console.log('❌ JSON upload failed:', error);
      }
      
    } else {
      const error = await response.json();
      console.log('❌ Pinata connection failed:', error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPinata();
