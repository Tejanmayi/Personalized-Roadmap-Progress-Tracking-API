# Personalized Roadmap API

A cloud-based API for creating and tracking personalized learning roadmaps, built with Node.js, Express, MongoDB, and JWT authentication.

## Features

- **User Authentication**
  - JWT-based authentication
  - Secure password hashing
  - User registration and login
  - Rate limiting for login attempts

- **Roadmap Management**
  - Create personalized learning roadmaps
  - Organize content into levels and modules
  - Update roadmap details
  - Delete roadmaps

- **Resource Management**
  - Create and manage learning resources
  - Support for multiple resource types (video, text, hands-on, audio, interactive)
  - Resource metadata and analytics
  - User feedback and ratings
  - Resource filtering and search

- **Progress Tracking**
  - Track module completion status
  - Record time spent on modules
  - Calculate overall progress
  - Track level completion
  - User notes for modules

- **Analytics**
  - Overall progress statistics
  - Time spent tracking
  - Completion rates
  - Achievement system
  - Resource usage analytics

- **Performance Optimizations**
  - Caching for frequently accessed data
  - Optimistic locking for concurrent updates
  - Efficient database queries
  - Pagination for resource listings

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Caching**: NodeCache
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Express Validator

## Documentation

- [Database Schema Documentation](docs/DATABASE_SCHEMA.md) - Detailed information about database schemas, relationships, and performance considerations
- [API Documentation](http://localhost:3000/api-docs) - Interactive Swagger documentation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/tejanmayi/personalized-roadmap-api.git
cd personalized-roadmap-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
MONGODB_URI_TEST=your_test_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Roadmaps
- `GET /api/roadmaps` - Get all roadmaps for user
- `POST /api/roadmaps` - Create new roadmap
- `GET /api/roadmaps/:id` - Get specific roadmap
- `PATCH /api/roadmaps/:id` - Update roadmap
- `DELETE /api/roadmaps/:id` - Delete roadmap

### Resources
- `GET /api/resources` - Get all resources with filtering and pagination
- `POST /api/resources` - Create new resource
- `GET /api/resources/:id` - Get specific resource
- `PATCH /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/resources/:id/feedback` - Add feedback to resource

### Progress
- `PATCH /api/progress/:roadmapId/levels/:levelId/modules/:moduleId` - Update module progress
- `GET /api/progress/:roadmapId/stats` - Get progress statistics
- `GET /api/progress/analytics` - Get user analytics

## Testing

Run the test suite:
```bash
npm test
```

Current test coverage:
- Statements: 85.71%
- Branches: 75.00%
- Functions: 87.50%
- Lines: 86.36%

The test suite includes:
- Authentication tests
- Roadmap management tests
- Resource management tests
- Progress tracking tests
- Integration tests with database
- Rate limiting tests

## Error Handling

The API implements comprehensive error handling:
- Input validation using express-validator
- MongoDB ObjectId validation
- Authentication error handling
- Resource access control
- Proper HTTP status codes and error messages
- Validation for resource types and ratings

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting for authentication
- Resource access control
- Helmet for security headers
- CORS configuration

## Performance Features

- Caching layer for frequently accessed data
- Optimistic locking for concurrent updates
- Efficient database queries with proper indexing
- Pagination for resource listings
- Response compression
- Rate limiting to prevent abuse

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Express.js for the web framework
- MongoDB for the database
- JWT for authentication
- Jest for testing
- All other open-source contributors

## 👨‍💻 Author

**Tejanmayi**  
[LinkedIn](https://linkedin.com/in/tejanmayi-gummaraju) • [Portfolio](https://tejanmayi.com)  
This project was built for educational purposes and portfolio demonstration.

