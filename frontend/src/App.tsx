import { useState } from 'react';
import { HomePage } from './routes/HomePage';
import { LoginPage } from './routes/LoginPage';
import { RegisterPage } from './routes/RegisterPage';

type Screen = 'home' | 'login' | 'register';

function App() {
  const [screen, setScreen] = useState<Screen>('home');

  if (screen === 'login') {
    return <LoginPage onGoHome={() => setScreen('home')} onGoRegister={() => setScreen('register')} />;
  }
  if (screen === 'register') {
    return <RegisterPage onGoHome={() => setScreen('home')} onGoLogin={() => setScreen('login')} />;
  }
  return <HomePage onGoLogin={() => setScreen('login')} onGoRegister={() => setScreen('register')} />;
}

export default App
