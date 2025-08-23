import Trie from './Trie';
import { javaKeywords } from '../data/javaKeywords';
import { cppKeywords } from '../data/cppKeywords';
import { cKeywords } from '../data/cKeywords';

class TrieManager {
  constructor() {
    this.trie = new Trie();
    this.isInitialized = false;
    this.learningEnabled = true;
    this.maxSuggestions = 100;
    this.minPrefixLength = 1;
    
    // Language mappings
    this.languageMap = {
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c'
    };
  }

  // Initialize the trie with all language keywords
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load keywords for each language
      this.loadLanguageKeywords('java', javaKeywords);
      this.loadLanguageKeywords('cpp', cppKeywords);
      this.loadLanguageKeywords('c', cKeywords);

      // Load learned words from localStorage
      this.loadLearnedWords();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing TrieManager:', error);
    }
  }

  // Load keywords for a specific language
  loadLanguageKeywords(language, keywords) {
    if (!Array.isArray(keywords)) return;

    // Priority sets for each language
    const javaPriority = new Set([
      'ArrayList', 'LinkedList', 'Vector', 'Stack',
      'HashMap', 'LinkedHashMap', 'TreeMap', 'Hashtable', 'IdentityHashMap', 'WeakHashMap', 'ConcurrentHashMap', 'EnumMap',
      'Set', 'HashSet', 'LinkedHashSet', 'TreeSet', 'EnumSet', 'CopyOnWriteArraySet', 'ConcurrentSkipListSet',
      'Map', 'Queue', 'Deque', 'PriorityQueue', 'ArrayDeque', 'ArrayBlockingQueue', 'LinkedBlockingQueue', 'ConcurrentLinkedQueue', 'PriorityBlockingQueue', 'DelayQueue', 'SynchronousQueue', 'LinkedTransferQueue',
      'CopyOnWriteArrayList',
      'add', 'get', 'set', 'static', 'remove', 'size', 'contains', 'isEmpty', 'clear', 'put', 'poll', 'peek', 'push', 'pop', 'sort',
      'for', 'while', 'if', 'else', 'return',
      'Scanner', 'System', 'out', 'println', 'nextInt', 'nextLine',
      'sort', 'binarySearch', 'max', 'min', 'abs', 'pow',
      'n', 'm', 'k', 't', 'i', 'j', 'ans', 'sum', 'count', 'result'
    ]);
    const cppPriority = new Set([
      'vector', 'map', 'set', 'queue', 'stack', 'priority_queue', 'unordered_map', 'unordered_set',
      'push_back', 'pop_back', 'insert', 'erase', 'find', 'size', 'clear', 'begin', 'end', 'sort', 'lower_bound', 'upper_bound',
      'reverse', 'unique', 'accumulate', 'count', 'min', 'max', 'abs', 'pow',
      'cin', 'cout', 'endl', 'scanf', 'printf',
      'n', 'm', 'k', 't', 'i', 'j', 'ans', 'sum', 'count', 'result'
    ]);
    const cPriority = new Set([
      'printf', 'scanf', 'gets', 'puts',
      'strlen', 'strcpy', 'strcmp', 'strcat',
      'abs', 'pow', 'sqrt', 'max', 'min',
      'malloc', 'free',
      'n', 'm', 'k', 't', 'i', 'j', 'ans', 'sum', 'count', 'result',
      'for', 'while', 'if', 'else', 'return'
    ]);

    keywords.forEach(keyword => {
      if (keyword && typeof keyword === 'string') {
        let freq = 5;
        if (language === 'java' && javaPriority.has(keyword)) freq = 20;
        else if (language === 'cpp' && cppPriority.has(keyword)) freq = 20;
        else if (language === 'c' && cPriority.has(keyword)) freq = 20;
        // Optionally, add more logic for medium-priority (freq = 10) if needed
        this.trie.insert(keyword, language, freq);
      }
    });
  }

  // Get autocomplete suggestions
  getSuggestions(prefix, language, limit = null) {
    if (!this.isInitialized) {
      this.initialize();
      return [];
    }

    if (!prefix || prefix.length < this.minPrefixLength) {
      return [];
    }

    const lang = this.languageMap[language] || language;
    // If limit is null, return all possible matches (up to 1000 for safety)
    const maxResults = limit === null ? 1000 : limit;
    
    const suggestions = this.trie.search(prefix, lang, maxResults);
    
    // Sort by frequency and recency
    return suggestions.sort((a, b) => {
      // First by frequency
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency;
      }
      // Then by recency
      if (a.lastUsed && b.lastUsed) {
        return new Date(b.lastUsed) - new Date(a.lastUsed);
      }
      // Finally alphabetically
      return a.word.localeCompare(b.word);
    });
  }

  // Learn a new word from user input
  learnWord(word, language) {
    // Always learn new words if valid
    if (!word || !language) return false;

    const lang = this.languageMap[language] || language;
    const success = this.trie.learnWord(word, lang);
    
    if (success) {
      this.saveLearnedWords();
    }
    
    return success;
  }

  // Learn multiple words at once (useful for batch processing)
  learnWords(words, language) {
    if (!Array.isArray(words) || !language) return 0;

    let learnedCount = 0;
    words.forEach(word => {
      if (this.learnWord(word, language)) {
        learnedCount++;
      }
    });
    return learnedCount;
  }

  // Extract words from code and learn them
  learnFromCode(code, language) {
    if (!code || !language) return 0;

    // Extract identifiers (variable names, function names, etc.)
    const words = this.extractIdentifiers(code);
    return this.learnWords(words, language);
  }

  // Extract identifiers from code
  extractIdentifiers(code) {
    if (!code || typeof code !== 'string') return [];

    // Regex to match identifiers (variable names, function names, etc.)
    const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const matches = code.match(identifierRegex) || [];

    // Filter out common keywords and short identifiers
    const filtered = matches.filter(word => 
      word.length >= 2 && 
      !this.isCommonKeyword(word) &&
      !this.isBuiltInType(word)
    );

    // Remove duplicates
    return [...new Set(filtered)];
  }

  // Check if a word is a common keyword
  isCommonKeyword(word) {
    const commonKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'break', 'continue', 'return', 'class', 'struct', 'public', 'private',
      'protected', 'static', 'const', 'void', 'int', 'long', 'double', 'float',
      'char', 'bool', 'string', 'true', 'false', 'null', 'this', 'new', 'delete'
    ];
    return commonKeywords.includes(word.toLowerCase());
  }

  // Check if a word is a built-in type
  isBuiltInType(word) {
    const builtInTypes = [
      'int', 'long', 'double', 'float', 'char', 'bool', 'string', 'void',
      'short', 'unsigned', 'signed', 'auto', 'static', 'extern', 'const'
    ];
    return builtInTypes.includes(word.toLowerCase());
  }

  // Save learned words to localStorage
  saveLearnedWords() {
    try {
      const data = this.trie.exportData();
      localStorage.setItem('trieLearnedWords', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving learned words:', error);
    }
  }

  // Load learned words from localStorage
  loadLearnedWords() {
    try {
      const saved = localStorage.getItem('trieLearnedWords');
      if (saved) {
        const data = JSON.parse(saved);
        this.trie.importData(data);
      }
    } catch (error) {
      console.error('Error loading learned words:', error);
    }
  }

  // Clear all learned words
  clearLearnedWords() {
    try {
      localStorage.removeItem('trieLearnedWords');
      // Reinitialize to get only built-in keywords
      this.trie = new Trie();
      this.isInitialized = false;
      this.initialize();
    } catch (error) {
      console.error('Error clearing learned words:', error);
    }
  }

  // Get statistics about the trie
  getStats() {
    const stats = this.trie.getStats();
    const learnedWords = this.trie.getAllWords('java').length + 
                        this.trie.getAllWords('cpp').length + 
                        this.trie.getAllWords('c').length;
    
    return {
      ...stats,
      learnedWords,
      isInitialized: this.isInitialized,
      learningEnabled: this.learningEnabled
    };
  }

  // Enable/disable learning
  setLearningEnabled(enabled) {
    this.learningEnabled = enabled;
  }

  // Set maximum number of suggestions
  setMaxSuggestions(max) {
    this.maxSuggestions = Math.max(1, Math.min(50, max));
  }

  // Set minimum prefix length for suggestions
  setMinPrefixLength(length) {
    this.minPrefixLength = Math.max(1, Math.min(10, length));
  }

  // Get all words for a specific language
  getAllWords(language, limit = 1000) {
    const lang = this.languageMap[language] || language;
    return this.trie.getAllWords(lang, limit);
  }

  // Check if a word exists in the trie
  containsWord(word, language = null) {
    if (language) {
      const lang = this.languageMap[language] || language;
      const words = this.trie.getAllWords(lang);
      return words.some(w => w.word === word);
    }
    return this.trie.contains(word);
  }

  // Remove a specific word
  removeWord(word) {
    return this.trie.remove(word);
  }

  // Export trie data for backup
  exportData() {
    return this.trie.exportData();
  }

  // Import trie data from backup
  importData(data) {
    return this.trie.importData(data);
  }
}

// Create a singleton instance
const trieManager = new TrieManager();
trieManager.clearLearnedWords();

export default trieManager; 