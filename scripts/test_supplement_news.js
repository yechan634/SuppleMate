// Test file to validate the new supplement-specific news functionality
import { newsService } from '../services/newsService';

async function testSupplementNews() {
  console.log('Testing supplement-specific news functionality...');
  
  // Test with sample supplement names
  const testSupplements = ['Vitamin D', 'Omega-3', 'Magnesium'];
  
  try {
    const articles = await newsService.fetchSupplementSpecificNews(testSupplements);
    console.log(`Fetched ${articles.length} supplement-specific articles`);
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source.title}`);
      console.log('---');
    });
    
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Run test
testSupplementNews().then(success => {
  console.log(success ? 'Test passed!' : 'Test failed!');
});
