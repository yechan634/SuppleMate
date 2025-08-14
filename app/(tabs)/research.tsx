import DrugInteractionModal from '@/components/DrugInteractionModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { InteractionResult } from '@/constants/DrugInteractions';
import { useColorScheme } from '@/hooks/useColorScheme';
import { NewsArticle, newsService } from '@/services/newsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface ArticleWithViews extends NewsArticle {
  viewCount: number;
}

interface Supplement {
  id: number;
  user_uid: string;
  name: string;
  dosage: string;
  frequency: string | { days?: number; hours?: number; seconds?: number };
  first_take: string;
  supply_amount: number;
  type: 'supplement' | 'medication';
  created_at: string;
  updated_at: string;
}

export default function ResearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // For the drug interaction checker
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);

  // Autocomplete states
  const [suggestions1, setSuggestions1] = useState<string[]>([]);
  const [suggestions2, setSuggestions2] = useState<string[]>([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);

  // News states
  const [userSupplements, setUserSupplements] = useState<Supplement[]>([]);
  const [supplementNewsLoading, setSupplementNewsLoading] = useState(false);
  const [generalNewsLoading, setGeneralNewsLoading] = useState(false);
  const [supplementNews, setSupplementNews] = useState<ArticleWithViews[]>([]);
  const [generalNews, setGeneralNews] = useState<ArticleWithViews[]>([]);

  // Check interactions between two drugs/supplements using API
  const checkTwoDrugInteractions = async (drugName1: string, drugName2: string): Promise<InteractionResult> => {
    try {
      console.log(`🔍 Checking interaction between ${drugName1} and ${drugName2} via API`);

      const response = await fetch(`${Config.API_URL}/drug-interactions/${encodeURIComponent(drugName1)}/${encodeURIComponent(drugName2)}`);

      if (!response.ok) {
        console.warn(`Failed to check interaction between ${drugName1} and ${drugName2}`);
        // Fallback to no interaction found
        return {
          hasInteractions: false,
          severity: null,
          interactions: []
        };
      }

      const apiResult = await response.json();
      console.log(`📊 API result:`, apiResult);

      // Check if there's an actual interaction (not 'none')
      if (apiResult.severity && apiResult.severity !== 'none') {
        // Map API severity to our InteractionSeverity type
        let mappedSeverity: 'mild' | 'strong';
        if (apiResult.severity === 'severe' || apiResult.severity === 'moderate') {
          mappedSeverity = 'strong';
        } else {
          mappedSeverity = 'mild';
        }

        return {
          hasInteractions: true,
          severity: mappedSeverity,
          interactions: [{
            conflictingDrug: drugName2,
            severity: mappedSeverity,
            description: apiResult.description || `Interaction detected between ${drugName1} and ${drugName2}`
          }]
        };
      }

      // No interaction found
      return {
        hasInteractions: false,
        severity: null,
        interactions: []
      };
    } catch (error) {
      console.error('Error checking drug interactions via API:', error);
      // Fallback to no interaction found on error
      return {
        hasInteractions: false,
        severity: null,
        interactions: []
      };
    }
  };

  const handleCheckInteractions = async () => {
    // Hide any open suggestions first
    setShowSuggestions1(false);
    setShowSuggestions2(false);

    if (!drug1.trim() || !drug2.trim()) {
      Alert.alert('Error', 'Please enter both supplements/drugs to check for interactions.');
      return;
    }

    if (drug1.trim().toLowerCase() === drug2.trim().toLowerCase()) {
      Alert.alert('Error', 'Please enter two different supplements/drugs.');
      return;
    }

    try {
      const result = await checkTwoDrugInteractions(drug1.trim(), drug2.trim());
      setInteractionResult(result);
      setShowInteractionModal(true);
    } catch (error) {
      console.error('Error checking interactions:', error);
      Alert.alert(
        'Error',
        'Failed to check drug interactions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCloseInteractionModal = () => {
    setShowInteractionModal(false);
    setInteractionResult(null);
  };

  // Fetch user supplements data
  const fetchUserSupplements = async (userIdParam?: string, forceRefresh = false) => {
    try {
      const currentUserId = userIdParam || userId;
      if (!currentUserId) {
        console.log('No user ID available for supplement-specific news');
        return;
      }

      // Try to load cached data first if not forcing refresh
      if (!forceRefresh) {
        try {
          const cachedSupplements = await AsyncStorage.getItem(`userSupplements_${currentUserId}`);
          const cachedSupplementNews = await AsyncStorage.getItem(`supplementNews_${currentUserId}`);

          if (cachedSupplements && cachedSupplementNews) {
            const supplements = JSON.parse(cachedSupplements);
            const supplementNews = JSON.parse(cachedSupplementNews);

            console.log('Loaded cached user supplements and news:', supplements.length, 'supplements,', supplementNews.length, 'articles');
            setUserSupplements(supplements);
            setSupplementNews(supplementNews);
            console.log('✅ Using cached supplement data');
            return;
          }
        } catch (cacheError) {
          console.log('Failed to load cached data, fetching fresh:', cacheError);
        }
      }

      console.log('Fetching fresh user supplements for research page:', currentUserId);
      console.log('🔄 Fetching fresh supplement data from API');
      const response = await fetch(
        `${Config.API_URL}/supplements?user_uid=${currentUserId}`
      );

      if (!response.ok) throw new Error('Failed to fetch user supplements');

      const data: Supplement[] = await response.json();
      console.log('User supplements fetched for research:', data.length, 'items');

      // Filter to get only supplements (not medications) and extract names
      const supplements = data.filter(item => item.type === 'supplement');
      setUserSupplements(supplements);

      // Cache the supplements data
      await AsyncStorage.setItem(`userSupplements_${currentUserId}`, JSON.stringify(supplements));

      // If user has supplements, fetch supplement-specific news
      if (supplements.length > 0) {
        await fetchSupplementSpecificNews(supplements.map(s => s.name), currentUserId, forceRefresh);
      } else {
        // Clear cached news if no supplements
        setSupplementNews([]);
        await AsyncStorage.removeItem(`supplementNews_${currentUserId}`);
      }
    } catch (error) {
      console.error('Error fetching user supplements for research:', error);
      setUserSupplements([]);
    }
  };

  // Fetch supplement-specific news
  const fetchSupplementSpecificNews = async (supplementNames: string[], currentUserId?: string, forceRefresh = false) => {
    try {
      // Try to load cached data first if not forcing refresh
      if (!forceRefresh && currentUserId) {
        try {
          const cachedSupplementNews = await AsyncStorage.getItem(`supplementNews_${currentUserId}`);
          if (cachedSupplementNews) {
            const supplementNews = JSON.parse(cachedSupplementNews);
            console.log('Loaded cached supplement-specific news:', supplementNews.length, 'articles');
            setSupplementNews(supplementNews);
            console.log('✅ Using cached supplement news');
            return;
          }
        } catch (cacheError) {
          console.log('Failed to load cached supplement news, fetching fresh:', cacheError);
        }
      }

      setSupplementNewsLoading(true);
      console.log('Fetching fresh supplement-specific news for:', supplementNames);
      console.log('🔄 Fetching fresh supplement news from API');

      const articles = await newsService.fetchSupplementSpecificNews(supplementNames);

      // Add random view counts
      const articlesWithViews = articles.map(article => ({
        ...article,
        viewCount: Math.floor(Math.random() * 500) + 100 // Random between 100-599
      }));

      setSupplementNews(articlesWithViews);
      console.log('Supplement-specific articles loaded:', articlesWithViews.length);

      // Cache the news data if we have a user ID
      if (currentUserId) {
        await AsyncStorage.setItem(`supplementNews_${currentUserId}`, JSON.stringify(articlesWithViews));
      }
    } catch (error) {
      console.error('Error fetching supplement-specific news:', error);
      setSupplementNews([]);
    } finally {
      setSupplementNewsLoading(false);
    }
  };

  // Fetch general supplement news (existing functionality)
  const fetchGeneralArticles = async (showRefreshing = false, forceRefresh = false) => {
    try {
      // Try to load cached data first if not forcing refresh
      if (!forceRefresh) {
        try {
          const cachedGeneralNews = await AsyncStorage.getItem('generalSupplementNews');
          if (cachedGeneralNews) {
            const generalNews = JSON.parse(cachedGeneralNews);
            console.log('Loaded cached general news:', generalNews.length, 'articles');
            setGeneralNews(generalNews);
            console.log('✅ Using cached general news');
            return;
          }
        } catch (cacheError) {
          console.log('Failed to load cached general news, fetching fresh:', cacheError);
        }
      }

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setGeneralNewsLoading(true);
      }

      console.log('Fetching fresh general supplement news');
      console.log('🔄 Fetching fresh general news from API');
      const fetchedArticles = await newsService.fetchSupplementNews();

      // Add random view counts and sort by views
      const articlesWithRandomViews = fetchedArticles.slice(0, 5).map(article => ({
        ...article,
        viewCount: Math.floor(Math.random() * 1000) // Random number between 0-999
      }));

      // Sort by view count (highest first)
      const sortedArticles = articlesWithRandomViews.sort((a, b) => b.viewCount - a.viewCount);
      setGeneralNews(sortedArticles);

      // Cache the general news data
      await AsyncStorage.setItem('generalSupplementNews', JSON.stringify(sortedArticles));
      console.log('Cached general news:', sortedArticles.length, 'articles');
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Error',
        'Failed to load research articles. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneralNewsLoading(false);
      setRefreshing(false);
    }
  };

  // Load user data and fetch all articles
  const loadDataAndFetchArticles = async (forceRefresh = false) => {
    try {
      // Get user data
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);

        // Fetch user supplements first, then general articles
        await fetchUserSupplements(user.id, forceRefresh);
      }

      // Always fetch general articles
      await fetchGeneralArticles(false, forceRefresh);
    } catch (error) {
      console.error('Error loading data:', error);
      // Still fetch general articles even if user data fails
      await fetchGeneralArticles(false, forceRefresh);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDataAndFetchArticles(true); // Force refresh
    setRefreshing(false);
  };

  const handleArticlePress = async (url: string, articleId: string, isSupplementSpecific = false) => {
    try {
      // Increment view count and resort appropriate list
      if (isSupplementSpecific) {
        setSupplementNews(prevArticles => {
          const updatedArticles = prevArticles.map(article => {
            if (article.id === articleId) {
              return {
                ...article,
                viewCount: article.viewCount + 1
              };
            }
            return article;
          });
          const sortedArticles = updatedArticles.sort((a, b) => b.viewCount - a.viewCount);

          // Update cache with new view counts
          if (userId) {
            AsyncStorage.setItem(`supplementNews_${userId}`, JSON.stringify(sortedArticles)).catch(err =>
              console.log('Failed to cache updated supplement news:', err)
            );
          }

          return sortedArticles;
        });
      } else {
        setGeneralNews(prevArticles => {
          const updatedArticles = prevArticles.map(article => {
            if (article.id === articleId) {
              return {
                ...article,
                viewCount: article.viewCount + 1
              };
            }
            return article;
          });
          const sortedArticles = updatedArticles.sort((a, b) => b.viewCount - a.viewCount);

          // Update cache with new view counts
          AsyncStorage.setItem('generalSupplementNews', JSON.stringify(sortedArticles)).catch(err =>
            console.log('Failed to cache updated general news:', err)
          );

          return sortedArticles;
        });
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open the article link');
      }
    } catch (error) {
      console.error('Error opening article:', error);
      Alert.alert('Error', 'Failed to open the article');
    }
  };

  // Fetch suggestions from API
  const fetchSuggestions = async (query: string, isFirstInput: boolean) => {
    if (query.length < 2) {
      if (isFirstInput) {
        setSuggestions1([]);
        setShowSuggestions1(false);
      } else {
        setSuggestions2([]);
        setShowSuggestions2(false);
      }
      return;
    }

    try {
      const response = await fetch(`${Config.API_URL}/supplement-names`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');

      const data = await response.json();
      // Filter suggestions based on input
      const filteredSuggestions = data.names.filter((name: string) =>
        name.toLowerCase().includes(query.toLowerCase())
      );

      if (isFirstInput) {
        setSuggestions1(filteredSuggestions);
        setShowSuggestions1(true);
      } else {
        setSuggestions2(filteredSuggestions);
        setShowSuggestions2(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      if (isFirstInput) {
        setSuggestions1([]);
        setShowSuggestions1(false);
      } else {
        setSuggestions2([]);
        setShowSuggestions2(false);
      }
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDataAndFetchArticles();
    }, [])
  );
  // Render individual article item
  const renderArticleItem = ({ item, isSupplementSpecific = false }: { item: ArticleWithViews; isSupplementSpecific?: boolean }) => (
    <TouchableOpacity
      style={[
        styles.articleBubble,
        {
          backgroundColor: colors.cardBackground,
          shadowColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.25)' : '#000',
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
        }
      ]}
      onPress={() => handleArticlePress(item.url, item.id, isSupplementSpecific)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.articleInner,
        {
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(255,255,255,0.6)',
          borderColor: colorScheme === 'dark'
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.03)',
        }
      ]}>
        <ThemedText style={[styles.articleTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText style={[styles.articleSource, { color: colors.tint }]}>
          {item.source.title}
        </ThemedText>
        <ThemedText style={[styles.articleDate, { color: colors.tabIconDefault }]}>
          {new Date(item.dateTime).toLocaleDateString()}
        </ThemedText>
        <ThemedText style={[styles.viewCount, { color: colors.tabIconDefault }]}>
          Views: {item.viewCount}
        </ThemedText>
        <ThemedText style={[styles.tapHint, { color: colors.tabIconDefault }]}>
          Tap to read full article
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  // Supplement-specific news section
  const SupplementNewsSection = () => (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
        News for Your Supplements
      </ThemedText>
      {userSupplements.length > 0 ? (
        <>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.tabIconDefault }]}>
            Based on: {userSupplements.map(s => s.name).join(', ')}
          </ThemedText>
          {supplementNewsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={[styles.loadingText, { color: colors.text }]}>
                Loading personalized news...
              </ThemedText>
            </View>
          ) : supplementNews.length > 0 ? (
            <View>
              {supplementNews.map((article, index) => (
                <View key={article.id || index}>
                  {renderArticleItem({ item: article, isSupplementSpecific: true })}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.noNewsContainer, { backgroundColor: colors.background }]}>
              <ThemedText style={[styles.noNewsText, { color: colors.tabIconDefault }]}>
                No recent news found for your supplements. Check back later!
              </ThemedText>
            </View>
          )}
        </>
      ) : (
        <View style={[styles.noNewsContainer, { backgroundColor: colors.background }]}>
          <ThemedText style={[styles.noNewsText, { color: colors.tabIconDefault }]}>
            Add supplements to your stack to see personalized news here!
          </ThemedText>
        </View>
      )}
    </View>
  );

  // General news section
  const GeneralNewsSection = () => (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
        General Supplement News
      </ThemedText>
      {generalNews.length > 0 ? (
        <View>
          {generalNews.map((article, index) => (
            <View key={article.id || index}>
              {renderArticleItem({ item: article, isSupplementSpecific: false })}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.text }]}>
            Loading general news...
          </ThemedText>
        </View>
      )}
    </View>
  );

  if (generalNewsLoading || supplementNewsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
            {Config.APP_NAME}
          </ThemedText>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.text }]}>
            Loading latest research...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (generalNewsLoading || supplementNewsLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ThemedText style={styles.errorText}>Loading articles...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 60 + 32 }} // 60 for nav bar, 32 for extra spacing
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleManualRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
          {Config.APP_NAME}
        </ThemedText>
      </View>

      {/* News sections */}
      <SupplementNewsSection />
      <GeneralNewsSection />

      {/* Drug Interaction Checker Section */}
      <View style={styles.interactionSection}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text, fontSize: 18, marginBottom: 10 }]}>
          Drug Interaction Checker
        </ThemedText>
        <View style={styles.interactionInputs}>
          <View style={[styles.inputContainer, { zIndex: 2 }]}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
              placeholder="First supplement/drug"
              placeholderTextColor={colors.tabIconDefault}
              value={drug1}
              onChangeText={(text) => {
                setDrug1(text);
                fetchSuggestions(text, true);
              }}
            />
            {showSuggestions1 && suggestions1.length > 0 && (
              <ScrollView
                style={[styles.suggestionsBox, {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  zIndex: 2000,
                }]}
                keyboardShouldPersistTaps="handled"
              >
                {suggestions1.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionItem, {
                      borderBottomWidth: index < suggestions1.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }]}
                    onPress={() => {
                      setDrug1(suggestion);
                      setSuggestions1([]);
                      setShowSuggestions1(false);
                    }}
                  >
                    <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={[styles.inputContainer, { zIndex: 1 }]}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
              placeholder="Second supplement/drug"
              placeholderTextColor={colors.tabIconDefault}
              value={drug2}
              onChangeText={(text) => {
                setDrug2(text);
                fetchSuggestions(text, false);
              }}
            />
            {showSuggestions2 && suggestions2.length > 0 && (
              <ScrollView
                style={[styles.suggestionsBox, {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  zIndex: 1500,
                }]}
                keyboardShouldPersistTaps="handled"
              >
                {suggestions2.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionItem, {
                      borderBottomWidth: index < suggestions2.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }]}
                    onPress={() => {
                      setDrug2(suggestion);
                      setSuggestions2([]);
                      setShowSuggestions2(false);
                    }}
                  >
                    <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <TouchableOpacity
            style={[styles.checkButton, { backgroundColor: colors.primary }]}
            onPress={handleCheckInteractions}
          >
            <ThemedText style={[styles.checkButtonText, { color: 'white' }]}>Check Interactions</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Interaction result modal */}
        {showInteractionModal && interactionResult && (
          <DrugInteractionModal
            visible={showInteractionModal}
            onClose={handleCloseInteractionModal}
            result={interactionResult}
            drug1={drug1}
            drug2={drug2}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 150, // Add bottom padding to account for tab bar
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  aiContainer: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  aiText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  aiSubtext: {
    fontSize: 14,
    lineHeight: 20,
  },
  noNewsContainer: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 10,
  },
  noNewsText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  articleBubble: {
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    // Add subtle inner shadow effect with overlapping elements
    position: 'relative',
  },
  articleInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    // Add subtle inner shadow effect
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSource: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  articleDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  viewCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  interactionSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  interactionInputs: {
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
    zIndex: 1,
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  checkButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  checkButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionText: {
    color: 'black',
    fontSize: 14,
  },
});
