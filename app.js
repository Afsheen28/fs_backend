const express = require("express");
const path = require ("path");
const fs = require("fs");
const cors = require ("cors");
const morgan = require ("morgan");
const lessonsRouter = require("./routes/lessonsRouter"); //Import the lessons router

const app = express();
const port = 3000;

//Middleware to log incoming requests
// app.use((req, res, next) => {
//     console.log(`Request URL: ${req.url}`); //hello
//     next();
// });

app.use(morgan("short"));

//Logger Middleware
// app.use((req, res, next) => {
//     const log = ${new Date().toISOString()} - ${req.method} ${req.url};
//     console.log(log);
//     next(); 
// });

//Enable CORS
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello We Are Live");
});

//Images path
app.use("/images", (req, res, next) => {
    const filePath = path.join(__dirname, "images", req.url);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send("Image not found!");
        }
        res.sendFile(filePath);
    });
});

//Middleware to serve images
// var imagesPath = path.resolve(__dirname, "images");
// app.use("/images", express.static(imagesPath));

//Using the lessonsRouter for routes under /api
app.use('/api', lessonsRouter);

//Middleware to handle 404 errors
app.use((req, res) => {
    res.status(404).send("Operation not available.");
});

console.log("Request received at /api/lesson");

//Starting the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});