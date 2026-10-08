  import Venue from './venue.model.js';
  import type { IVenueImage } from './venue.model.js';
  import type { PipelineStage } from 'mongoose';

  const NOT_DELETED = { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };

  export const createVenue = async (data: Record<string, unknown>) => {
    return await Venue.create(data);
  };

  export const getVenues = async (
    city?: string,
    filters?: {
      minCapacity?: number;
      maxCapacity?: number;
      minPrice?: number;
      maxPrice?: number;
    },
  ) => {
    const filter: Record<string, unknown> = {
      status: 'approved',
      ...NOT_DELETED,
    };

    if (city?.trim()) {
      filter['location.city'] = { $regex: city.trim(), $options: 'i' };
    }

    const { minCapacity, maxCapacity, minPrice, maxPrice } = filters ?? {};

    const capacityFilter: Record<string, number> = {};
    if (minCapacity !== undefined) capacityFilter.$gte = minCapacity;
    if (maxCapacity !== undefined) capacityFilter.$lte = maxCapacity;
    if (Object.keys(capacityFilter).length > 0) filter.capacity = capacityFilter;

    const priceFilter: Record<string, number> = {};
    if (minPrice !== undefined) priceFilter.$gte = minPrice;
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
    if (Object.keys(priceFilter).length > 0) filter.pricePerDay = priceFilter;

    return await Venue.find(filter).sort({ createdAt: -1 });
  };

  export const getNearbyVenues = async (params: {
    lat: number;
    lng: number;
    radius: number;
    minCapacity?: number;
    maxCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) => {
    const {
      lat,
      lng,
      radius,
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = params;

    const filter: Record<string, unknown> = {
      status: 'approved',
      ...NOT_DELETED,
    };

    if (minCapacity !== undefined || maxCapacity !== undefined) {
      filter.capacity = {};
      if (minCapacity !== undefined) (filter.capacity as Record<string, number>).$gte = minCapacity;
      if (maxCapacity !== undefined) (filter.capacity as Record<string, number>).$lte = maxCapacity;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerDay = {};
      if (minPrice !== undefined) (filter.pricePerDay as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined) (filter.pricePerDay as Record<string, number>).$lte = maxPrice;
    }

    const skip = (page - 1) * limit;

    const geoNearStage: PipelineStage.GeoNear = {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: radius,
        spherical: true,
        query: filter as Record<string, unknown>,
      },
    };

    const [totalAgg, docs] = await Promise.all([
      Venue.aggregate<{ total: number }>([geoNearStage, { $count: 'total' }]),
      Venue.aggregate([geoNearStage, { $skip: skip }, { $limit: limit }]),
    ]);

    const total = totalAgg.length > 0 ? totalAgg[0].total : 0;

    return {
      venues: docs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  };

  export const getAllVenuesForAdmin = async (city?: string, status?: string) => {
    const filter: Record<string, unknown> = { ...NOT_DELETED };
    if (city) {
      filter['location.city'] = city;
    }
    if (status) {
      filter.status = status;
    }
    return await Venue.find(filter);
  };

  export const getVenueById = async (id: string) => {
    return await Venue.findById(id);
  };

  export const approveVenue = async (id: string) => {
    return await Venue.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  };

  export const updateVenue = async (
    id: string,
    ownerId: string,
    data: Record<string, unknown>,
    newImages: IVenueImage[] = [],
  ) => {
    const update: Record<string, unknown> = {};

    if (Object.keys(data ?? {}).length > 0) {
      update.$set = data;
    }

    // A venue holds a single image: new uploads replace the existing
    // image list. The caller is responsible for deleting the old S3
    // objects once the update succeeds.
    if (newImages.length > 0) {
      update.$set = { ...(update.$set ?? {}), images: newImages };
    }

    if (Object.keys(update).length === 0) {
      return await Venue.findOne({ _id: id, ownerId });
    }

    return await Venue.findOneAndUpdate({ _id: id, ownerId }, update, { new: true, runValidators: true });
  };

  /**
   * Removes a single image entry from a venue's images array. The caller is
   * responsible for deleting the object from S3 first.
   */
  export const removeVenueImage = async (venueId: string, key: string) => {
    return await Venue.findOneAndUpdate(
      { _id: venueId, 'images.key': key },
      { $pull: { images: { key } } },
      { new: true, runValidators: true },
    );
  };

  export const deleteVenue = async (id: string, userId: string, userRole: string) => {
    if (userRole === 'ADMIN') {
      return await Venue.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
    return await Venue.findOneAndUpdate({ _id: id, ownerId: userId }, { isDeleted: true }, { new: true });
  };

  export const rejectVenue = async (id: string) => {
    return await Venue.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
  };

  export const getMyVenues = async (ownerId: string) => {
    return await Venue.find({ ownerId, ...NOT_DELETED }).sort({ createdAt: -1 });
  };