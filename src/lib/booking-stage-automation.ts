import { BOOKING_STAGES, type BookingStage } from "@/lib/booking-stages";

export function deriveOperationalStage(input: {
  storedStage: BookingStage;
  manualOverride: boolean;
  shootStart: string | null;
  shootEnd: string | null;
  galleryPublished: boolean;
  now: Date;
}): BookingStage {
  if (input.storedStage === "archived" || input.manualOverride) return input.storedStage;
  if (input.galleryPublished) return "delivered";
  const shootEnd = input.shootEnd ?? input.shootStart;
  if (shootEnd && new Date(shootEnd).getTime() <= input.now.getTime()) {
    return BOOKING_STAGES.indexOf(input.storedStage) < BOOKING_STAGES.indexOf("editing")
      ? "editing"
      : input.storedStage;
  }
  return input.storedStage;
}
