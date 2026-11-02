-- WayRivo Seed Data
-- This file runs on application startup to populate initial data

-- Admin user (password: admin123)
INSERT IGNORE INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at) VALUES
(1, 'WayRivo Admin', 'admin@wayrivo.com', '9000000001', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'ADMIN', 'ACTIVE', NOW(), NOW());

-- Traveler users (password: password123)
INSERT IGNORE INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at) VALUES
(2, 'Arjun Sharma', 'arjun@example.com', '9100000001', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'TRAVELER', 'ACTIVE', NOW(), NOW()),
(3, 'Priya Patel', 'priya@example.com', '9100000002', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'TRAVELER', 'ACTIVE', NOW(), NOW()),
(4, 'Rahul Verma', 'rahul@example.com', '9100000003', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'TRAVELER', 'ACTIVE', NOW(), NOW());

-- Expert users (password: password123)
INSERT IGNORE INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at) VALUES
(5, 'Vikram Travels', 'vikram@example.com', '9200000001', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'EXPERT', 'ACTIVE', NOW(), NOW()),
(6, 'Meera Adventures', 'meera@example.com', '9200000002', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'EXPERT', 'ACTIVE', NOW(), NOW()),
(7, 'Raj Tourism Co', 'raj@example.com', '9200000003', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'EXPERT', 'ACTIVE', NOW(), NOW()),
(8, 'Sunita Holidays', 'sunita@example.com', '9200000004', '$2a$10$mnN6ASfhgs8zFbjP4kvZqehhOJcvTY9pbbn/DnJNKIDrOpNWS6Id2', 'EXPERT', 'ACTIVE', NOW(), NOW());

-- Expert profiles
INSERT IGNORE INTO expert_profiles (id, user_id, organization_name, description, years_of_experience, city, state, country, specializations, verification_status, rating, total_reviews, created_at, updated_at) VALUES
(1, 5, 'Vikram Travels & Tours', 'Premium travel experiences across South India with personalized itineraries, luxury accommodations, and expert local guides. Specializing in Kerala, Tamil Nadu, and Karnataka.', 12, 'Kochi', 'Kerala', 'India', 'Kerala,Goa,Karnataka,South India,Beach,Culture', 'VERIFIED', 4.8, 24, NOW(), NOW()),
(2, 6, 'Meera Adventures India', 'Adventure and spiritual travel specialists. From Himalayan treks to Varanasi ghats, we craft experiences that transform. Eco-friendly and sustainable tourism practices.', 8, 'Rishikesh', 'Uttarakhand', 'India', 'Ladakh,Manali,Rishikesh,Adventure,Trekking,Spiritual', 'VERIFIED', 4.6, 18, NOW(), NOW()),
(3, 7, 'Raj Tourism Company', 'Royal Rajasthan experiences — heritage havelis, desert safaris, palace stays, and cultural immersion. 15 years of crafting unforgettable Rajasthan journeys.', 15, 'Jaipur', 'Rajasthan', 'India', 'Rajasthan,Gujarat,Heritage,Culture,Desert,Royal', 'VERIFIED', 4.9, 31, NOW(), NOW()),
(4, 8, 'Sunita Beach Holidays', 'Beach and island travel experts covering Andaman, Lakshadweep, Goa, and coastal Karnataka. Honeymoon and family beach vacation specialists.', 6, 'Port Blair', 'Andaman', 'India', 'Andaman,Goa,Beach,Honeymoon,Island', 'PENDING', 0.0, 0, NOW(), NOW());

-- Destinations
INSERT IGNORE INTO destinations (id, name, country, state, description, image_url, best_time_to_visit, average_budget, currency, created_at, updated_at) VALUES
(1, 'Kerala', 'India', 'Kerala', 'God''s Own Country — lush backwaters, pristine beaches, aromatic spice plantations, and rich cultural heritage. Experience houseboat cruises through serene backwaters, Ayurvedic rejuvenation, and vibrant Kathakali performances.', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800', 'September to March', 25000.00, 'INR', NOW(), NOW()),
(2, 'Goa', 'India', 'Goa', 'India''s beach paradise — golden sands, Portuguese architecture, vibrant nightlife, and world-class seafood. From the buzzing beaches of North Goa to the tranquil shores of South Goa.', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', 'October to March', 20000.00, 'INR', NOW(), NOW()),
(3, 'Rajasthan', 'India', 'Rajasthan', 'The Land of Kings — majestic forts, ornate palaces, golden deserts, and colorful festivals. Explore Jaipur''s pink city, Udaipur''s lake palaces, and Jaisalmer''s sand dunes.', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800', 'October to March', 30000.00, 'INR', NOW(), NOW()),
(4, 'Manali', 'India', 'Himachal Pradesh', 'A jewel of the Himalayas — snow-capped peaks, lush valleys, adventure sports, and ancient temples. Perfect for honeymooners, adventure seekers, and nature lovers.', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800', 'March to June, October to December', 22000.00, 'INR', NOW(), NOW()),
(5, 'Ladakh', 'India', 'Ladakh', 'The Land of High Passes — dramatic landscapes, Buddhist monasteries, crystal-clear lakes, and starlit skies. A once-in-a-lifetime adventure destination.', 'https://images.unsplash.com/photo-1626015365107-4986c390e5d2?w=800', 'June to September', 35000.00, 'INR', NOW(), NOW()),
(6, 'Andaman Islands', 'India', 'Andaman & Nicobar', 'Tropical paradise — turquoise waters, white sand beaches, vibrant coral reefs, and dense mangrove forests. World-class snorkeling, scuba diving, and island hopping.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'October to May', 28000.00, 'INR', NOW(), NOW()),
(7, 'Varanasi', 'India', 'Uttar Pradesh', 'The Spiritual Capital of India — ancient ghats, sacred temples, mesmerizing Ganga Aarti, and a 5000-year-old living city. A deeply transformative cultural experience.', 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800', 'October to March', 15000.00, 'INR', NOW(), NOW()),
(8, 'Meghalaya', 'India', 'Meghalaya', 'The Abode of Clouds — living root bridges, dramatic waterfalls, cleanest village in Asia, and stunning cave systems. An offbeat paradise for nature enthusiasts.', 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800', 'October to April', 20000.00, 'INR', NOW(), NOW());

-- Sample Trip Requests
INSERT IGNORE INTO trip_requests (id, traveler_id, from_location, destination, start_date, end_date, number_of_days, travelers_count, budget, currency, travel_type, travel_style, accommodation_preference, transport_preference, interests, special_requirements, status, proposal_count, created_at, updated_at) VALUES
(1, 2, 'Mumbai', 'Kerala', '2026-10-15', '2026-10-20', 5, 4, 60000.00, 'INR', 'Family', 'Premium', '4 Star', 'Flight', 'Nature,Beaches,Culture,Food', 'Vegetarian food options needed', 'OPEN', 2, NOW(), NOW()),
(2, 3, 'Delhi', 'Rajasthan', '2026-11-01', '2026-11-07', 7, 2, 80000.00, 'INR', 'Couple', 'Luxury', '5 Star', 'Private Cab', 'History,Culture,Shopping,Photography', 'Anniversary trip — need romantic experiences', 'OPEN', 1, NOW(), NOW()),
(3, 2, 'Bangalore', 'Ladakh', '2026-07-10', '2026-07-18', 9, 6, 120000.00, 'INR', 'Friends', 'Adventure', '3 Star', 'Flight', 'Adventure,Mountains,Photography,Wildlife', 'Some members have altitude concerns', 'PROPOSALS_RECEIVED', 2, NOW(), NOW()),
(4, 4, 'Chennai', 'Goa', '2026-12-20', '2026-12-25', 5, 3, 45000.00, 'INR', 'Friends', 'Standard', '3 Star', 'Flight', 'Beaches,Nightlife,Food,Adventure', NULL, 'OPEN', 0, NOW(), NOW()),
(5, 3, 'Pune', 'Andaman Islands', '2026-02-10', '2026-02-16', 7, 2, 90000.00, 'INR', 'Couple', 'Premium', '4 Star', 'Flight', 'Beaches,Adventure,Nature', 'Honeymoon trip', 'BOOKED', 2, NOW(), NOW());

-- Sample Proposals
INSERT IGNORE INTO proposals (id, trip_request_id, expert_id, title, description, total_price, price_per_person, itinerary, accommodation_details, transportation_details, activities, inclusions, exclusions, cancellation_policy, validity_date, status, created_at, updated_at) VALUES
(1, 1, 1, 'Kerala Backwater Bliss — 5 Days Family Package', 'Experience the magic of Kerala with our curated family package covering Kochi, Munnar, Alleppey, and Kovalam. Handpicked family-friendly hotels, private houseboat, and expert local guides.', 55000.00, 13750.00,
'Day 1: Arrive Kochi — Fort Kochi heritage walk, Kathakali show\nDay 2: Kochi to Munnar — Tea plantations, Eravikulam National Park\nDay 3: Munnar — Mattupetty Dam, Echo Point, spice garden\nDay 4: Munnar to Alleppey — Premium houseboat cruise\nDay 5: Alleppey — Beach morning, departure',
'Night 1-2: Premium resort in Munnar (family suite)\nNight 3: Alleppey Houseboat (AC deluxe)\nNight 4: Beachside hotel in Alleppey',
'Airport transfers, AC Innova for sightseeing, Private houseboat',
'Kathakali show, Tea factory visit, Spice garden tour, Houseboat cruise, Beach activities',
'All accommodation, Breakfast & dinner daily, Airport transfers, All sightseeing, Houseboat with meals, English speaking guide',
'Lunch, Personal expenses, Entry tickets (approx ₹500), Tips',
'Free cancellation up to 15 days before. 50% refund for 7-14 days. No refund within 7 days.',
'2026-09-30', 'SUBMITTED', NOW(), NOW()),

(2, 1, 2, 'Kerala Nature & Wellness Retreat — Family Edition', 'A holistic Kerala experience blending nature, wellness, and family fun. Includes Ayurvedic spa sessions, wildlife sanctuary visit, and cultural immersion.', 62000.00, 15500.00,
'Day 1: Kochi arrival — Chinese fishing nets, Jewish synagogue\nDay 2: Thekkady — Periyar Wildlife Sanctuary, spice plantation\nDay 3: Thekkady — Bamboo rafting, elephant experience\nDay 4: Alleppey — Backwater houseboat (full day)\nDay 5: Kovalam beach — Ayurvedic spa, departure',
'Night 1: Heritage hotel in Kochi\nNight 2-3: Jungle resort in Thekkady\nNight 4: Premium houseboat in Alleppey',
'Airport transfers, AC Tempo Traveller (6-seater), Private houseboat',
'Wildlife safari, Bamboo rafting, Spice plantation tour, Ayurvedic spa, Cultural show',
'All accommodation, All meals, Airport transfers, All activities listed, Ayurvedic spa session per person, Experienced naturalist guide',
'Personal expenses, Shopping, Additional spa treatments',
'Full refund 20 days before. 75% refund 10-19 days. 25% refund 5-9 days.',
'2026-09-25', 'SUBMITTED', NOW(), NOW()),

(3, 2, 3, 'Royal Rajasthan Romance — 7 Days Luxury', 'An enchanting journey through Rajasthan''s most romantic destinations. Private palace dinners, heritage stays, desert camping under the stars.', 78000.00, 39000.00,
'Day 1: Jaipur — Amber Fort, City Palace, rooftop dinner\nDay 2: Jaipur — Hawa Mahal, Jantar Mantar, Johari Bazaar\nDay 3: Jaipur to Jodhpur — Mehrangarh Fort, blue city walk\nDay 4: Jodhpur to Jaisalmer — Golden Fort, Patwon ki Haveli\nDay 5: Jaisalmer — Desert safari, camping under stars\nDay 6: Jaisalmer to Udaipur — Lake Pichola sunset cruise\nDay 7: Udaipur — City Palace, Saheliyon ki Bari, departure',
'Night 1-2: Heritage haveli in Jaipur\nNight 3: Boutique hotel in Jodhpur\nNight 4: Desert camp in Jaisalmer\nNight 5-6: Lake-facing palace hotel in Udaipur',
'Private AC sedan throughout, Airport/station transfers',
'Desert safari with camel ride, Lake cruise, Private palace dinner, Heritage walks, Shopping tours',
'All luxury accommodation, Breakfast & dinner, Private car with driver, All entry tickets, Desert camp with cultural program, Anniversary special arrangements',
'Lunch, Personal shopping, Tips, Travel insurance',
'Full refund 21 days before. 50% refund 14-20 days. Non-refundable within 14 days.',
'2026-10-15', 'SUBMITTED', NOW(), NOW()),

(4, 3, 2, 'Ladakh Expedition — 9 Day Adventure', 'The ultimate Ladakh adventure covering Leh, Nubra Valley, Pangong Lake, and Tso Moriri. Acclimatization built in, experienced mountain guides, and comfortable stays.', 108000.00, 18000.00,
'Day 1: Arrive Leh — rest and acclimatize\nDay 2: Leh local — Shanti Stupa, Leh Palace, market\nDay 3: Leh to Nubra via Khardung La — Diskit monastery\nDay 4: Nubra — Sand dunes, Bactrian camels, hot springs\nDay 5: Nubra to Pangong Lake via Shyok route\nDay 6: Pangong — Sunrise, photography, leisure\nDay 7: Pangong to Tso Moriri\nDay 8: Tso Moriri — Nomadic village, wildlife spotting\nDay 9: Tso Moriri to Leh — departure',
'Night 1-2: Hotel in Leh\nNight 3-4: Camp/guesthouse in Nubra\nNight 5-6: Lakeside camp at Pangong\nNight 7-8: Camp at Tso Moriri',
'Airport transfers, Toyota Innova Crysta fleet (2 vehicles), All permits',
'Khardung La crossing, Camel safari, Monastery visits, Lake photography, Stargazing, Mountain biking option',
'All accommodation, All meals during trip, Vehicles with experienced drivers, Oxygen cylinders, Medical kit, Inner line permits, Camping equipment',
'Flights, Personal gear, Tips, Travel insurance (strongly recommended)',
'Full refund 30 days before. 50% refund 15-29 days. 25% refund within 15 days.',
'2026-06-15', 'SUBMITTED', NOW(), NOW()),

(5, 3, 1, 'Ladakh Cultural & Nature Experience', 'A more relaxed Ladakh journey focusing on Buddhist culture, stunning landscapes, and comfortable accommodations. Perfect for first-time visitors.', 95000.00, 15833.00,
'Day 1: Arrive Leh — acclimatization\nDay 2: Leh — Hemis & Thiksey monasteries\nDay 3: Leh to Nubra via Khardung La\nDay 4: Nubra Valley exploration\nDay 5: Nubra to Pangong Lake\nDay 6: Pangong — full day at the lake\nDay 7: Pangong to Leh\nDay 8: Leh — Magnetic Hill, Sangam, market\nDay 9: Departure',
'Night 1-2, 7-8: Comfortable hotel in Leh\nNight 3-4: Deluxe camp in Nubra\nNight 5-6: Swiss camps at Pangong',
'Airport transfers, Comfortable SUVs, All permits arranged',
'Monastery tours, Camel ride, Lake visits, Local cuisine experience, Market tour',
'All accommodation, Breakfast & dinner, Vehicle with driver, Permits, Oxygen support, Guide for monastery visits',
'Lunch, Personal expenses, Tips, Insurance',
'Full refund 25 days prior. 50% refund 10-24 days.',
'2026-06-10', 'SUBMITTED', NOW(), NOW());

-- Sample Bookings
INSERT IGNORE INTO bookings (id, traveler_id, proposal_id, booking_reference, travelers_count, total_amount, booking_date, travel_start_date, travel_end_date, status, payment_status, created_at, updated_at) VALUES
(1, 3, 5, 'WR-2026-000001', 2, 90000.00, '2026-01-15', '2026-02-10', '2026-02-16', 'COMPLETED', 'PAID', NOW(), NOW());

-- Sample Reviews
INSERT IGNORE INTO reviews (id, booking_id, traveler_id, expert_id, rating, comment, created_at, updated_at) VALUES
(1, 1, 3, 1, 5, 'Absolutely incredible experience! Vikram Travels planned everything perfectly. The houseboat was magical and the guides were so knowledgeable. Our family had the best vacation ever. Highly recommended!', NOW(), NOW());

-- Sample Notifications
INSERT IGNORE INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
(1, 2, 'Welcome to WayRivo!', 'Start by creating your first trip request. Tell us where you want to go!', 'SYSTEM', false, NOW()),
(2, 5, 'You''re Verified!', 'Your expert profile has been verified. You can now submit proposals to travelers.', 'VERIFICATION', true, NOW()),
(3, 2, 'New Proposal Received', 'You received a new travel proposal from Vikram Travels for your trip to Kerala.', 'PROPOSAL', false, NOW());
