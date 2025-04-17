import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/admin');
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="p-8 ml-64">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold">Hi {user?.email || 'Not logged in'}</h2>
      </div>
    </div>
  );
} 