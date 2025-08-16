'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { projectsApi } from '../lib/api/projects';
import { type Entity, type EntityType } from '../lib/api/entities';
import styles from './EntityPills.module.css';
import Link from 'next/link';

interface EntityPillsProps {
  projectId: string | null;
  maxDisplay?: number;
  className?: string;
}

const getEntityTypeColor = (type: EntityType): string => {
  switch (type) {
    case 'person':
      return styles.person;
    case 'company':
      return styles.company;
    case 'technical':
      return styles.technical;
    case 'product':
      return styles.product;
    default:
      return '';
  }
};

const getEntityTypeIcon = (type: EntityType): string => {
  switch (type) {
    case 'person':
      return '👤';
    case 'company':
      return '🏢';
    case 'technical':
      return '⚙️';
    case 'product':
      return '📦';
    default:
      return '📌';
  }
};

export default function EntityPills({ 
  projectId, 
  maxDisplay = 8,
  className 
}: EntityPillsProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (projectId) {
      loadProjectEntities();
    } else {
      setEntities([]);
      setTotalCount(0);
    }
  }, [projectId]);

  const loadProjectEntities = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await projectsApi.getProjectEntities(projectId);
      setEntities(response.entities.slice(0, maxDisplay));
      setTotalCount(response.total);
    } catch (error) {
      console.error('Failed to load project entities:', error);
      setEntities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId || entities.length === 0) {
    return null;
  }

  const remainingCount = Math.max(0, totalCount - maxDisplay);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.pillsWrapper}>
        <span className={styles.label}>Project entities:</span>
        
        <div className={styles.pills}>
          {entities.map(entity => (
            <div
              key={entity.id}
              className={`${styles.pill} ${getEntityTypeColor(entity.type)}`}
              title={`${entity.value}${entity.aliases?.length ? ` (${entity.aliases.join(', ')})` : ''}`}
            >
              <span className={styles.pillIcon}>
                {getEntityTypeIcon(entity.type)}
              </span>
              <span className={styles.pillText}>{entity.name}</span>
            </div>
          ))}
          
          {remainingCount > 0 && (
            <div className={`${styles.pill} ${styles.morePill}`}>
              <span className={styles.pillText}>+{remainingCount} more</span>
            </div>
          )}
        </div>

        <Link href="/settings?tab=entities" className={styles.viewAllLink}>
          <span>View all</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}
    </div>
  );
}