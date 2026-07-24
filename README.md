# CineVault

CineVault is a full-stack movie tracking web application built with Node.js, Express, EJS, and MySQL. It allows users to create an account, search for movies using the OMDb API, maintain a personal watchlist, mark movies as watched, save favorites, and view detailed statistics about their collection.

The application focuses on providing a clean and organized way to manage a personal movie library while demonstrating authentication, database management, RESTful routing, and API integration.

---

## Features

- User Authentication
  - Secure user registration
  - Login and logout functionality
  - Password hashing using bcrypt
  - Session-based authentication

- Movie Management
  - Search movies using the OMDb API
  - Add movies to your collection
  - Mark movies as watched
  - Add or remove movies from favorites
  - Manage a personal watchlist
  - View detailed movie information

- Dashboard
  - Total watched movies
  - Favorite movies count
  - Watchlist count
  - Average IMDb rating
  - Recently added movies
  - Recent favorites

- Statistics
  - Movies watched
  - Favorite count
  - Watchlist count
  - Average IMDb rating
  - Movies grouped by release year

- Responsive user interface built with EJS templates and custom CSS

---

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- EJS

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Authentication

- Express Session
- bcrypt

### API

- OMDb API

---

## Folder Structure

```
CineVault/
│
├── config/
│   └── db.js
│
├── public/
│   ├── css/
│   ├── images/
│   └── js/
│
├── views/
│   ├── pages/
│   └── partials/
│
├── app.js
├── package.json
└── README.md
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/yourusername/CineVault.git
```

Move into the project directory

```bash
cd CineVault
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=cinevault

SESSION_SECRET=your_session_secret

OMDB_API_KEY=your_api_key
```

Start the server

```bash
npm start
```

Open

```
http://localhost:3000
```

---

## Screenshots

### Landing Page

<img width="1310" height="636" alt="image" src="https://github.com/user-attachments/assets/cf979c94-b0fd-4e32-9cfa-ab822dca402f" />


---

### Login

<img width="1263" height="613" alt="image" src="https://github.com/user-attachments/assets/a225a600-4dd4-4397-9d09-0e3d31efdc81" />


---

### Dashboard

<img width="1149" height="639" alt="image" src="https://github.com/user-attachments/assets/693c9983-de55-4200-a4bf-dbfb7a9142a4" 

<img width="1095" height="551" alt="image" src="https://github.com/user-attachments/assets/ef3cad3d-4d26-4df1-97cf-9351ab05674d" />
  
---

### Movie Search

<img width="1184" height="622" alt="image" src="https://github.com/user-attachments/assets/e5f959df-2e5d-43df-a53e-eaa44ca5e6a2" />


---

### Watchlist

<img width="1311" height="643" alt="image" src="https://github.com/user-attachments/assets/ef7470df-9389-48c1-bbe8-09a8ad4c8882" />


---

### Favorites

<img width="1258" height="621" alt="image" src="https://github.com/user-attachments/assets/7e052216-1e6b-4605-b635-a7f561a16723" />


---
### Library 
<img width="1197" height="631" alt="image" src="https://github.com/user-attachments/assets/85c61294-ede1-466f-8514-aa5a09c8a419" />


---
### Statistics

<img width="1256" height="558" alt="image" src="https://github.com/user-attachments/assets/38264bc2-98a1-4efa-8302-f38ded3d7109" />


---

## Future Improvements

- MongoDB migration
- Movie reviews
- User profile customization
- Sorting and filtering
- Pagination
- Advanced search
- Dark and light theme
- Movie recommendations
- Cloud image uploads
- JWT authentication
- Docker support
- Unit and integration testing

---

## License

This project is licensed under the MIT License.


