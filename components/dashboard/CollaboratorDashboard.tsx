"use client";

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export function CollaboratorDashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  return (
    <div className="p-8 ml-64">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Collaborator Dashboard</h1>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold">Hi {user?.email || 'Not logged in'}</h2>
      </div>
    </div>
  );
} 