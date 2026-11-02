import { destinationRepository, FilterOptions } from '../repositories/destination.repository';
import { NotFoundError } from '../utils/errors';

export class InventoryService {
  // HOTELS
  async getHotels(options?: FilterOptions) {
    return destinationRepository.findHotels(options);
  }

  async getHotelById(id: string) {
    const hotel = await destinationRepository.findHotelById(id);
    if (!hotel) throw new NotFoundError(`Hotel not found with id: ${id}`);
    return hotel;
  }

  async createHotel(data: any) {
    return destinationRepository.createHotel(data);
  }

  async updateHotel(id: string, data: any) {
    await this.getHotelById(id);
    return destinationRepository.updateHotel(id, data);
  }

  async deleteHotel(id: string) {
    await this.getHotelById(id);
    return destinationRepository.deleteHotel(id);
  }

  // ACTIVITIES
  async getActivities(options?: FilterOptions) {
    return destinationRepository.findActivities(options);
  }

  async getActivityById(id: string) {
    const activity = await destinationRepository.findActivityById(id);
    if (!activity) throw new NotFoundError(`Activity not found with id: ${id}`);
    return activity;
  }

  async createActivity(data: any) {
    return destinationRepository.createActivity(data);
  }

  async updateActivity(id: string, data: any) {
    await this.getActivityById(id);
    return destinationRepository.updateActivity(id, data);
  }

  async deleteActivity(id: string) {
    await this.getActivityById(id);
    return destinationRepository.deleteActivity(id);
  }

  // PACKAGES
  async getPackages(options?: FilterOptions) {
    return destinationRepository.findPackages(options);
  }

  async getPackageById(id: string) {
    const pkg = await destinationRepository.findPackageById(id);
    if (!pkg) throw new NotFoundError(`Travel package not found with id: ${id}`);
    return pkg;
  }

  async createPackage(data: any) {
    return destinationRepository.createPackage(data);
  }

  async updatePackage(id: string, data: any) {
    await this.getPackageById(id);
    return destinationRepository.updatePackage(id, data);
  }

  async deletePackage(id: string) {
    await this.getPackageById(id);
    return destinationRepository.deletePackage(id);
  }

  // ADMIN OVERVIEW
  async getInventoryOverview() {
    return destinationRepository.getInventoryOverview();
  }
}

export const inventoryService = new InventoryService();
