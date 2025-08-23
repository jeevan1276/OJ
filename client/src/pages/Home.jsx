import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import './Home.css';
import { toast } from 'react-toastify';
import { getAllProblems } from '../services/api';
import { clearAllUserCodes } from '../utils/codePersistence';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: [],
    category: [],
    status: [],
    rating: []
  });
  const [user, setUser] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllProblems();
      setProblems(response.data || []);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutLoading(true);
   
    let userId = 'guest';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj._id) userId = userObj._id;
      }
    } catch (e) {}
    clearAllUserCodes(userId);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
      setLogoutLoading(false);
      toast.success('Logged out!');
      fetchProblems(); 
      navigate('/');
    }, 1500);
  };

 
  const getProblemStatus = (problem) => {
   
    return problem.userStatus || 'unsolved';
  };

 
  const filteredProblems = problems.filter(problem => {
   
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchQuery.toLowerCase());
    
   
    const matchesDifficulty = filters.difficulty.length === 0 || 
                             filters.difficulty.includes(problem.difficulty.toLowerCase());
    
   
    const matchesCategory = filters.category.length === 0 || 
                           problem.categories.some(cat => 
                             filters.category.includes(cat.toLowerCase().replace(' ', '-'))
                           );
    
   
    const problemStatus = getProblemStatus(problem);
    const matchesStatus = filters.status.length === 0 || 
                         filters.status.includes(problemStatus);
    
   
    const matchesRating = filters.rating.length === 0 || 
                         filters.rating.some(ratingRange => {
                           const [min, max] = ratingRange.split('-').map(Number);
                           return problem.rating >= min && problem.rating <= max;
                         });
    
    return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus && matchesRating;
  });

 
  const uniqueCategories = [...new Set(problems.flatMap(problem => problem.categories))];

 
  const ratingRanges = [
    { label: '1000-1299', value: '1000-1299' },
    { label: '1300-1599', value: '1300-1599' },
    { label: '1600-1899', value: '1600-1899' },
    { label: '1900-2199', value: '1900-2199' },
    { label: '2200-2499', value: '2200-2499' },
    { label: '2500+', value: '2500-9999' }
  ];

 
  const getRatingColorClass = (rating) => {
    if (rating >= 2500) return 'master';
    if (rating >= 2200) return 'expert';
    if (rating >= 1900) return 'advanced';
    if (rating >= 1600) return 'intermediate';
    if (rating >= 1300) return 'beginner-plus';
    if (rating >= 1000) return 'novice';
    return 'unrated';
  };

  
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'difficulty' || filterType === 'category' || filterType === 'status' || filterType === 'rating') {
        if (newFilters[filterType].includes(value)) {
          newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
        } else {
          newFilters[filterType] = [...newFilters[filterType], value];
        }
      }
      
      return newFilters;
    });
  };

  
  const clearAllFilters = () => {
    setFilters({
      difficulty: [],
      category: [],
      status: [],
      rating: []
    });
    setSearchQuery(''); 
  };


  const getActiveFilterCount = () => {
    return filters.difficulty.length + filters.category.length + filters.status.length + filters.rating.length + (searchQuery ? 1 : 0);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>Online Judge</h1>
          <div className="header-actions">
            {user ? (
              <>
                <span className="user-info">
                  <Link to="/profile" className="user-name-full">
                    {(user?.fullName || '').split(' ')[0]}
                  </Link>
                </span>
                <button className="auth-button primary" onClick={handleLogout} disabled={logoutLoading} style={{marginLeft: 0}}>
                  {logoutLoading ? (<><span>Logging out</span></>) : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="auth-button">Sign In</Link>
                <Link to="/auth/register" className="auth-button primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="home-main">
        <div className="problems-header">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <button 
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="filter-badge">{getActiveFilterCount()}</span>
              )}
            </button>
            
            {getActiveFilterCount() > 0 && (
              <button className="clear-filters" onClick={clearAllFilters}>
                <FaTimes />
                Clear All
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <h4>Difficulty</h4>
              <div className="filter-options">
                {['easy', 'medium', 'hard'].map(difficulty => (
                  <label key={difficulty} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.difficulty.includes(difficulty)}
                      onChange={() => handleFilterChange('difficulty', difficulty)}
                    />
                    <span className={`difficulty-badge ${difficulty}`}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Categories</h4>
              <div className="filter-options">
                {uniqueCategories.map(category => (
                  <label key={category} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category.toLowerCase().replace(' ', '-'))}
                      onChange={() => handleFilterChange('category', category.toLowerCase().replace(' ', '-'))}
                    />
                    <span className="category-badge">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Status</h4>
              <div className="filter-options">
                {['solved', 'attempted', 'unsolved'].map(status => (
                  <label key={status} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleFilterChange('status', status)}
                    />
                    <span className={`status-badge ${status}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Rating Range</h4>
              <div className="filter-options">
                {ratingRanges.map(range => (
                  <label key={range.value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.rating.includes(range.value)}
                      onChange={() => handleFilterChange('rating', range.value)}
                    />
                    <span className="rating-badge">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="problems-list">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading problems...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error: {error}</p>
              <button onClick={fetchProblems} className="retry-button">
                Try Again
              </button>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="no-problems">
              <p>No problems found matching your filters.</p>
              {getActiveFilterCount() > 0 && (
                <button onClick={clearAllFilters} className="clear-filters-btn">
                  Clear filters to see all problems
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="results-info">
                <p>Showing {filteredProblems.length} of {problems.length} problems</p>
              </div>
              {filteredProblems.map(problem => (
                <Link to={`/problem/${problem._id}`} key={problem._id} className="problem-card">
                  <div className="problem-info">
                    <h3>{problem.title}</h3>
                    <div className="problem-meta">
                      <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                        {problem.difficulty}
                      </span>
                      <span className="category">{problem.categories.join(', ')}</span>
                      <span className="acceptance-rate">
                        Acceptance Rate: {problem.totalSubmissions > 0 
                          ? `${Math.round((problem.successfulSubmissions / problem.totalSubmissions) * 100)}%`
                          : '0%'
                        }
                      </span>
                      {problem.rating > 0 && (
                        <span className={`rating ${getRatingColorClass(problem.rating)}`}>
                          Rating: {problem.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`status ${getProblemStatus(problem)}`}>
                    {getProblemStatus(problem).charAt(0).toUpperCase() + getProblemStatus(problem).slice(1)}
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home; 