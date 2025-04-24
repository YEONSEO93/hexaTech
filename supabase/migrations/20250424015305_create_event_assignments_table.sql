-- Create the event_assignments table to link events and collaborators
CREATE TABLE public.event_assignments (
    event_id INTEGER NOT NULL,
    collaborator_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT event_assignments_pkey PRIMARY KEY (event_id, collaborator_id), -- Composite primary key
    CONSTRAINT event_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE,
    CONSTRAINT event_assignments_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add comments explaining the table and columns
COMMENT ON TABLE public.event_assignments IS 'Tracks which collaborator users are assigned to which events.';
COMMENT ON COLUMN public.event_assignments.event_id IS 'The ID of the assigned event.';
COMMENT ON COLUMN public.event_assignments.collaborator_id IS 'The ID of the assigned collaborator user.';
COMMENT ON COLUMN public.event_assignments.assigned_at IS 'Timestamp when the assignment was made.';

-- Add indexes for better query performance
CREATE INDEX idx_event_assignments_event_id ON public.event_assignments(event_id);
CREATE INDEX idx_event_assignments_collaborator_id ON public.event_assignments(collaborator_id);

-- Grant usage permissions for the new table (adjust roles as needed)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.event_assignments TO postgres, service_role;
-- Grant limited permissions to authenticated users (RLS will handle actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_assignments TO authenticated;
