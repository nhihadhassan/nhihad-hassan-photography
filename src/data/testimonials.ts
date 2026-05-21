/**
 * Real client testimonials only.
 *
 * Leave the array empty until you have actual quotes you have permission to
 * publish — the public Testimonials component returns `null` while the
 * array is empty, so the section disappears entirely rather than showing
 * placeholder content.
 *
 * To add a real testimonial later, follow the shape below:
 *
 *   {
 *     id: "miharmohian-2024-08",
 *     name: "Mihar & Mohian",
 *     shootType: "Wedding",
 *     quote: "Nhihad held the whole night together — every frame still feels like the room did.",
 *     location: "Toronto, ON",
 *     date: "August 2024",
 *   }
 */

export type Testimonial = {
  id: string;
  name: string;
  shootType: string;
  quote: string;
  location?: string;
  date?: string;
};

export const testimonials: Testimonial[] = [];
