import { Link } from 'react-router-dom';
import { CheckCircle, LayoutDashboard, Users, Zap, Shield, Globe, Rocket, Award } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              TeamFlow
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
            <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/30 rounded-full px-4 py-2 mb-6">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">Supercharge Your Team's Productivity</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Team Task Manager
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Transform how your team collaborates with our intuitive Kanban-style board. 
            Designed for modern teams who value efficiency, clarity, and seamless workflow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5" />
              Get Started Free
            </Link>
            <a 
              href="#features" 
              className="px-8 py-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold text-lg"
            >
              Explore Features
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-4 bg-gray-800/30 rounded-xl">
              <div className="text-3xl font-bold text-blue-400">99%</div>
              <div className="text-gray-400">Team Efficiency</div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-xl">
              <div className="text-3xl font-bold text-purple-400">10x</div>
              <div className="text-gray-400">Faster Task Completion</div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-xl">
              <div className="text-3xl font-bold text-pink-400">24/7</div>
              <div className="text-gray-400">Accessibility</div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-xl">
              <div className="text-3xl font-bold text-green-400">∞</div>
              <div className="text-gray-400">Scalability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features for Modern Teams</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to manage tasks efficiently and collaborate effectively.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-4">Interactive Kanban Board</h3>
            <p className="text-gray-400 mb-6">Drag and drop tasks between columns with our intuitive visual interface designed for maximum productivity.</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Real-time updates</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Customizable workflows</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Visual progress tracking</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-4">Team Collaboration</h3>
            <p className="text-gray-400 mb-6">Built for teams to work together seamlessly with role-based access and real-time synchronization.</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Multi-user support</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Role-based permissions</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Activity tracking</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-pink-500/50 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-4">Secure & Reliable</h3>
            <p className="text-gray-400 mb-6">Enterprise-grade security with JWT authentication and encrypted data protection for peace of mind.</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> JWT authentication</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Encrypted sessions</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Data backup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple Yet Powerful Workflow</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Get started in minutes and transform how your team works.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-bold mb-3">Sign In</h3>
            <p className="text-gray-400">Use our demo credentials or create your own account to get started instantly.</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-bold mb-3">Organize Tasks</h3>
            <p className="text-gray-400">Create tasks, set priorities, and organize them in the Kanban board.</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-bold mb-3">Collaborate & Track</h3>
            <p className="text-gray-400">Drag tasks between columns and track progress in real-time with your team.</p>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-pink-900/30 rounded-2xl p-8 md:p-12 border border-blue-800/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">Try It Yourself</h2>
              <p className="text-gray-300 mb-6">Experience the power of Team Task Manager with our live demo. No credit card required.</p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Demo Credentials</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Admin Account</p>
                      <p className="text-gray-400 font-mono">admin / admin123</p>
                    </div>
                    <div>
                      <p className="font-semibold">User Account</p>
                      <p className="text-gray-400 font-mono">user / user123</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  <Zap className="w-5 h-5" />
                  Launch Demo Dashboard
                </Link>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">To Do</div>
                    <div className="h-2 bg-blue-500 rounded-full mb-2"></div>
                    <div className="h-2 bg-blue-400 rounded-full mb-2"></div>
                    <div className="h-2 bg-blue-300 rounded-full"></div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">In Progress</div>
                    <div className="h-2 bg-purple-500 rounded-full mb-2"></div>
                    <div className="h-2 bg-purple-400 rounded-full"></div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Done</div>
                    <div className="h-2 bg-green-500 rounded-full mb-2"></div>
                    <div className="h-2 bg-green-400 rounded-full mb-2"></div>
                    <div className="h-2 bg-green-300 rounded-full mb-2"></div>
                    <div className="h-2 bg-green-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">TeamFlow</span>
            </div>
            <p className="text-gray-400 max-w-md">
              A modern task management solution built for teams that value productivity and collaboration.
            </p>
          </div>

          <div className="text-center md:text-right">
            <div className="mb-4">
              <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold">Academic Project</span>
              </div>
              <p className="text-gray-400">Developed as part of</p>
              <p className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                TS Academy
              </p>
            </div>

            <div className="mb-4">
              <p className="text-gray-400">Created by</p>
              <p className="text-xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Oluwatobiloba Durodola.
                </span>
              </p>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <span className="text-gray-500 text-sm">© 2026 TeamFlow. All rights reserved.</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>This project demonstrates full-stack development skills with React, TypeScript, Flask, and PostgreSQL.</p>
          <p className="mt-2">Built with passion and attention to detail.</p>
        </div>
      </footer>
    </div>
  );
}
