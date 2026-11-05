import { destinationRepository, FilterOptions } from '../repositories/destination.repository';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Destination } from '@prisma/client';

export interface CreateDestinationDTO {
  name: string;
  slug?: string;
  country?: string;
  state: string;
  description?: string;
  imageUrl?: string;
  bestTimeToVisit?: string;
  averageBudget?: number | string;
  currency?: string;
  popularAttractions?: string[];
  travelTips?: string[];
  highlights?: string[];
  isActive?: boolean;
}

export type UpdateDestinationDTO = Partial<CreateDestinationDTO>;

export class DestinationService {
  async getAllDestinations(options?: FilterOptions): Promise<{ items: Destination[]; total: number }> {
    return destinationRepository.findAll(options);
  }

  async getPopularDestinations(limit = 6): Promise<{ items: Destination[]; total: number }> {
    return destinationRepository.findAll({ limit, sortBy: 'popular' });
  }

  async getDestinationById(id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Destination ID or slug is required');
    }

    let destination = await destinationRepository.findById(id);
    if (!destination) {
      destination = await destinationRepository.findBySlug(id);
    }
    if (!destination) {
      throw new NotFoundError(`Destination not found with id or slug: ${id}`);
    }
    return destination;
  }

  async getDestinationBySlug(slug: string) {
    if (!slug || typeof slug !== 'string') {
      throw new BadRequestError('Destination slug is required');
    }

    const destination = await destinationRepository.findBySlug(slug);
    if (!destination) {
      throw new NotFoundError(`Destination not found with slug: ${slug}`);
    }
    return destination;
  }

  async createDestination(data: CreateDestinationDTO): Promise<Destination> {
    if (!data.name || !data.state) {
      throw new BadRequestError('Destination name and state are required fields');
    }
    return destinationRepository.createDestination(data);
  }

  async updateDestination(id: string, data: UpdateDestinationDTO): Promise<Destination> {
    const existing = await this.getDestinationById(id);
    return destinationRepository.updateDestination(existing.id, data);
  }

  async deleteDestination(id: string): Promise<Destination> {
    const existing = await this.getDestinationById(id);
    return destinationRepository.deleteDestination(existing.id);
  }

  async getDestinationHotels(destinationId: string) {
    const existing = await this.getDestinationById(destinationId);
    return destinationRepository.findHotels({ destinationId: existing.id });
  }

  async getDestinationActivities(destinationId: string) {
    const existing = await this.getDestinationById(destinationId);
    return destinationRepository.findActivities({ destinationId: existing.id });
  }

  async getDestinationPackages(destinationId: string) {
    const existing = await this.getDestinationById(destinationId);
    return destinationRepository.findPackages({ destinationId: existing.id });
  }
}

export const destinationService = new DestinationService();
