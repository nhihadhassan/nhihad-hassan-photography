export type PortfolioCategory =
  | "events"
  | "nightlife"
  | "portraits"
  | "lifestyle"
  | "weddings-couples";

export type PortfolioItem = {
  id: string;
  title: string;
  category: PortfolioCategory;
  date: string;
  location: string;
  imageUrl: string;
  alt: string;
  featured: boolean;
  description: string;
  orientation: "portrait" | "landscape" | "square";
};

export type FeaturedGallery = {
  slug: string;
  title: string;
  category: PortfolioCategory;
  date: string;
  location: string;
  imageUrl: string;
  alt: string;
  featured: boolean;
  description: string;
};

export type MockClientGallery = FeaturedGallery & {
  clientName: string;
  protected: boolean;
  sections: string[];
  photos: PortfolioItem[];
};

export const categoryLabels: Record<PortfolioCategory, string> = {
  events: "Events",
  nightlife: "Nightlife",
  portraits: "Portraits",
  lifestyle: "Lifestyle",
  "weddings-couples": "Weddings / Couples",
};

export const portfolioItems: PortfolioItem[] = [
  {
    id: "moove-neon-swirl",
    title: "MOOVE: Neon Swirl",
    category: "nightlife",
    date: "2026-03-22",
    location: "Toronto",
    imageUrl: "/portfolio/moove-neon-swirl.webp",
    alt: "Abstract neon light trails spiral over a packed dance floor at MOOVE Toronto.",
    featured: true,
    description: "Long exposure, movement, chaos. Colour held in a single frame.",
    orientation: "landscape",
  },
  {
    id: "moove-crowd-energy",
    title: "MOOVE: Crowd Energy",
    category: "nightlife",
    date: "2026-03-22",
    location: "Toronto",
    imageUrl: "/portfolio/moove-crowd-energy.webp",
    alt: "A performer reaches into the crowd at a packed Toronto nightclub event.",
    featured: true,
    description: "The moment the room breaks open, caught in the middle of it.",
    orientation: "landscape",
  },
  {
    id: "moove-dj-booth",
    title: "MOOVE: DJ Booth",
    category: "nightlife",
    date: "2026-03-21",
    location: "Toronto",
    imageUrl: "/portfolio/moove-dj-booth.webp",
    alt: "Friends gathered around the DJ booth under nightclub lighting at MOOVE.",
    featured: false,
    description: "Behind the decks. Energy, colour, and a tight crew.",
    orientation: "portrait",
  },
  {
    id: "choyons-grad-couple",
    title: "Choyons Graduation",
    category: "events",
    date: "2025-06-15",
    location: "Toronto",
    imageUrl: "/portfolio/choyons-grad-couple.webp",
    alt: "A couple posing at a graduation party with blue and gold balloon decor.",
    featured: false,
    description: "Milestone moments documented. Family energy and celebration.",
    orientation: "portrait",
  },
  {
    id: "miraz-first-birthday",
    title: "Miraz: First Birthday",
    category: "events",
    date: "2026-02-07",
    location: "Toronto",
    imageUrl: "/portfolio/miraz-first-birthday.webp",
    alt: "A baby in a safari-themed first birthday setup with animal balloon decorations and a birthday cake.",
    featured: false,
    description: "A first birthday documented in full: the setup, the cake, the pure first-year wonder.",
    orientation: "portrait",
  },
  {
    id: "nhd-sunset-hike",
    title: "Autumn Hike",
    category: "portraits",
    date: "2024-10-01",
    location: "Toronto",
    imageUrl: "/portfolio/nhd-sunset-hike.webp",
    alt: "A person hiking through fall foliage under a dramatic orange and pink sunset sky.",
    featured: true,
    description: "Golden fall light, a dramatic sky, a solitary figure. Cinematic outdoor portraiture.",
    orientation: "portrait",
  },
  {
    id: "forest-walk-portrait",
    title: "Forest Walk",
    category: "portraits",
    date: "2024-09-07",
    location: "Toronto",
    imageUrl: "/portfolio/forest-walk-portrait.webp",
    alt: "A person walking alone down a sunlit path through tall green trees.",
    featured: false,
    description: "Quiet environmental portraiture. A figure in motion, a forest standing still.",
    orientation: "portrait",
  },
  {
    id: "rachel-autumn-leaves",
    title: "Autumn Portrait, Rachel",
    category: "lifestyle",
    date: "2024-10-20",
    location: "Toronto",
    imageUrl: "/portfolio/rachel-autumn-leaves.webp",
    alt: "A woman sitting in a bed of autumn leaves in a warm fall forest, looking upward.",
    featured: true,
    description: "Warm tones, an honest expression, and fall light doing exactly what it should.",
    orientation: "landscape",
  },
  {
    id: "rachel-golden-picnic",
    title: "Golden Hour Picnic",
    category: "lifestyle",
    date: "2024-09-14",
    location: "Toronto",
    imageUrl: "/portfolio/rachel-golden-picnic.webp",
    alt: "A woman arranging a picnic blanket in warm evening golden-hour park light.",
    featured: false,
    description: "Lifestyle imagery with a soft editorial rhythm, caught between doing and being.",
    orientation: "landscape",
  },
  {
    id: "rachel-garden-bench",
    title: "Garden Bench",
    category: "lifestyle",
    date: "2024-09-14",
    location: "Toronto",
    imageUrl: "/portfolio/rachel-garden-bench.webp",
    alt: "A woman sitting on a green bench in a blooming garden in a light summer dress at golden hour.",
    featured: false,
    description: "Unposed summer ease. Warmth and stillness in equal measure.",
    orientation: "portrait",
  },
  {
    id: "oishi-cherry-blossoms",
    title: "Oishi & Lucky: Cherry Blossoms",
    category: "weddings-couples",
    date: "2025-04-15",
    location: "Toronto",
    imageUrl: "/portfolio/oishi-cherry-blossoms.webp",
    alt: "A woman in a pink floral dress with her dog under weeping cherry blossom trees by a pond.",
    featured: true,
    description: "A portrait session in bloom. Soft spring light, pink florals, and pure connection.",
    orientation: "portrait",
  },
  {
    id: "oishi-pond-portrait",
    title: "Oishi & Lucky: Pond",
    category: "weddings-couples",
    date: "2025-04-15",
    location: "Toronto",
    imageUrl: "/portfolio/oishi-pond-portrait.webp",
    alt: "A woman in a floral dress holding her dog beside a reflecting pond under cherry blossoms.",
    featured: false,
    description: "Spring portraiture by the water. Light, reflection, a quiet moment.",
    orientation: "portrait",
  },
  {
    id: "engagement-couple-porch",
    title: "Porch Steps",
    category: "weddings-couples",
    date: "2025-07-12",
    location: "Ontario",
    imageUrl: "/portfolio/engagement-couple-porch.webp",
    alt: "An engaged couple in white sitting close together on porch steps, the ring visible, summer greenery behind them.",
    featured: false,
    description: "An engagement session settled into one easy frame. Close, warm, unhurried.",
    orientation: "portrait",
  },
  {
    id: "rachel-garden-portrait",
    title: "Garden Portrait, Rachel",
    category: "portraits",
    date: "2024-09-14",
    location: "Toronto",
    imageUrl: "/portfolio/rachel-garden-portrait.webp",
    alt: "A woman in a sage dress standing beside climbing flowers at golden hour, looking calmly at the camera.",
    featured: false,
    description: "A portrait that lets the subject be still. Soft light, an honest look, room to breathe.",
    orientation: "portrait",
  },
  {
    id: "choyons-grad-cake",
    title: "Graduation Day",
    category: "events",
    date: "2025-06-15",
    location: "Toronto",
    imageUrl: "/portfolio/choyons-grad-cake.webp",
    alt: "A graduate and his father cutting a celebration cake under blue and gold balloons.",
    featured: false,
    description: "A milestone marked properly. Family, a cake, and the moment it all paid off.",
    orientation: "portrait",
  },
  {
    id: "moove-dj-floor",
    title: "MOOVE: The Floor",
    category: "nightlife",
    date: "2026-03-22",
    location: "Toronto",
    imageUrl: "/portfolio/moove-dj-floor.webp",
    alt: "A packed dance floor around the DJ booth at MOOVE Toronto, hands up, stage lights overhead.",
    featured: false,
    description: "The room at full tilt. Flash, colour, and a crowd that never stopped moving.",
    orientation: "landscape",
  },
];

export const featuredGalleries: FeaturedGallery[] = [
  {
    slug: "moove-ah",
    title: "MOOVE @ AH",
    category: "nightlife",
    date: "2026-03-22",
    location: "Toronto",
    imageUrl: "/portfolio/moove-neon-swirl.webp",
    alt: "A packed nightclub dance floor under vivid neon lighting at MOOVE Toronto.",
    featured: true,
    description: "A high-energy nightlife gallery from MOOVE, Toronto's underground dance scene.",
  },
];

export const mockClientGalleries: MockClientGallery[] = [
  {
    ...featuredGalleries[0],
    clientName: "MOOVE",
    protected: true,
    sections: ["Highlights", "Dance Floor", "DJ Set", "Crowd", "All Photos"],
    photos: portfolioItems.filter((item) =>
      ["events", "nightlife", "portraits", "lifestyle"].includes(item.category),
    ),
  },
];

export function getPortfolioByCategory(category: string) {
  return portfolioItems.filter((item) => item.category === category);
}

export function getMockGallery(slug: string) {
  return mockClientGalleries.find((gallery) => gallery.slug === slug);
}
