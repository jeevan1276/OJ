import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Auth.css';
import { registerUser } from '../../services/api';

const Spinner = () => (
  <span className="spinner" style={{ marginLeft: 8, display: 'inline-block', verticalAlign: 'middle' }}>
    <svg width="18" height="18" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#2563eb">
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="3">
          <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
          <path d="M36 18c0-9.94-8.06-18-18-18">
            <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
          </path>
        </g>
      </g>
    </svg>
  </span>
);

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 50) return 'Name cannot exceed 50 characters';
        break;
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) return 'Invalid email address';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        break;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        break;
      case 'agreeToTerms':
        if (!formData.agreeToTerms) return 'You must agree to the terms';
        break;
      default:
        break;
    }
    return '';
  };

  const validateForm = () => {
    return (
      !validateField('fullName', formData.fullName) &&
      !validateField('email', formData.email) &&
      !validateField('password', formData.password) &&
      !validateField('confirmPassword', formData.confirmPassword) &&
      formData.agreeToTerms
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true, agreeToTerms: true });
    if (!validateForm()) {
      setError('Please fix the errors above.');
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join our coding community</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">Registration successful! Redirecting...</div>}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                minLength={2}
                maxLength={50}
                autoComplete="off"
                disabled={loading || success}
                onBlur={handleChange}
              />
            </div>
            {touched.fullName && validateField('fullName', formData.fullName) && (
              <span className="auth-error" style={{ marginBottom: 0 }}>{validateField('fullName', formData.fullName)}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                autoComplete="off"
                disabled={loading || success}
                onBlur={handleChange}
              />
            </div>
            {touched.email && validateField('email', formData.email) && (
              <span className="auth-error" style={{ marginBottom: 0 }}>{validateField('email', formData.email)}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading || success}
                onBlur={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || success}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {touched.password && validateField('password', formData.password) && (
              <span className="auth-error" style={{ marginBottom: 0 }}>{validateField('password', formData.password)}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                disabled={loading || success}
                onBlur={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading || success}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {touched.confirmPassword && validateField('confirmPassword', formData.confirmPassword) && (
              <span className="auth-error" style={{ marginBottom: 0 }}>{validateField('confirmPassword', formData.confirmPassword)}</span>
            )}
          </div>

          <div className="form-group">
            <label className="remember-me">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                disabled={loading || success}
                onBlur={handleChange}
              />
              I agree to the{' '}
              <Link to="/terms" className="auth-link">
                Terms and Conditions
              </Link>
            </label>
            {touched.agreeToTerms && validateField('agreeToTerms', formData.agreeToTerms) && (
              <span className="auth-error" style={{ marginBottom: 0 }}>{validateField('agreeToTerms', formData.agreeToTerms)}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={loading || success}
          >
            {loading ? (<><span>Creating Account...</span><Spinner /></>) : 'Create Account'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/auth/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 