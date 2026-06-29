import React from 'react';
import styles from './BlogSkeleton.module.css';

export default function BlogSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonMeta}>
        <div className={`${styles.skeletonLine} ${styles.w30}`} />
        <div className={`${styles.skeletonLine} ${styles.w40}`} />
      </div>
      <div className={`${styles.skeletonTitle} ${styles.w80}`} />
      <div className={`${styles.skeletonText} ${styles.w100}`} />
      <div className={`${styles.skeletonText} ${styles.w95}`} />
      <div className={`${styles.skeletonText} ${styles.w60}`} />
    </div>
  );
}
