import React from 'react';
import styles from './TemplateSelector.module.css';

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userTemplate: string;
  placeholders?: string[];
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  meeting: {
    id: 'meeting',
    name: 'Meeting Transcription',
    systemPrompt: 'You are a professional meeting transcriber. Focus on accuracy, speaker identification, and action items.',
    userTemplate: `=== MEETING CONTEXT ===
Date: {date}
Attendees: {attendees}
Agenda: {agenda}

=== COMPANY GLOSSARY ===
Company: {company}
Projects: {projects}
Technical terms: {terms}

=== TRANSCRIPTION INSTRUCTIONS ===
1. Include timestamps every 30 seconds
2. Label speakers clearly [Name]:
3. Mark action items with [ACTION]
4. Mark decisions with [DECISION]
5. Note unclear audio with [UNCLEAR]
6. Preserve technical discussions verbatim

=== SPECIAL INSTRUCTIONS ===
{customInstructions}`,
    placeholders: ['date', 'attendees', 'agenda', 'company', 'projects', 'terms', 'customInstructions']
  },
  
  technical: {
    id: 'technical',
    name: 'Technical Discussion',
    systemPrompt: 'You are a technical transcription specialist with expertise in software development.',
    userTemplate: `=== TECHNICAL CONTEXT ===
Domain: {domain}
Technologies: {technologies}
Codebase: {codebase}

=== TERMINOLOGY ===
Frameworks: {frameworks}
Libraries: {libraries}
Common variables: {variables}

=== INSTRUCTIONS ===
1. Preserve code snippets exactly
2. Maintain technical accuracy
3. Include API names and endpoints
4. Note architecture decisions
5. Flag ambiguous technical terms

=== CUSTOM NOTES ===
{customNotes}`,
    placeholders: ['domain', 'technologies', 'codebase', 'frameworks', 'libraries', 'variables', 'customNotes']
  },
  
  podcast: {
    id: 'podcast',
    name: 'Podcast/Interview',
    systemPrompt: 'You are transcribing a podcast or interview. Maintain conversational tone.',
    userTemplate: `=== SHOW INFORMATION ===
Show: {showName}
Host(s): {hosts}
Guest(s): {guests}
Topic: {topic}

=== STYLE GUIDE ===
- Include [LAUGHTER], [PAUSE], [CROSSTALK]
- Add chapter markers for topic changes
- Clean up filler words unless significant
- Preserve personality and tone

=== EPISODE NOTES ===
{episodeNotes}`,
    placeholders: ['showName', 'hosts', 'guests', 'topic', 'episodeNotes']
  },
  
  custom: {
    id: 'custom',
    name: 'Custom Template',
    systemPrompt: '',
    userTemplate: '',
    placeholders: []
  }
};

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateKey: string) => void;
  onTemplateCustomize?: (template: PromptTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onTemplateCustomize
}) => {
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateKey = e.target.value;
    onTemplateSelect(templateKey);
    
    if (templateKey && templateKey !== 'custom' && onTemplateCustomize) {
      const template = PROMPT_TEMPLATES[templateKey];
      if (template) {
        onTemplateCustomize(template);
      }
    }
  };
  
  return (
    <div className={styles.templateSelector}>
      <label htmlFor="template-select" className={styles.label}>
        📋 Prompt Template
      </label>
      <select
        id="template-select"
        className={styles.select}
        value={selectedTemplate || ''}
        onChange={handleTemplateChange}
      >
        <option value="">None - Start from scratch</option>
        {Object.entries(PROMPT_TEMPLATES).map(([key, template]) => (
          <option key={key} value={key}>
            {template.name}
          </option>
        ))}
      </select>
      
      {selectedTemplate && selectedTemplate !== 'custom' && (
        <div className={styles.templateInfo}>
          <p className={styles.description}>
            This template includes pre-configured prompts for {PROMPT_TEMPLATES[selectedTemplate].name.toLowerCase()}.
            Fill in the placeholders below to customize for your specific needs.
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;