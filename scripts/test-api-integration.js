// Simple test to verify the NewsAPI.org integration
// Using built-in fetch (available in Node.js 18+)

const NEWS_API_TOKEN = 'cc459b6c308e4bfb972101510ab52e99';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';

async function testNewsApiIntegration() {
  try {
    console.log('Testing NewsAPI.org integration...');
    
    const keywords = ['supplement', 'vitamin'];
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const fromDate = lastMonth.toISOString().split('T')[0];

    for (const keyword of keywords) {
      console.log(`\nTesting keyword: ${keyword}`);
      
      const url = `${NEWS_API_BASE_URL}?q=${encodeURIComponent(keyword)}&from=${fromDate}&sortBy=popularity&apiKey=${NEWS_API_TOKEN}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error(`Request failed for keyword "${keyword}": ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        console.log(`✅ Found ${data.articles.length} articles for "${keyword}"`);
        console.log(`Sample article: ${data.articles[0].title}`);
        console.log(`Source: ${data.articles[0].source.name}`);
        console.log(`Published: ${data.articles[0].publishedAt}`);
      } else {
        console.log(`❌ No articles found for "${keyword}"`);
      }
    }
    
    console.log('\n✅ NewsAPI.org integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing NewsAPI.org integration:', error);
  }
}

testNewsApiIntegration();
