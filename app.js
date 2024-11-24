const express = require("express");
const cors = require("cors");
const fs = require ("fs");
const path = require ("path");
const { MongoClient, ObjectId } = require("mongodb"); // Import MongoDB driver

const app = express();
const port = 3000;

app.use(express.json());

//Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

//Logger Middleware
app.use((req, res, next) => {
     const log = `${new Date().toISOString()} - ${req.method} ${req.url}`;
     console.log(log);
     next(); 
});

//Images path
app.use("/images", (req, res, next) => {
    const filePath = path.join(__dirname, "images", req.url);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send("Image not found!");
        }
        res.sendFile(filePath);
    })
});

//Enable CORS
app.use(cors());

// MongoDB connection details
const uri = "mongodb+srv://affsidd07:Burntwood1@webstorecluster.ipevs.mongodb.net/?retryWrites=true&w=majority&appName=webstoreCluster";
const dbName = "Webstore"; 
const collectionName = "Lessons"; 
let client;
let db; 

//Connect to MongoDB once and store db reference
async function connectDB() {
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1); //Exit if connection fails
    }
}

//Endpoint to get all lessons
app.get("/lessons", async (req, res) => {
    console.log("Request received at /lessons");

    try {
        //Fetch lessons
        const lessons = await db.collection(collectionName).find().toArray();

        //Respond with lessons
        res.status(200).json(lessons);
    } catch (err) {
        console.error("Error fetching lessons:", err);
        res.status(500).send("Failed to fetch lessons.");
    }
});

//POST order endpoint (Handles cart and updates availability)
app.post("/collections/orders", async (req, res) => {
    const { name, phone, cart } = req.body;

    if (!name || !phone || !cart || !Array.isArray(cart)) {
        return res.status(400).json({ error: "Invalid order data. 'name', 'phone', and 'cart' are required." });
    }

    const session = client.startSession();

    try {
        session.startTransaction();

        const lessonsCollection = db.collection("Lessons");
        const ordersCollection = db.collection("Orders");

        // Check availability and update lessons
        for (const cartItem of cart) {
            const { lessonId, quantity } = cartItem;

            const lesson = await lessonsCollection.findOne({ id: lessonId }, { session });

            if (!lesson) {
                throw new Error(`Lesson with ID ${lessonId} not found.`);
            }

            if (lesson.availability < quantity) {
                throw new Error(`Not enough availability for lesson ID ${lessonId}.`);
            }

            //Update availability
            await lessonsCollection.updateOne(
                { id: lessonId },
                { $inc: { availability: -quantity } },
                { session }
            );
        }

        //Save the order
        const order = {
            name,
            phone,
            cart,
            date: new Date()
        };
        const result = await ordersCollection.insertOne(order, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: "Order created successfully", orderId: result.insertedId });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error creating order:", error);
        res.status(500).json({ error: error.message });
    }
});


//PUT 
app.put('/collections/lessons/:lessonId', async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const updatedLesson = req.body;  //Contains the new lesson data
        
        //Ensure the incoming body has valid data (optional validation logic can be added)
        if (!updatedLesson || typeof updatedLesson !== 'object') {
            return res.status(400).send("Invalid lesson data.");
        }

        //Prevent overwriting the _id field accidentally
        delete updatedLesson._id;

        const result = await db.collection('Lessons').updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: updatedLesson }  //Replace the fields with the new values
        );

        if (result.matchedCount === 0) {
            return res.status(404).send("Lesson not found.");
        }

        res.status(200).send({ message: `Lesson ${lessonId} updated successfully.` });
    } catch (err) {
        console.error("Error updating lesson:", err);
        next(err);  // Pass the error to error-handling middleware
    }
});

//Search route
app.get('/search', async (req, res) => {
    const searchTerm = req.query.searchTerm?.toLowerCase() || '';

    //Replace with your MongoDB search logic
    const results = await db.collection('Lessons').find({
        $or: [
            { subject: { $regex: searchTerm, $options: 'i' } },
            { location: { $regex: searchTerm, $options: 'i' } },
            { price: { $regex: searchTerm, $options: 'i' } },
            { availability: { $regex: searchTerm, $options: 'i' } }
        ]
    }).toArray();

    res.json(results);  //Send results back to Vue.js app
});
  
//Error-handling middleware
app.use((err, req, res, next) => {
    res.status(500).send({
        message: "An unexpected error occurred.",
        error: err.message,
    });
});

//Middleware to handle 404 errors (must be placed after all other routes)
app.use((req, res) => {
    res.status(404).send("Operation not available.");
});

//Starting the server after the connection is established
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});
