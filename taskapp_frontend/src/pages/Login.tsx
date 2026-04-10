import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, LogIn, Lock, User, Eye, EyeOff, Shield, Brain, Server, Cpu } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Brand & Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <Server className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TeamFlow
                </h1>
                <p className="text-gray-400">DevOps Task Management Platform</p>
              </div>
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DevOps Hub
                </span>
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Manage your infrastructure, deployments, and team tasks in one unified platform built for DevOps excellence.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Infrastructure Focused</h3>
                  <p className="text-gray-400 text-sm">
                    Designed specifically for DevOps workflows, CI/CD pipelines, and infrastructure management.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Enterprise Security</h3>
                  <p className="text-gray-400 text-sm">
                    Built with DevSecOps principles, featuring JWT tokens, encrypted sessions, and audit logging.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Automation Ready</h3>
                  <p className="text-gray-400 text-sm">
                    Integrates with your existing DevOps toolchain for seamless automation and workflow management.
                  </p>
                </div>
              </div>
            </div>

            {/* Project Info - Simplified */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-2xl border border-gray-700">
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Developed by</p>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Oluwatobiloba
                </p>
                <p className="text-gray-300 font-medium">DevOps Engineer</p>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-3"></div>
                <p className="text-sm text-gray-400">Capstone Project</p>
                <p className="text-lg font-bold text-white">DevOps Engineering Program</p>
                <p className="text-gray-300">TS Academy • 2026</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
                  <LogIn className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Sign In to DevOps Hub</h2>
                <p className="text-gray-400">Enter your credentials to access the platform</p>
              </div>

              {error && (
                <div className="mb-6 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-800/50 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-white"
                      placeholder="Enter your username"
                      required
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-white"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>

                {/* Demo Credentials */}
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-3">Try with demo credentials:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUsername('admin');
                          setPassword('admin123');
                        }}
                        className="p-3 bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-800/30 rounded-xl hover:border-blue-600 transition-all duration-200"
                      >
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-gray-400 mt-1">admin / admin123</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUsername('user');
                          setPassword('user123');
                        }}
                        className="p-3 bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-800/30 rounded-xl hover:border-purple-600 transition-all duration-200"
                      >
                        <div className="font-medium">User</div>
                        <div className="text-xs text-gray-400 mt-1">user / user123</div>
                      </button>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-gray-700">
                    <p className="text-gray-400">
                      Don't have an account?{' '}
                      <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
                        Sign up here
                      </Link>
                    </p>
                  </div>

                  <p className="text-center text-sm text-gray-500">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-400">
                    Need help?{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300 font-medium">
                      Contact support
                    </a>
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-xs text-gray-500">
                    © 2026 TeamFlow • DevOps Engineering Program • Created by Oluwatobiloba (DevOps Engineer)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
