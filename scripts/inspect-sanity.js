const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '2gdjnoi2',
  dataset: 'production',
  apiVersion: '2026-02-01',
  useCdn: false,
});

async function main() {
  const types = await client.fetch('array::unique(*[_type != "system.schema"]._type)');
  console.log('Sanity Document Types in Dataset:', types);
  for (const t of types) {
    const count = await client.fetch(`count(*[_type == "${t}"])`);
    console.log(`- ${t}: ${count} docs`);
  }
}

main().catch(console.error);
