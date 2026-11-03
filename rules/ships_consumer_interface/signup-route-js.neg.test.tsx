// lexcode-expect: 0
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Invites } from './Invites';

export function StaffApp() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/invites" element={<Invites />} />
      <Route path="/settings/register-device" element={<Invites />} />
    </Routes>
  );
}
