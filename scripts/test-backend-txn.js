const path = require('path');

async function testTxn() {
  try {
    const { processTransaction } = require('../lib/agents/pipeline');
    
    const sampleTxn = {
      txn_id: 'TXN-TEST-001',
      user_id: 'USR_123456',
      amount: 1500,
      location: 'Delhi, Delhi',
      ip: '192.168.1.45',
      device: 'mobile',
      timestamp: new Date().toISOString(),
      beneficiary_id: 'store@upi'
    };

    const telemetry = {
      recentSms: null,
      smsSender: null,
      isOnActiveCall: false,
      callDurationSec: 0
    };

    console.log('Running processTransaction...');
    const result = await processTransaction(sampleTxn, telemetry);
    console.log('SUCCESS! Processed Transaction Status:', result.transaction.status, 'Risk Score:', result.transaction.riskScore);
  } catch (err) {
    console.error('ERROR in processTransaction:', err);
  }
}

testTxn();
