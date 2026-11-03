import { destinationRepository, FilterOptions } from '../repositories/destination.repository';
import { NotFoundError } from '../utils/errors';

export class DestinationService {
  async getAllDestinations(options?: FilterOptions) {
    const result = await destinationRepository.findAll(options);
    return result;
  }

  async getDestinationById(id: string) {
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
    const destination = await destinationRepository.findBySlug(slug);
    if (!destination) {
      throw new NotFoundError(`Destination not found with slug: ${slug}`);
    }
    return destination;
  }

  async createDestination(data: any) {
    return destinationRepository.createDestination(data);
  }

  async updateDestination(id: string, data: any) {
    await this.getDestinationById(id);
    return destinationRepository.updateDestination(id, data);
  }

  async deleteDestination(id: string) {
    await this.getDestinationById(id);
    return destinationRepository.deleteDestination(id);
  }
}

export const destinationService = new DestinationService();
