// Service for fetching supplement-related news from NewsAPI.ai and storing locally
import AsyncStorage from '@react-native-async-storage/async-storage';

// Multiple API keys to avoid rate limiting
const NEWS_API_TOKENS = [
  '1674d87b32d14c40a51b199f211f9789', // Primary key
  'cc459b6c308e4bfb972101510ab52e99'  // Backup key
];
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 500, // NewsAPI free tier allows 500 requests per day
  requestsPerHour: 50,    // Conservative hourly limit
  delayBetweenRequests: 2000, // 2 seconds between requests
  maxRetries: 3
};

let currentApiKeyIndex = 0;
let requestCount = 0;
let lastRequestTime = 0;

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  RESEARCH_ARTICLES: '@supplemate_research_articles',
  LAST_UPDATE: '@supplemate_last_update',
  METADATA: '@supplemate_metadata'
};

// Enhanced keywords with more specific supplement terms
const SUPPLEMENT_KEYWORDS = [
  'supplement',
  'vitamin',
  'mineral',
  'nutrition',
  'dietary supplement',
  'health research',
  'clinical study',
  'nutritional study',
  'omega-3',
  'probiotics',
  'antioxidant',
  'herbal supplement',
  'medical research',
  'health benefits',
  'multivitamin',
  'fish oil',
  'vitamin D',
  'vitamin C',
  'calcium',
  'magnesium',
  'zinc',
  'iron deficiency',
  'B12',
  'folate',
  'biotin',
  'coenzyme Q10',
  'turmeric',
  'ginseng',
  'echinacea',
  'protein powder',
  'creatine',
  'meal replacement'
];

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  url: string;
  source: {
    title: string;
  };
  dateTime: string;
  image?: string;
}

export interface StoredResearchEntry {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_date: string;
  created_at: string;
}

interface LocalMetadata {
  total_articles: number;
  last_updated: string | null;
}

// Helper functions for rate limiting and API key management
const getCurrentApiKey = (): string => {
  return NEWS_API_TOKENS[currentApiKeyIndex];
};

const rotateApiKey = (): void => {
  currentApiKeyIndex = (currentApiKeyIndex + 1) % NEWS_API_TOKENS.length;
  console.log(`Switched to API key index: ${currentApiKeyIndex}`);
};

const waitForRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_CONFIG.delayBetweenRequests) {
    const waitTime = RATE_LIMIT_CONFIG.delayBetweenRequests - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  requestCount++;
};

const makeNewsApiRequest = async (url: string, retryCount = 0): Promise<any> => {
  await waitForRateLimit();

  const apiKey = getCurrentApiKey();
  const fullUrl = `${url}&apiKey=${apiKey}`;

  try {
    console.log(`Making API request (attempt ${retryCount + 1}/${RATE_LIMIT_CONFIG.maxRetries + 1})`);
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SuppleMate/1.0'
      }
    });

    if (response.status === 429) {
      console.warn(`Rate limit hit for API key index ${currentApiKeyIndex}`);

      if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
        // Try with next API key
        rotateApiKey();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
        return makeNewsApiRequest(url, retryCount + 1);
      } else {
        throw new Error('All API keys rate limited');
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
      console.warn(`Request failed, retrying... (${retryCount + 1}/${RATE_LIMIT_CONFIG.maxRetries})`);
      rotateApiKey();
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeNewsApiRequest(url, retryCount + 1);
    }
    throw error;
  }
};

class NewsService {
  async fetchSupplementNews(): Promise<NewsArticle[]> {
    try {
      // Use simple, effective keywords that work well with NewsAPI
      const keywords = [
        'supplement',
        // 'vitamin',
        // 'nutrition',
        // 'probiotics',
        // 'omega-3',
        // 'multivitamin',
        // 'dietary supplement',
        // 'vitamin D',
        // 'protein powder',
        // 'herbal supplement'
      ];

      const allArticles: any[] = [];
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      const fromDate = lastMonth.toISOString().split('T')[0];
      const TARGET_ARTICLES = 5; // We only need 5 general articles

      for (const keyword of keywords) {
        // Stop fetching if we already have enough articles
        if (allArticles.length >= TARGET_ARTICLES * 2) { // Fetch a bit more to account for duplicates
          console.log(`Stopping keyword search - already have ${allArticles.length} articles`);
          break;
        }

        try {
          // Use simple query format like your example URL
          const url = `${NEWS_API_BASE_URL}?q=${encodeURIComponent(keyword)}&from=${fromDate}&sortBy=popularity`;

          console.log(`Fetching articles for keyword: ${keyword}`);
          const data = await makeNewsApiRequest(url);
          console.log(`Found ${data.articles?.length || 0} articles for "${keyword}"`);

          if (data.articles && Array.isArray(data.articles)) {
            // More strict filtering to ensure articles are truly supplement/health related
            const relevantArticles = data.articles.filter((article: any) => {
              if (!article || !article.title) return false;

              const title = article.title.toLowerCase();
              const description = (article.description || '').toLowerCase();
              const content = `${title} ${description}`;

              // Must contain at least one primary health/supplement term
              const primaryTerms = [
                'supplement', 'vitamin', 'mineral', 'nutrition', 'probiotic',
                'omega', 'protein', 'calcium', 'magnesium', 'zinc', 'iron',
                'multivitamin', 'dietary', 'herbal', 'antioxidant', 'nutrient'
              ];

              // And should contain health-related context terms
              const contextTerms = [
                'health', 'study', 'research', 'clinical', 'trial', 'benefit',
                'medical', 'wellness', 'doctor', 'patient', 'diet', 'fitness'
              ];

              const hasPrimaryTerm = primaryTerms.some(term => content.includes(term));
              const hasContextTerm = contextTerms.some(term => content.includes(term));

              return hasPrimaryTerm && (hasContextTerm || content.includes('supplement') || content.includes('vitamin'));
            }).slice(0, 3); // Limit each keyword to 3 relevant articles max

            console.log(`Filtered to ${relevantArticles.length} relevant articles for "${keyword}"`);
            allArticles.push(...relevantArticles);
          }

          // Stop early if we have enough articles
          if (allArticles.length >= TARGET_ARTICLES * 2) {
            console.log(`Early stop - have ${allArticles.length} articles, target was ${TARGET_ARTICLES}`);
            break;
          }

          // Reduced delay since we have better rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`Error fetching articles for keyword "${keyword}":`, error);

          // If it's a rate limit error, wait longer before continuing
          if (error instanceof Error && error.message.includes('rate limited')) {
            console.log('Waiting 10 seconds due to rate limiting...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
      }

      // Remove duplicates based on URL
      const uniqueArticles = allArticles.filter((article, index, self) =>
        index === self.findIndex(a => a.url === article.url)
      );

      // Sort by publish date (most recent first)
      const sortedArticles = uniqueArticles.sort((a, b) =>
        new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
      );

      // Map the articles to the required format and limit to exactly 5 articles
      return sortedArticles.slice(0, 5).map((article: any) => ({
        id: article.url || `article-${Date.now()}-${Math.random()}`,
        title: article.title || 'Untitled Article',
        body: article.description || '',
        url: article.url || '',
        source: {
          title: article.source?.name || 'Unknown Source'
        },
        dateTime: article.publishedAt || new Date().toISOString(),
        image: article.urlToImage || null
      }));
    } catch (error) {
      console.error('Error fetching supplement news:', error);
      throw error;
    }
  }

  async getStoredResearchEntries(): Promise<StoredResearchEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.RESEARCH_ARTICLES);
      if (!stored) return [];

      const articles: StoredResearchEntry[] = JSON.parse(stored);
      return articles.sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime());
    } catch (error) {
      console.error('Error getting stored research entries:', error);
      return [];
    }
  }

  async saveResearchEntries(articles: NewsArticle[]): Promise<StoredResearchEntry[]> {
    try {
      const entriesToSave: StoredResearchEntry[] = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: this.extractSummary(article.body),
        url: article.url,
        source: article.source.title,
        published_date: article.dateTime,
        created_at: new Date().toISOString()
      }));

      // Store articles in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.RESEARCH_ARTICLES, JSON.stringify(entriesToSave));

      // Update metadata
      const metadata: LocalMetadata = {
        total_articles: entriesToSave.length,
        last_updated: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());

      return entriesToSave;
    } catch (error) {
      console.error('Error saving research entries:', error);
      throw error;
    }
  }

  async getMetadata(): Promise<LocalMetadata> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.METADATA);
      if (!stored) return { total_articles: 0, last_updated: null };

      return JSON.parse(stored);
    } catch (error) {
      console.error('Error getting metadata:', error);
      return { total_articles: 0, last_updated: null };
    }
  }

  async getLastUpdateDate(): Promise<string | null> {
    try {
      const lastUpdate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
      return lastUpdate;
    } catch (error) {
      console.error('Error getting last update date:', error);
      return null;
    }
  }

  async shouldRefreshNews(): Promise<boolean> {
    try {
      const lastUpdate = await this.getLastUpdateDate();
      if (!lastUpdate) return true;

      const lastUpdateDate = new Date(lastUpdate);
      const now = new Date();
      const diffInHours = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);

      return diffInHours >= 24;
    } catch (error) {
      console.error('Error checking if news should refresh:', error);
      return true;
    }
  }

  async cleanupOldArticles(): Promise<void> {
    // For local storage, we'll keep all articles and let AsyncStorage handle storage limits
    // If needed, we could implement a cleanup that keeps only the latest N articles
    console.log('Cleanup not needed for local storage implementation');
  }

  async refreshResearchEntries(): Promise<StoredResearchEntry[]> {
    try {
      const shouldRefresh = await this.shouldRefreshNews();

      if (!shouldRefresh) {
        return await this.getStoredResearchEntries();
      }

      console.log('Fetching fresh research articles from NewsAPI...');
      const freshArticles = await this.fetchSupplementNews();
      return await this.saveResearchEntries(freshArticles);
    } catch (error) {
      console.error('Error refreshing research entries:', error);
      return await this.getStoredResearchEntries();
    }
  }

  private extractSummary(body: string): string {
    if (!body) return '';

    const cleanText = body.replace(/<[^>]*>/g, '').trim();
    return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
  }

  async getLatestResearchEntries(count: number = 5): Promise<StoredResearchEntry[]> {
    try {
      let allEntries = await this.getStoredResearchEntries();

      if (allEntries.length === 0 || await this.shouldRefreshNews()) {
        console.log('Auto-refreshing research entries (daily refresh or first time)');
        allEntries = await this.refreshResearchEntries();
      }

      return allEntries.slice(0, count);
    } catch (error) {
      console.error('Error getting latest research entries:', error);
      return [];
    }
  }

  async getStoredLatestResearchEntries(count: number = 5): Promise<StoredResearchEntry[]> {
    try {
      const allEntries = await this.getStoredResearchEntries();
      return allEntries.slice(0, count);
    } catch (error) {
      console.error('Error getting stored latest research entries:', error);
      return [];
    }
  }

  async checkAndRefreshIfNeeded(): Promise<void> {
    try {
      const shouldRefresh = await this.shouldRefreshNews();
      if (shouldRefresh) {
        console.log('Background daily refresh triggered');
        await this.refreshResearchEntries();
      }
    } catch (error) {
      console.error('Background refresh failed:', error);
    }
  }

  async forceRefreshResearchEntries(): Promise<StoredResearchEntry[]> {
    try {
      console.log('Force refreshing research articles from NewsAPI...');
      const freshArticles = await this.fetchSupplementNews();
      return await this.saveResearchEntries(freshArticles);
    } catch (error) {
      console.error('Error force refreshing research entries:', error);
      // Fallback to stored entries if refresh fails
      return await this.getStoredLatestResearchEntries(5);
    }
  }

  async clearAllStoredData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.RESEARCH_ARTICLES,
        STORAGE_KEYS.LAST_UPDATE,
        STORAGE_KEYS.METADATA
      ]);
      console.log('All stored research data cleared');
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }

  async getStoredArticlesCount(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      return metadata.total_articles;
    } catch (error) {
      console.error('Error getting stored articles count:', error);
      return 0;
    }
  }

  async testFetchNews(): Promise<void> {
    try {
      console.log('Testing news fetch with debug logging...');
      const articles = await this.fetchSupplementNews();
      console.log(`Fetched ${articles.length} supplement-related articles`);

      // Log first few article titles for verification
      articles.slice(0, 5).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Source: ${article.source.title}`);
        console.log(`   URL: ${article.url}`);
        console.log('---');
      });
    } catch (error) {
      console.error('Test fetch failed:', error);
    }
  }

  async fetchSupplementSpecificNews(supplementNames: string[]): Promise<NewsArticle[]> {
    try {
      if (!supplementNames || supplementNames.length === 0) {
        console.log('No supplement names provided for specific news search');
        return [];
      }

      console.log('Fetching supplement-specific news for:', supplementNames);

      const allArticles: any[] = [];
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      const fromDate = lastMonth.toISOString().split('T')[0];
      const TARGET_ARTICLES = 3; // We only need 3 supplement-specific articles

      // Use supplement names as search keywords
      for (const supplementName of supplementNames.slice(0, 5)) { // Limit to 5 supplements to avoid rate limiting
        // Stop fetching if we already have enough articles
        if (allArticles.length >= TARGET_ARTICLES * 2) { // Fetch a bit more to account for duplicates
          console.log(`Stopping supplement search - already have ${allArticles.length} articles`);
          break;
        }

        try {
          // Clean supplement name for better search results
          const cleanedName = supplementName.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .trim();

          if (!cleanedName) continue;

          const searchQuery = `${cleanedName} supplement OR ${cleanedName} study OR ${cleanedName} research`;
          const url = `${NEWS_API_BASE_URL}?q=${encodeURIComponent(searchQuery)}&from=${fromDate}&sortBy=relevancy`;

          console.log(`Fetching articles for supplement: ${supplementName}`);
          const data = await makeNewsApiRequest(url);
          console.log(`Found ${data.articles?.length || 0} articles for "${supplementName}"`);

          if (data.articles && Array.isArray(data.articles)) {
            // Filter for supplement/health relevance and limit to first 5 articles per supplement
            const relevantArticles = data.articles.slice(0, 5).filter((article: any) => {
              if (!article || !article.title) return false;

              const title = article.title.toLowerCase();
              const description = (article.description || '').toLowerCase();
              const content = `${title} ${description}`;

              // Must contain the supplement name or related health terms
              const hasSupplementName = content.includes(cleanedName);
              const hasHealthTerms = ['health', 'study', 'research', 'benefit', 'supplement', 'vitamin', 'nutrition'].some(term =>
                content.includes(term)
              );

              return hasSupplementName || (hasHealthTerms && content.includes('supplement'));
            }).slice(0, 2); // Limit to 2 articles per supplement

            console.log(`Filtered to ${relevantArticles.length} relevant articles for "${supplementName}"`);
            allArticles.push(...relevantArticles);
          }

          // Stop early if we have enough articles
          if (allArticles.length >= TARGET_ARTICLES * 2) {
            console.log(`Early stop - have ${allArticles.length} supplement articles, target was ${TARGET_ARTICLES}`);
            break;
          }

          // Reduced delay since we have better rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`Error fetching articles for supplement "${supplementName}":`, error);

          // If it's a rate limit error, wait longer before continuing
          if (error instanceof Error && error.message.includes('rate limited')) {
            console.log('Waiting 10 seconds due to rate limiting...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
      }

      // Remove duplicates based on URL
      const uniqueArticles = allArticles.filter((article, index, self) =>
        index === self.findIndex(a => a.url === article.url)
      );

      // Sort by publish date (most recent first)
      const sortedArticles = uniqueArticles.sort((a, b) =>
        new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
      );

      // Map to required format and limit to 3 articles
      return sortedArticles.slice(0, 3).map((article: any) => ({
        id: article.url || `supplement-article-${Date.now()}-${Math.random()}`,
        title: article.title || 'Untitled Article',
        body: article.description || '',
        url: article.url || '',
        source: {
          title: article.source?.name || 'Unknown Source'
        },
        dateTime: article.publishedAt || new Date().toISOString(),
        image: article.urlToImage || null
      }));
    } catch (error) {
      console.error('Error fetching supplement-specific news:', error);
      return [];
    }
  }

  // API management methods
  async checkApiKeyStatus(): Promise<void> {
    console.log(`Current API key index: ${currentApiKeyIndex}`);
    console.log(`Total requests made: ${requestCount}`);
    console.log(`Available API keys: ${NEWS_API_TOKENS.length}`);
  }

  resetRateLimit(): void {
    requestCount = 0;
    lastRequestTime = 0;
    currentApiKeyIndex = 0;
    console.log('Rate limit counters reset');
  }
}

export const newsService = new NewsService();
