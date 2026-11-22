import Image from "next/image";
import { CropMarks } from "@/components/motion/CropMarks";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type ImageContent = MaintenanceContent["images"]["portrait"];

/** Decorative halftone plate shown until the portrait file exists on disk. */
const HalftonePlaceholder = () => (
  <div aria-hidden className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(var(--text-primary)_1px,transparent_1.6px)] bg-size-[6px_6px] opacity-30 mask-[radial-gradient(ellipse_at_55%_38%,black_10%,transparent_68%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(var(--text-primary)_1.4px,transparent_2px)] bg-size-[9px_9px] opacity-20 mask-[linear-gradient(to_top,black,transparent_55%)]" />
  </div>
);

/** 4:5 framed portrait with crop marks; grayscale + contrast per docs/STYLE.md §6.6. */
export const PortraitPlate = ({ image, available }: { image: ImageContent; available: boolean }) => (
  <figure className="relative aspect-4/5 w-full border border-rule bg-newsprint">
    <CropMarks />
    {available ? (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(min-width: 1024px) 40vw, 90vw"
        className="object-cover grayscale contrast-125"
      />
    ) : (
      <HalftonePlaceholder />
    )}
  </figure>
);
