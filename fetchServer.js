const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { MongoClient, ServerApiVersion } = require("mongodb");

//MongoDB connection string
const uri = "mongodb+srv://affsidd07:Burntwood1@webstorecluster.ipevs.mongodb.net/?retryWrites=true&w=majority&appName=webstoreCluster";

//Create a MongoClient with options
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

//Initialize the database variable
let db;

//Connect to the database once and reuse the connection
async function connectToDatabase() {
    try {
        if (!db) {
            await client.connect();
            console.log("Connected to MongoDB successfully!");
            db = client.db("Webstore"); //Connect to the "Webstore" database
        }
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); //Exit if the connection fails
    }
}

const app = express();
app.set("json spaces", 3);

//Middleware
app.use(cors());
app.use(morgan("short"));
app.use(express.json()); //Need this to parse json received in the requests

//Log incoming requests
app.use(function (req, res, next) {
    console.log("Incoming request: " + req.url);
    next();
});

//Integrate app.param() to handle dynamic collection routes
app.param('collectionName', async (req, res, next, collectionName) => {
    try {
        const db = await connectToDatabase();
        req.collection = db.collection(collectionName);
        return next();
    } catch (error) {
        console.error("Error initialising collection: ", error);
        res.status(500).send("Error setting up collection");
    }
});

//Root route
app.get("/", (req, res) => {
    res.send("Welcome to our lesson store!");
});

// // Dynamic route for fetching documents from any collection
// app.get("/collections/:collectionName", async (req, res, next) => {
//     try {
//         const results = await req.collection.find({}).toArray(); //Fetch all documents
//         res.json(results); //Sends the results in json format
//     } catch (err) {
//         console.error("Error fetching collection data:", err);
//         next(err); //Passes error to Express error handler
//     }
// });

// //Complex query to limit the number of documents printed from a collection
// app.get('/collections/:collectionName', async function (req, res, next) {
//     try {
//         const results = await req.collection
//             .find({})
//             .sort({ price: -1}) //Descending order
//             .limit(3)
//             .toArray();
//         res.json(results);
//     } catch (err) {
//         console.error("Error fetching documents:", err);
//         next (err); //Passes error to Express error handler
//     }
// });

//More complex query with additional parameters 
app.get('collections/:collectionName/:max/:sortAspect/:sortAscDesc', function (req, res, next) {
    //TODO: Validate params
    var max = parseInt(req.params.max, 10); //base 10

    let sortDirection = 1;
    if (req.params.sortAscDesc === "desc") {
        sortDirection = -1;
    }

    req.collection.find({}, { limit: max, sort: [[req.params.sortAspect, sortDirection]] }).toArray(function (err, results) {
        if (err) {
            return next(err);
        }
        res.send(results);
    });
});

//Retrieve 1 element by its id (NOT WORKING)
const ObjectId = require('mongodb');
app.get('/collections/:collectionName/:id', async function (req, res, next) {
    try {
        //Validate ObjectId
        const objectId = new ObjectId(req.params.id);

        //Find the document by its ID
        const result = await req.collection.findOne({ _id: objectId });

        if (!result) {
            return res.status(404).send("Document not found.");
        }

        res.json(result); //Result in json format
    } catch (err) {
        //Handle invalid ObjectId or other errors
        console.error("Error fetching document by ID:", err);

        if (err instanceof TypeError || err.message.includes('Arguement passed in must be a string of 12 bytes')) {
            return res.status(400).send("Invalid ID format.");
        }

        next(err);
    }
});

//POST and Create a Document
app.post('collections/:collectionName', async function (req, res, next) {
    try {
        //Validate request body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).send("Request body cannot be empty.");
        }

        //Insert the document
        const result = await req.collection.insertOne(req.body);

        //Return the inserted document ID
        res.status(201).send({
            message: "Document inserted successfully",
            insertedId: result.insertedId,
        });
    } catch (err) {
        console.error("Error inserting document:", err);
        next(err);
    }
});

// PUT and Updating a Document
app.put('/collections/:collectionName/:id', async (req, res, next) => {
    try {
        // Validate request body (make sure it's not empty)
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).send("Request body cannot be empty.");
        }

        // Update the document
        const result = await req.collection.updateOne(
            { _id: new ObjectId(req.params.id) }, // Match the document by ID
            { $set: req.body }, // Set the updated fields
            { upsert: false } // Do not insert if document is not found
        );

        // Send response based on the result of the update operation
        if (result.matchedCount === 1) {
            res.send({ msg: "Document updated successfully" });
        } else {
            res.status(404).send({ msg: "Document not found" });
        }
    } catch (err) {
        console.error("Error updating document:", err);
        next(err);
    }
});

//Fetch lessons from MongoDB
app.get("/api/lessons", async (req, res) => {
    try {
        const db = await connectToDatabase();
        const lessonsCollection = db.collection("Lessons");
        const lessons = await lessonsCollection.find({}).toArray();
        res.json(lessons);
    } catch (error) {
        console.error("Error fetching lessons:", error);
        res.status(500).send("Internal Server Error");
    }
});

//Order Collection
app.post ('/collections/orders', async (req, res, next) => {
    try {
        const { name, phone, lessonIDs, availability } = req.body;

        //Validation
        if (!name || !phone || !lessonIDs || !availability || !Array.isArray(lessonIDs)) {
            return res.status(400).send("Invalid request. Ensure all fields are provided and lessonIDs is an array.");
        }

        //Create the order document
        const newOrder = {
            name,
            phone,
            lessons,
            availability,
            orderDate: new Date()
        };

        //Insert the order into the database
        const result = await req.collection.insertOne(newOrder);

        //Send success response
        res.status(201).send({
            msg: "Order created successfully",
            orderId: result.insertedId
        });
    } catch (err) {
        console.error("Error creating order:", err);
        next(err);
    }
});

//Placeholder routes
app.post("/", (req, res) => {
    res.send("a POST request? Let’s create a new element");
});
app.put("/", (req, res) => {
    res.send("Ok, let’s change an element");
});
app.delete("/", (req, res) => {
    res.send("Are you sure??? Ok, let’s delete a record");
});

//Handle 404 errors
app.use((req, res) => {
    res.status(404).send("Resource not found!");
});

//Start the server
app.listen(3000, () => {
    console.log("App has started on port 3000");
});
