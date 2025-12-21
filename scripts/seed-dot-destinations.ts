/**
 * Seed DOT (Department of Tourism) Official Destinations
 *
 * Sources:
 * - DOT's award-winning destinations
 * - UNESCO World Heritage Sites in Philippines
 * - New 7 Wonders of Nature
 * - ASEAN Heritage Parks
 * - DOT-promoted hidden gems
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DOTPlace {
  name: string
  description: string
  location: string
  place_type: string
  category: string
  coordinates?: { lat: number; lng: number }
  tags: string[]
  estimated_cost: number
  price_range: string
  is_featured: boolean
  photo_url: string
}

// DOT Official Destinations - Curated from official announcements
const DOT_DESTINATIONS: DOTPlace[] = [
  // UNESCO World Heritage Sites
  {
    name: 'Baroque Churches of the Philippines - San Agustin Church',
    description: 'The oldest stone church in the Philippines, built in 1607. A UNESCO World Heritage Site showcasing Spanish colonial Baroque architecture with intricate trompe-l\'oeil ceiling murals.',
    location: 'Manila',
    place_type: 'landmark',
    category: 'landmark',
    coordinates: { lat: 14.5879, lng: 120.9752 },
    tags: ['unesco', 'heritage', 'church', 'history', 'manila', 'architecture'],
    estimated_cost: 200,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Baroque Churches - Paoay Church',
    description: 'A UNESCO World Heritage Site featuring unique Earthquake Baroque architecture. Built in 1710, its massive buttresses were designed to withstand earthquakes. One of the finest examples of Filipino-Spanish colonial architecture.',
    location: 'Ilocos',
    place_type: 'landmark',
    category: 'landmark',
    coordinates: { lat: 18.0631, lng: 120.5194 },
    tags: ['unesco', 'heritage', 'church', 'ilocos', 'architecture', 'history'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1597476817120-9b82f7f409e4?w=800'
  },
  {
    name: 'Baroque Churches - Santa Maria Church',
    description: 'Perched on a hilltop, this UNESCO World Heritage fortress church was completed in 1769. Its unique location served both religious and defensive purposes during the colonial era.',
    location: 'Ilocos',
    place_type: 'landmark',
    category: 'landmark',
    coordinates: { lat: 17.3711, lng: 120.4917 },
    tags: ['unesco', 'heritage', 'church', 'ilocos', 'architecture'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1597476817120-9b82f7f409e4?w=800'
  },
  {
    name: 'Baroque Churches - Miagao Church',
    description: 'A UNESCO World Heritage Site known as the "Fortress Church" with its distinctive yellow-ochre color and elaborate facade featuring a unique blend of Western and local artistic elements.',
    location: 'Iloilo',
    place_type: 'landmark',
    category: 'landmark',
    coordinates: { lat: 10.6444, lng: 122.2336 },
    tags: ['unesco', 'heritage', 'church', 'iloilo', 'architecture'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1597476817120-9b82f7f409e4?w=800'
  },
  {
    name: 'Rice Terraces of the Philippine Cordilleras',
    description: 'A UNESCO World Heritage Site and National Cultural Treasure. These 2,000-year-old terraces carved into the mountains by the Ifugao people are often called the "Eighth Wonder of the World."',
    location: 'Banaue',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 16.9167, lng: 121.0500 },
    tags: ['unesco', 'heritage', 'rice terraces', 'banaue', 'ifugao', 'nature', 'hiking'],
    estimated_cost: 500,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800'
  },
  {
    name: 'Historic City of Vigan',
    description: 'A UNESCO World Heritage Site and one of the New 7 Wonder Cities. The best-preserved example of a planned Spanish colonial town in Asia, featuring cobblestone streets and ancestral houses.',
    location: 'Vigan',
    place_type: 'landmark',
    category: 'landmark',
    coordinates: { lat: 17.5747, lng: 120.3869 },
    tags: ['unesco', 'heritage', 'vigan', 'ilocos', 'history', 'spanish colonial', 'architecture'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1597476817120-9b82f7f409e4?w=800'
  },
  {
    name: 'Puerto Princesa Subterranean River National Park',
    description: 'A UNESCO World Heritage Site and one of the New 7 Wonders of Nature. Features an 8.2km underground river navigable by boat, with stunning limestone karst landscapes and diverse wildlife.',
    location: 'Palawan',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 10.1667, lng: 118.9167 },
    tags: ['unesco', 'new7wonders', 'palawan', 'underground river', 'nature', 'cave', 'wildlife'],
    estimated_cost: 1500,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Tubbataha Reefs Natural Park',
    description: 'A UNESCO World Heritage Site and one of the Philippines\' oldest marine protected areas. Home to pristine coral reefs, 600+ fish species, 360+ coral species, and diverse marine life including sharks and sea turtles.',
    location: 'Palawan',
    place_type: 'activity',
    category: 'activity',
    coordinates: { lat: 8.9333, lng: 119.8333 },
    tags: ['unesco', 'diving', 'marine sanctuary', 'palawan', 'coral reef', 'wildlife'],
    estimated_cost: 15000,
    price_range: 'luxury',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
  },
  {
    name: 'Mount Hamiguitan Range Wildlife Sanctuary',
    description: 'A UNESCO World Heritage Site known for its unique pygmy forest and high biodiversity. Home to the critically endangered Philippine eagle and Philippine cockatoo.',
    location: 'Davao',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 6.7333, lng: 126.1667 },
    tags: ['unesco', 'davao', 'hiking', 'nature', 'wildlife', 'biodiversity'],
    estimated_cost: 800,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },

  // DOT Award-Winning Destinations 2024
  {
    name: 'Intramuros - The Walled City',
    description: 'Nominated as Asia\'s Leading Tourist Attraction 2024. The historic walled city of Manila, built during Spanish colonial period. Features Fort Santiago, Manila Cathedral, and centuries-old architecture.',
    location: 'Manila',
    place_type: 'landmark',
    category: 'landmark',
    coordinates: { lat: 14.5896, lng: 120.9747 },
    tags: ['manila', 'history', 'spanish colonial', 'fort santiago', 'walking tour', 'heritage'],
    estimated_cost: 75,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Boracay Island',
    description: 'Nominated as Asia\'s Leading Luxury Island Destination 2024. World-famous for its 4km White Beach with powder-fine sand. Offers water sports, nightlife, and stunning sunsets.',
    location: 'Boracay',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 11.9674, lng: 121.9248 },
    tags: ['boracay', 'beach', 'white beach', 'island', 'nightlife', 'water sports', 'luxury'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Cebu - Wedding Destination',
    description: 'Nominated as Asia\'s Leading Wedding Destination 2024. The Queen City of the South offers beautiful beaches, historic sites, world-class resorts, and the famous Sinulog Festival.',
    location: 'Cebu',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 10.3157, lng: 123.8854 },
    tags: ['cebu', 'wedding', 'resort', 'beach', 'sinulog', 'history'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },

  // DOT Hidden Gems - Luzon
  {
    name: 'Sagada',
    description: 'DOT-promoted hidden gem known for its hanging coffins, stunning cave systems, and cool mountain climate. Perfect for adventure seekers and culture enthusiasts.',
    location: 'Sagada',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 17.0833, lng: 120.9000 },
    tags: ['sagada', 'mountain province', 'hiking', 'caves', 'hanging coffins', 'nature', 'adventure'],
    estimated_cost: 500,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Baguio City - City of Pines',
    description: 'The Summer Capital of the Philippines. Known for its cool climate, pine trees, and strawberry farms. Features Burnham Park, Mines View, and the famous ukay-ukay shopping.',
    location: 'Baguio',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 16.4023, lng: 120.5960 },
    tags: ['baguio', 'summer capital', 'cool climate', 'pine trees', 'strawberry', 'burnham park'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Batanes Islands',
    description: 'The northernmost province of the Philippines. Features rolling hills, traditional Ivatan stone houses, dramatic cliffs, and untouched natural beauty. Often called the "Home of the Winds."',
    location: 'Batanes',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 20.4487, lng: 121.9702 },
    tags: ['batanes', 'ivatan', 'rolling hills', 'stone houses', 'nature', 'remote', 'scenic'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },

  // DOT Hidden Gems - Visayas
  {
    name: 'Siquijor Island',
    description: 'DOT-featured mystical island known for its healing traditions, pristine beaches, and waterfalls. Despite its reputation for witchcraft, it\'s a peaceful paradise with crystal-clear waters.',
    location: 'Siquijor',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 9.1989, lng: 123.5956 },
    tags: ['siquijor', 'mystical', 'beach', 'waterfall', 'healing', 'island'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Bohol - Chocolate Hills & Tarsiers',
    description: 'DOT-featured destination famous for the Chocolate Hills geological formation and the Philippine tarsier. Also offers beautiful beaches, historic churches, and river cruises.',
    location: 'Bohol',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 9.8500, lng: 124.0000 },
    tags: ['bohol', 'chocolate hills', 'tarsier', 'beach', 'panglao', 'river cruise'],
    estimated_cost: 500,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Camiguin Island',
    description: 'DOT-featured "Island Born of Fire" with more volcanoes per square kilometer than any other island. Features hot springs, cold springs, waterfalls, and the unique Sunken Cemetery.',
    location: 'Camiguin',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 9.1833, lng: 124.7167 },
    tags: ['camiguin', 'volcano', 'hot springs', 'waterfall', 'sunken cemetery', 'island'],
    estimated_cost: 200,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Apo Island Marine Sanctuary',
    description: 'One of the world\'s best-managed community marine sanctuaries. Famous for snorkeling and diving with sea turtles, vibrant coral reefs, and diverse marine life.',
    location: 'Negros Oriental',
    place_type: 'activity',
    category: 'activity',
    coordinates: { lat: 9.0667, lng: 123.2667 },
    tags: ['apo island', 'diving', 'snorkeling', 'sea turtles', 'marine sanctuary', 'coral reef'],
    estimated_cost: 1000,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
  },

  // DOT Hidden Gems - Mindanao
  {
    name: 'Davao City',
    description: 'Home to Mount Apo, the highest peak in the Philippines, and the Philippine Eagle Center. A blend of modern city living and natural beauty, known for durian and safety.',
    location: 'Davao',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 7.0707, lng: 125.6087 },
    tags: ['davao', 'mount apo', 'philippine eagle', 'durian', 'nature', 'city'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Siargao Island - Surfing Capital',
    description: 'The Surfing Capital of the Philippines, famous for Cloud 9 wave. Beyond surfing, it offers lagoons, rock pools, island hopping, and a laid-back island vibe.',
    location: 'Siargao',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 9.8500, lng: 126.0333 },
    tags: ['siargao', 'surfing', 'cloud 9', 'island hopping', 'lagoon', 'beach'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Enchanted River',
    description: 'A mystical deep blue saltwater river that meets the sea. Known for its incredibly clear, blue water and the fish feeding ritual at noon. One of Mindanao\'s top attractions.',
    location: 'Surigao del Sur',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 8.1333, lng: 126.2167 },
    tags: ['enchanted river', 'surigao', 'mindanao', 'swimming', 'nature', 'mystical'],
    estimated_cost: 50,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },

  // Palawan - Best Island in the World
  {
    name: 'El Nido',
    description: 'Gateway to the Bacuit Archipelago with stunning limestone cliffs, hidden lagoons, and pristine beaches. Consistently rated among the world\'s best islands.',
    location: 'El Nido',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 11.1784, lng: 119.4080 },
    tags: ['el nido', 'palawan', 'island hopping', 'lagoon', 'limestone', 'beach', 'snorkeling'],
    estimated_cost: 1400,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Coron',
    description: 'Famous for WWII Japanese shipwrecks, crystal-clear lakes, and hot springs. One of the world\'s top wreck diving destinations with stunning above-water scenery.',
    location: 'Coron',
    place_type: 'activity',
    category: 'activity',
    coordinates: { lat: 11.9986, lng: 120.2043 },
    tags: ['coron', 'palawan', 'diving', 'wreck diving', 'lake', 'island hopping'],
    estimated_cost: 1800,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
  },

  // Additional DOT-Promoted Spots
  {
    name: 'Hundred Islands National Park',
    description: 'The first national park in the Philippines featuring 124 islands and islets. Perfect for island hopping, snorkeling, kayaking, and zipline adventures.',
    location: 'Pangasinan',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 16.2000, lng: 119.9167 },
    tags: ['hundred islands', 'pangasinan', 'island hopping', 'snorkeling', 'kayaking', 'national park'],
    estimated_cost: 500,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Taal Volcano',
    description: 'One of the world\'s smallest active volcanoes, located on an island within a lake within an island. A unique geological wonder just a few hours from Manila.',
    location: 'Batangas',
    place_type: 'attraction',
    category: 'attraction',
    coordinates: { lat: 14.0113, lng: 120.9975 },
    tags: ['taal', 'volcano', 'batangas', 'tagaytay', 'hiking', 'nature', 'day trip'],
    estimated_cost: 2500,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
  {
    name: 'Kalanggaman Island',
    description: 'A pristine sandbar island known for its stunning white sand beach stretching into crystal-clear waters. One of the most photographed beaches in the Philippines.',
    location: 'Leyte',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 11.2000, lng: 124.3500 },
    tags: ['kalanggaman', 'leyte', 'sandbar', 'beach', 'camping', 'island'],
    estimated_cost: 500,
    price_range: 'budget',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Sumilon Island',
    description: 'Home to the oldest marine sanctuary in the Philippines. Features a stunning sandbar that changes shape with the tides and excellent snorkeling with sardine schools.',
    location: 'Cebu',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 9.2333, lng: 123.3833 },
    tags: ['sumilon', 'cebu', 'sandbar', 'marine sanctuary', 'snorkeling', 'sardines'],
    estimated_cost: 1500,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Bantayan Island',
    description: 'A peaceful island paradise known for its sugar-white beaches, affordable seafood, and laid-back atmosphere. Less crowded than other popular destinations.',
    location: 'Cebu',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 11.1833, lng: 123.7333 },
    tags: ['bantayan', 'cebu', 'beach', 'island', 'seafood', 'peaceful'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: false,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Donsol - Whale Shark Capital',
    description: 'The Whale Shark Capital of the World. Best place to swim with gentle whale sharks (butanding) in their natural habitat from November to June.',
    location: 'Sorsogon',
    place_type: 'activity',
    category: 'activity',
    coordinates: { lat: 12.9083, lng: 123.5972 },
    tags: ['donsol', 'whale shark', 'butanding', 'sorsogon', 'bicol', 'wildlife', 'swimming'],
    estimated_cost: 1000,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
  },
  {
    name: 'Caramoan Islands',
    description: 'A group of stunning limestone islands featured in multiple Survivor TV series. Pristine beaches, hidden lagoons, and dramatic rock formations.',
    location: 'Camarines Sur',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 13.7667, lng: 123.8667 },
    tags: ['caramoan', 'bicol', 'survivor', 'island hopping', 'beach', 'limestone'],
    estimated_cost: 2000,
    price_range: 'moderate',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Pagudpud',
    description: 'Home to the "Boracay of the North" - Saud Beach. Features stunning white sand beaches, the Bangui Windmills, and the beautiful Kapurpurawan Rock Formation.',
    location: 'Ilocos',
    place_type: 'beach',
    category: 'beach',
    coordinates: { lat: 18.5500, lng: 120.8500 },
    tags: ['pagudpud', 'ilocos', 'beach', 'saud beach', 'bangui windmills', 'kapurpurawan'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    name: 'Bangui Windmills',
    description: 'The first wind farm in Southeast Asia featuring 20 massive wind turbines along the coast. An iconic landmark and Instagram-worthy spot in Ilocos Norte.',
    location: 'Ilocos',
    place_type: 'landmark',
    category: 'landmark',
    coordinates: { lat: 18.5333, lng: 120.8000 },
    tags: ['bangui', 'windmills', 'ilocos', 'landmark', 'instagram', 'renewable energy'],
    estimated_cost: 0,
    price_range: 'free',
    is_featured: true,
    photo_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  },
]

async function seedDOTDestinations() {
  console.log('🇵🇭 DOT Official Destinations Seeder\n')
  console.log(`Processing ${DOT_DESTINATIONS.length} destinations...\n`)

  let added = 0
  let skipped = 0

  for (const place of DOT_DESTINATIONS) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('places')
      .select('id')
      .eq('name', place.name)
      .single()

    if (existing) {
      console.log(`⏭️  ${place.name} (already exists)`)
      skipped++
      continue
    }

    const placeData = {
      name: place.name,
      description: place.description,
      location: place.location,
      address: `${place.name}, ${place.location}, Philippines`,
      coordinates: place.coordinates ? `(${place.coordinates.lat}, ${place.coordinates.lng})` : null,
      place_type: place.place_type,
      category: place.category,
      price_range: place.price_range,
      estimated_cost: place.estimated_cost,
      tags: place.tags,
      photos: [place.photo_url],
      is_featured: place.is_featured,
      average_rating: 4.5 + Math.random() * 0.4, // 4.5-4.9 for DOT featured
      total_reviews: Math.floor(Math.random() * 2000) + 500, // Higher reviews for official spots
      is_active: true,
    }

    const { error } = await supabase.from('places').insert(placeData)

    if (error) {
      console.error(`❌ ${place.name}: ${error.message}`)
    } else {
      console.log(`✅ ${place.name} (${place.location})`)
      added++
    }
  }

  console.log(`\n✨ Done! Added ${added} new DOT destinations. Skipped ${skipped} existing.`)
}

seedDOTDestinations().catch(console.error)
