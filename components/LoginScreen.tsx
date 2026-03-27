import React, { useState } from 'react';
import { BandmasterIcon } from './icons';

interface LoginScreenProps {
  onLogin: (userId: string, username: string) => void;
}

const VALID_USERS = [
  { id: 'user1', username: 'lovnis', password: 'jahrasta' },
  { id: 'user2', username: 'giraprodutora', password: 'jahrasta' },
  { id: 'user3', username: 'dudapalosao', password: 'jahrasta' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate auth delay
    setTimeout(() => {
      const user = VALID_USERS.find(u => u.username === username && u.password === password);
      
      if (user) {
        onLogin(user.id, user.username);
      } else {
        setError('Usuário ou senha inválidos');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-spotify-green to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">🎵</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Bandmaster</h1>
          <p className="text-gray-400">Seu Centro de Controle Musical</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome de Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ex: lovnis"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green transition"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green transition"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-gradient-to-r from-spotify-green to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Conectando...' : 'Entrar'}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-3 font-semibold">CONTAS DE TESTE:</p>
            <div className="space-y-2 text-xs text-gray-500">
              <p>👤 <span className="text-gray-300">lovnis</span> / <span className="text-gray-300">jahrasta</span></p>
              <p>👤 <span className="text-gray-300">giraprodutora</span> / <span className="text-gray-300">jahrasta</span></p>
              <p>👤 <span className="text-gray-300">dudapalosao</span> / <span className="text-gray-300">jahrasta</span></p>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Cada usuário tem seu próprio espaço de trabalho<br/>
            isolado e seguro para gerenciar sua música.
          </p>
        </div>
      </div>
    </div>
  );
};
