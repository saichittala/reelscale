const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '2gdjnoi2',
  dataset: 'production',
  apiVersion: '2026-02-01',
  token: 'sk3Siocd2x3A3cJvRxFVtSCR6YoQwHLPqnoqpN1xeikBeEMjg3jntHkEFN1u4OxzFKnGH5sBeUpZ2DeQZlhM9SzXUUnW4YekS9AyaG6LYC4xnwV0D6lh21Gy7kllGRWzcfWtdzgicbaFSsjslbTKmFDdg7wGwssFSvebuA4cGs4ilrkwLEVH',
  useCdn: false,
});

async function cleanup() {
  console.log('1. Checking pricing plans in Sanity...');
  const plans = await client.fetch('*[_type == "pricingPlan"]{_id, title, category}');
  console.log('Found plans:', plans);

  const growthPlans = plans.filter(p => p.category === 'growth' || p.title.toLowerCase().includes('growth') || p._id.includes('growth') || p._id.includes('market-leader'));
  for (const gp of growthPlans) {
    console.log(`Deleting growth plan: ${gp.title} (${gp._id})`);
    await client.delete(gp._id);
  }

  console.log('2. Deleting service and locationPage documents from Sanity...');
  const services = await client.fetch('*[_type == "service"]{_id, title}');
  for (const s of services) {
    console.log(`Deleting service: ${s.title} (${s._id})`);
    await client.delete(s._id);
  }

  const locations = await client.fetch('*[_type == "locationPage"]{_id, title}');
  for (const l of locations) {
    console.log(`Deleting locationPage: ${l.title} (${l._id})`);
    await client.delete(l._id);
  }

  console.log('3. Updating pageSeo records with keywords and focusKeyword...');
  const seoUpdates = [
    {
      pageId: 'home',
      focusKeyword: 'reel production company Hyderabad',
      keywords: [
        'reel production company Hyderabad',
        'reel production Hyderabad',
        'reel production services Hyderabad',
        'reel shoot Hyderabad',
        'reels shoot Hyderabad',
        'Instagram reel production Hyderabad',
        'Instagram reels production company Hyderabad',
        'video production company Hyderabad',
        'video production services Hyderabad',
        'video editing company Hyderabad',
        'video editing services Hyderabad',
        'social media video production Hyderabad',
        'short form video production Hyderabad',
        'commercial video production Hyderabad'
      ]
    },
    {
      pageId: 'pricing',
      focusKeyword: 'reel production packages pricing Hyderabad',
      keywords: [
        'reel production cost Hyderabad',
        'video editing packages Hyderabad',
        'reel shoot pricing Hyderabad',
        'reels production cost',
        'Instagram reel pricing plans'
      ]
    },
    {
      pageId: 'works',
      focusKeyword: 'reels portfolio video production Hyderabad',
      keywords: [
        'reel production case studies',
        'reels portfolio Hyderabad',
        'Instagram reel examples Hyderabad',
        'brand reel examples',
        'video production portfolio'
      ]
    },
    {
      pageId: 'about',
      focusKeyword: 'reel production agency Hyderabad team',
      keywords: [
        'about ReelScale',
        'video production company founders Hyderabad',
        'short form video team Hyderabad',
        'best reel creators Hyderabad'
      ]
    },
    {
      pageId: 'growth',
      focusKeyword: 'social growth agency Hyderabad Instagram reels',
      keywords: [
        'social media marketing agency Hyderabad',
        'Instagram growth agency Hyderabad',
        'Meta ads management Hyderabad',
        'viral reels strategy agency'
      ]
    },
    {
      pageId: 'blog',
      focusKeyword: 'reel production and video editing tips blog',
      keywords: [
        'Instagram reels tips',
        'video editing guides Hyderabad',
        'how to create viral reels',
        'short form video production blog'
      ]
    },
    {
      pageId: 'track',
      focusKeyword: 'reelscale client delivery tracking portal',
      keywords: [
        'client delivery tracker',
        'reel shoot tracking',
        'order status ReelScale'
      ]
    }
  ];

  for (const update of seoUpdates) {
    const doc = await client.fetch('*[_type == "pageSeo" && pageId == $pageId][0]', { pageId: update.pageId });
    if (doc) {
      console.log(`Patching pageSeo for ${update.pageId}...`);
      await client.patch(doc._id).set({
        focusKeyword: update.focusKeyword,
        keywords: update.keywords
      }).commit();
    }
  }

  console.log('Cleanup & SEO update complete!');
}

cleanup().catch(console.error);
