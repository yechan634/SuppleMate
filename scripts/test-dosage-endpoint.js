// Test script for the database-backed dosage recommendation endpoint
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testDosageEndpoint() {
    console.log('🧪 Testing Database-Backed Dosage Recommendation Endpoint\n');

    const supplements = [
        'Vitamin D',
        'Vitamin C',
        'Vitamin B12',
        'Omega-3',
        'Magnesium',
        'Calcium',
        'Zinc',
        'Iron',
        'Probiotics',
        'Turmeric'
    ];

    const testUserId = '1'; // Using existing test user

    for (const supplement of supplements) {
        try {
            console.log(`Testing: ${supplement}`);

            const response = await axios.get(
                `${API_BASE_URL}/supplements/${encodeURIComponent(supplement)}/dosage-recommendation`,
                { params: { userId: testUserId } }
            );

            if (response.status === 200) {
                const data = response.data;
                console.log(`✅ Success for ${supplement}`);
                console.log(`   Supplement: ${data.supplement}`);
                console.log(`   User: ${data.userProfile.gender}, ${data.userProfile.weight}kg (${data.userProfile.weightCategory})`);
                console.log(`   Recommended: ${data.recommendation.dosage}`);
                console.log(`   Range: ${data.recommendation.range.min}-${data.recommendation.range.max} ${data.recommendation.range.unit}`);

                if (data.recommendation.notes) {
                    console.log(`   Notes: ${data.recommendation.notes}`);
                }

                // Verify structure
                if (data.success &&
                    data.supplement &&
                    data.userProfile &&
                    data.recommendation &&
                    data.recommendation.allOptions &&
                    Object.keys(data.recommendation.allOptions).length === 3) {
                    console.log(`   ✅ Response structure valid`);
                } else {
                    console.log(`   ⚠️  Response structure issues`);
                }
            } else {
                console.log(`❌ HTTP ${response.status} for ${supplement}`);
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ Error ${error.response.status} for ${supplement}: ${error.response.data.error}`);
            } else {
                console.log(`❌ Network error for ${supplement}: ${error.message}`);
            }
        }
        console.log('');
    }

    // Test error cases
    console.log('Testing error cases:');

    try {
        await axios.get(`${API_BASE_URL}/supplements/InvalidSupplement/dosage-recommendation`,
            { params: { userId: testUserId } });
        console.log('❌ Should have failed for invalid supplement');
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('✅ Correctly returned 404 for invalid supplement');
        } else {
            console.log('❌ Unexpected error for invalid supplement');
        }
    }

    try {
        await axios.get(`${API_BASE_URL}/supplements/Vitamin D/dosage-recommendation`);
        console.log('❌ Should have failed for missing userId');
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Correctly returned 400 for missing userId');
        } else {
            console.log('❌ Unexpected error for missing userId');
        }
    }

    console.log('\n🎉 Database-backed dosage endpoint testing completed!');
}

// Run the test
testDosageEndpoint().catch(console.error);
