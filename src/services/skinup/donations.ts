// Mock Every.org integration — org search and donate

import { EveryOrgOrganization, DonationResult } from '../../types/skinup'

// Mock organization database
const MOCK_ORGS: EveryOrgOrganization[] = [
  {
    slug: 'american-red-cross',
    name: 'American Red Cross',
    description: 'Prevents and alleviates human suffering in the face of emergencies.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '53-0196605',
    category: 'Humanitarian',
    location: 'Washington, DC',
    websiteUrl: 'https://redcross.org',
  },
  {
    slug: 'doctors-without-borders',
    name: 'Doctors Without Borders',
    description: 'International medical humanitarian organization providing aid where needed most.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '13-3433452',
    category: 'Health',
    location: 'New York, NY',
    websiteUrl: 'https://msf.org',
  },
  {
    slug: 'khan-academy',
    name: 'Khan Academy',
    description: 'Free world-class education for anyone, anywhere.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '26-1544963',
    category: 'Education',
    location: 'Mountain View, CA',
    websiteUrl: 'https://khanacademy.org',
  },
  {
    slug: 'electronic-frontier-foundation',
    name: 'Electronic Frontier Foundation',
    description: 'Defending digital privacy, free speech, and innovation.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '04-3091431',
    category: 'Technology',
    location: 'San Francisco, CA',
    websiteUrl: 'https://eff.org',
  },
  {
    slug: 'world-wildlife-fund',
    name: 'World Wildlife Fund',
    description: 'Conservation of nature and reduction of the most pressing threats to the diversity of life on Earth.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '52-1693387',
    category: 'Environment',
    location: 'Washington, DC',
    websiteUrl: 'https://worldwildlife.org',
  },
  {
    slug: 'feeding-america',
    name: 'Feeding America',
    description: 'Nationwide network of food banks feeding America\'s hungry.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '36-3673599',
    category: 'Hunger Relief',
    location: 'Chicago, IL',
    websiteUrl: 'https://feedingamerica.org',
  },
  {
    slug: 'wikipedia',
    name: 'Wikimedia Foundation',
    description: 'Free knowledge for everyone. The organization behind Wikipedia.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '20-0049703',
    category: 'Education',
    location: 'San Francisco, CA',
    websiteUrl: 'https://wikimediafoundation.org',
  },
  {
    slug: 'givedirectly',
    name: 'GiveDirectly',
    description: 'Send money directly to the world\'s poorest households.',
    logoUrl: null,
    coverImageUrl: null,
    ein: '27-1661997',
    category: 'Poverty',
    location: 'New York, NY',
    websiteUrl: 'https://givedirectly.org',
  },
]

export const DonationService = {
  async searchOrgs(query: string): Promise<EveryOrgOrganization[]> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 300))

    if (!query.trim()) return MOCK_ORGS.slice(0, 5)

    const q = query.toLowerCase()
    return MOCK_ORGS.filter(
      org =>
        org.name.toLowerCase().includes(q) ||
        org.category.toLowerCase().includes(q) ||
        org.description.toLowerCase().includes(q)
    )
  },

  async getOrg(slug: string): Promise<EveryOrgOrganization | null> {
    await new Promise(r => setTimeout(r, 100))
    return MOCK_ORGS.find(o => o.slug === slug) || null
  },

  async donate(orgSlug: string, amountCents: number): Promise<DonationResult> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500))

    const org = MOCK_ORGS.find(o => o.slug === orgSlug)

    return {
      success: true,
      amount: amountCents,
      orgSlug,
      orgName: org?.name || orgSlug,
      timestamp: new Date().toISOString(),
      receiptUrl: `https://every.org/${orgSlug}/receipt/mock-${Date.now()}`,
    }
  },

  async getFeaturedOrgs(): Promise<EveryOrgOrganization[]> {
    await new Promise(r => setTimeout(r, 200))
    return MOCK_ORGS.slice(0, 5)
  },
}
