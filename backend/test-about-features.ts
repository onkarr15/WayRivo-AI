import * as fs from 'fs';
import * as path from 'path';

async function testAboutFeatures() {
  console.log('Testing About Page Feature Anchors and Footer Links...');

  // 1. Check AboutPage.tsx
  const aboutPath = path.resolve(__dirname, '../frontend/src/pages/public/AboutPage.tsx');
  const aboutSource = fs.readFileSync(aboutPath, 'utf-8');

  if (!aboutSource.includes('id="escrow-terms"')) {
    throw new Error('AboutPage.tsx is missing id="escrow-terms"');
  }
  console.log('✅ Found id="escrow-terms" in AboutPage.tsx');

  if (!aboutSource.includes('id="security-architecture"')) {
    throw new Error('AboutPage.tsx is missing id="security-architecture"');
  }
  console.log('✅ Found id="security-architecture" in AboutPage.tsx');

  if (!aboutSource.includes('featureParam === \'escrow\'')) {
    throw new Error('AboutPage.tsx is missing featureParam scroll listener for escrow');
  }
  console.log('✅ Found escrow feature listener in AboutPage.tsx');

  if (!aboutSource.includes('featureParam === \'security\'')) {
    throw new Error('AboutPage.tsx is missing featureParam scroll listener for security');
  }
  console.log('✅ Found security feature listener in AboutPage.tsx');

  // 2. Check Footer.tsx
  const footerPath = path.resolve(__dirname, '../frontend/src/components/Footer.tsx');
  const footerSource = fs.readFileSync(footerPath, 'utf-8');

  if (!footerSource.includes('handleScrollToFeature')) {
    throw new Error('Footer.tsx is missing handleScrollToFeature implementation');
  }
  console.log('✅ Found handleScrollToFeature in Footer.tsx');

  if (!footerSource.includes('to="/about?feature=escrow#escrow-terms"')) {
    throw new Error('Footer.tsx is missing to="/about?feature=escrow#escrow-terms"');
  }
  console.log('✅ Found Escrow Terms link pointing to /about?feature=escrow#escrow-terms in Footer.tsx');

  if (!footerSource.includes('to="/about?feature=security#security-architecture"')) {
    throw new Error('Footer.tsx is missing to="/about?feature=security#security-architecture"');
  }
  console.log('✅ Found Security link pointing to /about?feature=security#security-architecture in Footer.tsx');

  // 3. Test dev server HTTP endpoint
  const res = await fetch('http://localhost:5173/about');
  console.log('Frontend dev server GET /about status:', res.status, res.statusText);
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

  console.log('\n🎉 ALL ABOUT FEATURE & SCROLL VERIFICATION CHECKS PASSED!');
}

testAboutFeatures().catch(err => {
  console.error(err);
  process.exit(1);
});

