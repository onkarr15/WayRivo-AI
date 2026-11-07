const API_BASE = 'http://localhost:8085/api/v1';

async function postJson(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function getJson(url: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data: any = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function getBinary(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    let errBody = '';
    try {
      errBody = await res.text();
    } catch {}
    const error: any = new Error(`Binary fetch failed with ${res.status}: ${errBody}`);
    error.status = res.status;
    throw error;
  }
  const arrayBuf = await res.arrayBuffer();
  return {
    status: res.status,
    headers: res.headers,
    buffer: Buffer.from(arrayBuf),
  };
}

async function runPdfReceiptTests() {
  console.log('\n======================================================================');
  console.log('📄 WayRivo AI: PDF Receipt Generation & Cross-Device Download Test');
  console.log('Backend Target:', API_BASE);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    // 1. Authenticate Traveler A
    const travelerAEmail = `traveler.pdf.a.${timestamp}@test.wayrivo.com`;
    const regResA = await postJson(`${API_BASE}/auth/register`, {
      name: 'Aditi Sharma',
      email: travelerAEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const tokenA = regResA.data.token;
    assert(!!tokenA, '1. Primary traveler authenticated');

    // 2. Authenticate Traveler B (for security check)
    const travelerBEmail = `traveler.pdf.b.${timestamp}@test.wayrivo.com`;
    const regResB = await postJson(`${API_BASE}/auth/register`, {
      name: 'Vikram Joshi',
      email: travelerBEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const tokenB = regResB.data.token;
    assert(!!tokenB, '2. Secondary traveler authenticated for access isolation');

    // 3. Get seeded destination & create itinerary & booking
    const destRes = await getJson(`${API_BASE}/destinations`);
    const dest = destRes.data[0];

    const itinRes = await postJson(
      `${API_BASE}/itineraries`,
      {
        destinationId: dest.id,
        title: '3-Day Highland Retreat',
        travelStyle: 'NATURE',
        startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 13).toISOString(),
        travelersCount: 2,
        roomsCount: 1,
        adultsCount: 2,
        childrenCount: 0,
        itineraryDays: [
          {
            dayNumber: 1,
            title: 'Estate Walk & Tasting',
            description: 'Guided tour of lush tea estates and factory museum',
            estimatedDayCost: 18000,
          },
        ],
      },
      tokenA
    );
    const itinerary = itinRes.data;

    const bookRes = await postJson(
      `${API_BASE}/bookings`,
      {
        itineraryId: itinerary.id,
        specialRequests: 'Balcony room facing the tea valleys',
      },
      tokenA
    );
    const booking = bookRes.data;
    assert(!!booking.id, `3. Booking created: ${booking.bookingReference}`);

    // 4. Pre-payment session initialized
    const sessionRes = await postJson(
      `${API_BASE}/payments/create-session`,
      { bookingId: booking.id },
      tokenA
    );
    const sessionId = sessionRes.data.paymentSessionId;
    assert(!!sessionId, '4. Pre-payment session initialized');

    // 5. Uncaptured receipt request rejected (HTTP 400)
    let uncapturedBlocked = false;
    try {
      await getBinary(`${API_BASE}/payments/${sessionId}/receipt?format=pdf`, tokenA);
    } catch (err: any) {
      if (err.status === 400) {
        uncapturedBlocked = true;
      }
    }
    assert(uncapturedBlocked, '5. Security Check: PDF generation rejected for uncaptured booking (HTTP 400)');

    // 6. Create Order and Capture
    const orderRes = await postJson(
      `${API_BASE}/payments/create-order`,
      {
        bookingId: booking.id,
        returnUrl: 'http://localhost:5173/payment/success',
        cancelUrl: 'http://localhost:5173/payment/cancel',
      },
      tokenA
    );
    const orderId = orderRes.data.orderId;
    assert(!!orderId, `6. PayPal order created: ${orderId}`);

    const captureRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking.id,
        paypalOrderId: orderId,
        idempotencyKey: `idemp-pdf-${timestamp}`,
        payerEmail: 'aditi.sharma.buyer@personal.example.com',
        payerName: 'Aditi Sharma',
      },
      tokenA
    );
    const payment = captureRes.data.payment;
    assert(!!payment.id, '7. PayPal order captured successfully');

    // 8. Backward Compatibility: Default GET /payments/:id/receipt returns JSON
    const jsonReceiptRes = await getJson(`${API_BASE}/payments/${payment.id}/receipt`, tokenA);
    assert(
      jsonReceiptRes.data?.wayrivoTransactionId &&
        jsonReceiptRes.data.wayrivoTransactionId.length === 12,
      `8. JSON receipt endpoint operational (TxID: ${jsonReceiptRes.data.wayrivoTransactionId})`
    );

    // 9. PDF Generation: GET /payments/:id/receipt?format=pdf returns binary PDF
    const pdfReceiptRes = await getBinary(`${API_BASE}/payments/${payment.id}/receipt?format=pdf`, tokenA);
    const pdfBuffer = pdfReceiptRes.buffer;
    const contentType = pdfReceiptRes.headers.get('content-type');
    const contentDisp = pdfReceiptRes.headers.get('content-disposition');

    assert(pdfReceiptRes.status === 200, '9. PDF Receipt returned with HTTP 200 OK');
    assert(contentType === 'application/pdf', `10. Content-Type is application/pdf (got: ${contentType})`);
    assert(
      !!(contentDisp && contentDisp.includes('attachment') && contentDisp.includes('.pdf')),
      `11. Content-Disposition is attachment with .pdf filename (got: ${contentDisp})`
    );

    // 12. PDF Magic Byte Header Verification (%PDF-)
    const pdfMagic = pdfBuffer.subarray(0, 5).toString('ascii');
    assert(pdfMagic.startsWith('%PDF-'), `12. Valid PDF binary structure with magic header (got: ${pdfMagic})`);
    assert(pdfBuffer.length > 2000, `13. PDF size is substantial (${pdfBuffer.length} bytes)`);

    // 14. Alias route: GET /payments/:id/receipt/pdf works identically
    const aliasPdfRes = await getBinary(`${API_BASE}/payments/${payment.id}/receipt/pdf`, tokenA);
    assert(
      aliasPdfRes.status === 200 && aliasPdfRes.headers.get('content-type') === 'application/pdf',
      '14. Alias endpoint /payments/:id/receipt/pdf returns valid PDF'
    );

    // 15. Mobile direct download via query param token: GET /payments/:id/receipt?format=pdf&token=<tokenA>
    const mobilePdfRes = await getBinary(
      `${API_BASE}/payments/${payment.id}/receipt?format=pdf&token=${tokenA}`
    );
    assert(
      mobilePdfRes.status === 200 && mobilePdfRes.headers.get('content-type') === 'application/pdf',
      '15. Cross-Device Mobile Support: Direct download via ?token= query param succeeds without headers'
    );

    // 16. Security Check: Traveler B cannot download Traveler A's receipt (403 Forbidden)
    let unauthorizedBlocked = false;
    try {
      await getBinary(`${API_BASE}/payments/${payment.id}/receipt?format=pdf`, tokenB);
    } catch (err: any) {
      if (err.status === 403) {
        unauthorizedBlocked = true;
      }
    }
    assert(unauthorizedBlocked, '16. Security Check: Cross-user receipt access blocked (HTTP 403 Forbidden)');

    // 17. Security Check: Unauthenticated request rejected (401 Unauthorized)
    let unauthenticatedBlocked = false;
    try {
      await getBinary(`${API_BASE}/payments/${payment.id}/receipt?format=pdf`);
    } catch (err: any) {
      if (err.status === 401) {
        unauthenticatedBlocked = true;
      }
    }
    assert(unauthenticatedBlocked, '17. Security Check: Unauthenticated PDF download rejected (HTTP 401 Unauthorized)');

  } catch (err: any) {
    console.error('Test execution failed with error:', err.data || err.message);
    failed++;
  }

  console.log('\n======================================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runPdfReceiptTests();
