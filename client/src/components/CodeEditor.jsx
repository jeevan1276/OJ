import Editor from '@monaco-editor/react';
import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';
import trieManager from '../utils/TrieManager';

const CodeEditor = ({ language, code, onChange }) => {
  const monacoRef = useRef(null);

  useEffect(() => {
    if (code && code.length > 10) {
      trieManager.learnFromCode(code, language);
    }
  }, [code, language]);

  const handleEditorDidMount = (editor, monaco) => {
    monacoRef.current = monaco;

    if (monaco._trieProviderDisposable) {
      monaco._trieProviderDisposable.dispose();
    }

    monaco._trieProviderDisposable = monaco.languages.registerCompletionItemProvider(
      language === 'cpp' ? 'cpp' : language,
      {
        triggerCharacters: ['.', ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'],
        async provideCompletionItems(model, position) {
          let defaultSuggestions = [];
          if (monaco.languages.registerCompletionItemProvider._original) {
            defaultSuggestions = await monaco.languages.registerCompletionItemProvider._original(model, position);
          }

          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });
          const match = textUntilPosition.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
          const prefix = match ? match[0] : '';
          let trieSuggestions = [];
          if (prefix) {
            trieSuggestions = trieManager.getSuggestions(prefix, language, 20).map(s => ({
              label: s.word,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: s.word,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - prefix.length,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            }));
          }

          return {
            suggestions: [...(defaultSuggestions?.suggestions || []), ...trieSuggestions]
          };
        }
      }
    );
  };

  return (
    <div style={{ height: '600px' }}>
      <Editor
        height="100%"
        language={language === 'cpp' ? 'cpp' : language}
        value={code}
        onChange={value => onChange(value || '')}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden'
          },
          overviewRulerLanes: 0,
          wordWrap: 'on',
          fontSize: 16,
          padding: { top: 8, bottom: 40 }
        }}
      />
    </div>
  );
};

CodeEditor.propTypes = {
  language: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CodeEditor; 