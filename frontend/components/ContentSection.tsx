'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RefreshCw } from 'lucide-react';
import styles from './ContentSection.module.css';

interface ContentSectionProps {
  title: string;
  content: string;
  type: 'summary' | 'transcription';
  onRegenerate?: () => void;
  showRegenerate?: boolean;
  isRegenerating?: boolean;
}

export default function ContentSection({
  title,
  content,
  type,
  onRegenerate,
  showRegenerate = false,
  isRegenerating = false
}: ContentSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTranscription = (text: string) => {
    // Parse special markers in transcription
    let formatted = text;
    
    // Time stamps: [00:30] -> styled badge
    formatted = formatted.replace(
      /\[(\d{1,2}:\d{2})\]/g,
      '<span class="' + styles.timestamp + '">$1</span>'
    );
    
    // Speaker labels: [John]: -> bold colored name
    formatted = formatted.replace(
      /\[([^\]]+)\]:/g,
      '<span class="' + styles.speaker + '">$1:</span>'
    );
    
    // Action items: [ACTION] -> highlighted badge
    formatted = formatted.replace(
      /\[ACTION\]/g,
      '<span class="' + styles.actionBadge + '">ACTION</span>'
    );
    
    // Decisions: [DECISION] -> highlighted badge
    formatted = formatted.replace(
      /\[DECISION\]/g,
      '<span class="' + styles.decisionBadge + '">DECISION</span>'
    );
    
    // Unclear audio: [UNCLEAR] -> warning style
    formatted = formatted.replace(
      /\[UNCLEAR\]/g,
      '<span class="' + styles.unclearBadge + '">unclear</span>'
    );
    
    // Smart paragraph detection
    let paragraphs = formatted.split('\n\n').filter(p => p.trim());
    
    // If no natural paragraphs exist (text is one long block), create them intelligently
    if (paragraphs.length <= 1 && formatted.length > 200) {
      const singleText = paragraphs[0] || formatted;
      
      // Split on sentence boundaries (. ! ?) followed by space
      // This regex captures sentences while keeping their punctuation
      const sentences = singleText.match(/[^.!?]+[.!?]+(\s|$)/g) || [singleText];
      
      // Group sentences into paragraphs (3-4 sentences each or ~250 chars)
      paragraphs = [];
      let currentParagraph = '';
      let sentenceCount = 0;
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        currentParagraph += (currentParagraph ? ' ' : '') + trimmedSentence;
        sentenceCount++;
        
        // Create a new paragraph after 3-4 sentences or ~250 characters
        if (sentenceCount >= 3 || currentParagraph.length > 250) {
          // Look ahead - if next sentence is very short, include it
          const nextIndex = sentences.indexOf(sentence) + 1;
          if (nextIndex < sentences.length && sentences[nextIndex].length < 50 && sentenceCount < 4) {
            continue;
          }
          
          paragraphs.push(currentParagraph);
          currentParagraph = '';
          sentenceCount = 0;
        }
      }
      
      // Add any remaining content as final paragraph
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }
    }
    
    // Convert single newlines within paragraphs to <br> and wrap in <p> tags
    return paragraphs
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };

  return (
    <div className={styles.contentCard}>
      <div className={styles.contentHeader}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.actionButtons}>
          <button
            onClick={handleCopy}
            className={styles.copyButton}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {showRegenerate && onRegenerate && (
            <button
              onClick={onRegenerate}
              className={styles.regenerateButton}
              disabled={isRegenerating}
              title="Regenerate"
            >
              <RefreshCw size={16} className={isRegenerating ? styles.spinning : ''} />
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.contentBody}>
        {type === 'summary' ? (
          <div className={styles.markdown}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom checkbox rendering
                input: ({ node, ...props }) => {
                  if (props.type === 'checkbox') {
                    return (
                      <input
                        {...props}
                        disabled
                        className={styles.checkbox}
                      />
                    );
                  }
                  return <input {...props} />;
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div 
            className={styles.transcription}
            dangerouslySetInnerHTML={{ 
              __html: formatTranscription(content) 
            }}
          />
        )}
      </div>
    </div>
  );
}