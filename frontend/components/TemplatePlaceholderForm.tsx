import React, { useState, useEffect } from 'react';
import styles from './TemplatePlaceholderForm.module.css';

interface PlaceholderField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

interface TemplatePlaceholderFormProps {
  template: string;
  templateText: string;
  onTemplateUpdate: (filledTemplate: string) => void;
}

// Extract placeholders from template text (e.g., {date}, {attendees})
function extractPlaceholders(templateText: string): PlaceholderField[] {
  const regex = /\{([^}]+)\}/g;
  const matches = templateText.matchAll(regex);
  const uniquePlaceholders = new Set<string>();
  
  for (const match of matches) {
    uniquePlaceholders.add(match[1]);
  }
  
  return Array.from(uniquePlaceholders).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
    placeholder: getPlaceholderHint(key),
    multiline: isMultilineField(key)
  }));
}

function getPlaceholderHint(key: string): string {
  const hints: Record<string, string> = {
    date: 'e.g., January 15, 2025',
    attendees: 'e.g., John Smith, Sarah Johnson, Mike Chen',
    agenda: 'Main topics to discuss',
    company: 'Your company name',
    projects: 'e.g., Project Alpha, Beta Release',
    terms: 'Technical terms and acronyms',
    domain: 'e.g., FinTech, Healthcare, E-commerce',
    technologies: 'e.g., React, Node.js, PostgreSQL',
    codebase: 'Repository or project name',
    frameworks: 'e.g., Next.js, Express, Django',
    libraries: 'e.g., Prisma, Zod, React Query',
    variables: 'Common variable names',
    showName: 'Podcast or show name',
    hosts: 'Host names',
    guests: 'Guest names',
    topic: 'Episode topic',
    customInstructions: 'Any special requirements'
  };
  
  return hints[key] || `Enter ${key}`;
}

function isMultilineField(key: string): boolean {
  const multilineFields = ['agenda', 'terms', 'projects', 'customInstructions', 'variables'];
  return multilineFields.includes(key);
}

export default function TemplatePlaceholderForm({
  template,
  templateText,
  onTemplateUpdate
}: TemplatePlaceholderFormProps) {
  const placeholders = extractPlaceholders(templateText);
  const [values, setValues] = useState<Record<string, string>>({});
  
  // Initialize values
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    placeholders.forEach(field => {
      initialValues[field.key] = values[field.key] || '';
    });
    setValues(initialValues);
  }, [template, templateText]);
  
  // Update template when values change
  useEffect(() => {
    let filledTemplate = templateText;
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      filledTemplate = filledTemplate.replace(regex, value || `{${key}}`);
    });
    onTemplateUpdate(filledTemplate);
  }, [values, templateText, onTemplateUpdate]);
  
  const handleValueChange = (key: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleClearAll = () => {
    const clearedValues: Record<string, string> = {};
    placeholders.forEach(field => {
      clearedValues[field.key] = '';
    });
    setValues(clearedValues);
  };
  
  const hasValues = Object.values(values).some(v => v.trim() !== '');
  
  if (placeholders.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Template Variables</h4>
        {hasValues && (
          <button
            type="button"
            onClick={handleClearAll}
            className={styles.clearButton}
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className={styles.fields}>
        {placeholders.map(field => (
          <div key={field.key} className={styles.field}>
            <label htmlFor={`placeholder-${field.key}`} className={styles.label}>
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                id={`placeholder-${field.key}`}
                value={values[field.key] || ''}
                onChange={(e) => handleValueChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <input
                id={`placeholder-${field.key}`}
                type="text"
                value={values[field.key] || ''}
                onChange={(e) => handleValueChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={styles.input}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className={styles.preview}>
        <h5 className={styles.previewTitle}>Preview</h5>
        <div className={styles.previewContent}>
          {templateText.split('\n').slice(0, 5).map((line, index) => {
            let previewLine = line;
            Object.entries(values).forEach(([key, value]) => {
              if (value) {
                const regex = new RegExp(`\\{${key}\\}`, 'g');
                previewLine = previewLine.replace(regex, 
                  `<span class="${styles.highlight}">${value}</span>`
                );
              }
            });
            return (
              <div 
                key={index} 
                className={styles.previewLine}
                dangerouslySetInnerHTML={{ __html: previewLine }}
              />
            );
          })}
          {templateText.split('\n').length > 5 && (
            <div className={styles.previewMore}>...</div>
          )}
        </div>
      </div>
    </div>
  );
}