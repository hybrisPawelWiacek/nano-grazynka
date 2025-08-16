import styles from './VoiceNoteSkeleton.module.css';

export default function VoiceNoteSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.header}>
        <div className={styles.title}></div>
        <div className={styles.date}></div>
      </div>
      <div className={styles.content}>
        <div className={styles.line} style={{ width: '90%' }}></div>
        <div className={styles.line} style={{ width: '75%' }}></div>
        <div className={styles.line} style={{ width: '85%' }}></div>
      </div>
      <div className={styles.footer}>
        <div className={styles.tag}></div>
        <div className={styles.tag}></div>
        <div className={styles.duration}></div>
      </div>
    </div>
  );
}