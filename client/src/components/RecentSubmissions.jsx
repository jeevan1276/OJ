import { useEffect, useState } from 'react';
import { getRecentSubmissions } from '../services/api';
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import './RecentSubmissions.css';

const formatExecutionTime = (ms) => ms === undefined ? 'N/A' : (ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(3)}s`);
const formatMemory = (mb) => mb === undefined ? 'N/A' : (mb < 1024 ? `${mb}MB` : `${(mb/1024).toFixed(2)}GB`);
const getStatusIcon = (status) => {
  switch (status) {
    case 'accepted': return <FaCheckCircle className="status-icon accepted" />;
    case 'wrong_answer': return <FaExclamationTriangle className="status-icon wrong" />;
    case 'time_limit_exceeded': return <FaClock className="status-icon tle" />;
    case 'memory_limit_exceeded': return <FaExclamationTriangle className="status-icon mle" />;
    case 'runtime_error': return <FaExclamationTriangle className="status-icon runtime" />;
    case 'compilation_error': return <FaExclamationTriangle className="status-icon compile" />;
    default: return <FaExclamationTriangle className="status-icon error" />;
  }
};

export default function RecentSubmissions({ problemId, refreshTrigger }) {
  const [submissions, setSubmissions] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getRecentSubmissions(problemId, 100)
      .then(res => {
        if (isMounted) setSubmissions(res.data || []);
      })
      .finally(() => isMounted && setLoading(false));
    return () => { isMounted = false; };
  }, [problemId, refreshTrigger]);

  if (loading) return <div className="recent-submissions-loading">Loading recent submissions...</div>;
  if (!submissions.length) return <div className="recent-submissions-empty">No recent submissions.</div>;

  return (
    <div className="recent-submissions-list">
      <h4>Recent Submissions</h4>
      {submissions.map(sub => (
        <div key={sub._id} className="recent-submission-card">
          <div className="recent-submission-header">
            {getStatusIcon(sub.status)}
            <span className={`status-text ${sub.status}`}>{sub.status.replace('_', ' ').toUpperCase()}</span>
            <span className="recent-submission-meta">
              {new Date(sub.submittedAt).toLocaleString()} | {sub.language.toUpperCase()} | {formatExecutionTime(sub.executionTime)} | {formatMemory(sub.memoryUsed)}
            </span>
            <button
              className="expand-btn"
              onClick={() => setExpanded(e => ({ ...e, [sub._id]: !e[sub._id] }))}
              aria-label={expanded[sub._id] ? 'Collapse code' : 'Expand code'}
            >
              {expanded[sub._id] ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          {expanded[sub._id] && (
            <pre className="recent-submission-code">
              {sub.code}
            </pre>
          )}
          <div className="recent-submission-details">
            <span>Test Cases: {sub.testCasesPassed}/{sub.totalTestCases}</span>
            {sub.status !== 'accepted' && sub.errorMessage && (
              <span className="error-message">Error: {sub.errorMessage}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 