const mongoose = require('mongoose');
const ReturnRequest = require('./models/ReturnRequest');
require('dotenv').config();

async function cleanMalformedReturnRequests() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/groww');
  const badRequests = await ReturnRequest.find({
    $or: [
      { orderId: { $exists: false } },
      { itemId: { $exists: false } },
      { userId: { $exists: false } },
      { orderId: null },
      { itemId: null },
      { userId: null }
    ]
  });
  let removed = 0;
  for (const req of badRequests) {
    await req.deleteOne();
    removed++;
    console.log(`Removed malformed return request: ${req._id}`);
  }
  console.log(`Removed ${removed} malformed return requests.`);
  process.exit(0);
}

cleanMalformedReturnRequests(); 