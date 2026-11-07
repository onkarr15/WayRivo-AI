import { execSync } from 'child_process';

const testSuites = [
  { name: 'Core REST APIs & Authentication', file: 'test-api.ts' },
  { name: 'Security Penetration & RBAC Audit', file: 'test-security.ts' },
  { name: 'Dynamic Itinerary & Budget Math Engine', file: 'test-budget-intelligence.ts' },
  { name: 'Google Gemini Travel Agent & AI Tools', file: 'test-agent-workflow.ts' },
  { name: 'Expert Marketplace & Proposal Sync', file: 'test-proposal-flow.ts' },
  { name: 'Confirmed Proposal -> My Bookings Pipeline', file: 'test-confirmed-proposal-booking.ts' },
  { name: 'PayPal Orders v2 & Escrow State Transitions', file: 'test-booking-paypal.ts' },
  { name: 'Traveler & Admin Analytics Portals', file: 'test-dashboards.ts' },
  { name: 'Complete End-to-End User Journey', file: 'test-e2e-journey.ts' },
  { name: 'Debit/Credit Card & PayPal Sandbox Redirect Flow', file: 'test-card-and-paypal-redirect.ts' },
  { name: 'Server-Authoritative 6-Minute Payment Countdown Timer', file: 'test-payment-timer.ts' },
  { name: '5–6s Payment Processing Animation & Capture Verification', file: 'test-payment-processing-animation.ts' },
  { name: 'Payment Success Page & PDF Receipt with 12-Digit TxID & PayPal Logo', file: 'test-payment-success-receipt.ts' },
  { name: 'PayPal Buffering Animations & 6-Minute Countdown Visibility', file: 'test-payment-buffering-countdown.ts' },
  { name: 'Enhanced Admin Dashboard & Financial Telemetry', file: 'test-admin-dashboard-enhancements.ts' },
];

console.log('\n======================================================================');
console.log('🚀 WayRivo AI 2.0: Full Platform Automated Verification Runner');
console.log('======================================================================\n');

let totalSuitesPassed = 0;
let totalSuitesFailed = 0;

for (const suite of testSuites) {
  process.stdout.write(`⏳ Executing ${suite.name} (${suite.file})... `);
  try {
    const start = Date.now();
    execSync(`npx ts-node ${suite.file}`, { stdio: 'pipe', encoding: 'utf-8' });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ PASSED (${elapsed}s)`);
    totalSuitesPassed++;
  } catch (err: any) {
    console.log(`❌ FAILED`);
    console.error(err.stdout || err.stderr || err.message);
    totalSuitesFailed++;
  }
}

console.log('\n======================================================================');
console.log(`📊 FINAL PLATFORM SCORECARD: ${totalSuitesPassed} Suites PASSED / ${totalSuitesFailed} FAILED`);
console.log('======================================================================\n');

process.exit(totalSuitesFailed > 0 ? 1 : 0);

