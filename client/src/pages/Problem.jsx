import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaPlay, 
  FaCode, 
  FaEye, 
  FaEyeSlash, 
  FaCopy, 
  FaCheck,
  FaTimes,
  FaClock,
  FaMemory,
  FaTrophy,
  FaUser,
  FaCalendar,
  FaTag,
  FaLightbulb,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaUndo,
  FaPlus
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getProblem, submitSolution, runCode, runCustomTest } from '../services/api';
import { saveCode, loadCode, clearCode, hasSavedCode } from '../utils/codePersistence';
import './Problem.css';
import CodeEditor from '../components/CodeEditor';
import RecentSubmissions from '../components/RecentSubmissions';
import axios from 'axios';
import HintModal from '../components/HintModal';
import '../components/HintModal.css';

let userId = 'guest';
try {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const userObj = JSON.parse(userStr);
    if (userObj && userObj._id) userId = userObj._id;
  }
} catch (e) {}

const Problem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [showTestCases, setShowTestCases] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [runningCode, setRunningCode] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [refreshSubmissions, setRefreshSubmissions] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState(null);
  const [hints, setHints] = useState([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(2);
  const [customInput, setCustomInput] = useState('');
  const [customTestResult, setCustomTestResult] = useState(null);
  const [runningCustomTest, setRunningCustomTest] = useState(false);

  const languages = [
    { value: 'java', label: 'Java', extension: '.java' },
    { value: 'cpp', label: 'C++', extension: '.cpp' },
    { value: 'c', label: 'C', extension: '.c' }
  ];

  const defaultCode = {
    java: `public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[0];
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

vector<int> solution(vector<int>& nums, int target) {
    // Your solution here
    return {};
}`,
    c: `#include <stdio.h>
#include <stdlib.h>

int* solution(int* nums, int numsSize, int target, int* returnSize) {
    // Your solution here
    *returnSize = 0;
    return NULL;
}`
  };

  useEffect(() => {
    fetchProblem();
  }, [id]);

  useEffect(() => {
    if (problem && problem.customTestCaseInputTemplate && !customInput) {
      setCustomInput(problem.customTestCaseInputTemplate);
    }
  }, [problem]);

  const getTemplateCode = useCallback(() => {
    if (problem && problem.starterCode && problem.starterCode[language]) {
      return problem.starterCode[language];
    }
    return defaultCode[language];
  }, [language, problem]);

  const handleResetCode = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Are you sure you want to reset your code? This will discard all your changes.');
      if (!confirmed) return;
    }
    
    const templateCode = getTemplateCode();
    setCode(templateCode);
    clearCode(userId, id, language);
    setHasUnsavedChanges(false);
    toast.success('Code reset to template!');
  }, [userId, id, language, getTemplateCode, hasUnsavedChanges]);

  useEffect(() => {
    if (!id || !language) return;
    
    const savedCode = loadCode(userId, id, language);
    if (savedCode) {
      setCode(savedCode);
      setHasUnsavedChanges(false);
    } else {
      const templateCode = getTemplateCode();
      setCode(templateCode);
      setHasUnsavedChanges(false);
    }
  }, [language, problem, id, getTemplateCode, userId]);

  useEffect(() => {
    if (!id || !language || !code) return;
    
    const templateCode = getTemplateCode();
    const isTemplate = code.trim() === templateCode.trim();
    
    if (isTemplate) {
      clearCode(userId, id, language);
      setHasUnsavedChanges(false);
    } else {
      saveCode(userId, id, language, code);
      setHasUnsavedChanges(true);
    }
  }, [code, language, id, getTemplateCode, userId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + R to reset code
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleResetCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetCode]);

  useEffect(() => {
    const fetchHintCount = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/ai/hint-count/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHintsRemaining(res.data.data.hintsRemaining);
      } catch (err) {
        setHintsRemaining(2); // fallback
      }
    };
    if (id) fetchHintCount();
  }, [id]);

  useEffect(() => {
    const fetchHints = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/ai/hints/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHints(res.data.data.hints || []);
      } catch (err) {
        setHints([]);
      }
    };
    if (id) fetchHints();
  }, [id]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProblem(id);
      setProblem(response.data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before running');
      return;
    }

    try {
      setRunningCode(true);
      setRunResult(null);
      const response = await runCode(id, code, language);
      setRunResult(response.data);
      setActiveTab('run_result'); // Switch to the result tab
      toast.success('Code executed successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRunningCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionResult(null);
      
      const response = await submitSolution(id, code, language);
      setSubmissionResult(response.data);
      
      if (response.data.status === 'accepted') {
        toast.success('Congratulations! Your solution is correct!');
      } else {
        toast.error(`Submission failed: ${response.data.status ? response.data.status.replace('_', ' ') : (response.data.message || 'Wrong Answer')}`);
      }
      setActiveTab('submission_result');
      setRefreshSubmissions(v => v + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };
//for http copy paste
  const handleCopyCode = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true);
          toast.success('Code copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopyTextToClipboard(code));
    } else {
      fallbackCopyTextToClipboard(code);
    }
  }; 
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = 0;
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      const successful = document.execCommand('copy');
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  
    document.body.removeChild(textArea);
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };
// console.log("current status",submissionResult.status);
  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <FaCheckCircle className="status-icon accepted" />;
      case 'wrong_answer':
        return <FaTimes className="status-icon wrong" />;
      case 'time_limit_exceeded':
        return <FaClock className="status-icon tle" />;
      case 'memory_limit_exceeded':
        return <FaMemory className="status-icon mle" />;
      case 'runtime_error':
        return <FaExclamationTriangle className="status-icon error" />;
      default:
        return <FaExclamationTriangle className="status-icon error" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#10b981';
      case 'wrong_answer': return '#ef4444';
      case 'time_limit_exceeded': return '#f59e0b';
      case 'memory_limit_exceeded': return '#8b5cf6';
      case 'runtime_error': return '#f97316';
      default: return '#6b7280';
    }
  };

  const handleGetHint = async () => {
    if (!problem) return;
    if (hints.length >= 2) {
      toast.info('You have already received the maximum number of hints for this problem.');
      return;
    }
    setHintLoading(true);
    setHintError(null);
    try {
      const API_BASE =  import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/ai/hint`, {
        problemId: id,
        userCode: code,
        hintNumber: hints.length + 1,
        problemTitle: problem.title,
        problemDescription: problem.description,
        constraints: problem.constraints,
        examples: problem.examples
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.data.success) {
        setHints(prev => [...prev, res.data.data.hint]);
        setHintsRemaining(res.data.data.hintsRemaining);
        setShowHintModal(true);
      } else {
        setHintError(res.data.message || 'Failed to get hint.');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error('Please log in to get hints!');
      } else {
        setHintError(err.response?.data?.message || 'Failed to get hint.');
      }
    } finally {
      setHintLoading(false);
    }
  };

  const handleViewHints = async () => {
    if (hints.length === 0) {
      try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/ai/hints/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHints(res.data.data.hints || []);
      } catch (err) {
        setHints([]);
      }
    }
    setShowHintModal(true);
  };

  const handleRunCustomTest = async () => {
    if (!customInput.trim()) {
      toast.error('Please enter test input');
      return;
    }

    try {
      setRunningCustomTest(true);
      setCustomTestResult(null);
      const response = await runCustomTest(id, code, language, customInput);
      setCustomTestResult(response.data);
      toast.success('Custom test executed successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRunningCustomTest(false);
    }
  };

  if (loading) {
    return (
      <div className="problem-loading">
        <div className="loading-spinner"></div>
        <p>Loading problem...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="problem-error">
        <p>Error: {error}</p>
        <button onClick={fetchProblem} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="problem-not-found">
        <p>Problem not found</p>
        <Link to="/" className="back-button">Back to Problems</Link>
      </div>
    );
  }

  return (
    <div className="problem-container">
      {/* Header */}
      <header className="problem-header">
        <div className="header-content">
          <Link to="/" className="back-button">
            <FaArrowLeft />
            Back to Problems
          </Link>
          <div className="problem-title-section">
            <h1>{problem.title}</h1>
            <div className="problem-meta">
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
              >
                {problem.difficulty}
              </span>
              {problem.rating > 0 && (
                <span className="rating-badge">
                  Rating: {problem.rating}
                </span>
              )}
              <span className="acceptance-rate">
                Acceptance: {problem.totalSubmissions > 0 
                  ? `${Math.round((problem.successfulSubmissions / problem.totalSubmissions) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="problem-main">
        {/* Loading Overlay */}
        {runningCode && (
          <div className="loading-overlay">
            <div className="loading-content">
              <FaSpinner className="loading-spinner-large" />
              <h3>Running Your Code...</h3>
              <p>Please wait while we execute your solution against the test cases.</p>
            </div>
          </div>
        )}
        
        {/* Left Panel - Problem Description */}
        <div className="problem-left-panel">
          <div className="problem-tabs">
            <button 
              className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              <FaCode />
              Description
            </button>
            <button 
              className={`tab-button ${activeTab === 'testcases' ? 'active' : ''}`}
              onClick={() => setActiveTab('testcases')}
            >
              <FaEye />
              Test Cases
            </button>
            <button 
              className={`tab-button ${activeTab === 'run_result' ? 'active' : ''}`}
              onClick={() => setActiveTab('run_result')}
              disabled={!runResult}
            >
              <FaPlay />
              Run Result
            </button>
            <button 
              className={`tab-button ${activeTab === 'submission_result' ? 'active' : ''}`}
              onClick={() => setActiveTab('submission_result')}
              disabled={!submissionResult}
            >
              <FaTrophy />
              Submission
            </button>

          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-content">
                <div className="problem-description">
                  <h3>Problem Statement</h3>
                  <p>{problem.description}</p>
                </div>

                <div className="problem-constraints">
                  <h3>Constraints</h3>
                  <ul className="constraints-list">
                    {problem.constraints && problem.constraints.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="problem-categories">
                  <h3>Categories</h3>
                  <div className="categories-list">
                    {problem.categories.map((category, index) => (
                      <span key={index} className="category-tag">
                        <FaTag />
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="problem-author">
                  <h3>Author</h3>
                  <div className="author-info">
                    <div className="info-item">
                      <FaUser />
                      <span>{problem.author?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="info-item">
                      <FaCalendar />
                      <span>Published: {new Date(problem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'testcases' && (
              <div className="testcases-content">
                <div className="testcases-header">
                  <h3>Test Cases</h3>
                  <button 
                    className="toggle-testcases"
                    onClick={() => setShowTestCases(!showTestCases)}
                  >
                    {showTestCases ? <FaEyeSlash /> : <FaEye />}
                    {showTestCases ? 'Hide' : 'Show'} Test Cases
                  </button>
                </div>

                {/* Custom Test Section */}
                <div className="custom-test-section">
                  <div className="custom-test-header">
                    <h4>Custom Test Case</h4>
                    <p>Test your code with custom input</p>
                  </div>
                  
                  <div className="custom-test-form">
                    <div className="input-group">
                      <label>Input:</label>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder={problem && problem.customTestCaseInputTemplate ? problem.customTestCaseInputTemplate : 'Enter your test input'}
                        rows={3}
                      />
                    </div>
                    
                    <button 
                      className="run-custom-test-btn"
                      onClick={() => {
                        handleRunCustomTest();
                      }}
                      disabled={!customInput.trim() || runningCustomTest}
                    >
                      {runningCustomTest ? (
                        <>
                          <FaSpinner className="spinner" />
                          Running...
                        </>
                      ) : (
                        <>
                          <FaPlay />
                          Run Custom Test
                        </>
                      )}
                    </button>
                  </div>
                  
                  {customTestResult && (
                    <div className="custom-test-result">
                      <h5>Custom Test Result:</h5>
                      <div className="result-detail">
                        <span className="detail-label">Input:</span>
                        <pre className="detail-value">{customInput}</pre>
                      </div>
                      <div className="result-detail">
                        <span className="detail-label">Output:</span>
                        <pre className="detail-value output">{customTestResult.output}</pre>
                      </div>
                      {customTestResult.stderr && (
                        <div className="result-detail">
                          <span className="detail-label">Error:</span>
                          <pre className="detail-value error">{customTestResult.stderr}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Public Test Cases Section */}
                {showTestCases && (
                  <div className="public-testcases-section">
                    <h4>Public Test Cases</h4>
                    <div className="testcases-list">
                      {problem.publicTestCases.map((testCase, index) => (
                        <div key={index} className="testcase-item">
                          <div className="testcase-header">
                            <h5>Test Case {index + 1}</h5>
                          </div>
                          <div className="testcase-content">
                            <div className="testcase-input">
                              <h6>Input:</h6>
                              <pre>{testCase.input}</pre>
                            </div>
                            <div className="testcase-output">
                              <h6>Expected Output:</h6>
                              <pre>{testCase.output}</pre>
                            </div>
                            {testCase.explanation && (
                              <div className="testcase-explanation">
                                <h6>Explanation:</h6>
                                <p>{testCase.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'run_result' && runResult && (
              <div className="run-results-container">
                <h3>Run Results</h3>
                <div className="run-results-tabs">
                  {runResult.map((result, index) => (
                    <button
                      key={index}
                      className={`result-tab-button ${activeResultTab === index ? 'active' : ''} ${result.status}`}
                      onClick={() => setActiveResultTab(index)}
                    >
                      Case {index + 1}
                    </button>
                  ))}
                </div>
                <div className="run-result-content">
                  <div className="result-detail">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status ${runResult[activeResultTab].status}`}>
                      {runResult[activeResultTab].status}
                    </span>
                  </div>
                  <div className="result-detail">
                    <span className="detail-label">Input:</span>
                    <pre className="detail-value">{runResult[activeResultTab].input}</pre>
                  </div>
                  <div className="result-detail">
                    <span className="detail-label">Your Output:</span>
                    <pre className="detail-value output">{runResult[activeResultTab].output}</pre>
                  </div>
                  <div className="result-detail">
                    <span className="detail-label">Expected Output:</span>
                    <pre className="detail-value expected">{runResult[activeResultTab].expected}</pre>
                  </div>
                  {(runResult[activeResultTab].stderr && runResult[activeResultTab].stderr.trim() !== "") && (
                    <div className="result-detail">
                      <span className="detail-label" style={{ color: '#ef4444' }}>Compiler/Error:</span>
                      <pre className="detail-value error" style={{ color: '#ef4444', background: '#1a1a1a', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {runResult[activeResultTab].stderr}
                      </pre>
                    </div>
                  )}
                  {(runResult[activeResultTab].error && runResult[activeResultTab].error.trim() !== "") && (
                    <div className="result-detail">
                      <span className="detail-label" style={{ color: '#ef4444' }}>Error:</span>
                      <pre className="detail-value error" style={{ color: '#ef4444', background: '#1a1a1a', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {runResult[activeResultTab].error}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'submission_result' && submissionResult && (() => {
              const status = submissionResult?.status || submissionResult?.data?.status;
              const failedCase = submissionResult?.failedCase || submissionResult?.data?.failedCase;
              return (
                <div className="submission-result-container">
                  <div className="result-header">
                    <h3>Submission Result</h3>
                  </div>
                  <div className="result-content">
                    <div className="result-status">
                      {getStatusIcon(status)}
                      <span 
                        className="status-text"
                        style={{ color: getStatusColor(status) }}
                      >
                        {status === 'wrong_answer'
                          ? 'WRONG ANSWER'
                          : (status
                              ? status.replace('_', ' ').toUpperCase()
                              : (submissionResult.message || 'UNKNOWN ERROR'))}
                      </span>
                    </div>
                    
                    <div className="result-metrics">
                      <div className="metric-item">
                        <FaClock />
                        <span>Time: {submissionResult.executionTime}ms</span>
                      </div>
                      <div className="metric-item">
                        <FaMemory />
                        <span>Memory: {submissionResult.memoryUsed}MB</span>
                      </div>
                      <div className="metric-item">
                        <FaTrophy />
                        <span>Test Cases: {submissionResult.testCasesPassed}/{submissionResult.totalTestCases}</span>
                      </div>
                    </div>

                    {status === 'accepted' && (
                      <div className="success-message">
                        <FaLightbulb />
                        <span>Great job! Your solution passed all test cases!</span>
                      </div>
                    )}

                    {status === 'wrong_answer' && failedCase && (
                      <div className="failed-case-feedback">
                        <h4 style={{ color: '#ef4444' }}>Failed on Test Case #{failedCase.index}</h4>
                        <div><b>Input:</b> <pre>{failedCase.input}</pre></div>
                        <div><b>Your Output:</b> <pre>{failedCase.output}</pre></div>
                        <div><b>Expected Output:</b> <pre>{failedCase.expected}</pre></div>
                      </div>
                    )}

                    {submissionResult.errorMessage && (
                      <div className="error-message">
                        <FaExclamationTriangle />
                        <div className="error-content">
                          <span className="error-title">Error Details:</span>
                          <pre className="error-text">{submissionResult.errorMessage}</pre>
                        </div>
                      </div>
                    )}

                    {/* Keep the generic failed case for other statuses */}
                    {status !== 'wrong_answer' && failedCase && (
                      <div className="failed-case-feedback">
                        <h4>Failed on Test Case #{failedCase.index}</h4>
                        <div><b>Input:</b> <pre>{failedCase.input}</pre></div>
                        <div><b>Your Output:</b> <pre>{failedCase.output}</pre></div>
                        <div><b>Expected Output:</b> <pre>{failedCase.expected}</pre></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}


          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="problem-right-panel">
          <div className="editor-header">
            <div className="language-selector">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="editor-actions">
              {hasUnsavedChanges && (
                <span className="unsaved-indicator" title="Saved!">
                  •
                </span>
              )}
              <button 
                className="reset-button"
                onClick={handleResetCode}
                title="Reset to template (Ctrl+R)"
              >
                <FaUndo />
              </button>
              <button 
                className="copy-button"
                onClick={handleCopyCode}
                title="Copy code"
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
            </div>
          </div>

          <div className="code-editor">
          <CodeEditor
  code={code}
  onChange={setCode}
  language={language}
  problemId={id}
  hasUnsavedChanges={hasUnsavedChanges}
/>
          </div>

          <div className="editor-footer">
            <button 
              className="run-button"
              onClick={() => {
                handleRunCode();
              }}
              disabled={runningCode || submitting}
            >
              {runningCode ? (
                <>
                  <FaSpinner className="spinner" />
                  Running...
                </>
              ) : (
                <>
                  <FaPlay />
                  Run Code
                </>
              )}
            </button>
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={submitting || runningCode}
            >
              {submitting ? (
                <>
                  <FaSpinner className="spinner" />
                  Submitting...
                </>
              ) : (
                <>
                  <FaTrophy />
                  Submit Solution
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hint Controls - centered below editor */}
      <div className="hint-controls-below">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          {hintsRemaining >=0 && hintsRemaining <= 2 && (
            <span className="hint-count-label" style={{ marginBottom: '2px', fontWeight: 600, color: '#f7b42c' }}>{hintsRemaining} left</span>
          )}
          <button
            className="hint-btn"
            onClick={handleGetHint}
            disabled={hintLoading || hints.length >= 2 || hintsRemaining <= 0}
            title={hintsRemaining >0 ? `Get a hint (${hintsRemaining} left)` : 'No hints remaining'}
          >
            <FaLightbulb style={{ marginRight: 6 }} />
            {hintLoading ? 'Getting Hint...' : 'Get Hint'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            className="view-hints-btn"
            onClick={handleViewHints}
            disabled={hints.length === 0}
            title={hints.length > 0 ? 'View your hints' : 'No hints received yet'}
            style={{ marginTop: '24px' }}
          >
            <FaLightbulb style={{ marginRight: 6 }} />
            View Hints
          </button>
        </div>
      </div>

      <RecentSubmissions problemId={id} refreshTrigger={refreshSubmissions} />

      {/* Hint Modal */}
      {showHintModal && (
        <HintModal
          hints={hints}
          hintError={hintError}
          loading={hintLoading}
          onClose={() => setShowHintModal(false)}
          hintsRemaining={2 - hints.length}
        />
      )}
    </div>
  );
};

export default Problem; 