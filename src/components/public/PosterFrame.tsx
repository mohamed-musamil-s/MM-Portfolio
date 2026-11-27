import { RegistrationMark } from "@/components/motion/RegistrationMark";

/**
 * The poster's registration frame (docs/STYLE.md §5.1): four corners, edge
 * midpoints from `sm` (unless `edges={false}`, for dense layouts), bullseye on
 * the right-hand corners, and short hairline companions under the top
 * corners. Parent must be `relative`.
 */
export const PosterFrame = ({ edges = true }: { edges?: boolean }) => (
  <div aria-hidden className="pointer-events-none absolute inset-frame print:hidden">
    <RegistrationMark className="absolute top-0 left-0 -translate-1/2" delay={0.05} />
    <RegistrationMark
      variant="bullseye"
      className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"
      delay={0.15}
    />
    <RegistrationMark className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2" delay={0.25} />
    <RegistrationMark variant="bullseye" className="absolute right-0 bottom-0 translate-1/2" delay={0.35} />
    {edges ? (
      <>
        <RegistrationMark className="absolute top-0 left-1/2 hidden -translate-1/2 sm:block" delay={0.45} />
        <RegistrationMark
          className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 sm:block"
          delay={0.5}
        />
        <RegistrationMark className="absolute top-1/2 left-0 hidden -translate-1/2 sm:block" delay={0.55} />
        <RegistrationMark
          className="absolute top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 sm:block"
          delay={0.6}
        />
        <span className="absolute top-6 left-0 hidden h-px w-16 bg-rule sm:block" />
        <span className="absolute top-6 right-0 hidden h-px w-16 bg-rule sm:block" />
      </>
    ) : null}
  </div>
);
