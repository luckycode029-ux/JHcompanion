import styles from "./skeleton.module.css";
import classNames from "classnames";

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  borderRadius?: string;
}

export function Skeleton({ className, height, width, borderRadius }: SkeletonProps) {
  return (
    <div
      className={classNames(styles.skeleton, className)}
      style={{ height, width, borderRadius }}
    />
  );
}
