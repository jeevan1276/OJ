import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendar, 
  FaTrophy, 
  FaCode, 
  FaFilter,
  FaEdit,
  FaSave,
  FaTimes,
  FaChartBar,
  FaHistory,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserStats, 
  getUserSubmissions,
  getSolvedProblems 
} from '../services/api';
import './Profile.css';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [submissionFilters, setSubmissionFilters] = useState({
    status: 'all',
    language: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc'
  });
  const [submissionPagination, setSubmissionPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });
  // const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions();
    } else if (activeTab === 'solved') {
      fetchSolvedProblems();
    }
  }, [activeTab, submissionFilters, submissionPagination.page]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [profileRes, statsRes] = await Promise.all([
        getUserProfile(),
        getUserStats()
      ]);
      
      setUser(profileRes.data);
      setStats(statsRes.data);
      setEditForm({
        fullName: profileRes.data.fullName,
        email: profileRes.data.email
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const filters = {
        ...submissionFilters,
        page: submissionPagination.page,
        limit: 10
      };
      
      const response = await getUserSubmissions(filters);
      
      if (response.data && response.data.submissions) {
        // Keep all submissions but ensure they have basic structure
        const validSubmissions = response.data.submissions.filter(submission => 
          submission && submission._id
        );
        setSubmissions(validSubmissions);
      } else {
        setSubmissions([]);
      }
      
      setSubmissionPagination(response.data.pagination || { page: 1, total: 0, pages: 0 });
    } catch (err) {
      toast.error(err.message || 'Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchSolvedProblems = async () => {
    try {
      const response = await getSolvedProblems(submissionPagination.page, 10);
      setSolvedProblems(response.data.solvedProblems);
      setSubmissionPagination(response.data.pagination);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await updateUserProfile(editForm);
      setUser(response.data);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFilterChange = (key, value) => {
    setSubmissionFilters(prev => ({ ...prev, [key]: value }));
    setSubmissionPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <FaCheckCircle className="status-icon accepted" />;
      case 'wrong_answer':
        return <FaExclamationTriangle className="status-icon wrong" />;
      case 'time_limit_exceeded':
        return <FaClock className="status-icon tle" />;
      case 'memory_limit_exceeded':
        return <FaExclamationTriangle className="status-icon mle" />;
      case 'runtime_error':
        return <FaExclamationTriangle className="status-icon runtime" />;
      case 'compilation_error':
        return <FaExclamationTriangle className="status-icon compile" />;
      default:
        return <FaExclamationTriangle className="status-icon error" />;
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'UNKNOWN';
    return status.replace('_', ' ').toUpperCase();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatExecutionTime = (ms) => ms === undefined ? 'N/A' : (ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(3)}s`);
  const formatMemory = (mb) => mb === undefined ? 'N/A' : (mb < 1024 ? `${mb}MB` : `${(mb/1024).toFixed(2)}GB`);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <p>Error: {error}</p>
        <button onClick={fetchUserData} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <Link to="/" className="back-button">
            <FaArrowLeft />
            Back to Problems
          </Link>
          <h1>User Profile</h1>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-sidebar">
          <div className="user-card">
            <div className="user-avatar">
              <FaUser />
            </div>
            <div className="user-info">
              <h2>{user?.fullName}</h2>
              <p className="user-email">{user?.email}</p>
              <p className="user-joined">
                <FaCalendar />
                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
            <button 
              className="edit-profile-btn"
              onClick={() => setEditMode(!editMode)}
            >
              <FaEdit />
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <nav className="profile-nav">
            <button 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FaChartBar />
              Overview
            </button>
            <button 
              className={`nav-item ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              <FaHistory />
              Submission History
            </button>
            <button 
              className={`nav-item ${activeTab === 'solved' ? 'active' : ''}`}
              onClick={() => setActiveTab('solved')}
            >
              <FaTrophy />
              Solved Problems
            </button>
          </nav>
        </div>

        <div className="profile-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {(!stats || !stats.overall || stats.overall.totalProblems === 0) && (
                <div className="empty-state">No data yet.</div>
              )}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaTrophy />
                  </div>
                  <div className="stat-info">
                    <h3>{stats?.overall?.solvedProblems || 0}</h3>
                    <p>Problems Solved</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaCode />
                  </div>
                  <div className="stat-info">
                    <h3>{stats?.overall?.totalSubmissions || 0}</h3>
                    <p>Total Submissions</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaUser />
                  </div>
                  <div className="stat-info">
                    <h3>{stats?.overall?.totalProblems || 0}</h3>
                    <p>Problems Attempted</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaChartBar />
                  </div>
                  <div className="stat-info">
                    <h3>
                      {stats?.overall?.totalProblems > 0 
                        ? Math.round((stats.overall.solvedProblems / stats.overall.totalProblems) * 100)
                        : 0}%
                    </h3>
                    <p>Success Rate</p>
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="edit-profile-form">
                  <h3>Edit Profile</h3>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-actions">
                    <button onClick={handleProfileUpdate} className="save-btn">
                      <FaSave />
                      Save Changes
                    </button>
                    <button onClick={() => setEditMode(false)} className="cancel-btn">
                      <FaTimes />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {stats?.difficultyStats && stats.difficultyStats.length > 0 && (
                <div className="difficulty-stats">
                  <h3>Performance by Difficulty</h3>
                  <div className="difficulty-bars">
                    {stats.difficultyStats.map((stat) => (
                      <div key={stat._id} className="difficulty-bar">
                        <div className="difficulty-label">
                          <span 
                            className="difficulty-dot"
                            style={{ backgroundColor: getDifficultyColor(stat._id) }}
                          ></span>
                          {stat._id}
                        </div>
                        <div className="difficulty-progress">
                          <div 
                            className="progress-bar"
                            style={{ 
                              width: `${stat.totalAttempted > 0 ? (stat.solved / stat.totalAttempted) * 100 : 0}%`,
                              backgroundColor: getDifficultyColor(stat._id)
                            }}
                          ></div>
                        </div>
                        <div className="difficulty-numbers">
                          {stat.solved}/{stat.totalAttempted}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="submissions-tab">
              <div className="submissions-header">
                <h3>Submission History</h3>
                <div className="submission-filters">
                  <select
                    value={submissionFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="accepted">Accepted</option>
                    <option value="wrong_answer">Wrong Answer</option>
                    <option value="time_limit_exceeded">Time Limit Exceeded</option>
                    <option value="memory_limit_exceeded">Memory Limit Exceeded</option>
                    <option value="runtime_error">Runtime Error</option>
                    <option value="compilation_error">Compilation Error</option>
                  </select>
                  
                  <select
                    value={submissionFilters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                  >
                    <option value="all">All Languages</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                  
                  <input
                    type="date"
                    value={submissionFilters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    placeholder="Start Date"
                  />
                  
                  <input
                    type="date"
                    value={submissionFilters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </div>

              <div className="submissions-list">
                {submissionsLoading ? (
                  <div className="submission-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading submissions...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="empty-state">No submissions yet.</div>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission._id} className="submission-card">
                      <div className="submission-header">
                        <div className="submission-status">
                          {getStatusIcon(submission.status)}
                          <span className={`status-text ${submission.status}`}>
                            {getStatusText(submission.status)}
                          </span>
                        </div>
                        <div className="submission-meta">
                          <span className="submission-language">{submission.language || 'Unknown'}</span>
                          <span className="submission-time">
                            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                      <div className="submission-problem">
                        {submission.problem ? (
                          <>
                            <Link to={`/problem/${submission.problem._id}`}>
                              {submission.problem.title}
                            </Link>
                            <div className="problem-meta">
                              <span 
                                className="difficulty"
                                style={{ color: getDifficultyColor(submission.problem.difficulty) }}
                              >
                                {submission.problem.difficulty}
                              </span>
                              {submission.problem.rating > 0 && (
                                <span className="rating">Rating: {submission.problem.rating}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="problem-meta">
                            <span className="difficulty" style={{ color: '#6b7280' }}>
                              Problem not found
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="submission-details">
                        <div className="detail-item">
                          <span className="detail-label">Execution Time:</span>
                          <span className="detail-value">
                            {submission.executionTime ? 
                              (submission.executionTime < 1000 ? 
                                `${submission.executionTime}ms` : 
                                `${(submission.executionTime / 1000).toFixed(3)}s`
                              ) : 'N/A'
                            }
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Memory Used:</span>
                          <span className="detail-value">
                            {submission.memoryUsed ? 
                              (submission.memoryUsed < 1024 ? 
                                `${submission.memoryUsed}MB` : 
                                `${(submission.memoryUsed / 1024).toFixed(2)}GB`
                              ) : 'N/A'
                            }
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Test Cases:</span>
                          <span className="detail-value">
                            {submission.testCasesPassed || 0}/{submission.totalTestCases || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {submissionPagination.pages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => setSubmissionPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={submissionPagination.page === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {submissionPagination.page} of {submissionPagination.pages}
                  </span>
                  <button 
                    onClick={() => setSubmissionPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={submissionPagination.page === submissionPagination.pages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'solved' && (
            <div className="solved-tab">
              <h3>Solved Problems</h3>
              <div className="solved-problems-list">
                {solvedProblems.length === 0 ? (
                  <div className="empty-state">No solved problems yet.</div>
                ) : (
                  solvedProblems.map((item) => (
                    <div key={item._id} className="solved-problem-card">
                      <div className="problem-info">
                        <Link to={`/problem/${item._id}`} className="problem-title">
                          {item.problemData.title}
                        </Link>
                        <div className="problem-meta">
                          <span 
                            className="difficulty"
                            style={{ color: getDifficultyColor(item.problemData.difficulty) }}
                          >
                            {item.problemData.difficulty}
                          </span>
                          {item.problemData.rating > 0 && (
                            <span className="rating">Rating: {item.problemData.rating}</span>
                          )}
                          <span className="categories">
                            {item.problemData.categories.join(', ')}
                          </span>
                        </div>
                      </div>
                      <div className="solved-info">
                        <span className="solved-date">
                          Solved on {new Date(item.firstSolvedAt).toLocaleDateString()}
                        </span>
                        <div className="best-submission">
                          <span>Best: {formatExecutionTime(item.bestExecutionTime)} {formatMemory(item.bestMemoryUsed)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {submissionPagination.pages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => setSubmissionPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={submissionPagination.page === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {submissionPagination.page} of {submissionPagination.pages}
                  </span>
                  <button 
                    onClick={() => setSubmissionPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={submissionPagination.page === submissionPagination.pages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile; 