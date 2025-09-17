
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <LogOut className="h-5 w-5" />
      <span>Logout</span>
    </button>
  );
};

export default LogoutButton;
