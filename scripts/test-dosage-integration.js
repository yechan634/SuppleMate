// Test script to verify dosage recommendation integration
import { calculateRecommendedDosage, getSupplementDosageRanges } from './utils/DosageCalculator.ts';

// Test data
const testPersonalInfo = {
  gender: 'male',
  weight: 75 // 75kg male - should be medium weight category
};

const supplements = ['Vitamin D', 'Vitamin C', 'Omega-3', 'Magnesium', 'Zinc'];

console.log('🧪 Testing Dosage Recommendation Integration\n');

supplements.forEach(supplement => {
  console.log(`Testing: ${supplement}`);
  
  // Test getting dosage ranges
  const dosageInfo = getSupplementDosageRanges(supplement);
  if (dosageInfo) {
    console.log(`✅ Found dosage info for ${supplement}`);
    
    // Test calculating recommended dosage
    const recommendation = calculateRecommendedDosage(supplement, testPersonalInfo);
    if (recommendation) {
      console.log(`✅ Recommended dosage: ${recommendation.dosage}`);
      console.log(`   Range: ${recommendation.range.min}-${recommendation.range.max} ${recommendation.range.unit}`);
      console.log(`   Category: ${recommendation.range.description}`);
      if (recommendation.notes) {
        console.log(`   Notes: ${recommendation.notes}`);
      }
    } else {
      console.log(`❌ Failed to calculate recommendation for ${supplement}`);
    }
  } else {
    console.log(`❌ No dosage info found for ${supplement}`);
  }
  console.log('');
});

console.log('✅ Integration test completed!');
