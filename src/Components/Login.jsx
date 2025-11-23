import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import peakBrewLogo from '../assets/peak brew.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-black font-sans overflow-hidden relative">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-brand-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-800 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-red-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Left Side - Brand Identity */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-16 xl:p-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={peakBrewLogo} alt="Peak Brew Logo" className="h-12 w-auto invert brightness-0" />
        </motion.div>

        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-8xl xl:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-8"
          >
            PEAK<br />BREW
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4"
          >
            <div className="h-1 w-24 bg-brand-600"></div>
            <p className="text-brand-100 text-xl font-mono uppercase tracking-widest">
              Nepali Beer Distribution • Ohio
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-brand-200/50 text-sm font-mono uppercase tracking-widest"
        >
          System v2.4.0 — Secure Access
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 shadow-2xl"
        >
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white tracking-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400">Enter your credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-brand-900/50 border border-brand-600/50 p-4 text-brand-200 text-sm font-mono"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-6">
              <div className="group relative">
                <label className="block text-xs font-bold text-brand-500 uppercase tracking-widest mb-2" htmlFor="email">
                  Email Identity
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-4 bg-black/20 border-b-2 border-white/20 text-xl text-white placeholder-white/20 focus:outline-none focus:border-brand-600 focus:bg-black/40 transition-all duration-300 font-medium rounded-none"
                  placeholder="NAME@COMPANY.COM"
                />
              </div>
              <div className="group relative">
                <label className="block text-xs font-bold text-brand-500 uppercase tracking-widest mb-2" htmlFor="password">
                  Access Key
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-4 bg-black/20 border-b-2 border-white/20 text-xl text-white placeholder-white/20 focus:outline-none focus:border-brand-600 focus:bg-black/40 transition-all duration-300 font-medium rounded-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-5 text-lg font-bold uppercase tracking-widest hover:bg-brand-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-brand-600/40 hover:-translate-y-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Authenticating...
                </span>
              ) : 'Initialize Session'}
            </button>
          </form>

          <div className="mt-12 flex justify-center">
            <a href="#" className="text-white/40 text-xs font-mono uppercase tracking-wider hover:text-brand-500 transition-colors">
              Forgot Credentials?
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;