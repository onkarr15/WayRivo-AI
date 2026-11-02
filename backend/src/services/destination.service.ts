import { destinationRepository } from '../repositories/destination.repository';
import { NotFoundError } from '../utils/errors';

export class DestinationService {
  async getAllDestinations() {
    return destinationRepository.findAll();
  }

  async getDestinationById(id: string) {
    const destination = await destinationRepository.findById(id);
    if (!destination) {
      throw new NotFoundError(`Destination not found with id: ${id}`);
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
}

export const destinationService = new DestinationService();
