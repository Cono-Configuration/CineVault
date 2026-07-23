const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const PORT = 3000;

function isloggedin(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/login");
}

app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "cinevault_secret_key",
        resave: false,
        saveUninitialized: false
    })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
const { v4: uuidv4 } = require("uuid");
const uuid = uuidv4();
const db = require("./config/db");



const movies = [
    {
        id: uuidv4(),
        title: "Inception",
        director: "Christopher Nolan",
        year: 2010,
        genre: "Sci-Fi",
        rating: 5,
        review: "A layered dream heist movie with a sharp emotional core.",
        watched: true,
        watchDate: "2026-07-05",
        favorite: true,
        inWatchlist: false
    },
    {
        id: uuidv4(),
        title: "The Grand Budapest Hotel",
        director: "Wes Anderson",
        year: 2014,
        genre: "Comedy",
        rating: 4,
        review: "Stylish, funny, and carefully composed from start to finish.",
        watched: true,
        watchDate: "2026-06-28",
        favorite: false,
        inWatchlist: false
    },
    {
        id: uuidv4(),
        title: "Dune: Part Two",
        director: "Denis Villeneuve",
        year: 2024,
        genre: "Sci-Fi",
        rating: null,
        review: "",
        watched: false,
        watchDate: "",
        favorite: false,
        inWatchlist: true
    }
];

app.get("/", (req, res) => {
    res.render("pages/landing", { title: "CineVault" });
});

app.get("/movies/new", isloggedin, (req, res) => {
    res.render("pages/new-movie", { title: "Add Movie" });
});

app.get("/login", (req, res) => {
    res.render("pages/login");
})

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = `
        SELECT * FROM users
        WHERE email = ?;
    `;

    db.query(sql, [email], async (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Something went wrong");
        }

        if (result.length === 0) {
            return res.send("User not found");
        }

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.send("Invalid password");
        }
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        }

        console.log("Login Successful!");
        res.redirect("/dashboard");
    });
});

app.get("/signup", (req, res) => {
    res.render("pages/signup");

})

app.get("/profile", (req, res) => {
    console.log(req.session);
    res.send(req.session);
});

app.post("/signup", async (req, res) => {
    let { username, email, password } = req.body;
    // console.log(req.body);
    const sql = `
    insert into users (username , email,password)
    values(?,?,?)
    `;
    const hashedpassword = await bcrypt.hash(password, 10);

    db.query(sql, [username, email, hashedpassword], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("something went wrong");
            return res.send(err);
        }

        console.log("User Registered");
        console.log(result);
        res.redirect("/login");
    });

})

app.post("/movies", (req, res) => {
    let { title, director, year, genre, rating, review, watched, watchDate, favorite, inWatchlist } = req.body;
    let newid = uuidv4();
    movies.push({ id: newid, title, director, year, genre, rating, review, watched, watchDate, favorite, inWatchlist });
    res.redirect("/movies");
});
app.post("/movies/:id/toggle-watched", (req, res) => {
    const { id } = req.params;
    const movie = movies.find((movie) => movie.id == id);
    movie.watched = !movie.watched;
    res.redirect("/movies");
})

app.post("/movies/:id/delete", (req, res) => {
    const { id } = req.params;

    const movieIndex = movies.findIndex((movie) => movie.id === id);

    if (movieIndex === -1) {
        return res.status(404).render("pages/not-found", {
            title: "Movie Not Found"
        });
    }

    movies.splice(movieIndex, 1);

    res.redirect("/movies");
});

app.get("/dashboard", isloggedin, (req, res) => {
    let watchedCount = 0;
    let favoriteCount = 0;
    let watchlistCount = 0;
    let totalRating = 0;
    let ratedMovies = 0;
    let favoriteMovies = movies.filter((movie) => movie.favorite == true);
    let recentlyWatched = movies.filter((movie) => movie.watched == true);
    for (let i = 0; i < movies.length; i++) {
        if (movies[i].watched) {
            watchedCount++;
        }

        if (movies[i].favorite) {
            favoriteCount++;
        }

        if (movies[i].inWatchlist) {
            watchlistCount++;
        }

        if (movies[i].rating != null) {
            totalRating += Number(movies[i].rating);
            ratedMovies++;
        }
    }

    const averageRating =
        ratedMovies > 0 ? (totalRating / ratedMovies).toFixed(1) : 0;

    res.render("pages/dashboard", {
        title: "Dashboard",
        stats: {
            watchedCount,
            favoriteCount,
            watchlistCount,
            averageRating
        },
        favoriteMovies,
        recentlyWatched
    });
});

app.get("/movies", isloggedin, (req, res) => {
    const search = req.query.search || "";

    const filteredMovies = movies.filter((movie) =>
        movie.title.toLowerCase().includes(search.toLowerCase())
    );

    res.render("pages/movies", {
        title: "Movies",
        movies: filteredMovies,
        search
    });
});

app.get("/movies/search", (req, res) => {
    const search = req.query.search || "";

    const filteredMovies = movies.filter((movie) => {
        return (
            movie.title.toLowerCase().includes(search.toLowerCase()) ||
            movie.director.toLowerCase().includes(search.toLowerCase()) ||
            movie.genre.toLowerCase().includes(search.toLowerCase())
        );
    });

    res.render("pages/movies", {
        title: "Movies",
        movies: filteredMovies,
        search
    });
});

app.get("/watchlist", isloggedin, (req, res) => {
    const watchlistt = movies.filter((movie) => movie.inWatchlist == true);
    res.render("pages/watchlist", { title: "Watchlist", movies: watchlistt });
});

app.post("/movies/:id/toggle-watchlist", (req, res) => {
    const { id } = req.params;
    const movie = movies.find((movie) => movie.id == id);
    movie.inWatchlist = !movie.inWatchlist;
    res.redirect("/movies");
});



app.get("/favorites", isloggedin, (req, res) => {
    const favoritess = movies.filter((movie) => movie.favorite == true);
    res.render("pages/favorites", { title: "Favorites", movies: favoritess });
});

app.post("/movies/:id/toggle-favorite", (req, res) => {
    const { id } = req.params;
    const movie = movies.find((movie) => movie.id == id);
    movie.favorite = !movie.favorite;
    res.redirect("/movies");
})

app.get("/statistics", isloggedin, (req, res) => {
    let watchedCount = 0;
    let favoriteCount = 0;
    let watchlistCount = 0;
    let totalRating = 0;
    let ratedMovies = 0;

    const moviesPerYear = {};

    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];

        if (movie.watched) {
            watchedCount++;
        }

        if (movie.favorite) {
            favoriteCount++;
        }

        if (movie.inWatchlist) {
            watchlistCount++;
        }

        if (movie.rating != null) {
            totalRating += Number(movie.rating);
            ratedMovies++;
        }

        // Movies per Year
        if (moviesPerYear[movie.year]) {
            moviesPerYear[movie.year]++;
        } else {
            moviesPerYear[movie.year] = 1;
        }
    }

    const totalMovies = movies.length;

    const averageRating = ratedMovies > 0 ? (totalRating / ratedMovies).toFixed(1) : 0;

    res.render("pages/statistics", {
        title: "Statistics",
        stats: {
            totalMovies,
            watchedCount,
            favoriteCount,
            watchlistCount,
            averageRating,
            moviesPerYear
        }
    });
});

app.get("/movies/:id/edit", (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id);

    res.render("pages/edit-movie", { title: "Edit", movie });
});

app.post("/movies/:id", (req, res) => {
    let { title, director, year, genre, rating, review, watched, watchDate, favorite, inWatchlist } = req.body;
    const { id } = req.params;
    const movieindex = movies.findIndex((movie) => movie.id == id);
    const movie = movies.find((movie) => movie.id == id);
    if (movieindex === -1) {
        return res.status(404).render("pages/not-found", {
            title: "Movie Not Found"
        });
    }
    Object.assign(movie, req.body);
    // const updatedmovie = {
    //     ...movies[movieindex],
    //     ...req.body
    // };


    res.redirect("/movies")
});


app.get("/movies/:id", (req, res) => {
    const { id } = req.params;
    const movie = movies.find((movie) => movie.id === id);
    res.render("pages/movie-details", { title: "Movie Details", movie })
    console.log(req.params.id);
    console.log(movies.map((movie) => movie.id));
}
);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
