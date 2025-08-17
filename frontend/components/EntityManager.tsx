'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './EntityManager.module.css';
import { 
  entitiesApi,
  type Entity, 
  type EntityType 
} from '../lib/api/entities';
import { projectsApi, type Project } from '../lib/api/projects';

interface EntityManagerProps {
  userId?: string;
  className?: string;
}

interface EntityFormData {
  name: string;
  type: EntityType;
  value: string;
  aliases: string[];
  description: string;
}

const entityTypeLabels: Record<EntityType, string> = {
  person: 'Person',
  company: 'Company',
  technical: 'Technical',
  product: 'Product'
};

const entityTypeIcons: Record<EntityType, string> = {
  person: '👤',
  company: '🏢',
  technical: '⚙️',
  product: '📦'
};

export default function EntityManager({ userId, className }: EntityManagerProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EntityFormData>({
    name: '',
    type: 'person',
    value: '',
    aliases: [],
    description: ''
  });
  const [aliasInput, setAliasInput] = useState('');
  
  // New state for Session 3 enhancements
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null);
  const [entityProjects, setEntityProjects] = useState<Map<string, Project[]>>(new Map());
  const [projectManageModal, setProjectManageModal] = useState<{ open: boolean; entity: Entity | null }>({ open: false, entity: null });
  const [filterProjectId, setFilterProjectId] = useState<string>('all');
  const [selectedProjectsForEntity, setSelectedProjectsForEntity] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-hide success message after 3 seconds
    if (assignmentSuccess) {
      const timer = setTimeout(() => setAssignmentSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [assignmentSuccess]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entitiesResponse, projectsResponse] = await Promise.all([
        entitiesApi.listEntities(),
        projectsApi.listProjects()
      ]);
      setEntities(entitiesResponse.entities);
      setProjects(projectsResponse.projects);
      
      // Load entity-project mappings
      await loadEntityProjects(projectsResponse.projects);
    } catch (err) {
      setError('Failed to load data');
      console.error('Failed to load entities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load which projects each entity belongs to
  const loadEntityProjects = async (projectsList?: Project[]) => {
    const projectsToUse = projectsList || projects;
    const projectEntityMap = new Map<string, Project[]>();
    
    try {
      // For each project, get its entities and build reverse mapping
      for (const project of projectsToUse) {
        const response = await projectsApi.getProjectEntities(project.id);
        if (response.entities) {
          response.entities.forEach(entity => {
            if (!projectEntityMap.has(entity.id)) {
              projectEntityMap.set(entity.id, []);
            }
            projectEntityMap.get(entity.id)!.push(project);
          });
        }
      }
      
      setEntityProjects(projectEntityMap);
    } catch (err) {
      console.error('Failed to load entity-project mappings:', err);
    }
  };

  const filteredAndGroupedEntities = useMemo(() => {
    let filtered = entities;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entity => 
        entity.name.toLowerCase().includes(term) ||
        entity.value.toLowerCase().includes(term) ||
        entity.aliases?.some(alias => alias.toLowerCase().includes(term)) ||
        entity.description?.toLowerCase().includes(term)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(entity => entity.type === filterType);
    }

    // Apply project filter
    if (filterProjectId !== 'all') {
      if (filterProjectId === 'unassigned') {
        filtered = filtered.filter(entity => 
          !entityProjects.has(entity.id) || entityProjects.get(entity.id)!.length === 0
        );
      } else {
        filtered = filtered.filter(entity => 
          entityProjects.get(entity.id)?.some(p => p.id === filterProjectId)
        );
      }
    }

    // Group by type
    const grouped: Record<EntityType, Entity[]> = {
      person: [],
      company: [],
      technical: [],
      product: []
    };

    filtered.forEach(entity => {
      grouped[entity.type].push(entity);
    });

    // Sort each group alphabetically
    Object.keys(grouped).forEach(type => {
      grouped[type as EntityType].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    });

    return grouped;
  }, [entities, searchTerm, filterType, filterProjectId, entityProjects]);

  const handleAddEntity = () => {
    setFormData({
      name: '',
      type: 'person',
      value: '',
      aliases: [],
      description: ''
    });
    setAliasInput('');
    setEditingEntity(null);
    setIsAddModalOpen(true);
  };

  const handleEditEntity = (entity: Entity) => {
    setFormData({
      name: entity.name,
      type: entity.type,
      value: entity.value,
      aliases: entity.aliases || [],
      description: entity.description || ''
    });
    setAliasInput('');
    setEditingEntity(entity);
    setIsAddModalOpen(true);
  };

  const handleDeleteEntity = async (entityId: string) => {
    if (!confirm('Are you sure you want to delete this entity?')) {
      return;
    }

    try {
      await entitiesApi.deleteEntity(entityId);
      setEntities(entities.filter(e => e.id !== entityId));
      setActiveMenu(null);
    } catch (err) {
      setError('Failed to delete entity');
      console.error('Failed to delete entity:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingEntity) {
        // Update existing entity
        const updated = await entitiesApi.updateEntity(editingEntity.id, {
          name: formData.name,
          type: formData.type,
          value: formData.value,
          aliases: formData.aliases.length > 0 ? formData.aliases : undefined,
          description: formData.description || undefined
        });
        setEntities(entities.map(e => e.id === editingEntity.id ? updated : e));
      } else {
        // Create new entity
        const created = await entitiesApi.createEntity({
          name: formData.name,
          type: formData.type,
          value: formData.value,
          aliases: formData.aliases.length > 0 ? formData.aliases : undefined,
          description: formData.description || undefined
        });
        setEntities([...entities, created]);
      }
      setIsAddModalOpen(false);
    } catch (err) {
      setError('Failed to save entity');
      console.error('Failed to save entity:', err);
    }
  };

  const handleAddAlias = () => {
    if (aliasInput.trim() && !formData.aliases.includes(aliasInput.trim())) {
      setFormData({
        ...formData,
        aliases: [...formData.aliases, aliasInput.trim()]
      });
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (alias: string) => {
    setFormData({
      ...formData,
      aliases: formData.aliases.filter(a => a !== alias)
    });
  };

  const toggleEntitySelection = (entityId: string) => {
    const newSelection = new Set(selectedEntities);
    if (newSelection.has(entityId)) {
      newSelection.delete(entityId);
    } else {
      newSelection.add(entityId);
    }
    setSelectedEntities(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedEntities.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedEntities.size} entities?`)) {
      return;
    }

    try {
      await Promise.all(Array.from(selectedEntities).map(id => entitiesApi.deleteEntity(id)));
      setEntities(entities.filter(e => !selectedEntities.has(e.id)));
      setSelectedEntities(new Set());
    } catch (err) {
      setError('Failed to delete entities');
      console.error('Failed to delete entities:', err);
    }
  };

  // Bulk assignment to project
  const handleBulkAssignToProject = async () => {
    if (!selectedProjectId || selectedEntities.size === 0) return;
    
    try {
      await projectsApi.addEntitiesToProject(
        selectedProjectId, 
        Array.from(selectedEntities)
      );
      setAssignmentSuccess(`Assigned ${selectedEntities.size} entities to project`);
      setSelectedEntities(new Set());
      setSelectedProjectId('');
      await loadEntityProjects();
    } catch (err) {
      setError('Failed to assign entities to project');
      console.error('Failed to assign entities:', err);
    }
  };

  // Remove entity from project
  const handleRemoveFromProject = async (entityId: string, projectId: string) => {
    try {
      await projectsApi.removeEntitiesFromProject(projectId, [entityId]);
      await loadEntityProjects();
    } catch (err) {
      setError('Failed to remove entity from project');
      console.error('Failed to remove entity from project:', err);
    }
  };

  // Open manage projects modal for a single entity
  const handleManageProjects = (entity: Entity) => {
    const currentProjects = entityProjects.get(entity.id) || [];
    const currentProjectIds = new Set(currentProjects.map(p => p.id));
    setSelectedProjectsForEntity(currentProjectIds);
    setProjectManageModal({ open: true, entity });
    setActiveMenu(null);
  };

  // Save project assignments for a single entity
  const handleSaveProjectsForEntity = async () => {
    if (!projectManageModal.entity) return;
    
    try {
      const entity = projectManageModal.entity;
      const currentProjects = entityProjects.get(entity.id) || [];
      const currentProjectIds = new Set(currentProjects.map(p => p.id));
      
      // Find projects to add and remove
      const toAdd = Array.from(selectedProjectsForEntity).filter(id => !currentProjectIds.has(id));
      const toRemove = currentProjects.filter(p => !selectedProjectsForEntity.has(p.id)).map(p => p.id);
      
      // Add entity to new projects
      for (const projectId of toAdd) {
        await projectsApi.addEntitiesToProject(projectId, [entity.id]);
      }
      
      // Remove entity from old projects
      for (const projectId of toRemove) {
        await projectsApi.removeEntitiesFromProject(projectId, [entity.id]);
      }
      
      setAssignmentSuccess('Project associations updated successfully');
      setTimeout(() => setAssignmentSuccess(null), 3000);
      
      // Reload and close modal
      await loadEntityProjects();
      setProjectManageModal({ open: false, entity: null });
      setSelectedProjectsForEntity(new Set());
    } catch (err) {
      setError('Failed to update project associations');
      console.error('Failed to update project associations:', err);
    }
  };


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Entities & Projects</h2>
        <p className={styles.subtitle}>
          Manage entities to improve transcription accuracy for names, terms, and concepts
        </p>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <input
            type="text"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EntityType | 'all')}
            className={styles.filterSelect}
          >
            <option value="all">All Types</option>
            <option value="person">Person</option>
            <option value="company">Company</option>
            <option value="technical">Technical</option>
            <option value="product">Product</option>
          </select>
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <div className={styles.toolbarRight}>
          {selectedEntities.size > 0 && (
            <>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={styles.projectSelector}
              >
                <option value="">Select Project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssignToProject}
                className={styles.assignButton}
                disabled={!selectedProjectId}
              >
                Assign to Project ({selectedEntities.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className={styles.bulkDeleteButton}
              >
                Delete ({selectedEntities.size})
              </button>
            </>
          )}
          <button
            onClick={handleAddEntity}
            className={styles.addButton}
          >
            + New Entity
          </button>
        </div>
      </div>

      {/* Success Message */}
      {assignmentSuccess && (
        <div className={styles.successMessage}>
          {assignmentSuccess}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Entity List */}
      <div className={styles.entityList}>
        {Object.entries(filteredAndGroupedEntities).map(([type, typeEntities]) => {
          if (typeEntities.length === 0) return null;
          
          return (
            <div key={type} className={styles.typeSection}>
              <h3 className={styles.typeHeader}>
                <span className={styles.typeIcon}>
                  {entityTypeIcons[type as EntityType]}
                </span>
                {entityTypeLabels[type as EntityType]} ({typeEntities.length})
              </h3>
              <div className={styles.entityGrid}>
                {typeEntities.map(entity => (
                  <div key={entity.id} className={styles.entityCard}>
                    <div className={styles.entityCardContent}>
                      <input
                        type="checkbox"
                        checked={selectedEntities.has(entity.id)}
                        onChange={() => toggleEntitySelection(entity.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.entityInfo}>
                        <div className={styles.entityName}>{entity.name}</div>
                        {entity.description && (
                          <div className={styles.entityDescription}>
                            {entity.description}
                          </div>
                        )}
                        {entity.aliases && entity.aliases.length > 0 && (
                          <div className={styles.entityAliases}>
                            Also: {entity.aliases.join(', ')}
                          </div>
                        )}
                        {/* Project Badges */}
                        {entityProjects.get(entity.id) && entityProjects.get(entity.id)!.length > 0 && (
                          <div className={styles.projectBadges}>
                            {entityProjects.get(entity.id)!.map(project => (
                              <span key={project.id} className={styles.projectBadge}>
                                {project.name}
                                <button
                                  onClick={() => handleRemoveFromProject(entity.id, project.id)}
                                  className={styles.badgeRemove}
                                  title={`Remove from ${project.name}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={styles.entityActions}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === entity.id ? null : entity.id)}
                          className={styles.menuButton}
                        >
                          •••
                        </button>
                        {activeMenu === entity.id && (
                          <div className={styles.menu}>
                            <button
                              onClick={() => {
                                handleEditEntity(entity);
                                setActiveMenu(null);
                              }}
                              className={styles.menuItem}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleManageProjects(entity);
                                setActiveMenu(null);
                              }}
                              className={styles.menuItem}
                            >
                              Manage Projects
                            </button>
                            <button
                              onClick={() => handleDeleteEntity(entity.id)}
                              className={styles.menuItem}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingEntity ? 'Edit Entity' : 'New Entity'}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={styles.input}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as EntityType})}
                  className={styles.select}
                  required
                >
                  <option value="person">Person</option>
                  <option value="company">Company</option>
                  <option value="technical">Technical Term</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Value *</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className={styles.input}
                  placeholder="The exact spelling/format to use"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Aliases</label>
                <div className={styles.aliasInput}>
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAlias();
                      }
                    }}
                    className={styles.input}
                    placeholder="Add alternative names or spellings"
                  />
                  <button
                    type="button"
                    onClick={handleAddAlias}
                    className={styles.addAliasButton}
                  >
                    Add
                  </button>
                </div>
                {formData.aliases.length > 0 && (
                  <div className={styles.aliasList}>
                    {formData.aliases.map(alias => (
                      <span key={alias} className={styles.aliasTag}>
                        {alias}
                        <button
                          type="button"
                          onClick={() => handleRemoveAlias(alias)}
                          className={styles.removeAlias}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={styles.textarea}
                  placeholder="Additional context (e.g., CEO of TechCorp)"
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  {editingEntity ? 'Save Changes' : 'Create Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Management Modal */}
      {projectManageModal.open && projectManageModal.entity && (
        <div className={styles.modalOverlay} onClick={() => setProjectManageModal({ open: false, entity: null })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Manage Projects for {projectManageModal.entity.name}</h3>
              <button
                onClick={() => setProjectManageModal({ open: false, entity: null })}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.projectManageContent}>
              <p className={styles.modalDescription}>
                Select which projects this entity should belong to:
              </p>
              <div className={styles.projectCheckboxList}>
                {projects.map(project => (
                  <label key={project.id} className={styles.projectCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedProjectsForEntity.has(project.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedProjectsForEntity);
                        if (e.target.checked) {
                          newSet.add(project.id);
                        } else {
                          newSet.delete(project.id);
                        }
                        setSelectedProjectsForEntity(newSet);
                      }}
                    />
                    <span>{project.name}</span>
                    {project.description && (
                      <span className={styles.projectDescription}> - {project.description}</span>
                    )}
                  </label>
                ))}
              </div>
              {projects.length === 0 && (
                <p className={styles.noProjects}>
                  No projects available. Create a project first to assign entities to it.
                </p>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={() => setProjectManageModal({ open: false, entity: null })}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProjectsForEntity}
                className={styles.submitButton}
                disabled={projects.length === 0}
              >
                Save Project Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}