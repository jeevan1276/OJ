class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
    this.lastUsed = null;
    this.language = null;
    this.originalWord = null;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.totalWords = 0;
    this.languages = new Set();
  }

  insert(word, language = 'general', frequency = 1) {
    if (!word || typeof word !== 'string') return false;
    
    const originalWord = word;
    word = word.toLowerCase().trim();
    if (word.length === 0) return false;

    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }
    
    current.isEndOfWord = true;
    current.frequency += frequency;
    current.lastUsed = new Date();
    current.language = language;
    if (!current.originalWord) {
      current.originalWord = originalWord;
    }

    if (!this.languages.has(language)) {
      this.languages.add(language);
    }
    
    this.totalWords++;
    return true;
  }

  search(prefix, language = null, limit = 20) {
    if (!prefix || typeof prefix !== 'string') return [];
    
    prefix = prefix.toLowerCase().trim();
    if (prefix.length === 0) return [];

    let current = this.root;
    
    // Navigate to the node representing the prefix
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char);
    }
    
    // Collect all words with this prefix
    const results = [];
    this._collectWords(current, prefix, results, language, limit);
    
    // Sort by frequency (highest first) and then alphabetically
    return results.sort((a, b) => {
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency;
      }
      return a.word.localeCompare(b.word);
    }).slice(0, limit);
  }

  // Helper method to collect words from a node
  _collectWords(node, currentWord, results, language, limit) {
    if (results.length >= limit) return;
    
    if (node.isEndOfWord) {
      // Only add if language matches or no language filter
      if (!language || node.language === language) {
        results.push({
          word: node.originalWord || currentWord,
          frequency: node.frequency,
          lastUsed: node.lastUsed,
          language: node.language
        });
      }
    }
    
    // Recursively search children
    for (const [char, childNode] of node.children) {
      this._collectWords(childNode, currentWord + char, results, language, limit);
    }
  }

  // Check if a word exists in the trie
  contains(word) {
    if (!word || typeof word !== 'string') return false;
    
    word = word.toLowerCase().trim();
    if (word.length === 0) return false;

    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }
    
    return current.isEndOfWord;
  }

  // Update frequency of a word (for learning)
  updateFrequency(word, language = 'general') {
    if (!word || typeof word !== 'string') return false;
    
    word = word.toLowerCase().trim();
    if (word.length === 0) return false;

    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }
    
    if (current.isEndOfWord) {
      current.frequency++;
      current.lastUsed = new Date();
      return true;
    }
    
    return false;
  }

  // Learn a new word (insert if not exists, update frequency if exists)
  learnWord(word, language = 'general') {
    if (!word || typeof word !== 'string') return false;
    const originalWord = word;
    word = word.toLowerCase().trim();
    if (word.length === 0) return false;

    // Check if word already exists
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        // Insert with original casing if not exists
        return this.insert(originalWord, language, 1);
      }
      current = current.children.get(char);
    }
    if (current.isEndOfWord) {
      current.frequency++;
      current.lastUsed = new Date();
      // Update originalWord if the new word matches the casing in code
      if (originalWord !== current.originalWord && originalWord.toLowerCase() === word) {
        current.originalWord = originalWord;
      }
      return true;
    } else {
      // Insert with original casing
      return this.insert(originalWord, language, 1);
    }
  }

  // Get all words for a specific language
  getAllWords(language, limit = 1000) {
    const results = [];
    this._collectWords(this.root, '', results, language, limit);
    return results.sort((a, b) => b.frequency - a.frequency);
  }

  // Get statistics about the trie
  getStats() {
    return {
      totalWords: this.totalWords,
      languages: Array.from(this.languages),
      languagesCount: this.languages.size
    };
  }

  // Clear all words for a specific language
  clearLanguage(language) {
    if (!language) return false;
    
    const wordsToRemove = this.getAllWords(language);
    let removedCount = 0;
    
    for (const { word } of wordsToRemove) {
      if (this.remove(word)) {
        removedCount++;
      }
    }
    
    return removedCount;
  }

  // Remove a word from the trie
  remove(word) {
    if (!word || typeof word !== 'string') return false;
    
    word = word.toLowerCase().trim();
    if (word.length === 0) return false;

    return this._removeHelper(this.root, word, 0);
  }

  // Helper method for removing words
  _removeHelper(node, word, index) {
    if (index === word.length) {
      if (!node.isEndOfWord) {
        return false;
      }
      node.isEndOfWord = false;
      node.frequency = 0;
      node.lastUsed = null;
      this.totalWords--;
      return node.children.size === 0;
    }

    const char = word[index];
    const childNode = node.children.get(char);
    
    if (!childNode) {
      return false;
    }

    const shouldDeleteChild = this._removeHelper(childNode, word, index + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }

  // Export trie data for persistence
  exportData() {
    const data = {
      totalWords: this.totalWords,
      languages: Array.from(this.languages),
      words: []
    };

    const collectAllWords = (node, currentWord) => {
      if (node.isEndOfWord) {
        data.words.push({
          word: currentWord,
          frequency: node.frequency,
          lastUsed: node.lastUsed,
          language: node.language
        });
      }
      
      for (const [char, childNode] of node.children) {
        collectAllWords(childNode, currentWord + char);
      }
    };

    collectAllWords(this.root, '');
    return data;
  }

  // Import trie data from persistence
  importData(data) {
    if (!data || !Array.isArray(data.words)) return false;
    
    // Clear existing data
    this.root = new TrieNode();
    this.totalWords = 0;
    this.languages.clear();
    
    // Import words
    for (const wordData of data.words) {
      this.insert(
        wordData.word, 
        wordData.language || 'general', 
        wordData.frequency || 1
      );
    }
    
    return true;
  }
}

export default Trie; 