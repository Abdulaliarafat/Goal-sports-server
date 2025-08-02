const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const PORT = process.env.PORT || 3000;
dotenv.config();
const stripe = require("stripe")(process.env.PAYMENT_GETWAY_KEY);


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.g02ycwa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);//from main fath private key from project generate key..SDK

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const db = client.db("courtDB")
    const bookingsCollection = db.collection('bookings')
    const usersCollection = db.collection('users')
    const paymentsCollection = db.collection('payments')
    const courtsCollection = db.collection('court')
    const couponsCollection = db.collection('coupon')
    const announcementsCollection = db.collection('announcements')

    // custom meddleWare
    const verifyFbtoken = async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ massage: 'unauthorization access' })
      }
      const token = authHeader.split(' ')[1]
      if (!token) {
        return res.status(401).send({ massage: 'unauthorization access' })
      }
      // veryfy token with SDK firebase admin
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next()
      } catch (err) {
        res.status(403).send({ massage: 'forbidden access' });
      }
    }
    // admin meddleware
    const verifyAdmin = async (req, res, next) => {

      const email = req.decoded.email;
      const query = { email }

      const user = await usersCollection.findOne(query);

      if (!user || user.role !== 'admin') {
        return res.status(403).send({ error: 'Forbidden: Admin access only' });
      }
      next();
    }
    // member meddleware
    const verifyMember = async (req, res, next) => {

      const email = req.decoded.email;
      const query = { email }

      const user = await usersCollection.findOne(query);

      if (!user || user.role !== 'member') {
        return res.status(403).send({ error: 'Forbidden: Admin access only' });
      }
      next();
    }
    // User meddleware
    const verifyUser = async (req, res, next) => {

      const email = req.decoded.email;
      const query = { email }

      const user = await usersCollection.findOne(query);

      if (!user || user.role !== 'user') {
        return res.status(403).send({ error: 'Forbidden: Admin access only' });
      }
      next();
    }

    // For admin All user and member
    app.get('/users', verifyFbtoken, verifyAdmin, async (req, res) => {
      try {
        const role = req.query.role;
        const query = role ? { role } : {}; // If no role provided, return all users
        const users = await usersCollection.find(query).toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch users' });
      }
    });
    // Get API user role beased for profile
    app.get('/users/:email', verifyFbtoken, async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    // Get API user role beased
    app.get('/users/role/:email', verifyFbtoken, async (req, res) => {
      const email = req.params.email;
      if (!email) {
        return res.status(400).send({ success: false, message: 'Email is required' });
      }
      try {
        const user = await usersCollection.findOne(
          { email },);

        if (!user) {
          return res.status(404).send({ success: false, message: 'User not found' });
        }

        res.send({ success: true, role: user.role || 'user' });
      } catch (err) {
        res.status(500).send({ success: false, message: 'Failed to fetch role' });
      }
    });
    // post users
    app.post('/users', async (req, res) => {

      const email = req.body.email;
      const userExists = await usersCollection.findOne({ email })

      if (userExists) {
        // update last log in
        await usersCollection.updateOne(
          { email },
          { $set:new Date({ last_log_in: req.body.last_log_in }).toLocaleString() }
        );
        return res.status(200).send({ message: 'User already exists', inserted: false });
      }
      const user = req.body;
      const result = await usersCollection.insertOne(user)
      res.send(result)

    })
    // delete member and user
    app.delete('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.send({ success: true, deletedCount: 1 });
        } else {
          res.status(404).send({ error: 'User not found' });
        }
      } catch (err) {
        res.status(500).send({ error: 'Failed to delete user' });
      }
    });
    // GET /bookings?email=...&status=approved and Member
    app.get('/bookings/approved', verifyFbtoken, verifyMember, async (req, res) => {
      const { email, status } = req.query;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      if (status) {
        query.status = status;
      }

      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });
    // Confirmed bookings API
    app.get('/bookings/confirmed', verifyFbtoken, verifyAdmin, async (req, res) => {
      try {
        const confirmed = await bookingsCollection.find({ status: 'confirmed' }).sort({ createdAt: -1 }).toArray();
        res.send(confirmed);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch confirmed bookings' });
      }
    });
    // ✅ GET single approved booking by ID for payment
    app.get('/bookings/approved/:id', verifyFbtoken, verifyMember, async (req, res) => {
      const id = req.params.id;

      try {
        const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });

        if (!booking) {
          return res.status(404).send({ error: 'Booking not found' });
        }

        res.send(booking);
      } catch (error) {
        res.status(500).send({ error: 'Invalid booking ID' });
      }
    });
    // User API
    app.get('/bookings/User', verifyFbtoken, verifyUser, async (req, res) => {
      try {
        const { email, status } = req.query;

        let query = {};

        if (email) {
          query.userEmail = email;
        }
        if (status) {
          query.status = status;
        }
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch bookings' });
      }
    });
    //Member API
    app.get('/bookings/Member', verifyFbtoken, verifyMember, async (req, res) => {
      try {
        const { email, status } = req.query;

        let query = {};

        if (email) {
          query.userEmail = email;
        }
        if (status) {
          query.status = status;
        }
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch bookings' });
      }
    });
    //Admin API
    app.get('/bookings', verifyFbtoken, verifyAdmin, async (req, res) => {
      try {
        const query = req.query;
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch bookings' });
      }
    });

    // POST /bookings - Add a new booking
    app.post('/bookings', async (req, res) => {
      const newBooking = req.body;
      const result = await bookingsCollection.insertOne(newBooking);
      res.send(result)

    });
    //Patch Make user member
    app.patch('/bookings/decision/:id', async (req, res) => {
      const bookingId = req.params.id;
      const { decision, adminEmail, userEmail } = req.body;

      const updateBooking = await bookingsCollection.updateOne(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            status: decision,
            approvedBy: adminEmail
          }
        }
      );

      let updateUser;
      if (decision === 'approved') {
        updateUser = await usersCollection.updateOne(
          { email: userEmail },
          { $set: { role: 'member' } }
        );
      }

      res.send({
        bookingUpdate: updateBooking,
        userUpdate: updateUser
      });
    });
    // Delete booking by ID
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // Get API court
    app.get('/court',async (req, res) => {
      try {
        const courts = await courtsCollection.find().toArray();
        res.send(courts);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch courts' });
      }
    });
    // POST add new court
    app.post('/court', async (req, res) => {
      try {
        const { title, type, img, slots } = req.body;

        if (!title || !type) {
          return res.status(400).send({ error: 'Title and type are required' });
        }

        // slots should be array, if not provided, default to empty array
        const courtDoc = {
          title,
          type,
          img: img || '',
          slots: Array.isArray(slots) ? slots : [],
        };

        const result = await courtsCollection.insertOne(courtDoc);
        res.send({ insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ error: 'Failed to add court' });
      }
    });

    // PUT update court by ID
    app.put('/court/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { title, type, img, slots } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid court ID' });
        }

        const updateDoc = {
          $set: {
            title,
            type,
            img: img || '',
            slots: Array.isArray(slots) ? slots : [],
          },
        };

        const result = await courtsCollection.updateOne(
          { _id: new ObjectId(id) },
          updateDoc
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to update court' });
      }
    });
    // DELETE court by ID
    app.delete('/court/:id', async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid court ID' });
        }

        const result = await courtsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: 'Court not found' });
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete court' });
      }
    });
    app.get('/coupon',async (req, res) => {
      try {
        const coupons = await couponsCollection.find().toArray();
        res.send(coupons);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch coupons' });
      }
    });
    // Post coupon
    app.post('/coupon', async (req, res) => {
      try {
        const coupon = req.body;
        const result = await couponsCollection.insertOne(coupon);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create coupon' });
      }
    });
    // Patch coupon
    app.patch('/coupon/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await couponsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to update coupon' });
      }
    });
    // Delete coupon
    app.delete('/coupon/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await couponsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete coupon' });
      }
    });
    // Get all announcements
    app.get('/announcements', verifyFbtoken, async (req, res) => {
      const announcements = await announcementsCollection.find().sort({ date: -1 }).toArray();
      res.send(announcements);
    });

    // Post new announcement
    app.post('/announcements', async (req, res) => {
      const data = req.body;
      const result = await announcementsCollection.insertOne(data);
      res.send(result);
    });

    // Update announcement
    app.patch('/announcements/:id', async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const result = await announcementsCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      res.send(result);
    });
    // Delete announcement....
    app.delete('/announcements/:id', async (req, res) => {
      const id = req.params.id;
      const result = await announcementsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // Total count for Admin 
    app.get('/dashboard/stats',verifyFbtoken,verifyAdmin, async (req, res) => {
      try {
        const totalCourts = await courtsCollection.estimatedDocumentCount();
        const totalUsers = await usersCollection.estimatedDocumentCount();
        const totalMembers = await usersCollection.countDocuments({ role: 'member' });

        res.send({
          totalCourts,
          totalUsers,
          totalMembers,
        });
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch dashboard stats' });
      }
    });

    // Get payment history for a user or all (if admin)
    app.get('/payments', verifyFbtoken, verifyMember, async (req, res) => {
      try {
        const email = req.query.email;
        console.log('decoded', req.decoded)
        // veryfy email
        if (email !== req.decoded.email) {
          return res.status(403).send({ error: 'Forbidden: email mismatch' });
        }
        const query = email ? { email } : {}; // Admin can load all
        const payments = await paymentsCollection
          .find(query)
          .sort({ paid_At: -1 }) // 📅 latest first
          .toArray();

        res.send(payments);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch payment history' });
      }
    });
    // Create and store payment + mark parcel as paid
    app.post('/payments', async (req, res) => {

      const { bookingId, email, amount, paymentMethod } = req.body;


      try {
        // 1️⃣ Update parcel status to paid
        const updatedResult = await bookingsCollection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { status: 'confirmed', payment_status: 'paid' } }
        );

        const paymentDoc = {
          bookingId,
          email,
          amount,
          paymentMethod,
          paid_at_string: new Date().toISOString(),
          paid_At: new Date()
        }
        // 3️⃣ Save payment info
        const paymentResult = await paymentsCollection.insertOne(paymentDoc);

        res.send({
          success: true,
          message: 'Payment recorded and parcel updated',
          insertedId: paymentResult.insertedId,
        });
      } catch (err) {
        res.status(500).send({ success: false, message: 'Payment processing failed' });
      }
    });

    // Strips payment API
    app.post('/create-payment-intent', async (req, res) => {
      const amountInCent = req.body.amountInCent
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCent, // amount in cents
          currency: 'usd',
          payment_method_types: ['card'],
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });


    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Goal server API is running...');
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});