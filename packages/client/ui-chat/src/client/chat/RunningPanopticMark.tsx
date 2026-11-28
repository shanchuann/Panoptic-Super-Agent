/** Decorative Panoptic star and orbit for the running Chat status. */
import css from './ChatView.module.css'

/**
 * Render a star and orbit with motion controlled by accessibility media queries.
 * @returns A decorative vector mark that inherits the running status color.
 */
export function RunningPanopticMark() {
  return (
    <span className={css.runningIcon} aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
        <g className={css.runningOrbit}>
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-25 12 12)" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="21" cy="8" r="1.4" fill="currentColor" />
        </g>
        <path className={css.runningStar} d="M12 2C12.8 9.2 14.8 11.2 21 12C14.8 12.8 12.8 14.8 12 22C11.2 14.8 9.2 12.8 3 12C9.2 11.2 11.2 9.2 12 2Z" fill="currentColor" />
      </svg>
    </span>
  )
}
