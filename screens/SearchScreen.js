// screens/Search.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../Constants/Colors';
import { auth, db } from './firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const Search = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadRecentItems();
  }, []);

  const loadRecentItems = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get recent notes
      const notesRef = collection(db, 'users', user.uid, 'notes');
      const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));
      const notesSnapshot = await getDocs(notesQuery);
      
      const notesData = [];
      notesSnapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({
          id: doc.id,
          ...data,
          type: 'note',
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Get recent todo lists
      const listsRef = collection(db, 'users', user.uid, 'lists');
      const listsQuery = query(listsRef, orderBy('createdAt', 'desc'));
      const listsSnapshot = await getDocs(listsQuery);
      
      const listsData = [];
      listsSnapshot.forEach((doc) => {
        const data = doc.data();
        listsData.push({
          id: doc.id,
          ...data,
          type: 'todo',
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Get recent reminders
      const remindersRef = collection(db, 'users', user.uid, 'reminders');
      const remindersQuery = query(remindersRef, orderBy('createdAt', 'desc'));
      const remindersSnapshot = await getDocs(remindersQuery);
      
      const remindersData = [];
      remindersSnapshot.forEach((doc) => {
        const data = doc.data();
        remindersData.push({
          id: doc.id,
          ...data,
          type: 'reminder',
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Combine and sort by date
      const allItems = [...notesData, ...listsData, ...remindersData]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5); // Get only 5 most recent items

      setRecentItems(allItems);
    } catch (error) {
      console.log('Error loading recent items:', error);
    }
  };

  const performSearch = async (searchText = searchQuery) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setIsSearching(true);

    try {
      const results = [];

      // Search in notes (title and content)
      const notesRef = collection(db, 'users', user.uid, 'notes');
      
      // Search by title
      const notesTitleQuery = query(
        notesRef,
        where('title', '>=', searchText.toLowerCase()),
        where('title', '<=', searchText.toLowerCase() + '\uf8ff')
      );
      
      const notesTitleSnapshot = await getDocs(notesTitleQuery);
      notesTitleSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!results.find(item => item.id === doc.id)) {
          results.push({
            id: doc.id,
            ...data,
            type: 'note',
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      // Search by content if it's a note search
      const notesContentQuery = query(
        notesRef,
        where('content', '>=', searchText.toLowerCase()),
        where('content', '<=', searchText.toLowerCase() + '\uf8ff')
      );
      
      const notesContentSnapshot = await getDocs(notesContentQuery);
      notesContentSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!results.find(item => item.id === doc.id)) {
          results.push({
            id: doc.id,
            ...data,
            type: 'note',
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      // Search in todo lists (title only)
      const listsRef = collection(db, 'users', user.uid, 'lists');
      const listsQuery = query(
        listsRef,
        where('title', '>=', searchText.toLowerCase()),
        where('title', '<=', searchText.toLowerCase() + '\uf8ff')
      );
      
      const listsSnapshot = await getDocs(listsQuery);
      listsSnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data,
          type: 'todo',
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Search in reminders (title and description)
      const remindersRef = collection(db, 'users', user.uid, 'reminders');
      
      // Search by title
      const remindersTitleQuery = query(
        remindersRef,
        where('title', '>=', searchText.toLowerCase()),
        where('title', '<=', searchText.toLowerCase() + '\uf8ff')
      );
      
      const remindersTitleSnapshot = await getDocs(remindersTitleQuery);
      remindersTitleSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!results.find(item => item.id === doc.id)) {
          results.push({
            id: doc.id,
            ...data,
            type: 'reminder',
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      // Search by description
      const remindersDescQuery = query(
        remindersRef,
        where('description', '>=', searchText.toLowerCase()),
        where('description', '<=', searchText.toLowerCase() + '\uf8ff')
      );
      
      const remindersDescSnapshot = await getDocs(remindersDescQuery);
      remindersDescSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!results.find(item => item.id === doc.id)) {
          results.push({
            id: doc.id,
            ...data,
            type: 'reminder',
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      // Remove duplicates and sort by relevance/date
      const uniqueResults = results.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id && t.type === item.type)
      ).sort((a, b) => b.createdAt - a.createdAt);

      setSearchResults(uniqueResults);

      // Add to search history
      if (searchText.trim() !== '' && !searchHistory.includes(searchText.trim())) {
        const newHistory = [searchText.trim(), ...searchHistory.slice(0, 4)];
        setSearchHistory(newHistory);
      }

    } catch (error) {
      console.log('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    performSearch();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const navigateToItem = (item) => {
    switch (item.type) {
      case 'note':
        navigation.navigate('NotesScreen', {
          title: item.title,
          noteId: item.id,
        });
        break;
      case 'todo':
        navigation.navigate('TodoList', {
          title: item.title,
          color: item.color || Colors.blue,
          listid: item.id,
        });
        break;
      case 'reminder':
        navigation.navigate('Calendar');
        break;
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'note': return 'document-text';
      case 'todo': return 'list';
      case 'reminder': return 'notifications';
      default: return 'document-text';
    }
  };

  const getItemTypeText = (type) => {
    switch (type) {
      case 'note': return 'Note';
      case 'todo': return 'Todo List';
      case 'reminder': return 'Reminder';
      default: return 'Item';
    }
  };

  const getItemColor = (item) => {
    if (item.color) return item.color;
    switch (item.type) {
      case 'note': return Colors.blue;
      case 'todo': return Colors.green;
      case 'reminder': return Colors.orange;
      default: return Colors.blue;
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: getItemColor(item) }]}
      onPress={() => navigateToItem(item)}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Ionicons 
            name={getItemIcon(item.type)} 
            size={20} 
            color="white" 
            style={styles.resultIcon}
          />
          <Text style={styles.resultTitle}>{item.title}</Text>
        </View>
        
        {item.content && item.type === 'note' && (
          <Text style={styles.resultPreview} numberOfLines={2}>
            {item.content}
          </Text>
        )}
        
        {item.description && item.type === 'reminder' && (
          <Text style={styles.resultPreview} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.resultFooter}>
          <Text style={styles.resultType}>
            {getItemTypeText(item.type)}
          </Text>
          <Text style={styles.resultDate}>
            {item.createdAt.toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
    </TouchableOpacity>
  );

  const renderSearchHistory = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setSearchQuery(item);
        performSearch(item);
      }}
    >
      <Ionicons name="time-outline" size={20} color={Colors.lightGray} />
      <Text style={styles.historyText}>{item}</Text>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          const newHistory = searchHistory.filter(h => h !== item);
          setSearchHistory(newHistory);
        }}
      >
        <Ionicons name="close" size={16} color={Colors.lightGray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.recentItem, { backgroundColor: getItemColor(item) }]}
      onPress={() => navigateToItem(item)}
    >
      <Ionicons 
        name={getItemIcon(item.type)} 
        size={20} 
        color="white" 
        style={styles.recentIcon}
      />
      <View style={styles.recentContent}>
        <Text style={styles.recentTitle}>{item.title}</Text>
        <Text style={styles.recentType}>
          {getItemTypeText(item.type)} • {item.createdAt.toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.lightGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, todos, and reminders..."
            placeholderTextColor={Colors.lightGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={Colors.lightGray} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Button */}
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchSubmit}
          disabled={isSearching}
        >
          <Ionicons 
            name="search" 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {searchQuery === '' ? (
        <View style={styles.emptySearchContainer}>
          {/* Search History */}
          {searchHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <FlatList
                data={searchHistory}
                renderItem={renderSearchHistory}
                keyExtractor={(item, index) => `history-${index}`}
                style={styles.historyList}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Recent Items */}
          {recentItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Items</Text>
              <FlatList
                data={recentItems}
                renderItem={renderRecentItem}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                style={styles.recentList}
                scrollEnabled={false}
              />
            </View>
          )}

          {searchHistory.length === 0 && recentItems.length === 0 && (
            <View style={styles.noContentContainer}>
              <Ionicons name="search-outline" size={64} color={Colors.lightGray} />
              <Text style={styles.noContentText}>Start searching</Text>
              <Text style={styles.noContentSubtext}>
                Search through your notes, todo lists, and reminders
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="search" size={32} color={Colors.blue} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsTitle}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>
              
              {searchResults.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="document-outline" size={64} color={Colors.lightGray} />
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try a different search term
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => `${item.type}-${item.id}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.resultsList}
                />
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: Colors.black,
  },
  searchButton: {
    backgroundColor: Colors.blue,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptySearchContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 15,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 8,
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginLeft: 10,
  },
  recentList: {
    maxHeight: 300,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentIcon: {
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  recentType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noContentText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    marginTop: 20,
    marginBottom: 10,
  },
  noContentSubtext: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.blue,
    fontWeight: '600',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 15,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultIcon: {
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  resultPreview: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    lineHeight: 18,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    marginTop: 20,
    marginBottom: 10,
  },
  noResultsSubtext: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
  },
});

export default Search;