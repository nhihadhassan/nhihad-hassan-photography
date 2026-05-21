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
    id: "mihar-dance-floor",
    title: "Mihar & Mohian Reception",
    category: "events",
    date: "2024-08-04",
    location: "Scarborough Convention Centre, Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/PE5pWyy/August042024-SNY00361-ShotByNhihadHassan-ffbaade6-1500.JPG",
    alt: "A vivid wedding reception dance floor with guests celebrating under pink and purple lights.",
    featured: true,
    description: "A charged reception frame with colour, rhythm, and a packed Toronto dance floor.",
    orientation: "landscape",
  },
  {
    id: "mehndi-portraits",
    title: "Mehndi Night",
    category: "events",
    date: "2024-08-02",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/5O6odKl/SNY00202-ShotByNhihadHassan-49eb58f0-1000.JPG",
    alt: "Two women smiling at a colourful mehndi night portrait setup.",
    featured: true,
    description: "Portraits and details from a bright, intimate mehndi celebration.",
    orientation: "portrait",
  },
  {
    id: "ceremony-family",
    title: "Reception Portraits",
    category: "weddings-couples",
    date: "2024-08-04",
    location: "Scarborough",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/5O6odKl/August042024-SNY00111-ShotByNhihadHassan-e0e5f810-1000.jpg",
    alt: "Family portrait at a wedding reception with floral stage details.",
    featured: false,
    description: "Formal portraits with clean light and a soft reception backdrop.",
    orientation: "portrait",
  },
  {
    id: "venue-details",
    title: "Reception Details",
    category: "events",
    date: "2024-08-04",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/5O6odKl/August042024-SNY00238-ShotByNhihadHassan-cac44f50-1000.jpg",
    alt: "Dessert and chocolate fountain details at a reception.",
    featured: false,
    description: "Small details preserved with the same care as the headline moments.",
    orientation: "landscape",
  },
  {
    id: "dance-performance",
    title: "Dance Floor Performance",
    category: "nightlife",
    date: "2024-08-02",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/5O6odKl/August022024-SNY00188-ShotByNhihadHassan-7e1c3586-1000.jpg",
    alt: "A wide reception hall scene with dancers performing in colourful outfits.",
    featured: true,
    description: "Movement, colour, and stage energy held in a clean wide frame.",
    orientation: "landscape",
  },
  {
    id: "couple-porch",
    title: "Engagement At Home",
    category: "weddings-couples",
    date: "2024-07-28",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/ZQXXPJD/A7R01406-5fef54f5-1500.JPEG",
    alt: "An engaged couple smiling together on a porch.",
    featured: true,
    description: "A quiet portrait with warmth, ease, and direct emotional pull.",
    orientation: "portrait",
  },
  {
    id: "family-porch",
    title: "Family Portrait",
    category: "portraits",
    date: "2024-07-28",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/vXAAm7D/A7R01094-0239de3b-1500.jpg",
    alt: "A family group portrait outside on a porch.",
    featured: false,
    description: "A composed family portrait with natural light and relaxed direction.",
    orientation: "landscape",
  },
  {
    id: "ring-detail",
    title: "Ring Detail",
    category: "weddings-couples",
    date: "2024-07-28",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/vXAAm7D/A7R00142-b1af8466-1500.jpg",
    alt: "Close-up of an engagement ring and white dress detail.",
    featured: false,
    description: "A detail frame built around sunlight, texture, and the quiet part of the story.",
    orientation: "square",
  },
  {
    id: "first-birthday",
    title: "First Birthday",
    category: "lifestyle",
    date: "2024-10-14",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/vXAAm7D/LuckysFirstBirthday0012010-14-2024-dcf945c7-1500.jpg",
    alt: "Friends gathered outdoors at a first birthday celebration table.",
    featured: true,
    description: "A candid outdoor celebration with warmth and family energy.",
    orientation: "landscape",
  },
  {
    id: "park-lifestyle",
    title: "Golden Hour Picnic",
    category: "lifestyle",
    date: "2024-09-14",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/vXAAm7D/RachelPost1-09142024-e8a1120f-1500.jpg",
    alt: "A woman sitting on a picnic blanket in warm evening park light.",
    featured: false,
    description: "Lifestyle imagery with a softer editorial rhythm.",
    orientation: "landscape",
  },
  {
    id: "baby-shower",
    title: "Baby Shower Portrait",
    category: "portraits",
    date: "2025-01-11",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/vXAAm7D/MABabyShower010140111-2025-337701d0-1500.jpg",
    alt: "A couple posing in front of a blue and gold baby shower balloon display.",
    featured: false,
    description: "Clean portrait coverage for a family milestone.",
    orientation: "landscape",
  },
  {
    id: "birthday-candid",
    title: "Autumn Birthday Candids",
    category: "lifestyle",
    date: "2024-10-14",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/vXAAm7D/LuckysFirstBirthday0008610-14-2024-73062414-1500.jpg",
    alt: "Two people kissing a small dog in an autumn park.",
    featured: false,
    description: "Small unscripted moments inside a larger event story.",
    orientation: "portrait",
  },
];

export const featuredGalleries: FeaturedGallery[] = [
  {
    slug: "moove-ah",
    title: "MOOVE @ AH",
    category: "nightlife",
    date: "2025-11-29",
    location: "Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/PE5pWyy/August042024-SNY00361-ShotByNhihadHassan-ffbaade6-1500.JPG",
    alt: "A packed event dance floor under vivid nightlife lighting.",
    featured: true,
    description: "A high-energy event gallery concept built for private client delivery.",
  },
  {
    slug: "mihar-mohian",
    title: "Mihar & Mohian",
    category: "events",
    date: "2024-08-04",
    location: "Scarborough Convention Centre, Toronto",
    imageUrl:
      "https://images-pw.pixieset.com/elementfield/PE5pWyy/August042024-SNY00361-ShotByNhihadHassan-ffbaade6-1500.JPG",
    alt: "Wedding reception dance floor with live drumming and guests celebrating.",
    featured: true,
    description: "A multi-day event story with colour, movement, portraits, and family moments.",
  },
];

export const mockClientGalleries: MockClientGallery[] = [
  {
    ...featuredGalleries[0],
    clientName: "MOOVE",
    protected: true,
    sections: ["Highlights", "Dance Floor", "Portraits", "Details", "All Photos"],
    photos: portfolioItems.filter((item) =>
      ["events", "nightlife", "portraits", "lifestyle"].includes(item.category),
    ),
  },
  {
    ...featuredGalleries[1],
    clientName: "Mihar & Mohian",
    protected: false,
    sections: ["Highlights", "Mehndi Night", "Reception", "Portraits", "Details", "All Photos"],
    photos: portfolioItems,
  },
];

export function getPortfolioByCategory(category: string) {
  return portfolioItems.filter((item) => item.category === category);
}

export function getMockGallery(slug: string) {
  return mockClientGalleries.find((gallery) => gallery.slug === slug);
}

