import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-lg bg-muted", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
