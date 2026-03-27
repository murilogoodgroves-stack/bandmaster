import React, { useState } from 'react';

interface OnboardingModalProps {
  username: string;
  onComplete: (bandName: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ username, onComplete }) => {
  const [bandName, setBandName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandName.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      onComplete(bandName);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo, {username}! 🎵</h2>
        <p className="text-gray-400 mb-6">
          Vamos configurar sua banda para começar a gerenciar sua música no Bandmaster.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Sua Banda / Projeto
            </label>
            <input
              type="text"
              value={bandName}
              onChange={e => setBandName(e.target.value)}
              placeholder="ex: LOVNIS, Gira Produtora, Duda Paloção"
              autoFocus
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green transition"
              disabled={isLoading}
            />
          </div>

          <p className="text-xs text-gray-500">
            💡 Você pode adicionar mais bandas depois nas Configurações. Por enquanto, vamos criar apenas uma.
          </p>

          <button
            type="submit"
            disabled={isLoading || !bandName.trim()}
            className="w-full bg-gradient-to-r from-spotify-green to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Criando...' : 'Começar!'}
          </button>
        </form>
      </div>
    </div>
  );
};
