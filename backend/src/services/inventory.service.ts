import { destinationRepository } from '../repositories/destination.repository';

export class InventoryService {
  async getHotels(destinationId?: string) {
    return destinationRepository.findHotels(destinationId);
  }

  async getActivities(destinationId?: string, category?: string) {
    return destinationRepository.findActivities(destinationId, category);
  }

  async getPackages(destinationId?: string, isRecommended?: boolean) {
    return destinationRepository.findPackages(destinationId, isRecommended);
  }
}

export const inventoryService = new InventoryService();
