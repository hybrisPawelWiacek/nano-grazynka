'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './EntityManager.module.css';
import { 
  listEntities, 
  createEntity, 
  updateEntity, 
  deleteEntity,
  type Entity, 
  type EntityType 
} from '../lib/api/entities';
import { listProjects, type Project } from '../lib/api/projects';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entitiesResponse, projectsResponse] = await Promise.all([
        listEntities(),
        listProjects()
      ]);
      setEntities(entitiesResponse.entities);
      setProjects(projectsResponse.projects);
    } catch (err) {
      setError('Failed to load data');
      console.error('Failed to load entities:', err);
    } finally {
      setLoading(false);
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
  }, [entities, searchTerm, filterType]);

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
      await deleteEntity(entityId);
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
        const updated = await updateEntity(editingEntity.id, {
          name: formData.name,
          type: formData.type,
          value: formData.value,
          aliases: formData.aliases.length > 0 ? formData.aliases : undefined,
          description: formData.description || undefined
        });
        setEntities(entities.map(e => e.id === editingEntity.id ? updated : e));
      } else {
        // Create new entity
        const created = await createEntity({
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
      await Promise.all(Array.from(selectedEntities).map(id => deleteEntity(id)));
      setEntities(entities.filter(e => !selectedEntities.has(e.id)));
      setSelectedEntities(new Set());
    } catch (err) {
      setError('Failed to delete entities');
      console.error('Failed to delete entities:', err);
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
        </div>
        <div className={styles.toolbarRight}>
          {selectedEntities.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className={styles.bulkDeleteButton}
            >
              Delete ({selectedEntities.size})
            </button>
          )}
          <button
            onClick={handleAddEntity}
            className={styles.addButton}
          >
            + New Entity
          </button>
        </div>
      </div>

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
    </div>
  );
}