import React, { useState, useEffect } from 'react';
import {
  destinationService,
  hotelService,
  activityService,
  packageService,
} from '../../services';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Hotel as HotelIcon,
  Activity as ActivityIcon,
  Compass,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

type InventoryTab = 'destinations' | 'hotels' | 'activities' | 'packages';

export const AdminInventory: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<InventoryTab>('destinations');
  const [loading, setLoading] = useState(true);

  // Lists
  const [destinations, setDestinations] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  // Modals & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form records
  const [destForm, setDestForm] = useState({
    name: '',
    country: 'India',
    state: '',
    description: '',
    imageUrl: '',
    bestTimeToVisit: '',
    averageBudget: '25000',
    popularAttractions: '',
    travelTips: '',
  });

  const [hotelForm, setHotelForm] = useState({
    destinationId: '',
    name: '',
    description: '',
    address: '',
    city: '',
    stars: '4',
    pricePerNight: '8500',
    totalRooms: '15',
    availableRooms: '10',
    amenities: 'Free Wi-Fi, Pool, Spa, Breakfast',
    imageUrl: '',
  });

  const [activityForm, setActivityForm] = useState({
    destinationId: '',
    title: '',
    description: '',
    category: 'Adventure activities',
    durationHours: '4.0',
    pricePerPerson: '2500',
    location: '',
    difficultyLevel: 'Moderate',
    maxSlots: '20',
    availableSlots: '12',
    includedItems: 'Certified Guide, Safety Gear, Refreshments',
    imageUrl: '',
  });

  const [pkgForm, setPkgForm] = useState({
    destinationId: '',
    title: '',
    description: '',
    durationDays: '5',
    totalPrice: '38000',
    pricePerPerson: '19000',
    expertName: 'WayRivo Verified Specialist',
    organizationName: 'Certified Agency Partner',
    availableSeats: '12',
    inclusions: 'Luxury Hotel Stay, Private Transfers, Breakfast & Dinner',
    exclusions: 'Flights, Personal Expenses',
    cancellationPolicy: 'Free cancellation up to 7 days before departure.',
    imageUrl: '',
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [destRes, hotelRes, actRes, pkgRes] = await Promise.all([
        destinationService.getAll(1, 100),
        hotelService.getAll({ limit: 100 }),
        activityService.getAll({ limit: 100 }),
        packageService.getAll({ limit: 100 }),
      ]);

      setDestinations(destRes.data?.data || []);
      setHotels(hotelRes.data?.data || []);
      setActivities(actRes.data?.data || []);
      setPackages(pkgRes.data?.data || []);
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    if (activeTab === 'destinations') {
      setDestForm({
        name: '',
        country: 'India',
        state: '',
        description: '',
        imageUrl: '',
        bestTimeToVisit: '',
        averageBudget: '25000',
        popularAttractions: '',
        travelTips: '',
      });
    } else if (activeTab === 'hotels') {
      setHotelForm({
        destinationId: destinations[0]?.id || '',
        name: '',
        description: '',
        address: '',
        city: '',
        stars: '4',
        pricePerNight: '8500',
        totalRooms: '15',
        availableRooms: '10',
        amenities: 'Free Wi-Fi, Pool, Spa, Breakfast',
        imageUrl: '',
      });
    } else if (activeTab === 'activities') {
      setActivityForm({
        destinationId: destinations[0]?.id || '',
        title: '',
        description: '',
        category: 'Adventure activities',
        durationHours: '4.0',
        pricePerPerson: '2500',
        location: '',
        difficultyLevel: 'Moderate',
        maxSlots: '20',
        availableSlots: '12',
        includedItems: 'Certified Guide, Safety Gear, Refreshments',
        imageUrl: '',
      });
    } else if (activeTab === 'packages') {
      setPkgForm({
        destinationId: destinations[0]?.id || '',
        title: '',
        description: '',
        durationDays: '5',
        totalPrice: '38000',
        pricePerPerson: '19000',
        expertName: 'WayRivo Verified Specialist',
        organizationName: 'Certified Agency Partner',
        availableSeats: '12',
        inclusions: 'Luxury Hotel Stay, Private Transfers, Breakfast & Dinner',
        exclusions: 'Flights, Personal Expenses',
        cancellationPolicy: 'Free cancellation up to 7 days before departure.',
        imageUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'destinations') {
      setDestForm({
        name: item.name || '',
        country: item.country || 'India',
        state: item.state || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        bestTimeToVisit: item.bestTimeToVisit || '',
        averageBudget: item.averageBudget?.toString() || '25000',
        popularAttractions: Array.isArray(item.popularAttractions) ? item.popularAttractions.join(', ') : '',
        travelTips: Array.isArray(item.travelTips) ? item.travelTips.join(', ') : '',
      });
    } else if (activeTab === 'hotels') {
      setHotelForm({
        destinationId: item.destinationId || '',
        name: item.name || '',
        description: item.description || '',
        address: item.address || '',
        city: item.city || '',
        stars: item.stars?.toString() || '4',
        pricePerNight: item.pricePerNight?.toString() || '8500',
        totalRooms: item.totalRooms?.toString() || '15',
        availableRooms: item.availableRooms?.toString() || '10',
        amenities: Array.isArray(item.amenities) ? item.amenities.join(', ') : '',
        imageUrl: Array.isArray(item.imageUrls) ? item.imageUrls[0] : item.imageUrl || '',
      });
    } else if (activeTab === 'activities') {
      setActivityForm({
        destinationId: item.destinationId || '',
        title: item.title || '',
        description: item.description || '',
        category: item.category || 'Adventure activities',
        durationHours: item.durationHours?.toString() || '4.0',
        pricePerPerson: item.pricePerPerson?.toString() || '2500',
        location: item.location || '',
        difficultyLevel: item.difficultyLevel || 'Moderate',
        maxSlots: item.maxSlots?.toString() || '20',
        availableSlots: item.availableSlots?.toString() || '12',
        includedItems: Array.isArray(item.includedItems) ? item.includedItems.join(', ') : '',
        imageUrl: Array.isArray(item.imageUrls) ? item.imageUrls[0] : item.imageUrl || '',
      });
    } else if (activeTab === 'packages') {
      setPkgForm({
        destinationId: item.destinationId || '',
        title: item.title || '',
        description: item.description || '',
        durationDays: item.durationDays?.toString() || '5',
        totalPrice: item.totalPrice?.toString() || '38000',
        pricePerPerson: item.pricePerPerson?.toString() || '19000',
        expertName: item.expertName || 'WayRivo Verified Specialist',
        organizationName: item.organizationName || 'Certified Agency Partner',
        availableSeats: item.availableSeats?.toString() || '12',
        inclusions: Array.isArray(item.inclusions) ? item.inclusions.join(', ') : '',
        exclusions: Array.isArray(item.exclusions) ? item.exclusions.join(', ') : '',
        cancellationPolicy: item.cancellationPolicy || '',
        imageUrl: item.imageUrl || '',
      });
    }
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === 'destinations') {
        const payload = {
          ...destForm,
          averageBudget: parseFloat(destForm.averageBudget) || 25000,
          popularAttractions: destForm.popularAttractions.split(',').map((s) => s.trim()).filter(Boolean),
          travelTips: destForm.travelTips.split(',').map((s) => s.trim()).filter(Boolean),
        };
        if (editingItem) {
          await destinationService.update(editingItem.id, payload);
          toast.success('Destination updated successfully');
        } else {
          await destinationService.create(payload);
          toast.success('Destination added to catalog');
        }
      } else if (activeTab === 'hotels') {
        const payload = {
          ...hotelForm,
          stars: parseInt(hotelForm.stars),
          pricePerNight: parseFloat(hotelForm.pricePerNight),
          totalRooms: parseInt(hotelForm.totalRooms),
          availableRooms: parseInt(hotelForm.availableRooms),
          amenities: hotelForm.amenities.split(',').map((s) => s.trim()).filter(Boolean),
          imageUrls: hotelForm.imageUrl ? [hotelForm.imageUrl] : [],
        };
        if (editingItem) {
          await hotelService.update(editingItem.id, payload);
          toast.success('Hotel and room availability updated');
        } else {
          await hotelService.create(payload);
          toast.success('Hotel added to inventory');
        }
      } else if (activeTab === 'activities') {
        const payload = {
          ...activityForm,
          durationHours: parseFloat(activityForm.durationHours),
          pricePerPerson: parseFloat(activityForm.pricePerPerson),
          maxSlots: parseInt(activityForm.maxSlots),
          availableSlots: parseInt(activityForm.availableSlots),
          includedItems: activityForm.includedItems.split(',').map((s) => s.trim()).filter(Boolean),
          imageUrls: activityForm.imageUrl ? [activityForm.imageUrl] : [],
        };
        if (editingItem) {
          await activityService.update(editingItem.id, payload);
          toast.success('Activity and slot capacity updated');
        } else {
          await activityService.create(payload);
          toast.success('Activity added to marketplace');
        }
      } else if (activeTab === 'packages') {
        const payload = {
          ...pkgForm,
          durationDays: parseInt(pkgForm.durationDays),
          totalPrice: parseFloat(pkgForm.totalPrice),
          pricePerPerson: parseFloat(pkgForm.pricePerPerson),
          availableSeats: parseInt(pkgForm.availableSeats),
          inclusions: pkgForm.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
          exclusions: pkgForm.exclusions.split(',').map((s) => s.trim()).filter(Boolean),
        };
        if (editingItem) {
          await packageService.update(editingItem.id, payload);
          toast.success('Package updated successfully');
        } else {
          await packageService.create(payload);
          toast.success('Package published to marketplace');
        }
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from live inventory?`)) return;
    try {
      if (activeTab === 'destinations') await destinationService.delete(id);
      if (activeTab === 'hotels') await hotelService.delete(id);
      if (activeTab === 'activities') await activityService.delete(id);
      if (activeTab === 'packages') await packageService.delete(id);
      toast.success(`Removed "${name}" from inventory`);
      loadData();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Inventory & Marketplace Management
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time catalog control for destinations, hotel room allocations, excursion slots, and packages.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Add {activeTab.slice(0, -1)}
        </Button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Destinations</span>
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {destinations.length}
          </p>
          <span className="text-[11px] text-slate-500">Live in catalog</span>
        </div>

        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Hotels</span>
            <HotelIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {hotels.length}
          </p>
          <span className="text-[11px] text-emerald-400">
            {hotels.reduce((s, h) => s + (h.availableRooms || 0), 0)} rooms available
          </span>
        </div>

        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Activities</span>
            <ActivityIcon className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {activities.length}
          </p>
          <span className="text-[11px] text-teal-300">
            {activities.reduce((s, a) => s + (a.availableSlots || 0), 0)} slots open
          </span>
        </div>

        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Travel Packages</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {packages.length}
          </p>
          <span className="text-[11px] text-amber-300">Escrow backed</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('destinations')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'destinations'
              ? 'bg-cyan-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-surface'
          }`}
        >
          <MapPin className="w-4 h-4" /> Destinations ({destinations.length})
        </button>

        <button
          onClick={() => setActiveTab('hotels')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'hotels'
              ? 'bg-cyan-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-surface'
          }`}
        >
          <HotelIcon className="w-4 h-4" /> Hotels & Stays ({hotels.length})
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'activities'
              ? 'bg-cyan-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-surface'
          }`}
        >
          <ActivityIcon className="w-4 h-4" /> Activities ({activities.length})
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'packages'
              ? 'bg-cyan-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-surface'
          }`}
        >
          <Compass className="w-4 h-4" /> Packages ({packages.length})
        </button>
      </div>

      {/* Data Management Table View */}
      <div className="card p-6 border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. DESTINATIONS TABLE */}
            {activeTab === 'destinations' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Destination</th>
                    <th className="pb-3">State / Country</th>
                    <th className="pb-3">Best Time</th>
                    <th className="pb-3">Avg Budget</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {destinations.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <img
                          src={d.imageUrl}
                          alt={d.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <span className="font-bold text-white text-sm">{d.name}</span>
                      </td>
                      <td className="py-3.5 text-slate-300">{d.state}, {d.country}</td>
                      <td className="py-3.5 text-slate-400">{d.bestTimeToVisit || 'All Year'}</td>
                      <td className="py-3.5 font-mono text-cyan-300 font-bold">₹{Number(d.averageBudget).toLocaleString()}</td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. HOTELS TABLE */}
            {activeTab === 'hotels' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Hotel & City</th>
                    <th className="pb-3">Stars</th>
                    <th className="pb-3">Price / Night</th>
                    <th className="pb-3">Room Availability</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {hotels.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <img
                          src={Array.isArray(h.imageUrls) ? h.imageUrls[0] : h.imageUrl}
                          alt={h.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{h.name}</p>
                          <p className="text-[11px] text-slate-400">{h.city}</p>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
                          {h.stars}★
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-cyan-300 font-bold">
                        ₹{Number(h.pricePerNight).toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          h.availableRooms <= 5 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {h.availableRooms} / {h.totalRooms || 15} Rooms Available
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(h)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(h.id, h.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. ACTIVITIES TABLE */}
            {activeTab === 'activities' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Activity & Category</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Price / Person</th>
                    <th className="pb-3">Available Slots</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <img
                          src={Array.isArray(act.imageUrls) ? act.imageUrls[0] : act.imageUrl}
                          alt={act.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{act.title}</p>
                          <p className="text-[11px] text-cyan-400">{act.category}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300">{act.durationHours} hrs</td>
                      <td className="py-3.5 font-mono text-cyan-300 font-bold">
                        ₹{Number(act.pricePerPerson).toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300">
                          {act.availableSlots} / {act.maxSlots || 20} Slots Left
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(act)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(act.id, act.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. PACKAGES TABLE */}
            {activeTab === 'packages' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Package & Agency</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Total Price</th>
                    <th className="pb-3">Seats</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <img
                          src={pkg.imageUrl}
                          alt={pkg.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{pkg.title}</p>
                          <p className="text-[11px] text-slate-400">{pkg.organizationName || pkg.expertName}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300">{pkg.durationDays} Days</td>
                      <td className="py-3.5 font-mono text-cyan-300 font-bold">
                        ₹{Number(pkg.totalPrice).toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                          {pkg.availableSeats || 12} Seats
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CUD Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingItem ? 'Edit' : 'Add'} ${activeTab.slice(0, -1).toUpperCase()}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* DESTINATION FORM */}
          {activeTab === 'destinations' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Destination Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={destForm.name}
                    onChange={(e) => setDestForm({ ...destForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={destForm.state}
                    onChange={(e) => setDestForm({ ...destForm, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={destForm.description}
                  onChange={(e) => setDestForm({ ...destForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={destForm.imageUrl}
                    onChange={(e) => setDestForm({ ...destForm, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Best Time To Visit
                  </label>
                  <input
                    type="text"
                    value={destForm.bestTimeToVisit}
                    onChange={(e) => setDestForm({ ...destForm, bestTimeToVisit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Avg Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={destForm.averageBudget}
                    onChange={(e) => setDestForm({ ...destForm, averageBudget: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Popular Attractions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Alleppey Backwaters, Munnar Tea Gardens, Periyar Reserve"
                  value={destForm.popularAttractions}
                  onChange={(e) => setDestForm({ ...destForm, popularAttractions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Insider Travel Tips (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Book houseboats in advance, Carry cotton clothes"
                  value={destForm.travelTips}
                  onChange={(e) => setDestForm({ ...destForm, travelTips: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>
            </>
          )}

          {/* HOTEL FORM */}
          {activeTab === 'hotels' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Destination *
                  </label>
                  <select
                    value={hotelForm.destinationId}
                    onChange={(e) => setHotelForm({ ...hotelForm, destinationId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                    required
                  >
                    <option value="">Select Destination</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Hotel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={hotelForm.name}
                    onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={hotelForm.city}
                    onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Stars (1-5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={hotelForm.stars}
                    onChange={(e) => setHotelForm({ ...hotelForm, stars: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Price / Night (₹)
                  </label>
                  <input
                    type="number"
                    value={hotelForm.pricePerNight}
                    onChange={(e) => setHotelForm({ ...hotelForm, pricePerNight: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    value={hotelForm.totalRooms}
                    onChange={(e) => setHotelForm({ ...hotelForm, totalRooms: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Available Rooms (Live Booking Cap)
                  </label>
                  <input
                    type="number"
                    value={hotelForm.availableRooms}
                    onChange={(e) => setHotelForm({ ...hotelForm, availableRooms: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Amenities (comma separated)
                </label>
                <input
                  type="text"
                  value={hotelForm.amenities}
                  onChange={(e) => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={hotelForm.imageUrl}
                  onChange={(e) => setHotelForm({ ...hotelForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>
            </>
          )}

          {/* ACTIVITY FORM */}
          {activeTab === 'activities' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Destination *
                  </label>
                  <select
                    value={activityForm.destinationId}
                    onChange={(e) => setActivityForm({ ...activityForm, destinationId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                    required
                  >
                    <option value="">Select Destination</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Activity Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={activityForm.title}
                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={activityForm.category}
                    onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  >
                    <option value="Adventure activities">Adventure activities</option>
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Water sports">Water sports</option>
                    <option value="Cultural experiences">Cultural experiences</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={activityForm.durationHours}
                    onChange={(e) => setActivityForm({ ...activityForm, durationHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Price / Person (₹)
                  </label>
                  <input
                    type="number"
                    value={activityForm.pricePerPerson}
                    onChange={(e) => setActivityForm({ ...activityForm, pricePerPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Available Slots
                  </label>
                  <input
                    type="number"
                    value={activityForm.availableSlots}
                    onChange={(e) => setActivityForm({ ...activityForm, availableSlots: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Max Slots (Capacity)
                  </label>
                  <input
                    type="number"
                    value={activityForm.maxSlots}
                    onChange={(e) => setActivityForm({ ...activityForm, maxSlots: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Included Gear & Perks (comma separated)
                </label>
                <input
                  type="text"
                  value={activityForm.includedItems}
                  onChange={(e) => setActivityForm({ ...activityForm, includedItems: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={activityForm.imageUrl}
                  onChange={(e) => setActivityForm({ ...activityForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>
            </>
          )}

          {/* PACKAGE FORM */}
          {activeTab === 'packages' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Destination *
                  </label>
                  <select
                    value={pkgForm.destinationId}
                    onChange={(e) => setPkgForm({ ...pkgForm, destinationId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                    required
                  >
                    <option value="">Select Destination</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Package Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={pkgForm.title}
                    onChange={(e) => setPkgForm({ ...pkgForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={pkgForm.durationDays}
                    onChange={(e) => setPkgForm({ ...pkgForm, durationDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Total Price (₹)
                  </label>
                  <input
                    type="number"
                    value={pkgForm.totalPrice}
                    onChange={(e) => setPkgForm({ ...pkgForm, totalPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Seats Available
                  </label>
                  <input
                    type="number"
                    value={pkgForm.availableSeats}
                    onChange={(e) => setPkgForm({ ...pkgForm, availableSeats: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Inclusions (comma separated)
                </label>
                <input
                  type="text"
                  value={pkgForm.inclusions}
                  onChange={(e) => setPkgForm({ ...pkgForm, inclusions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={pkgForm.imageUrl}
                  onChange={(e) => setPkgForm({ ...pkgForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs"
                />
              </div>
            </>
          )}

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={saving}
            >
              {editingItem ? 'Update' : 'Publish'} {activeTab.slice(0, -1)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminInventory;
