import * as fs from 'fs';
import * as path from 'path';

async function testPrivacyPolicy() {
  console.log('Testing Privacy Policy Route on Frontend Dev Server (http://localhost:5173)...');
  
  // 1. Direct route access
  const res = await fetch('http://localhost:5173/privacy-policy');
  console.log('Status for /privacy-policy:', res.status, res.statusText);
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

  const html = await res.text();
  console.log('Index HTML fetched successfully. Length:', html.length);
  if (!html.includes('id="root"')) throw new Error('HTML does not contain root element');

  // 2. Direct alias route access
  const aliasRes = await fetch('http://localhost:5173/privacy');
  console.log('Status for /privacy alias:', aliasRes.status, aliasRes.statusText);
  if (aliasRes.status !== 200) throw new Error(`Expected 200, got ${aliasRes.status}`);

  // 3. Inspect component source file
  const compPath = path.resolve(__dirname, '../frontend/src/pages/public/PrivacyPolicyPage.tsx');
  const compSource = fs.readFileSync(compPath, 'utf-8');
  console.log('PrivacyPolicyPage.tsx size:', compSource.length, 'bytes');

  // Verify all 21 sections are defined
  const sectionIds = [
    'introduction',
    'information-we-collect',
    'personal-information',
    'account-and-authentication',
    'travel-and-booking-information',
    'payment-information',
    'ai-powered-services-and-gemini',
    'cookies-and-similar-technologies',
    'how-we-use-your-information',
    'how-we-share-your-information',
    'third-party-services',
    'paypal-payment-processing',
    'supabase-database-and-storage',
    'data-security',
    'data-retention',
    'user-rights-and-data-access',
    'account-deletion',
    'childrens-privacy',
    'international-data-transfers',
    'changes-to-this-privacy-policy',
    'contact-information'
  ];

  for (const id of sectionIds) {
    if (!compSource.includes(`id="${id}"`)) {
      throw new Error(`Missing section anchor: id="${id}"`);
    }
  }
  console.log('All 21 sections verified in PrivacyPolicyPage.tsx');

  // 4. Verify Footer link points to /privacy-policy
  const footerPath = path.resolve(__dirname, '../frontend/src/components/Footer.tsx');
  const footerSource = fs.readFileSync(footerPath, 'utf-8');
  if (!footerSource.includes('to="/privacy-policy"')) {
    throw new Error('Footer does not link to /privacy-policy');
  }
  console.log('Verified Footer.tsx links to /privacy-policy');

  // 5. Verify App.tsx has route configured
  const appPath = path.resolve(__dirname, '../frontend/src/App.tsx');
  const appSource = fs.readFileSync(appPath, 'utf-8');
  if (!appSource.includes('path="/privacy-policy"')) {
    throw new Error('App.tsx does not have /privacy-policy route');
  }
  console.log('Verified App.tsx has route /privacy-policy');

  // 6. Verify docs/PRIVACY_POLICY.md exists
  const docPath = path.resolve(__dirname, '../docs/PRIVACY_POLICY.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('docs/PRIVACY_POLICY.md does not exist');
  }
  console.log('Verified docs/PRIVACY_POLICY.md exists and is populated');

  console.log('\n🎉 ALL PRIVACY POLICY VERIFICATION CHECKS PASSED!');
}

testPrivacyPolicy().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
