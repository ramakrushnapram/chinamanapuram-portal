import { Routes, Route } from 'react-router-dom';
import HomePage       from './pages/HomePage';
import FamilyDirectory from './pages/FamilyDirectory';
import FamilyTree     from './pages/FamilyTree';
import Gallery        from './pages/Gallery';
import Complaints     from './pages/Complaints';
import Chat           from './pages/Chat';
import Education      from './pages/Education';
import LoginPage      from './pages/Login';
import Register       from './pages/Register';
import Profile        from './pages/Profile';
import Admin          from './pages/Admin';
import Documents      from './pages/Documents';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/"           element={<HomePage />} />
      <Route path="/families"   element={<FamilyDirectory />} />
      <Route path="/family-tree"element={<FamilyTree />} />
      <Route path="/gallery"    element={<Gallery />} />
      <Route path="/complaints" element={<Complaints />} />
      <Route path="/chat"       element={<Chat />} />
      <Route path="/education"  element={<Education />} />
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/register"   element={<Register />} />
      <Route path="/profile"    element={<Profile />} />
      <Route path="/admin"      element={<Admin />} />
      <Route path="/documents"  element={<Documents />} />
    </Routes>
  );
}

export default App;
