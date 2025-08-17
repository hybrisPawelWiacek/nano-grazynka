'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Folder, Check } from 'lucide-react';
import { projectsApi, type Project } from '../lib/api/projects';
import { entitiesApi, type Entity } from '../lib/api/entities';
import styles from './ProjectSelector.module.css';

interface ProjectSelectorProps {
  onProjectSelect: (projectId: string | null) => void;
  selectedProjectId?: string | null;
  className?: string;
}

export default function ProjectSelector({ 
  onProjectSelect, 
  selectedProjectId,
  className 
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [availableEntities, setAvailableEntities] = useState<Entity[]>([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected project when prop changes
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === selectedProjectId);
      setSelectedProject(project || null);
    }
  }, [selectedProjectId, projects]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectsApi.listProjects();
      setProjects(response.projects.filter(p => p.isActive));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      const response = await entitiesApi.listEntities();
      setAvailableEntities(response.entities);
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setLoadingEntities(false);
    }
  };

  const toggleEntitySelection = (entityId: string) => {
    setSelectedEntityIds(prev => 
      prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const handleSelectProject = (project: Project | null) => {
    setSelectedProject(project);
    onProjectSelect(project?.id || null);
    setIsOpen(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const newProject = await projectsApi.createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      });
      
      // Link selected entities to the new project
      if (selectedEntityIds.length > 0) {
        try {
          await projectsApi.addEntitiesToProject(newProject.id, selectedEntityIds);
        } catch (error) {
          console.error('Failed to link entities to project:', error);
          // Continue even if entity linking fails
        }
      }
      
      // Add to projects list and select it
      setProjects([...projects, newProject]);
      handleSelectProject(newProject);
      
      // Reset form
      setNewProjectName('');
      setNewProjectDescription('');
      setSelectedEntityIds([]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className={`${styles.container} ${className || ''}`} ref={dropdownRef}>
        <button
          className={styles.selector}
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          aria-label="Select project"
          aria-expanded={isOpen}
        >
          <div className={styles.selectorContent}>
            <Folder className={styles.icon} size={16} />
            <span className={styles.selectorText}>
              {selectedProject ? selectedProject.name : 'No Project'}
            </span>
            <ChevronDown 
              className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
              size={16} 
            />
          </div>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <button
              className={styles.dropdownItem}
              onClick={() => handleSelectProject(null)}
            >
              <span className={styles.itemText}>No Project</span>
              {!selectedProject && <span className={styles.checkmark}>✓</span>}
            </button>

            {projects.length > 0 && <div className={styles.divider} />}

            {projects.map(project => (
              <button
                key={project.id}
                className={styles.dropdownItem}
                onClick={() => handleSelectProject(project)}
              >
                <span className={styles.itemText}>{project.name}</span>
                {selectedProject?.id === project.id && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            ))}

            <div className={styles.divider} />

            <button
              className={`${styles.dropdownItem} ${styles.createNew}`}
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
                loadEntities(); // Load entities when opening modal
                setSelectedEntityIds([]); // Reset selected entities
              }}
            >
              <Plus size={14} className={styles.plusIcon} />
              <span className={styles.itemText}>New Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Create New Project</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="projectName" className={styles.label}>
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                className={styles.input}
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="e.g., Medical Research, Tech Blog"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="projectDescription" className={styles.label}>
                Description (optional)
              </label>
              <textarea
                id="projectDescription"
                className={styles.textarea}
                value={newProjectDescription}
                onChange={e => setNewProjectDescription(e.target.value)}
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>

            {/* Entity Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Select Entities (optional)
              </label>
              {loadingEntities ? (
                <div className={styles.loadingText}>Loading entities...</div>
              ) : availableEntities.length > 0 ? (
                <div className={styles.entityList}>
                  {availableEntities.map(entity => (
                    <label key={entity.id} className={styles.entityCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedEntityIds.includes(entity.id)}
                        onChange={() => toggleEntitySelection(entity.id)}
                      />
                      <span className={styles.entityName}>
                        {entity.name}
                        <span className={styles.entityType}>
                          {entity.type === 'person' && ' 👤'}
                          {entity.type === 'company' && ' 🏢'}
                          {entity.type === 'technical' && ' ⚙️'}
                          {entity.type === 'product' && ' 📦'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className={styles.noEntities}>
                  No entities available. Create entities in Settings first.
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className={styles.createButton}
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}