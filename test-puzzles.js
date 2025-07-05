const mongoose = require('mongoose');
const Puzzle = require('./models/Puzzle');
const User = require('./models/User');
require('dotenv').config();

// Sample puzzle data
const samplePuzzles = [
    {
        title: "HTTP Status Codes",
        description: "Test your knowledge of common HTTP status codes and their meanings.",
        category: "HTTP",
        difficulty: "Beginner",
        question: "What does HTTP status code 404 mean?",
        options: ["Not Found", "Forbidden", "Internal Server Error", "Bad Request"],
        answer: "Not Found",
        explanation: "HTTP 404 (Not Found) indicates that the server could not find the requested resource. This is one of the most common HTTP status codes.",
        hint: "Think about what happens when you try to visit a webpage that doesn't exist.",
        creatorUsername: "admin",
        status: "approved",
        isPublic: true,
        tags: ["http", "status-codes", "web"],
        rating: { average: 4.5, count: 12 },
        plays: 45,
        completions: 38
    },
    {
        title: "REST API Methods",
        description: "Learn about the different HTTP methods used in REST APIs.",
        category: "REST",
        difficulty: "Intermediate",
        question: "Which HTTP method is typically used to create a new resource in a REST API?",
        options: ["GET", "POST", "PUT", "DELETE"],
        answer: "POST",
        explanation: "POST is the standard HTTP method for creating new resources in REST APIs. GET is for retrieving, PUT for updating, and DELETE for removing resources.",
        hint: "This method is often used when submitting forms or creating new records.",
        creatorUsername: "admin",
        status: "approved",
        isPublic: true,
        tags: ["rest", "api", "http-methods"],
        rating: { average: 4.2, count: 8 },
        plays: 32,
        completions: 25
    },
    {
        title: "API Authentication",
        description: "Understanding different methods of API authentication and security.",
        category: "API",
        difficulty: "Advanced",
        question: "What is the main advantage of using JWT tokens over session-based authentication for APIs?",
        options: ["They are shorter", "They are stateless", "They are faster", "They are free"],
        answer: "They are stateless",
        explanation: "JWT tokens are stateless, meaning the server doesn't need to store session information. This makes them ideal for distributed systems and microservices.",
        hint: "Think about scalability and server memory usage.",
        creatorUsername: "admin",
        status: "approved",
        isPublic: true,
        tags: ["api", "authentication", "jwt", "security"],
        rating: { average: 4.8, count: 15 },
        plays: 67,
        completions: 52
    },
    {
        title: "Web Development Basics",
        description: "Test your knowledge of fundamental web development concepts.",
        category: "Web Development",
        difficulty: "Beginner",
        question: "What does CSS stand for?",
        options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
        answer: "Cascading Style Sheets",
        explanation: "CSS stands for Cascading Style Sheets. It's a style sheet language used for describing the presentation of a document written in HTML.",
        hint: "Think about how styles can cascade or inherit from parent elements.",
        creatorUsername: "admin",
        status: "approved",
        isPublic: true,
        tags: ["css", "web", "frontend"],
        rating: { average: 4.0, count: 6 },
        plays: 28,
        completions: 22
    },
    {
        title: "Programming Logic",
        description: "A puzzle about basic programming concepts and logic.",
        category: "Programming",
        difficulty: "Intermediate",
        question: "What is the time complexity of a binary search algorithm?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        answer: "O(log n)",
        explanation: "Binary search has a time complexity of O(log n) because it divides the search space in half with each iteration, making it very efficient for sorted arrays.",
        hint: "Think about how the algorithm divides the problem size in each step.",
        creatorUsername: "admin",
        status: "approved",
        isPublic: true,
        tags: ["algorithms", "complexity", "search"],
        rating: { average: 4.6, count: 10 },
        plays: 41,
        completions: 35
    }
];

async function populatePuzzles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find or create admin user
        let adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            adminUser = new User({
                username: 'admin',
                password: 'admin123', // This will be hashed by the pre-save middleware
                role: 'admin'
            });
            await adminUser.save();
            console.log('Created admin user');
        } else {
            console.log('Found existing admin user');
        }

        // Clear existing puzzles (optional)
        await Puzzle.deleteMany({});
        console.log('Cleared existing puzzles');

        // Add creator field to sample puzzles
        const puzzlesWithCreator = samplePuzzles.map(puzzle => ({
            ...puzzle,
            creator: adminUser._id
        }));

        // Create sample puzzles
        const createdPuzzles = await Puzzle.insertMany(puzzlesWithCreator);
        console.log(`Created ${createdPuzzles.length} sample puzzles`);

        // Display created puzzles
        console.log('\nCreated puzzles:');
        createdPuzzles.forEach((puzzle, index) => {
            console.log(`${index + 1}. ${puzzle.title} (${puzzle.category} - ${puzzle.difficulty})`);
        });

        console.log('\n✅ Sample puzzles created successfully!');
        console.log('You can now test the marketplace at /community');

    } catch (error) {
        console.error('Error populating puzzles:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
populatePuzzles(); 