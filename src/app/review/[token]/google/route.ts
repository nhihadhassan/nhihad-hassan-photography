import { NextResponse } from "next/server";
import { getReviewRequestByToken, markReviewRequestGoogleClicked } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const reviewRequest = await getReviewRequestByToken(token);

  if (!reviewRequest?.googleReviewUrl) {
    return NextResponse.redirect(new URL(`/review/${token}`, request.url));
  }

  await markReviewRequestGoogleClicked(token);
  return NextResponse.redirect(reviewRequest.googleReviewUrl);
}
