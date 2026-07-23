require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const PORT = process.env.PORT || 3000;
function isloggedin(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/login");
}

function isloggedout(req, res, next) {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }
    next();
}

app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
})

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))

const db = require("./config/db");



app.get("/", (req, res) => {
    res.render("pages/landing", { title: "CineVault" });
});


app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send("logout failed");
        }
        res.redirect("/login");
    })
})


app.get("/login", isloggedout, (req, res) => {
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

app.get("/watched", isloggedin, (req, res) => {
    const id = req.session.user.id;
    // let result = [];
    let sql = `select * from movies where user_id = ? and watched = ?`;
    db.query(sql, [id, true], (err, result) => {
        if (err) {
            console.log(err);
            console.log("no movie detected");
            return res.send("database error");
        }
        res.render("pages/watched", {
            title: "Watched",
            movies: result
        })

    });
});

app.get("/signup", isloggedout, (req, res) => {
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


app.post("/movies/:id/toggle-watched", (req, res) => {
    const { id } = req.params;

    const sql = `
        DELETE FROM movies
        WHERE id = ? AND user_id = ?;
    `;

    db.query(sql, [id, req.session.user.id], (err) => {
        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        res.redirect("/watched");
    });
});

app.get("/dashboard", isloggedin, (req, res) => {

    let watchedCount = 0;
    let favoriteCount = 0;
    let watchlistCount = 0;
    let totalRating = 0;
    let ratedMovies = 0;

    const sql = `
        SELECT * FROM movies
        WHERE user_id = ?;
    `;

    const favoriteSql = `
        SELECT *
        FROM movies
        WHERE user_id = ?
        AND favorite = true
        ORDER BY created_at DESC
        LIMIT 4;
    `;

    const recentSql = `
        SELECT *
        FROM movies
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 4;
    `;

    db.query(sql, [req.session.user.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        for (let i = 0; i < result.length; i++) {

            if (result[i].watched)
                watchedCount++;

            if (result[i].favorite)
                favoriteCount++;

            if (result[i].watchlist)
                watchlistCount++;

            if (result[i].imdbRating && result[i].imdbRating !== "N/A") {
                totalRating += Number(result[i].imdbRating);
                ratedMovies++;
            }
        }

        const averageRating =
            ratedMovies > 0
                ? (totalRating / ratedMovies).toFixed(1)
                : 0;

        db.query(favoriteSql, [req.session.user.id], (err, favoriteMovies) => {

            if (err) {
                console.log(err);
                return res.send("Database Error");
            }

            db.query(recentSql, [req.session.user.id], (err, recentMovies) => {

                if (err) {
                    console.log(err);
                    return res.send("Database Error");
                }

                res.render("pages/dashboard", {
                    title: "Dashboard",
                    stats: {
                        watchedCount,
                        favoriteCount,
                        watchlistCount,
                        averageRating
                    },
                    favoriteMovies,
                    recentlyWatched: recentMovies
                });

            });

        });

    });

});

app.get("/movies", isloggedin, async (req, res) => {
    let searchresults = [];

    const search = req.query.search || "";
    if (search) {
        const url = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${search}`;
        const response = await axios.get(url);
        searchresults = response.data.Search || [];
    }

    res.render("pages/movies", {
        title: "Movies",
        movies: searchresults,
        search
    });
});
app.post("/movies/add", isloggedin, async (req, res) => {
    const { imdbID } = req.body;
    console.log(imdbID);
    const url = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${imdbID}`;
    try {
        const response = await axios.get(url);
        console.log(response.data);
        const movie = response.data;

        const sql = `INSERT INTO movies
                    (
                        user_id,
                        imdbID,
                        title,
                        year,
                        genre,
                        director,
                        actors,
                        runtime,
                        poster,
                        plot,
                        imdbRating,
                        watched
                    )
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
        db.query(sql, [
            req.session.user.id,
            movie.imdbID,
            movie.Title,
            movie.Year,
            movie.Genre,
            movie.Director,
            movie.Actors,
            movie.Runtime,
            movie.Poster,
            movie.Plot,
            movie.imdbRating,
            true
        ], (err, results) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {
                    // req.flash("success", "Movie already exists.");

                    return res.redirect("/watched");
                }

                console.log(err);
                return res.send("Database Error");
            }

            console.log("Movie Added!");
            res.redirect("/watched");
        });
    }
    catch (err) {
        console.log(err);
        res.send("Unable to fetch movie.");
    }
});


app.get("/watchlist", isloggedin, (req, res) => {
    let sql = `select * from movies where watchlist = ? and user_id = ?`;
    db.query(sql, [true, req.session.user.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Database error");
        }
        res.render("pages/watchlist", { title: "Watchlist", movies: result });

    })
});

app.post("/movies/:id/toggle-watchlist", (req, res) => {
    const { id } = req.params;
    let sql = `update movies
                set watchlist = not watchlist
                where id =? and user_id =?;
                `;
    db.query(sql, [id, req.session.user.id], (err, reuslt) => {
        if (err) {
            console.log(err);
            return res.send("Database error");
        }
        res.redirect("/watchlist");
    })
});



app.get("/favorites", isloggedin, (req, res) => {
    let sql = `select * from movies where favorite = ? and user_id = ?`;
    db.query(sql, [true, req.session.user.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Database error");
        }
        res.render("pages/favorites", { title: "Favorites", movies: result });

    })
});

app.post("/movies/:id/toggle-favorite", (req, res) => {
    const { id } = req.params;
    let sql = `update movies 
                set favorite = NOT favorite
                where id =? and user_id =?;
                `;
    db.query(sql, [id, req.session.user.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Database error");
        }
        res.redirect("/favorites");
    })
})

app.get("/statistics", isloggedin, (req, res) => {

    let watchedCount = 0;
    let favoriteCount = 0;
    let watchlistCount = 0;
    let totalRating = 0;
    let ratedMovies = 0;

    const moviesPerYear = {};

    const sql = `
        SELECT * FROM movies
        WHERE user_id = ?;
    `;

    db.query(sql, [req.session.user.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        for (const movie of result) {

            if (movie.watched)
                watchedCount++;

            if (movie.favorite)
                favoriteCount++;

            if (movie.watchlist)
                watchlistCount++;

            if (movie.imdbRating && movie.imdbRating !== "N/A") {
                totalRating += Number(movie.imdbRating);
                ratedMovies++;
            }

            if (moviesPerYear[movie.year]) {
                moviesPerYear[movie.year]++;
            } else {
                moviesPerYear[movie.year] = 1;
            }
        }

        const averageRating =
            ratedMovies > 0
                ? (totalRating / ratedMovies).toFixed(1)
                : 0;

        res.render("pages/statistics", {
            title: "Statistics",
            stats: {
                totalMovies: result.length,
                watchedCount,
                favoriteCount,
                watchlistCount,
                averageRating,
                moviesPerYear
            }
        });

    });

});


app.get("/movies/:id", isloggedin, (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT *
        FROM movies
        WHERE id = ? AND user_id = ?;
    `;

    db.query(sql, [id, req.session.user.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        if (result.length === 0) {
            return res.send("Movie not found");
        }

        res.render("pages/movie-details", {
            title: "Movie Details",
            movie: result[0]
        });

    });

});



app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
