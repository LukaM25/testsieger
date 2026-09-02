import Image from "next/image";

type MarketplaceLogosProps = {
  className?: string;
  label?: string;
};

const marketplaces = [
  {
    src: "/images/logos2/amazon.png",
    alt: "Amazon",
    width: 3000,
    height: 3000,
    className: "h-12 w-12 sm:h-20 sm:w-20",
  },
  {
    src: "/images/logos2/ebay.png",
    alt: "eBay",
    width: 2000,
    height: 800,
    className: "h-9 w-[90px] sm:h-14 sm:w-[140px]",
  },
  {
    src: "/images/logos2/shopify.png",
    alt: "Shopify",
    width: 1000,
    height: 600,
    className: "h-12 w-[104px] sm:h-16 sm:w-[150px]",
  },
];

export default function MarketplaceLogos({
  className = "",
  label = "Verkaufskanäle",
}: MarketplaceLogosProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5 ${className}`}
      role="group"
      aria-label={label}
      data-marketplace-logos
    >
      {marketplaces.map((marketplace) => (
        <Image
          key={marketplace.src}
          src={marketplace.src}
          alt={marketplace.alt}
          width={marketplace.width}
          height={marketplace.height}
          sizes="(min-width: 640px) 150px, 104px"
          className={`${marketplace.className} shrink-0 object-contain`}
        />
      ))}
    </div>
  );
}
