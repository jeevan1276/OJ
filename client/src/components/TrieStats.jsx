import React, { useState, useEffect } from 'react';
import trieManager from '../utils/TrieManager';
import './TrieStats.css';

const TrieStats = () => {
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [learnedWords, setLearnedWords] = useState({});

  useEffect(() => {
    if (showStats) {
      updateStats();
    }
  }, [showStats]);

  const updateStats = () => {
    const currentStats = trieManager.getStats();
    setStats(currentStats);

      
    const javaWords = trieManager.getAllWords('java', 50);
    const cppWords = trieManager.getAllWords('cpp', 50);
    const cWords = trieManager.getAllWords('c', 50);

    setLearnedWords({
      java: javaWords.filter(w => w.frequency > 5),
      cpp: cppWords.filter(w => w.frequency > 5),
      c: cWords.filter(w => w.frequency > 5)
    });
  };

  const clearLearnedWords = () => {
    if (window.confirm('Are you sure you want to clear all learned words? This cannot be undone.')) {
      trieManager.clearLearnedWords();
      updateStats();
    }
  };

  const exportData = () => {
    const data = trieManager.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trie-data-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          trieManager.importData(data);
          updateStats();
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  if (!showStats) {
    return (
      <button 
        className="trie-stats-toggle"
        onClick={() => setShowStats(true)}
        title="View Trie Statistics"
      >
        📊 Stats
      </button>
    );
  }

  return (
    <div className="trie-stats-overlay">
      <div className="trie-stats-modal">
        <div className="trie-stats-header">
          <h3>Autocomplete Statistics</h3>
          <button 
            className="close-button"
            onClick={() => setShowStats(false)}
          >
            ×
          </button>
        </div>

        <div className="trie-stats-content">
          {stats && (
            <div className="stats-section">
              <h4>General Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Words:</span>
                  <span className="stat-value">{stats.totalWords}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Languages:</span>
                  <span className="stat-value">{stats.languagesCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Learning Enabled:</span>
                  <span className="stat-value">{stats.learningEnabled ? 'Yes' : 'No'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Initialized:</span>
                  <span className="stat-value">{stats.isInitialized ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="learned-words-section">
            <h4>Learned Words (Top 10 per Language)</h4>
            
            {Object.entries(learnedWords).map(([lang, words]) => (
              <div key={lang} className="language-words">
                <h5>{lang.toUpperCase()}</h5>
                {words.length > 0 ? (
                  <div className="words-list">
                    {words.slice(0, 10).map((word, index) => (
                      <div key={index} className="word-item">
                        <span className="word-text">{word.word}</span>
                        <span className="word-frequency">
                          {word.frequency > 20 ? '🔥' : word.frequency > 10 ? '⭐' : '•'} {word.frequency}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-words">No learned words yet</p>
                )}
              </div>
            ))}
          </div>

          <div className="actions-section">
            <h4>Actions</h4>
            <div className="action-buttons">
              <button 
                className="action-button export"
                onClick={exportData}
              >
                📤 Export Data
              </button>
              
              <label className="action-button import">
                📥 Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  style={{ display: 'none' }}
                />
              </label>
              
              <button 
                className="action-button clear"
                onClick={clearLearnedWords}
              >
                🗑️ Clear Learned Words
              </button>
              
              <button 
                className="action-button refresh"
                onClick={updateStats}
              >
                🔄 Refresh Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrieStats; 