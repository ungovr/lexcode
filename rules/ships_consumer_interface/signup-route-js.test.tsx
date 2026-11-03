// lexcode-expect: 2
import { Route, Routes } from 'react-router-dom';
import { Home } from './Home';
import { SignUp } from './SignUp';
import { Register } from './Register';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
