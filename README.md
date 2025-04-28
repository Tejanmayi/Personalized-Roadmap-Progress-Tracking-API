# Personalized Roadmap API

A cloud-based API for creating and tracking personalized learning roadmaps, built with Node.js, Express, MongoDB, and JWT authentication.

## Features

- **User Authentication**
  - JWT-based authentication
  - Secure password hashing
  - User registration and login

- **Roadmap Management**
  - Create personalized learning roadmaps
  - Organize content into levels and modules
  - Update roadmap details
  - Delete roadmaps

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

- **Performance Optimizations**
  - Caching for frequently accessed data
  - Optimistic locking for concurrent updates
  - Efficient database queries

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Caching**: NodeCache
- **Testing**: Jest
- **API Documentation**: Swagger/OpenAPI

## Documentation

- [Database Schema Documentation](docs/DATABASE_SCHEMA.md) - Detailed information about database schemas, relationships, and performance considerations

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
- Statements: 66.85%
- Branches: 50%
- Functions: 69.07%
- Lines: 68.31%

## Error Handling

The API implements comprehensive error handling:
- Input validation using express-validator
- MongoDB ObjectId validation
- Authentication error handling
- Optimistic locking for concurrent updates
- Proper HTTP status codes and error messages

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- Helmet for security headers
- CORS configuration

## Performance Features

- Caching layer for frequently accessed data
- Optimistic locking for concurrent updates
- Efficient database queries with proper indexing
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

