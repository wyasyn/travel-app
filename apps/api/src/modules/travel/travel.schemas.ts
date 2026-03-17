export type PackageType = 'all' | 'flight' | 'hotel' | 'experience';
export type DestinationStatus = 'draft' | 'published' | 'archived';

export interface TravelPackageInput {
  type: PackageType;
  title: string;
  summary?: string | null;
  priceFrom?: number | null;
  currency?: string;
  durationDays?: number | null;
  durationNights?: number | null;
  includes?: string[];
}

export interface RouteStopInput {
  order: number;
  title: string;
  description: string;
}

export interface TravelPackageSummarySchema {
  id: string;
  type: PackageType;
  title: string;
  summary: string;
  priceFrom: number | null;
  currency: string;
  durationDays: number | null;
  durationNights: number | null;
  includes: string[];
}

export interface DestinationReviewSchema {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationCardSchema {
  id: string;
  slug: string;
  name: string;
  locationLabel: string;
  region: string;
  country: string;
  heroImageUrl: string;
  averageRating: number;
  ratingCount: number;
  likesCount: number;
  durationLabel: string | null;
}

export interface DestinationDetailSchema extends DestinationCardSchema {
  tagline: string;
  description: string;
  distanceKm: number | null;
  viewsCount: number;
  gallery: string[];
  packages: TravelPackageSummarySchema[];
  routeList: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  reviews: DestinationReviewSchema[];
  isLiked: boolean;
  myReview: DestinationReviewSchema | null;
}

export interface TravelHomeSchema {
  market: {
    country: string;
    currency: string;
    locale: string;
  };
  packageTabs: PackageType[];
  featuredDestination: DestinationCardSchema;
  quickEscapeDestinations: DestinationCardSchema[];
  popularDestinations: DestinationCardSchema[];
  trendingDestinations: DestinationCardSchema[];
}

export interface CreateDestinationDto {
  name: string;
  slug: string;
  tagline: string;
  country?: string;
  region: string;
  locationLabel: string;
  description: string;
  heroImageUrl: string;
  durationLabel?: string | null;
  distanceKm?: number | null;
  gallery?: string[];
  packages?: TravelPackageInput[];
  routeList?: RouteStopInput[];
  featured?: boolean;
  popular?: boolean;
  status?: DestinationStatus;
}

export type UpdateDestinationDto = Partial<CreateDestinationDto>;

export interface CreateDestinationReviewDto {
  rating: number;
  title?: string | null;
  comment?: string | null;
}
