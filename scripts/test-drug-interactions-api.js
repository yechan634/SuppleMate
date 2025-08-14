import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testDrugInteractionsAPI() {
    console.log('Testing Drug Interactions API...\n');

    const testCases = [
        {
            name: 'Known interaction: ibuprofen + warfarin',
            drug1: 'ibuprofen',
            drug2: 'warfarin',
            expectInteraction: true
        },
        {
            name: 'No interaction: vitamin C + vitamin D',
            drug1: 'vitamin-c',
            drug2: 'vitamin-d',
            expectInteraction: false
        },
        {
            name: 'Cached result: ibuprofen + warfarin (should be fast)',
            drug1: 'ibuprofen',
            drug2: 'warfarin',
            expectInteraction: true,
            expectSource: 'database'
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n--- ${testCase.name} ---`);

        try {
            const startTime = Date.now();
            const response = await axios.get(
                `${API_BASE_URL}/drug-interactions/${testCase.drug1}/${testCase.drug2}`
            );
            const endTime = Date.now();

            console.log(`✅ Response time: ${endTime - startTime}ms`);
            console.log(`✅ Status: ${response.status}`);
            console.log(`✅ Data:`, JSON.stringify(response.data, null, 2));

            // Validate response structure
            const requiredFields = ['fst_drug', 'snd_drug', 'severity', 'description', 'last_updated', 'source'];
            const missingFields = requiredFields.filter(field => !(field in response.data));

            if (missingFields.length > 0) {
                console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
            } else {
                console.log(`✅ All required fields present`);
            }

            // Check interaction expectation
            const hasInteraction = response.data.severity !== 'none';
            if (testCase.expectInteraction === hasInteraction) {
                console.log(`✅ Interaction expectation met: ${hasInteraction}`);
            } else {
                console.log(`❌ Interaction expectation failed. Expected: ${testCase.expectInteraction}, Got: ${hasInteraction}`);
            }

            // Check source expectation
            if (testCase.expectSource && response.data.source !== testCase.expectSource) {
                console.log(`❌ Source expectation failed. Expected: ${testCase.expectSource}, Got: ${response.data.source}`);
            } else if (testCase.expectSource) {
                console.log(`✅ Source expectation met: ${response.data.source}`);
            }

        } catch (error) {
            console.log(`❌ Request failed:`, error.message);
            if (error.response) {
                console.log(`❌ Response status: ${error.response.status}`);
                console.log(`❌ Response data:`, error.response.data);
            }
        }
    }

    console.log('\n--- API Test Complete ---');
}

// Run the tests
testDrugInteractionsAPI();
