import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { prisma } from '../../lib/prisma.js';
import {
  DestinationStatus as PrismaDestinationStatus,
  ImageType,
  PackageType as PrismaPackageType,
  Prisma,
} from '../../../generated/prisma/client.js';
import type {
  CreateDestinationDto,
  CreateDestinationReviewDto,
  DestinationCardSchema,
  DestinationDetailSchema,
  DestinationReviewSchema,
  DestinationStatus,
  PackageType,
  RouteStopInput,
  TravelHomeSchema,
  TravelPackageInput,
  TravelPackageSummarySchema,
  UpdateDestinationDto,
} from './travel.schemas.js';

type DestinationDetailRecord = Prisma.DestinationGetPayload<{
  include: {
    galleryImages: true;
    packages: true;
    itineraryStops: true;
    reviews: {
      include: {
        user: true;
      };
    };
    _count: {
      select: {
        likes: true;
        reviews: true;
        views: true;
      };
    };
  };
}>;

type DestinationCardRecord = Prisma.DestinationGetPayload<{
  include: {
    _count: {
      select: {
        likes: true;
        reviews: true;
      };
    };
  };
}>;

const destinationCardInclude = {
  _count: {
    select: {
      likes: true,
      reviews: true,
    },
  },
} satisfies Prisma.DestinationInclude;

const destinationDetailInclude = {
  galleryImages: {
    orderBy: {
      sortOrder: 'asc',
    },
  },
  packages: {
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  itineraryStops: {
    orderBy: {
      stopOrder: 'asc',
    },
  },
  reviews: {
    where: {
      isPublished: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
  _count: {
    select: {
      likes: true,
      reviews: true,
      views: true,
    },
  },
} satisfies Prisma.DestinationInclude;

@Injectable()
export class TravelService {
  async getHome(): Promise<TravelHomeSchema> {
    const [
      featuredDestination,
      quickEscapeDestinations,
      popularDestinations,
      trendingDestinations,
    ] = await Promise.all([
      this.findFeaturedDestination(),
      prisma.destination.findMany({
        where: { status: PrismaDestinationStatus.PUBLISHED },
        include: destinationCardInclude,
        orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
        take: 3,
      }),
      prisma.destination.findMany({
        where: {
          status: PrismaDestinationStatus.PUBLISHED,
          isPopular: true,
        },
        include: destinationCardInclude,
        orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
        take: 8,
      }),
      this.findTrendingDestinations(6),
    ]);

    return {
      market: {
        country: 'Uganda',
        currency: 'UGX',
        locale: 'en-UG',
      },
      packageTabs: ['all', 'flight', 'hotel', 'experience'],
      featuredDestination: this.toCard(featuredDestination),
      quickEscapeDestinations: quickEscapeDestinations.map((destination) =>
        this.toCard(destination),
      ),
      popularDestinations: popularDestinations.map((destination) =>
        this.toCard(destination),
      ),
      trendingDestinations: trendingDestinations.map((destination) =>
        this.toCard(destination),
      ),
    };
  }

  async listDestinations(): Promise<DestinationCardSchema[]> {
    const destinations = await prisma.destination.findMany({
      where: { status: PrismaDestinationStatus.PUBLISHED },
      include: destinationCardInclude,
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
    });

    return destinations.map((destination) => this.toCard(destination));
  }

  async listPopularDestinations(): Promise<DestinationCardSchema[]> {
    const destinations = await prisma.destination.findMany({
      where: {
        status: PrismaDestinationStatus.PUBLISHED,
        isPopular: true,
      },
      include: destinationCardInclude,
      orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
    });

    return destinations.map((destination) => this.toCard(destination));
  }

  async listTrendingDestinations(limit = 6): Promise<DestinationCardSchema[]> {
    const destinations = await this.findTrendingDestinations(limit);
    return destinations.map((destination) => this.toCard(destination));
  }

  async getDestinationBySlug(
    slug: string,
    session?: UserSession | null,
  ): Promise<DestinationDetailSchema> {
    const destination = await prisma.destination.findFirst({
      where: {
        slug,
        status: PrismaDestinationStatus.PUBLISHED,
      },
      include: destinationDetailInclude,
    });

    if (!destination) {
      throw new NotFoundException(`Destination "${slug}" was not found`);
    }

    const isLiked = session?.user.id
      ? (await prisma.destinationLike.count({
          where: {
            destinationId: destination.id,
            userId: session.user.id,
          },
        })) > 0
      : false;

    return this.toDetail(destination, { isLiked, session });
  }

  async recordView(destinationId: string, session?: UserSession | null) {
    await this.getPublishedDestinationById(destinationId);

    await prisma.destinationView.create({
      data: {
        destinationId,
        userId: session?.user.id ?? null,
      },
    });

    return {
      destinationId,
      viewsCount: await prisma.destinationView.count({
        where: { destinationId },
      }),
    };
  }

  async likeDestination(destinationId: string, session: UserSession) {
    await this.getPublishedDestinationById(destinationId);

    await prisma.destinationLike.upsert({
      where: {
        userId_destinationId: {
          userId: session.user.id,
          destinationId,
        },
      },
      update: {},
      create: {
        destinationId,
        userId: session.user.id,
      },
    });

    return {
      destinationId,
      likesCount: await prisma.destinationLike.count({
        where: { destinationId },
      }),
      isLiked: true,
    };
  }

  async unlikeDestination(destinationId: string, session: UserSession) {
    await this.getPublishedDestinationById(destinationId);

    await prisma.destinationLike.deleteMany({
      where: {
        destinationId,
        userId: session.user.id,
      },
    });

    return {
      destinationId,
      likesCount: await prisma.destinationLike.count({
        where: { destinationId },
      }),
      isLiked: false,
    };
  }

  async addOrUpdateReview(
    destinationId: string,
    session: UserSession,
    payload: CreateDestinationReviewDto,
  ) {
    if (payload.rating < 1 || payload.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    await this.getPublishedDestinationById(destinationId);

    const review = await prisma.destinationReview.upsert({
      where: {
        userId_destinationId: {
          userId: session.user.id,
          destinationId,
        },
      },
      update: {
        rating: payload.rating,
        title: payload.title ?? null,
        comment: payload.comment ?? null,
        isPublished: true,
      },
      create: {
        destinationId,
        userId: session.user.id,
        rating: payload.rating,
        title: payload.title ?? null,
        comment: payload.comment ?? null,
        isPublished: true,
      },
      include: {
        user: true,
      },
    });

    await this.refreshDestinationReviewStats(destinationId);

    return {
      destinationId,
      review: this.toReview(review),
    };
  }

  async getUserTravelProfile(session: UserSession) {
    const [likedDestinations, reviewedDestinations, viewedDestinations] =
      await Promise.all([
        prisma.destinationLike.findMany({
          where: { userId: session.user.id },
          include: {
            destination: {
              include: destinationCardInclude,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.destinationReview.findMany({
          where: { userId: session.user.id },
          include: {
            destination: true,
            user: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        }),
        prisma.destinationView.findMany({
          where: { userId: session.user.id },
          include: {
            destination: {
              include: destinationCardInclude,
            },
          },
          orderBy: {
            viewedAt: 'desc',
          },
          distinct: ['destinationId'],
        }),
      ]);

    return {
      userId: session.user.id,
      role: session.user.role ?? 'user',
      likedDestinations: likedDestinations
        .map((entry) => entry.destination)
        .filter(
          (destination) =>
            destination.status === PrismaDestinationStatus.PUBLISHED,
        )
        .map((destination) => this.toCard(destination)),
      reviewedDestinations: reviewedDestinations.map((entry) => ({
        destinationId: entry.destinationId,
        destinationName: entry.destination.name,
        review: this.toReview(entry),
      })),
      viewedDestinations: viewedDestinations
        .map((entry) => entry.destination)
        .filter(
          (destination) =>
            destination.status === PrismaDestinationStatus.PUBLISHED,
        )
        .map((destination) => this.toCard(destination)),
    };
  }

  async adminListDestinations() {
    const destinations = await prisma.destination.findMany({
      include: destinationDetailInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return destinations.map((destination) => ({
      ...this.toDetail(destination),
      status: this.fromStatus(destination.status),
      featured: destination.isFeatured,
      popular: destination.isPopular,
      createdById: destination.createdById,
      updatedById: destination.updatedById,
      createdAt: destination.createdAt.toISOString(),
      updatedAt: destination.updatedAt.toISOString(),
    }));
  }

  async adminCreateDestination(
    payload: CreateDestinationDto,
    session: UserSession,
  ) {
    const duration = this.parseDurationLabel(payload.durationLabel);
    const destination = await prisma.destination.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        tagline: payload.tagline,
        country: payload.country ?? 'Uganda',
        region: payload.region,
        shortLocation: payload.locationLabel,
        description: payload.description,
        heroImageUrl: payload.heroImageUrl,
        distanceKm: payload.distanceKm ?? null,
        durationHoursMin: duration.min,
        durationHoursMax: duration.max,
        isFeatured: payload.featured ?? false,
        isPopular: payload.popular ?? false,
        status: this.toStatus(payload.status),
        createdById: session.user.id,
        updatedById: session.user.id,
        galleryImages: {
          create: this.toGalleryCreateInput(payload.gallery),
        },
        packages: {
          create: this.toPackageCreateInput(payload.packages),
        },
        itineraryStops: {
          create: this.toRouteStopCreateInput(payload.routeList),
        },
      },
      include: destinationDetailInclude,
    });

    return {
      ...this.toDetail(destination),
      status: this.fromStatus(destination.status),
      featured: destination.isFeatured,
      popular: destination.isPopular,
      createdById: destination.createdById,
      updatedById: destination.updatedById,
      createdAt: destination.createdAt.toISOString(),
      updatedAt: destination.updatedAt.toISOString(),
    };
  }

  async adminUpdateDestination(
    destinationId: string,
    payload: UpdateDestinationDto,
    session: UserSession,
  ) {
    await this.getDestinationById(destinationId);
    const duration =
      payload.durationLabel === undefined
        ? undefined
        : this.parseDurationLabel(payload.durationLabel);

    const destination = await prisma.destination.update({
      where: { id: destinationId },
      data: {
        name: payload.name,
        slug: payload.slug,
        tagline: payload.tagline,
        country: payload.country,
        region: payload.region,
        shortLocation: payload.locationLabel,
        description: payload.description,
        heroImageUrl: payload.heroImageUrl,
        distanceKm: payload.distanceKm,
        durationHoursMin: duration?.min,
        durationHoursMax: duration?.max,
        isFeatured: payload.featured,
        isPopular: payload.popular,
        status: payload.status ? this.toStatus(payload.status) : undefined,
        updatedById: session.user.id,
        galleryImages:
          payload.gallery === undefined
            ? undefined
            : {
                deleteMany: {},
                create: this.toGalleryCreateInput(payload.gallery),
              },
        packages:
          payload.packages === undefined
            ? undefined
            : {
                deleteMany: {},
                create: this.toPackageCreateInput(payload.packages),
              },
        itineraryStops:
          payload.routeList === undefined
            ? undefined
            : {
                deleteMany: {},
                create: this.toRouteStopCreateInput(payload.routeList),
              },
      },
      include: destinationDetailInclude,
    });

    return {
      ...this.toDetail(destination),
      status: this.fromStatus(destination.status),
      featured: destination.isFeatured,
      popular: destination.isPopular,
      createdById: destination.createdById,
      updatedById: destination.updatedById,
      createdAt: destination.createdAt.toISOString(),
      updatedAt: destination.updatedAt.toISOString(),
    };
  }

  async adminDeleteDestination(destinationId: string) {
    await this.getDestinationById(destinationId);

    await prisma.destination.delete({
      where: { id: destinationId },
    });

    return {
      deleted: true,
      destinationId,
    };
  }

  private async getDestinationById(destinationId: string) {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException(
        `Destination "${destinationId}" was not found`,
      );
    }

    return destination;
  }

  private async getPublishedDestinationById(destinationId: string) {
    const destination = await prisma.destination.findFirst({
      where: {
        id: destinationId,
        status: PrismaDestinationStatus.PUBLISHED,
      },
    });

    if (!destination) {
      throw new NotFoundException(
        `Destination "${destinationId}" was not found`,
      );
    }

    return destination;
  }

  private async findFeaturedDestination(): Promise<DestinationCardRecord> {
    const featured =
      (await prisma.destination.findFirst({
        where: {
          status: PrismaDestinationStatus.PUBLISHED,
          isFeatured: true,
        },
        include: destinationCardInclude,
        orderBy: {
          updatedAt: 'desc',
        },
      })) ??
      (await prisma.destination.findFirst({
        where: {
          status: PrismaDestinationStatus.PUBLISHED,
        },
        include: destinationCardInclude,
        orderBy: {
          updatedAt: 'desc',
        },
      }));

    if (!featured) {
      throw new NotFoundException('No published destinations were found');
    }

    return featured;
  }

  private async findTrendingDestinations(
    limit: number,
  ): Promise<DestinationCardRecord[]> {
    const destinations = await prisma.destination.findMany({
      where: {
        status: PrismaDestinationStatus.PUBLISHED,
      },
      include: {
        _count: {
          select: {
            likes: true,
            reviews: true,
            views: true,
          },
        },
      },
    });

    return destinations
      .sort(
        (left, right) =>
          this.getTrendingScore(right) - this.getTrendingScore(left),
      )
      .slice(0, limit);
  }

  private toCard(destination: DestinationCardRecord): DestinationCardSchema {
    return {
      id: destination.id,
      slug: destination.slug,
      name: destination.name,
      locationLabel: destination.shortLocation,
      region: destination.region,
      country: destination.country,
      heroImageUrl: destination.heroImageUrl,
      averageRating: Number(destination.averageRating),
      ratingCount: destination.reviewCount,
      likesCount: destination._count.likes,
      durationLabel: this.toDurationLabel(destination),
    };
  }

  private toDetail(
    destination: DestinationDetailRecord,
    options?: {
      isLiked?: boolean;
      session?: UserSession | null;
    },
  ): DestinationDetailSchema {
    const matchingReview = options?.session?.user.id
      ? (destination.reviews.find(
          (review) => review.userId === options.session?.user.id,
        ) ?? null)
      : null;
    const myReview = matchingReview ? this.toReview(matchingReview) : null;

    return {
      ...this.toCard(destination),
      tagline: destination.tagline ?? '',
      description: destination.description,
      distanceKm: destination.distanceKm,
      viewsCount: destination._count.views,
      gallery: destination.galleryImages.map((image) => image.imageUrl),
      packages: destination.packages.map((travelPackage) =>
        this.toPackage(travelPackage),
      ),
      routeList: destination.itineraryStops.map((stop) => ({
        order: stop.stopOrder,
        title: stop.title,
        description: stop.description ?? '',
      })),
      reviews: destination.reviews.map((review) => this.toReview(review)),
      isLiked: options?.isLiked ?? false,
      myReview,
    };
  }

  private toReview(
    review: Prisma.DestinationReviewGetPayload<{
      include: {
        user: true;
      };
    }>,
  ): DestinationReviewSchema {
    return {
      id: review.id,
      userId: review.userId,
      userName: review.user.name,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  private toPackage(
    travelPackage: Prisma.TravelPackageGetPayload<object>,
  ): TravelPackageSummarySchema {
    return {
      id: travelPackage.id,
      type: this.fromPackageType(travelPackage.type),
      title: travelPackage.title,
      summary: travelPackage.summary ?? '',
      priceFrom: travelPackage.priceFrom
        ? Number(travelPackage.priceFrom)
        : null,
      currency: travelPackage.currency,
      durationDays: travelPackage.durationDays,
      durationNights: travelPackage.durationNights,
      includes: travelPackage.includes,
    };
  }

  private toGalleryCreateInput(gallery?: string[]) {
    return (gallery ?? []).map((imageUrl, index) => ({
      imageUrl,
      type: index === 0 ? ImageType.HERO : ImageType.GALLERY,
      sortOrder: index,
    }));
  }

  private toPackageCreateInput(packages?: TravelPackageInput[]) {
    return (packages ?? []).map((travelPackage) => ({
      type: this.toPackageType(travelPackage.type),
      title: travelPackage.title,
      summary: travelPackage.summary ?? null,
      priceFrom: travelPackage.priceFrom ?? null,
      currency: travelPackage.currency ?? 'UGX',
      durationDays: travelPackage.durationDays ?? null,
      durationNights: travelPackage.durationNights ?? null,
      includes: travelPackage.includes ?? [],
    }));
  }

  private toRouteStopCreateInput(routeList?: RouteStopInput[]) {
    return (routeList ?? []).map((stop) => ({
      stopOrder: stop.order,
      title: stop.title,
      description: stop.description,
    }));
  }

  private toStatus(status?: DestinationStatus): PrismaDestinationStatus {
    switch (status) {
      case 'archived':
        return PrismaDestinationStatus.ARCHIVED;
      case 'published':
        return PrismaDestinationStatus.PUBLISHED;
      case 'draft':
      default:
        return PrismaDestinationStatus.DRAFT;
    }
  }

  private fromStatus(status: PrismaDestinationStatus): DestinationStatus {
    switch (status) {
      case PrismaDestinationStatus.ARCHIVED:
        return 'archived';
      case PrismaDestinationStatus.PUBLISHED:
        return 'published';
      case PrismaDestinationStatus.DRAFT:
      default:
        return 'draft';
    }
  }

  private toPackageType(type: PackageType): PrismaPackageType {
    switch (type) {
      case 'all':
        return PrismaPackageType.ALL;
      case 'flight':
        return PrismaPackageType.FLIGHT;
      case 'hotel':
        return PrismaPackageType.HOTEL;
      case 'experience':
      default:
        return PrismaPackageType.EXPERIENCE;
    }
  }

  private fromPackageType(type: PrismaPackageType): PackageType {
    switch (type) {
      case PrismaPackageType.ALL:
        return 'all';
      case PrismaPackageType.FLIGHT:
        return 'flight';
      case PrismaPackageType.HOTEL:
        return 'hotel';
      case PrismaPackageType.EXPERIENCE:
      default:
        return 'experience';
    }
  }

  private toDurationLabel(destination: {
    durationHoursMin: number | null;
    durationHoursMax: number | null;
  }) {
    if (!destination.durationHoursMin && !destination.durationHoursMax) {
      return null;
    }

    if (
      destination.durationHoursMin !== null &&
      destination.durationHoursMax !== null
    ) {
      return this.formatDurationRange(
        destination.durationHoursMin,
        destination.durationHoursMax,
      );
    }

    const hours = destination.durationHoursMax ?? destination.durationHoursMin;
    return hours === null ? null : this.formatSingleDuration(hours);
  }

  private getTrendingScore(destination: {
    averageRating: Prisma.Decimal;
    _count: {
      likes: number;
      reviews: number;
      views: number;
    };
  }) {
    return (
      destination._count.likes * 4 +
      destination._count.views +
      destination._count.reviews * 3 +
      Number(destination.averageRating) * 2
    );
  }

  private async refreshDestinationReviewStats(destinationId: string) {
    const aggregate = await prisma.destinationReview.aggregate({
      where: {
        destinationId,
        isPublished: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    });

    await prisma.destination.update({
      where: { id: destinationId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count._all,
      },
    });
  }

  private parseDurationLabel(durationLabel?: string | null) {
    if (!durationLabel) {
      return { min: null, max: null };
    }

    const normalized = durationLabel.trim().toLowerCase();
    const rangeMatch = normalized.match(
      /^(\d+)\s*-\s*(\d+)\s*(day|days|hr|hrs|hour|hours)$/,
    );
    if (rangeMatch) {
      const min = Number(rangeMatch[1]);
      const max = Number(rangeMatch[2]);
      const multiplier = rangeMatch[3].startsWith('day') ? 24 : 1;
      return {
        min: min * multiplier,
        max: max * multiplier,
      };
    }

    const singleMatch = normalized.match(
      /^(\d+)\s*(day|days|hr|hrs|hour|hours)$/,
    );
    if (singleMatch) {
      const value = Number(singleMatch[1]);
      const multiplier = singleMatch[2].startsWith('day') ? 24 : 1;
      return {
        min: value * multiplier,
        max: value * multiplier,
      };
    }

    return { min: null, max: null };
  }

  private formatDurationRange(minHours: number, maxHours: number) {
    if (minHours % 24 === 0 && maxHours % 24 === 0) {
      return `${minHours / 24}-${maxHours / 24} days`;
    }

    return `${minHours}-${maxHours} hrs`;
  }

  private formatSingleDuration(hours: number) {
    if (hours % 24 === 0) {
      return `${hours / 24} days`;
    }

    return `${hours} hrs`;
  }
}
