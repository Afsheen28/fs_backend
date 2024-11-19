const express = require("express");
const router = express.Router();


let lessons = [
    {
        id: 1,
        subject: 'Mathematics',
        location: 'Hendon',
        price: 40,
        imagePath: './images/maths.png',
        imageAlt: 'Math lesson image',
        availability: 5,
        rating: 4
    },
    {
        id: 2,
        subject: 'English',
        location: 'Bromley',
        price: 40,
        imagePath: './images/english.jpg',
        imageAlt: 'English lesson image',
        availability: 5,
        rating: 4
    },
    {
        id: 3,
        subject: 'Science',
        location: 'Dagenham',
        price: 40,
        imagePath: './images/science.jpeg',
        imageAlt: 'Science lesson image',
        availability: 5,
        rating: 4
    },
    {
        id: 4,
        subject: 'Geography',
        location: 'Oxford',
        price: 25,
        imagePath: './images/geography.jpg',
        imageAlt: 'Geography lesson image',
        availability: 5,
        rating: 3
    },
    {
        id: 5,
        subject: 'History',
        location: 'Balham',
        price: 25,
        imagePath: './images/history.jpg',
        imageAlt: 'History lesson image',
        availability: 5,
        rating: 3
    },
    {
        id: 6,
        subject: 'Religious Studies',
        location: 'Catford',
        price: 25,
        imagePath: './images/religiousStudies.jpg',
        imageAlt: 'Religious Studies lesson image',
        availability: 5,
        rating: 2
    },
    {
        id: 7,
        subject: 'Art',
        location: 'Putney',
        price: 20,
        imagePath: './images/art.jpg',
        imageAlt: 'Art lesson image',
        availability: 5,
        rating: 3
    },
    {
        id: 8,
        subject: 'Computer Science',
        location: 'Brixton',
        price: 35,
        imagePath: './images/computerScience.jpg',
        imageAlt: 'Computer Science lesson image',
        availability: 5,
        rating: 5
    },
    {
        id: 9,
        subject: 'Dance',
        location: 'Stratford',
        price: 30,
        imagePath: './images/dance.png',
        imageAlt: 'Dance lesson image',
        availability: 5,
        rating: 5
    },
    {
        id: 10,
        subject: 'Drama',
        location: 'Romford',
        price: 30,
        imagePath: './images/drama.jpg',
        imageAlt: 'Drama lesson image',
        availability: 5,
        rating: 4
    },
    {
        id: 11,
        subject: 'Psychology',
        location: 'Mitcham',
        price: 35,
        imagePath:'./images/psychology.jpg',
        imageAlt: 'Psychology lesson image',
        availability: 5,
        rating: 5
    },
    {
        id: 12,
        subject: 'Economics',
        location: 'Brent Cross',
        price: 45,
        imagePath:'./images/economics.jpeg',
        imageAlt: 'Economics lesson image',
        availability: 5,
        rating: 4
    }
]

//Route to return all lessons in JSON
router.get('/lesson', (req, res) => {
    res.json(lessons);
});

//Route to return a specific lesson by ID
router.get('/lessons/:lessonid', function (req, res) {
    //Convert lessonid into an integer
    const lessonId = parseInt(req.params.lessonid, 10); // base 10

    //Check if lessonId is a valid number
    if (isNaN(lessonId)) {
        return res.status(404).send("The lesson ID indicated is not valid!");
    }

    //Find the lesson with the specified ID
    const lesson = lessons.find(l => l.id === lessonId);
    //Check if lesson exists
    if (lesson) {
        res.json(lesson); //Return the lesson as JSON if found
    } else {
        res.status(404).send("Lesson not found");
    }
});

module.exports = router;
