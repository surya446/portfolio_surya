import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

// Create a cached connection variable
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Connect to MongoDB (with caching to avoid re-connecting on every request)
async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => {
      console.log("✅ MongoDB connected");
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Define schema
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

// Create or get model (to avoid overwrite error)
const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

// Main handler function
export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const contact = new Contact(req.body);
      await contact.save();
      res.status(201).json({ message: 'Message saved to MongoDB!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
