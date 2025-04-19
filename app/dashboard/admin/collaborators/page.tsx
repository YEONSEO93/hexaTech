"use client";

import { useState, useEffect, FormEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface Collaborator {
  id: string;
  email: string;
  role: string;
  created_at: string;
  must_change_password?: boolean;
}

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();

  async function fetchCollaborators() {
    setLoading(true);
    setError(null);
    setCollaborators([]);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error(sessionError?.message || 'Not authenticated');

      const response = await fetch('/api/roles/collaborator', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch collaborators');
      }
      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error("Error fetching collaborators:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const handleAddCollaboratorClick = () => {
    setIsModalOpen(true);
    setNewCollaboratorEmail('');
    setCreationError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setCreationError(null);

    if (!newCollaboratorEmail) {
      setCreationError('Email is required.');
      setIsCreating(false);
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error(sessionError?.message || 'Not authenticated');

      const response = await fetch('/api/roles/collaborator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: newCollaboratorEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create collaborator');
      }

      setIsModalOpen(false);
      alert('Collaborator created successfully and invitation email sent.');
      fetchCollaborators();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setCreationError(errorMessage);
      console.error("Error creating collaborator:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <PageHeader title="User Management" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddCollaboratorClick}>Add New Collaborator</Button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Collaborator</h2>
              <form onSubmit={handleCreateSubmit}>
                <div className="mb-4">
                  <Input
                    id="new-collaborator-email"
                    type="email"
                    placeholder="Enter collaborator email"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>
                {creationError && (
                  <p className="text-red-500 text-sm mb-4">Error: {creationError}</p>
                )}
                <div className="flex justify-end space-x-3">
                  <Button type="button" onClick={handleCloseModal} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Collaborator'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && <p>Loading collaborators...</p>}
        {error && (
          <div style={{ color: 'red' }}>
            <h2>Error Fetching List:</h2>
            <pre>{error}</pre>
          </div>
        )}
        {!loading && !error && (
          <div>
            <h2>Collaborator List:</h2>
            {collaborators.length === 0 ? (
              <p>No collaborators found.</p>
            ) : (
              <>
                <ul>
                  {collaborators.map((collab) => (
                    <li key={collab.id}>
                      {collab.email} (Role: {collab.role}, Created: {new Date(collab.created_at).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
