'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './ConversionModal.module.css';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageCount: number;
}

export default function ConversionModal({ isOpen, onClose, usageCount }: ConversionModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      {/* Backdrop */}
      <div 
        className={styles.backdrop}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={styles.modalContainer}>
        <div className={styles.modal}>
          {/* Close button */}
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Content */}
          <div className={styles.content}>
            {/* Icon */}
            <div className={styles.iconContainer}>
              <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            {/* Title */}
            <h3 className={styles.title}>
              You've Discovered the Power of nano-Grażynka!
            </h3>
            
            {/* Message */}
            <p className={styles.message}>
              You've used all {usageCount} free transcriptions. Create a free account to continue and unlock:
            </p>
            
            {/* Benefits */}
            <ul className={styles.benefitsList}>
              <li className={styles.benefitItem}>
                <svg className={styles.benefitIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={styles.benefitText}>
                  <strong>5 monthly transcriptions</strong> with free account
                </span>
              </li>
              <li className={styles.benefitItem}>
                <svg className={styles.benefitIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={styles.benefitText}>
                  <strong>Save and access</strong> all your transcriptions
                </span>
              </li>
              <li className={styles.benefitItem}>
                <svg className={styles.benefitIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={styles.benefitText}>
                  <strong>Priority processing</strong> for faster results
                </span>
              </li>
              <li className={styles.benefitItem}>
                <svg className={styles.benefitIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={styles.benefitText}>
                  <strong>Detailed analytics</strong> and usage insights
                </span>
              </li>
            </ul>
            
            {/* CTAs */}
            <div className={styles.ctaContainer}>
              <Link
                href="/register"
                className={styles.primaryButton}
              >
                Sign Up - It's Free!
              </Link>
              <Link
                href="/login"
                className={styles.secondaryButton}
              >
                Already have an account? Login
              </Link>
              <button
                onClick={onClose}
                className={styles.laterButton}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}