import type { CSSProperties } from "react";

/**
 * Hand-built SVG botanicals: watercolour-style pink lilies, buds, leaves,
 * a pressed flower and a crochet heart. All decorative (aria-hidden, no pointer events).
 *
 * <LilyDefs /> must be rendered once near the top of the app: it holds the shared
 * gradients and the "watercolour" filter that the illustrations reference by id.
 */

/* ------------------------------------------------------------------ */
/* Shared gradients + watercolour filter                               */
/* ------------------------------------------------------------------ */

export function LilyDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="lily-petal" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f3d36f" />
          <stop offset="0.2" stopColor="#f7d3ad" />
          <stop offset="0.45" stopColor="#f2a3b1" />
          <stop offset="0.8" stopColor="#e0708c" />
          <stop offset="1" stopColor="#cf5a78" />
        </linearGradient>
        <linearGradient id="lily-petal-blush" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f1dc9c" />
          <stop offset="0.2" stopColor="#f6dcd2" />
          <stop offset="0.55" stopColor="#f1bac7" />
          <stop offset="1" stopColor="#dc8aa2" />
        </linearGradient>
        <radialGradient id="lily-throat" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d9dc86" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#f3d36f" stopOpacity="0.6" />
          <stop offset="1" stopColor="#f3d36f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lily-leaf" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6f7a52" />
          <stop offset="0.6" stopColor="#8b9470" />
          <stop offset="1" stopColor="#a9b08c" />
        </linearGradient>
        <linearGradient id="lily-bud" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8b9470" />
          <stop offset="0.3" stopColor="#d8b9a0" />
          <stop offset="0.7" stopColor="#e8a1b0" />
          <stop offset="1" stopColor="#d6728d" />
        </linearGradient>

        {/* wobbly edges + a little paper grain = hand-painted watercolour feel */}
        <filter
          id="watercolor"
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G" result="wobble" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="11" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0 0 0 0.64"
            result="grainAlpha"
          />
          <feComposite in="wobble" in2="grainAlpha" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Parts                                                               */
/* ------------------------------------------------------------------ */

const PETAL = "M0,0 C-24,-16 -36,-58 -7,-98 Q0,-107 7,-98 C36,-58 24,-16 0,0 Z";
const PETAL_WIDE = "M0,0 C-30,-18 -44,-60 -9,-100 Q0,-110 9,-100 C44,-60 30,-18 0,0 Z";
const SPOTS: Array<[number, number, number]> = [
  [-5, -20, 1.5],
  [4, -27, 1.8],
  [-2, -35, 1.4],
  [6, -42, 1.7],
  [-7, -44, 1.3],
  [1, -51, 1.5],
  [-4, -58, 1.2],
];

type LilyProps = {
  x: number;
  y: number;
  /** Diameter of the open flower, in SVG units. */
  size: number;
  rotate?: number;
  /** <1 tilts the flower away from the viewer. */
  squash?: number;
  tone?: "rose" | "blush";
};

export function Lily({ x, y, size, rotate = 0, squash = 1, tone = "rose" }: LilyProps) {
  const s = size / 210;
  const fill = tone === "rose" ? "url(#lily-petal)" : "url(#lily-petal-blush)";
  const petals = [
    { a: 0, wide: true },
    { a: 120, wide: true },
    { a: 240, wide: true },
    { a: 60, wide: false },
    { a: 180, wide: false },
    { a: 300, wide: false },
  ];
  const stamens = [-62, -34, -8, 20, 46, 72];

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s} ${s * squash})`}>
      {petals.map(({ a, wide }) => (
        <g key={a} transform={`rotate(${a + 8})`}>
          <path d={wide ? PETAL_WIDE : PETAL} fill={fill} />
          <path
            d={wide ? PETAL_WIDE : PETAL}
            fill="none"
            stroke="#c9506c"
            strokeOpacity="0.38"
            strokeWidth="1.6"
          />
          <path d="M0,-8 Q-2,-52 0,-88" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.3" />
          {SPOTS.map(([sx, sy, r], i) => (
            <circle key={i} cx={sx} cy={sy} r={r} fill="#8e3b52" opacity="0.5" />
          ))}
        </g>
      ))}
      <circle r="26" fill="url(#lily-throat)" />
      {stamens.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const len = 44 + (i % 3) * 7;
        const ex = Math.sin(rad) * len;
        const ey = -Math.cos(rad) * len;
        const cx = ex * 0.45 + 4;
        const cy = ey * 0.55;
        return (
          <g key={a}>
            <path d={`M0,0 Q${cx},${cy} ${ex},${ey}`} fill="none" stroke="#c9d09a" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx={ex} cy={ey} rx="3.4" ry="9" transform={`rotate(${a} ${ex} ${ey})`} fill="#8e2f3a" />
            <ellipse cx={ex - 0.8} cy={ey - 2} rx="1" ry="4" transform={`rotate(${a} ${ex} ${ey})`} fill="#d98a8f" opacity="0.7" />
          </g>
        );
      })}
      <path d="M0,0 Q16,-30 12,-66" fill="none" stroke="#b5c08a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="-67" r="3.6" fill="#7e9150" />
    </g>
  );
}

type LeafProps = { x: number; y: number; length: number; rotate: number; width?: number };

export function Leaf({ x, y, length, rotate, width = 1 }: LeafProps) {
  const w = 16 * width;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        d={`M0,0 C${-w},${-length * 0.25} ${-w * 0.9},${-length * 0.7} 0,${-length} C${w * 0.9},${-length * 0.7} ${w},${-length * 0.25} 0,0 Z`}
        fill="url(#lily-leaf)"
        opacity="0.94"
      />
      <path
        d={`M0,-3 Q${2 * width},${-length * 0.5} 0,${-length * 0.94}`}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.4"
      />
    </g>
  );
}

type BudProps = { x: number; y: number; length: number; rotate: number };

export function Bud({ x, y, length, rotate }: BudProps) {
  const w = length * 0.16;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        d={`M0,0 C${-w},${-length * 0.3} ${-w},${-length * 0.7} 0,${-length} C${w},${-length * 0.7} ${w},${-length * 0.3} 0,0 Z`}
        fill="url(#lily-bud)"
      />
      <path d={`M0,-4 Q1,${-length * 0.5} 0,${-length * 0.92}`} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Corner clusters                                                     */
/* ------------------------------------------------------------------ */

type ClusterProps = { className?: string; variant?: "a" | "b" };

/**
 * A cluster designed for the TOP-LEFT corner of its box (stems start at the corner).
 * Rotate it 180° with CSS for the bottom-right corner, flip it for the others.
 */
export function FloralCluster({ className, variant = "a" }: ClusterProps) {
  const tone = variant === "a" ? "rose" : "blush";
  return (
    <svg
      className={className}
      viewBox="0 0 560 560"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <g filter="url(#watercolor)">
        {variant === "a" ? (
          <>
            <g fill="none" stroke="#7d8a5e" strokeWidth="4.5" strokeLinecap="round" opacity="0.92">
              <path d="M-10,-10 C110,70 190,120 252,196" />
              <path d="M-10,50 C80,170 200,260 332,326" />
              <path d="M20,-14 C200,16 330,60 446,96" />
              <path d="M-12,170 C60,240 118,330 150,430" />
            </g>
            <Leaf x={70} y={40} length={190} rotate={118} width={1.1} />
            <Leaf x={150} y={90} length={170} rotate={100} />
            <Leaf x={60} y={170} length={200} rotate={150} width={1.1} />
            <Leaf x={250} y={160} length={150} rotate={70} />
            <Leaf x={200} y={250} length={170} rotate={135} />
            <Leaf x={340} y={290} length={140} rotate={60} width={0.9} />
            <Bud x={446} y={96} length={96} rotate={102} />
            <Bud x={370} y={74} length={74} rotate={96} />
            <Bud x={150} y={430} length={90} rotate={170} />
            <Lily x={252} y={196} size={230} rotate={-12} squash={0.92} tone={tone} />
            <Lily x={334} y={326} size={176} rotate={28} squash={0.86} tone={tone} />
          </>
        ) : (
          <>
            <g fill="none" stroke="#858c70" strokeWidth="4" strokeLinecap="round" opacity="0.9">
              <path d="M-10,0 C100,60 180,130 236,214" />
              <path d="M10,-10 C170,10 300,50 404,110" />
            </g>
            <Leaf x={40} y={30} length={170} rotate={125} />
            <Leaf x={130} y={80} length={160} rotate={95} width={1.1} />
            <Leaf x={150} y={180} length={170} rotate={150} />
            <Leaf x={290} y={110} length={120} rotate={80} width={0.9} />
            <Bud x={404} y={110} length={88} rotate={108} />
            <Bud x={320} y={80} length={68} rotate={100} />
            <Lily x={236} y={214} size={220} rotate={18} squash={0.9} tone={tone} />
            <Lily x={360} y={250} size={150} rotate={-20} squash={0.8} tone={tone} />
          </>
        )}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Small scrapbook charms                                              */
/* ------------------------------------------------------------------ */

export function PressedFlower({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 90" aria-hidden="true" focusable="false">
      <path d="M30 88 C29 66 31 48 30 30" stroke="#858c70" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M30 66 C20 62 14 54 13 46 C22 48 28 56 30 66Z" fill="#9aa27f" opacity="0.88" />
      <path d="M30 58 C40 55 45 48 46 40 C37 42 32 49 30 58Z" fill="#858c70" opacity="0.88" />
      <g transform="translate(30 24)" fill="#b7a3bd">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-10" rx="5.2" ry="10" transform={`rotate(${a})`} opacity="0.92" />
        ))}
      </g>
      <circle cx="30" cy="24" r="3.4" fill="#f5d98a" />
    </svg>
  );
}

export function CrochetHeart({ className, style }: { className?: string; style?: CSSProperties }) {
  const heart =
    "M20 46 C6 36 2 28 2 22 C2 15 7 11 12 11 C16 11 19 13 20 16 C21 13 24 11 28 11 C33 11 38 15 38 22 C38 28 34 36 20 46Z";
  return (
    <svg className={className} style={style} viewBox="0 0 40 52" aria-hidden="true" focusable="false">
      <path d="M20 0 L20 14" stroke="#a88a5f" strokeWidth="1.4" />
      <path d={heart} fill="#cf7f89" />
      <path
        d={heart}
        transform="translate(20 28) scale(0.78) translate(-20 -28)"
        fill="none"
        stroke="#f6d9db"
        strokeWidth="1.1"
        strokeDasharray="2 2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A little botanical sprig, used as a flourish. */
export function Sprig({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" aria-hidden="true" focusable="false">
      <path d="M2 24 C30 10 70 36 118 14" stroke="#858c70" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {[18, 38, 60, 82, 102].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${i % 2 ? 22 : 20} q${i % 2 ? 6 : -6} ${i % 2 ? 9 : -10} ${i % 2 ? 11 : -12} ${i % 2 ? 6 : -4}`}
          stroke="#858c70"
          strokeWidth="1.2"
          fill="#a9b08c"
          fillOpacity="0.6"
        />
      ))}
      <circle cx="118" cy="14" r="3" fill="#b9787e" />
    </svg>
  );
}
