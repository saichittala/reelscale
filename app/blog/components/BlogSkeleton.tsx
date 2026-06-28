import React from 'react';
import styles from './BlogSkeleton.module.css';

export default function BlogSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonMeta}>
        <div className={styles.skeletonLine} style={{ width: '30%' }} />
        <div className={styles.skeletonLine} style={{ width: '40%' }} />
      </div>
      <div className={styles.skeletonTitle} style={{ width: '80%' }} />
      <div className={styles.skeletonText} style={{ width: '100%' }} />
      <div className={styles.skeletonText} style={{ width: '95%' }} />
      <div className={styles.skeletonText} style={{ width: '60%' }} />
    </div>
  );
}
