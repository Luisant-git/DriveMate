import prisma from './src/config/database.js';

const serviceAreas = [
  {
    name: 'Delhi',
    city: 'Delhi',
    state: 'Delhi',
    radius: 40,
    latitude: 28.6139,
    longitude: 77.2090,
    isActive: true
  },
  {
    name: 'Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    radius: 40,
    latitude: 19.0760,
    longitude: 72.8777,
    isActive: true
  },
  {
    name: 'Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    radius: 40,
    latitude: 22.5726,
    longitude: 88.3639,
    isActive: true
  },
  {
    name: 'Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    radius: 40,
    latitude: 12.9716,
    longitude: 77.5946,
    isActive: true
  },
  {
    name: 'Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    radius: 40,
    latitude: 13.0827,
    longitude: 80.2707,
    isActive: true
  },
  {
    name: 'Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    radius: 40,
    latitude: 17.3850,
    longitude: 78.4867,
    isActive: true
  },
  {
    name: 'Vijayawada',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    radius: 40,
    latitude: 16.5062,
    longitude: 80.6480,
    isActive: true
  },
  {
    name: 'Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    radius: 40,
    latitude: 23.0225,
    longitude: 72.5714,
    isActive: true
  },
  {
    name: 'Surat',
    city: 'Surat',
    state: 'Gujarat',
    radius: 40,
    latitude: 21.1702,
    longitude: 72.8311,
    isActive: true
  },
  {
    name: 'Pune',
    city: 'Pune',
    state: 'Maharashtra',
    radius: 40,
    latitude: 18.5204,
    longitude: 73.8567,
    isActive: true
  },
  {
    name: 'Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    radius: 40,
    latitude: 26.9124,
    longitude: 75.7873,
    isActive: true
  }
];

async function seedServiceAreas() {
  console.log('--------------------------------------------------');
  console.log('📍 Seeding Active Service Areas (40 km Radius)...');
  console.log('--------------------------------------------------');

  const existingAreas = await prisma.serviceArea.findMany();
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of serviceAreas) {
    // Check if area already exists by matching city or name (case-insensitive)
    const existing = existingAreas.find(
      (a) =>
        a.city.toLowerCase() === item.city.toLowerCase() ||
        a.name.toLowerCase() === item.name.toLowerCase()
    );

    if (existing) {
      const updated = await prisma.serviceArea.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          city: item.city,
          state: item.state,
          radius: item.radius,
          latitude: item.latitude,
          longitude: item.longitude,
          isActive: true
        }
      });
      console.log(`✓ Updated: ${updated.city}, ${updated.state} [Radius: ${updated.radius} km, Coordinates: ${updated.latitude}, ${updated.longitude}]`);
      updatedCount++;
    } else {
      const created = await prisma.serviceArea.create({
        data: item
      });
      console.log(`+ Added:   ${created.city}, ${created.state} [Radius: ${created.radius} km, Coordinates: ${created.latitude}, ${created.longitude}]`);
      createdCount++;
    }
  }

  const allAreas = await prisma.serviceArea.findMany({
    orderBy: { name: 'asc' }
  });

  console.log('--------------------------------------------------');
  console.log(`✨ Done! ${createdCount} created, ${updatedCount} updated.`);
  console.log(`📊 Total Active Service Areas in DB: ${allAreas.length}`);
  console.log('--------------------------------------------------');
  console.table(
    allAreas.map(a => ({
      City: a.city,
      State: a.state,
      'Radius (km)': `${a.radius} km`,
      Latitude: a.latitude,
      Longitude: a.longitude,
      Status: a.isActive ? 'Active' : 'Inactive'
    }))
  );
}

seedServiceAreas()
  .catch((err) => {
    console.error('❌ Error seeding service areas:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

