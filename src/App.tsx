import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import PharmacyLogin from './pages/PharmacyLogin';
import ClientLogin from './pages/ClientLogin';
import PharmacyDashboard from './pages/PharmacyDashboard';
import ClientDashboard from './pages/ClientDashboard';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loginMode, setLoginMode] = useState<'pharmacy' | 'client'>('pharmacy');
  const { isAuthenticated, userRole, checkAuth } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-[#0F3C4C] text-lg">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (loginMode === 'pharmacy') {
      return (
        <PharmacyLogin
          onLogin={() => window.location.reload()}
          onSwitchToClient={() => setLoginMode('client')}
        />
      );
    } else {
      return (
        <ClientLogin
          onLogin={() => window.location.reload()}
          onSwitchToPharmacy={() => setLoginMode('pharmacy')}
        />
      );
    }
  }

  if (userRole === 'pharmacy') {
    return <PharmacyDashboard onLogout={() => window.location.reload()} />;
  } else {
    return <ClientDashboard onLogout={() => window.location.reload()} />;
  }
}

export default App;
