'use client';

import React, { useState, useEffect } from 'react';
import { 
  Project, 
  Entity, 
  EntityType,
  ListProjectsResponse,
  UpdateProjectDto,
  ProjectEntitiesResponse 
} from '@/lib/types';
import { projectsApi } from '@/lib/api/projects';
import { entitiesApi } from '@/lib/api/entities';
import styles from './ProjectManager.module.css';

interface ProjectManagerProps {
  userId?: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  isActive: boolean;
}

export default function ProjectManager({ userId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    isActive: true
  });
  
  // Entity association modal
  const [entityModalProject, setEntityModalProject] = useState<Project | null>(null);
  const [projectEntities, setProjectEntities] = useState<Map<string, string[]>>(new Map());
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  
  // Delete confirmation
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load projects and entities in parallel
      const [projectsResponse, entitiesResponse] = await Promise.all([
        projectsApi.listProjects(),
        entitiesApi.listEntities()
      ]);
      
      setProjects(projectsResponse.projects || []);
      setEntities(entitiesResponse.entities || []);
      
      // Load entities for each project
      const entityMap = new Map<string, string[]>();
      for (const project of projectsResponse.projects || []) {
        try {
          const response = await projectsApi.getProjectEntities(project.id);
          entityMap.set(project.id, response.entities.map(e => e.id));
        } catch (err) {
          console.error(`Failed to load entities for project ${project.id}:`, err);
          entityMap.set(project.id, []);
        }
      }
      setProjectEntities(entityMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      isActive: project.isActive
    });
  };

  const handleSaveProject = async () => {
    if (!editingProject) return;
    
    try {
      setError(null);
      const updated = await projectsApi.updateProject(editingProject.id, formData);
      
      setProjects(projects.map(p => 
        p.id === editingProject.id ? updated : p
      ));
      
      setEditingProject(null);
      setFormData({ name: '', description: '', isActive: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      setError(null);
      await projectsApi.deleteProject(project.id);
      
      setProjects(projects.filter(p => p.id !== project.id));
      projectEntities.delete(project.id);
      setProjectEntities(new Map(projectEntities));
      
      setDeleteConfirmProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleManageEntities = async (project: Project) => {
    setEntityModalProject(project);
    const currentEntities = projectEntities.get(project.id) || [];
    setSelectedEntities(new Set(currentEntities));
  };

  const handleSaveEntityAssociations = async () => {
    if (!entityModalProject) return;
    
    try {
      setError(null);
      const currentEntities = projectEntities.get(entityModalProject.id) || [];
      const selected = Array.from(selectedEntities);
      
      // Find entities to add and remove
      const toAdd = selected.filter(id => !currentEntities.includes(id));
      const toRemove = currentEntities.filter(id => !selected.includes(id));
      
      // Execute operations
      const operations = [];
      if (toAdd.length > 0) {
        operations.push(projectsApi.addEntitiesToProject(entityModalProject.id, toAdd));
      }
      if (toRemove.length > 0) {
        operations.push(projectsApi.removeEntitiesFromProject(entityModalProject.id, toRemove));
      }
      
      await Promise.all(operations);
      
      // Update local state
      projectEntities.set(entityModalProject.id, selected);
      setProjectEntities(new Map(projectEntities));
      
      setEntityModalProject(null);
      setSelectedEntities(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entity associations');
    }
  };

  const toggleEntitySelection = (entityId: string) => {
    const newSelected = new Set(selectedEntities);
    if (newSelected.has(entityId)) {
      newSelected.delete(entityId);
    } else {
      newSelected.add(entityId);
    }
    setSelectedEntities(newSelected);
  };

  const getEntityTypeIcon = (type: EntityType) => {
    const icons = {
      person: '👤',
      company: '🏢',
      technical: '⚙️',
      product: '📦'
    };
    return icons[type] || '📝';
  };

  if (loading) {
    return <div className={styles.loading}>Loading projects...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Project Management</h2>
        <div className={styles.stats}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.dismissError}>×</button>
        </div>
      )}

      <div className={styles.projectList}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No projects yet</p>
            <p className={styles.hint}>Create projects from the homepage</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.projectInfo}>
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <span className={`${styles.statusBadge} ${project.isActive ? styles.active : styles.inactive}`}>
                    {project.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {project.description && (
                  <p className={styles.projectDescription}>{project.description}</p>
                )}
                
                <div className={styles.projectMeta}>
                  <span className={styles.entityCount}>
                    {projectEntities.get(project.id)?.length || 0} entities
                  </span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.createdAt}>
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className={styles.projectActions}>
                <button
                  onClick={() => handleEditProject(project)}
                  className={styles.actionButton}
                  title="Edit project"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleManageEntities(project)}
                  className={styles.actionButton}
                  title="Manage entities"
                >
                  🔗
                </button>
                <button
                  onClick={() => setDeleteConfirmProject(project)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Delete project"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Edit Project</h3>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setFormData({ name: '', description: '', isActive: true });
                }}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label htmlFor="project-name">Name</label>
                <input
                  id="project-name"
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Project name"
                />
              </div>
              
              <div className={styles.field}>
                <label htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  className={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project description (optional)"
                  rows={3}
                />
              </div>
              
              <div className={styles.field}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setFormData({ name: '', description: '', isActive: true });
                }}
                className={styles.buttonSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className={styles.buttonPrimary}
                disabled={!formData.name.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entity Association Modal */}
      {entityModalProject && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Manage Entities for {entityModalProject.name}</h3>
              <button
                onClick={() => {
                  setEntityModalProject(null);
                  setSelectedEntities(new Set());
                }}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.entityList}>
                {entities.length === 0 ? (
                  <p className={styles.emptyState}>No entities available</p>
                ) : (
                  entities.map(entity => (
                    <label key={entity.id} className={styles.entityCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedEntities.has(entity.id)}
                        onChange={() => toggleEntitySelection(entity.id)}
                      />
                      <span className={styles.entityLabel}>
                        <span className={styles.entityIcon}>
                          {getEntityTypeIcon(entity.type)}
                        </span>
                        <span className={styles.entityName}>{entity.name}</span>
                        <span className={styles.entityValue}>({entity.value})</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              
              <div className={styles.selectionInfo}>
                {selectedEntities.size} entities selected
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setEntityModalProject(null);
                  setSelectedEntities(new Set());
                }}
                className={styles.buttonSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntityAssociations}
                className={styles.buttonPrimary}
              >
                Save Associations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProject && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Delete Project</h3>
              <button
                onClick={() => setDeleteConfirmProject(null)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete <strong>{deleteConfirmProject.name}</strong>?</p>
              <p className={styles.warning}>
                This action cannot be undone. All associations with entities will be removed.
              </p>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                onClick={() => setDeleteConfirmProject(null)}
                className={styles.buttonSecondary}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(deleteConfirmProject)}
                className={styles.buttonDanger}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}