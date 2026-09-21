/**
 * The "P3" pinwheel mark: one L-shaped blade rotated 90/180/270 about the
 * centre for exact rotational symmetry. Three blades use `currentColor`
 * (not a fixed dark value) so the mark follows whatever color the
 * surrounding link/text is set to — needed because ImmersiveNav switches
 * its logo between white (over the hero video) and dark (once solid) on
 * scroll, and SiteHeader is always dark. Only the accent blade stays the
 * fixed brand red, since that should read the same in both contexts.
 *
 * Sized via `width`/`height` in em by default so it scales with whatever
 * font-size the surrounding .logo rule sets — no separate size prop
 * needed for the two current call sites (both 22px), but one can still
 * be passed if a future spot needs a fixed pixel size instead.
 *
 * `shape-rendering="crispEdges"` turns off anti-aliasing on the blade
 * edges. Every path here is pure horizontal/vertical lines (no curves,
 * no diagonals), so there's nothing for anti-aliasing to smooth *except*
 * blur otherwise-sharp corners at the small sizes this actually renders
 * at (22px in the header, 16px as a favicon) — the mark was reading as
 * noticeably softer than the surrounding text before this was added.
 */
export function LogoMark({ size = "1em", className }: { size?: string | number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Timchenko Art"
      shapeRendering="crispEdges"
    >
      <g>
        <path d="M8 8h24v7H15v17H8V8Z" fill="currentColor" />
      </g>
      <g transform="rotate(90 32 32)">
        <path d="M8 8h24v7H15v17H8V8Z" fill="#E22D2D" />
      </g>
      <g transform="rotate(180 32 32)">
        <path d="M8 8h24v7H15v17H8V8Z" fill="currentColor" />
      </g>
      <g transform="rotate(270 32 32)">
        <path d="M8 8h24v7H15v17H8V8Z" fill="currentColor" />
      </g>
    </svg>
  );
}
