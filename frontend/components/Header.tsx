'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Download, Trash2 } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  // Page identification
  currentPage?: 'home' | 'library' | 'dashboard' | 'note' | 'settings';
  
  // Back button
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
  
  // Custom navigation content
  customNavContent?: React.ReactNode;
  
  // Note-specific props
  showMoreMenu?: boolean;
  moreMenuItems?: Array<{
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
    isDivider?: boolean;
    isDanger?: boolean;
  }>;
  onMoreMenuToggle?: (isOpen: boolean) => void;
  
  // Custom right content (for complex pages like homepage)
  customRightContent?: React.ReactNode;
}

export default function Header({
  currentPage,
  showBackButton = false,
  onBackClick,
  backButtonText = 'Back',
  customNavContent,
  showMoreMenu = false,
  moreMenuItems = [],
  onMoreMenuToggle,
  customRightContent
}: HeaderProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  
  const handleMoreMenuToggle = () => {
    const newState = !isMoreMenuOpen;
    setIsMoreMenuOpen(newState);
    onMoreMenuToggle?.(newState);
  };
  
  const getDefaultNavLinks = () => {
    const links = [];
    
    if (currentPage !== 'home') {
      links.push(
        <Link key="upload" href="/" className={styles.navLink}>
          Upload
        </Link>
      );
    }
    
    if (currentPage !== 'dashboard') {
      links.push(
        <Link key="dashboard" href="/dashboard" className={styles.navLink}>
          Dashboard
        </Link>
      );
    }
    
    if (currentPage !== 'library') {
      links.push(
        <Link key="library" href="/library" className={styles.navLink}>
          Library
        </Link>
      );
    }
    
    if (currentPage === 'home' || currentPage === 'dashboard' || currentPage === 'library') {
      links.push(
        <Link key="settings" href="/settings" className={styles.navLink}>
          Settings
        </Link>
      );
    }
    
    return links;
  };
  
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Left section */}
        <div className={styles.headerLeft}>
          {showBackButton && (
            <button onClick={onBackClick} className={styles.backButton}>
              <ArrowLeft size={20} />
              <span>{backButtonText}</span>
            </button>
          )}
          
          <Link href="/" className={styles.logo}>
            nano-Grażynka
          </Link>
        </div>
        
        {/* Right section */}
        <div className={styles.headerRight}>
          {customRightContent ? (
            customRightContent
          ) : (
            <>
              <nav className={styles.nav}>
                {customNavContent || getDefaultNavLinks()}
              </nav>
              
              {showMoreMenu && (
                <div className={styles.headerActions}>
                  <button 
                    onClick={handleMoreMenuToggle} 
                    className={styles.moreButton}
                    aria-label="More actions"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  
                  {isMoreMenuOpen && moreMenuItems.length > 0 && (
                    <div className={styles.dropdown}>
                      {moreMenuItems.map((item, index) => {
                        if (item.isDivider) {
                          return <div key={index} className={styles.dropdownDivider} />;
                        }
                        
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              item.onClick();
                              setIsMoreMenuOpen(false);
                            }}
                            className={`${styles.dropdownItem} ${item.isDanger ? styles.danger : ''}`}
                          >
                            {item.icon}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}