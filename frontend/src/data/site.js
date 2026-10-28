// One place for company details. Replace the placeholder values with real ones.
export const site = {
  name: 'Al Habeeb',
  fullName: 'Al Habeeb Construction & Engineering',
  tagline: 'Building your vision. Innovating for tomorrow.',
  established: 1978, // from the signboard concept - change if different
  offices: ['Dubai', 'Riyadh', 'London'],
  email: 'info@alhabeebce.com', // placeholder
  phone: '+971 56 111 9233', // placeholder
  website: 'www.alhabeebce.com', // placeholder
  // Social media links - replace '#' with the real page addresses.
  social: [
    { title: 'Facebook', icon: 'facebook', href: '#' },
    { title: 'Instagram', icon: 'instagram', href: '#' },
    { title: 'LinkedIn', icon: 'linkedin', href: '#' },
    { title: 'X (Twitter)', icon: 'x', href: '#' },
    { title: 'YouTube', icon: 'youtube', href: '#' },
    { title: 'WhatsApp', icon: 'whatsapp', href: '#' },
  ],
}

// Photos that slide behind the hero text (files are in public/images).
// Real project sites + reference images you supplied.
export const heroBackgrounds = [
  { src: '/images/hero-bg-tower-dusk.jpg', alt: 'Tower rising at dusk, cranes still working' },
  { src: '/images/hero-bg-glass-tower.jpg', alt: 'Glass tower under construction against a clear sky' },
  { src: '/images/hero-bg-green-building.jpg', alt: 'Low-rise building with rooftop garden and solar panels' },
  { src: '/images/hero-bg-night-site.jpg', alt: 'Construction site lit up at night, several cranes working' },
  { src: '/images/hero-bg-villa-sunset.jpg', alt: 'Finished villa with an infinity pool at sunset' },
]

export const values = [
  { title: 'Quality Construction', icon: 'hardhat' },
  { title: 'Expert Engineering', icon: 'gear' },
  { title: 'Reliable Partner', icon: 'handshake' },
  { title: 'Sustainable Futures', icon: 'building' },
]

// Shown if the backend is asleep or not deployed yet, so the website never looks empty.
export const fallbackServices = [
  {
    id: 1,
    title: 'Residential Construction',
    icon: 'home',
    description: 'Villas, apartment buildings and housing developments built to a high standard of finish.',
  },
  {
    id: 2,
    title: 'Commercial Construction',
    icon: 'building',
    description: 'Offices, retail and mixed-use towers delivered on programme and on budget.',
  },
  {
    id: 3,
    title: 'Civil Engineering Solutions',
    icon: 'gear',
    description: 'Structural design, foundations, infrastructure and site engineering.',
  },
  {
    id: 4,
    title: 'Renovation & Remodeling',
    icon: 'crane',
    description: 'Upgrades, extensions and refurbishment of existing buildings with minimal disruption.',
  },
  {
    id: 5,
    title: 'Project Planning & Design',
    icon: 'blueprint',
    description: 'Feasibility, drawings, 3D coordination and cost planning from concept to tender.',
  },
  {
    id: 6,
    title: 'Quality, Safety & Compliance',
    icon: 'shield',
    description: 'Site safety, inspections and full compliance with authority requirements.',
  },
]

export const fallbackProjects = [
  {
    id: 1,
    slug: 'al-habeeb-tower',
    title: 'Al Habeeb Tower - Structural & Façade Systems',
    location: 'Dubai',
    status: 'Design Concept',
    category: 'Commercial',
    summary: 'A 30-storey smart tower concept with a glass curtain wall and LEED Platinum target.',
    image_url: '/images/concept-board.jpg',
  },
  {
    id: 2,
    slug: 'commercial-tower-site',
    title: 'Commercial Tower',
    location: 'Dubai',
    status: 'Under Construction',
    category: 'Commercial',
    summary: 'Reinforced concrete frame with glazed façade currently rising on site.',
    image_url: '/images/site-progress.jpg',
  },
  {
    id: 3,
    slug: 'glass-tower-facade',
    title: 'Glass Tower - Façade Installation',
    location: 'Dubai',
    status: 'Under Construction',
    category: 'Commercial',
    summary: 'Steel frame topped out with unitised glass curtain wall panels being installed floor by floor.',
    image_url: '/images/tower-facade-view.jpg',
  },
]