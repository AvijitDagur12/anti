import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // If user is authenticated, render the Dashboard
  if (isAuthenticated) {
    return <DashboardPage />;
  }

  // Otherwise, render Login or Register
  return (
    <div className="auth-wrapper">
      <header className="app-header">
        <h1 className="app-logo">
          Money<span>Track</span>
        </h1>
        <p className="app-tagline">Personal Expense Tracker</p>
      </header>

      {isRegistering ? (
        <RegisterPage onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <LoginPage onSwitchToRegister={() => setIsRegistering(true)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
