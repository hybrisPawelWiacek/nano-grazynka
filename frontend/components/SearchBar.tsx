'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, ProcessingStatus } from '@/lib/types';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: {
    status?: ProcessingStatus;
    language?: Language;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export default function SearchBar({ onSearch, onFilterChange }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus | ''>('');
  const [language, setLanguage] = useState<Language | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]); // onSearch excluded to prevent infinite loops

  // Notify parent of filter changes
  useEffect(() => {
    const filters: any = {};
    if (status) filters.status = status;
    if (language) filters.language = language;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    onFilterChange(filters);
  }, [status, language, startDate, endDate]); // onFilterChange excluded to prevent infinite loops

  const clearFilters = () => {
    setStatus('');
    setLanguage('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.searchRow}>
        <div className={styles.searchInputWrapper}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search voice notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search voice notes"
          />
          {searchQuery && (
            <button
              className={styles.clearButton}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          Filters
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              className={styles.filterSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as ProcessingStatus | '')}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="language-filter">
              Language
            </label>
            <select
              id="language-filter"
              className={styles.filterSelect}
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language | '')}
            >
              <option value="">All</option>
              <option value="en">English</option>
              <option value="pl">Polish</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="start-date">
              From Date
            </label>
            <input
              id="start-date"
              type="date"
              className={styles.filterInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="end-date">
              To Date
            </label>
            <input
              id="end-date"
              type="date"
              className={styles.filterInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button className={styles.clearFiltersButton} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}