/**
 * ProjectGroup -- Project switching list for the command palette.
 *
 * Fetches projects from GET /api/projects on mount. Hides when only 1 project.
 * Selecting a project sends POST /api/projects/switch then reloads.
 *
 * Constitution: Named export (2.2), typed API responses (5.4).
 */

import { Command } from 'cmdk';
import { FolderOpen } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CommandPaletteItem } from '../CommandPaletteItem';
import { apiFetch } from '@/lib/api-client';

export interface Project {
  name: string;
  path: string;
  isActive?: boolean;
}

export interface ProjectGroupProps {
  onClose: () => void;
}

export const ProjectGroup = function ProjectGroup({ onClose }: ProjectGroupProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    apiFetch<Project[]>('/api/projects')
      .then((data) => {
        setProjects(data);
      })
      .catch(() => {
        // Graceful degradation: project list stays empty on fetch failure
      });
  }, []);

  const handleSelect = useCallback((project: Project) => {
    onClose();
    apiFetch('/api/projects/switch', {
      method: 'POST',
      body: JSON.stringify({ name: project.name }),
    })
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        window.location.reload();
      });
  }, [onClose]);

  // Don't render if 0 or 1 project
  if (projects.length <= 1) return null;

  return (
    <Command.Group heading="Projects">
      {projects.map((project) => (
        <CommandPaletteItem
          key={project.name}
          icon={<FolderOpen size={16} />}
          label={project.name}
          onSelect={() => handleSelect(project)}
        />
      ))}
    </Command.Group>
  );
};
