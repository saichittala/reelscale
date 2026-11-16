const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '2gdjnoi2',
  dataset: 'production',
  apiVersion: '2026-02-01',
  useCdn: false,
});

async function main() {
  const plans = await client.fetch('*[_type == "pricingPlan"]{_id, title, category, price, cadence, order}');
  console.log('PRICING PLANS in Sanity:');
  console.log(plans);

  const seos = await client.fetch('*[_type == "pageSeo"]{_id, pageId, focusKeyword, "keywordCount": length(keywords)}');
  console.log('PAGE SEO in Sanity:');
  console.log(seos);
}

main().catch(console.error);
