import Image from "next/image";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type ImageContent = MaintenanceContent["images"]["gridPlate"];

const STEP = 10;
const WIDTH = 100;
const HEIGHT = 125;
const lines = (count: number, step: number) => Array.from({ length: count + 1 }, (_, i) => i * step);

/** Generated technical grid with edge calibration ticks: the fallback for the grid-plate image. */
const TechnicalGrid = () => (
  <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} fill="none" stroke="currentColor" className="size-full text-ink" preserveAspectRatio="none">
    {lines(WIDTH / STEP, STEP).map((x) => (
      <path key={`v${x}`} d={`M${x} 0V${HEIGHT}`} strokeWidth={0.15} />
    ))}
    {lines(Math.floor(HEIGHT / STEP), STEP).map((y) => (
      <path key={`h${y}`} d={`M0 ${y}H${WIDTH}`} strokeWidth={0.15} />
    ))}
    {lines(WIDTH / 2, 2).map((x) => (
      <path key={`t${x}`} d={`M${x} 0V${x % STEP === 0 ? 3 : 1.5}`} strokeWidth={0.2} />
    ))}
    {lines(Math.floor(HEIGHT / 2), 2).map((y) => (
      <path key={`l${y}`} d={`M0 ${y}H${y % STEP === 0 ? 3 : 1.5}`} strokeWidth={0.2} />
    ))}
    <path d={`M0 ${HEIGHT}L${WIDTH} 0`} strokeWidth={0.2} strokeDasharray="1 2" />
  </svg>
);

/** Background depth plate; the image when present, otherwise the generated grid. Always decorative. */
export const GridPlate = ({ image, available }: { image: ImageContent; available: boolean }) => (
  <div aria-hidden className="relative size-full opacity-50">
    {available ? (
      <Image src={image.src} alt="" fill sizes="50vw" className="object-cover grayscale contrast-125" />
    ) : (
      <TechnicalGrid />
    )}
    <div className="absolute inset-0 bg-[radial-gradient(var(--text-primary)_0.8px,transparent_1.2px)] bg-size-[5px_5px] opacity-20 mask-[linear-gradient(135deg,transparent_40%,black)]" />
  </div>
);
