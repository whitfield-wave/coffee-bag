const config = require("./lib/config");
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const PgPersistence = require("./lib/pg-persistence");
const session = require('express-session');
const store = require("connect-loki");
const LokiStore = store(session);
const bcrypt = require('bcrypt');

const missingCoffeeNames = require('./lib/missing-coffee-names');


const multer = require('multer');
const upload = multer({ dest: 'uploads/' })

const app = express();
const host = config.HOST;
const port = config.PORT;
app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "coffeebag-session-id",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

app.use(flash());

// Create new datastore 
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// extract session info
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Display Sign In page
app.get('/users/signin', (req, res) => {
  req.flash("info", "Please sign in.");
  res.render('signin', { flash: req.flash() });
});

// Handle Sign In form submission
app.post("/users/signin",
  async (req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;

    let authenticated = await res.locals.store.authenticate(username, password);
    if (!authenticated) {
      req.flash("error", "Username or password was incorrect. Please try again");
      res.render("signin", {
        username: req.body.username,
        flash: req.flash()
      });
    } else {
      let session = req.session;
      session.username = username;
      session.signedIn = true;
      req.flash("success", `Welcome back, ${username}!`);
      res.redirect("/coffees");
    }
  }
);

// Handle Sign Out
app.post("/users/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/users/signin");
});

// Display sign up form
app.get("/users/signup", (req, res) => res.render('signup'));

// Handle sign up form submission
app.post("/users/signup", async (req, res) => {
  let username = req.body.username.trim();
  let password = req.body.password;
  let passwordRepeat = req.body.passwordRepeat;
  let unique = await res.locals.store.isUniqueUsername(username);
  let passwordsMatch = password === passwordRepeat;
  if (!unique) {
    req.flash('error', `Username ${username} already exists`);
    res.redirect('/users/signup');
  } else if (!passwordsMatch) {
    req.flash('error', 'Passwords do not match.');
    res.render('signup', { username, flash: req.flash() });
  } else {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.log(err);
      } else {
        res.locals.store.addNewUser(username, hash);
        req.flash('success', 'New user successfully created!');
        res.redirect('/users/signin');
      }
    });
  }
});


// Detect unauthorized access to routes.
const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect('/users/signin');
    // res.status(401).send("Unauthorized.");
  } else {
    next();
  }
};

// Redirect start page
app.get('/', (req, res) => res.redirect('/coffees'));

// Displays all coffees
app.get('/coffees', requiresAuthentication, async (req, res) => {
  try {
    let coffees = await res.locals.store.getAllCoffees();
    res.render('all-coffees', { coffees });
  } catch (error) {
    console.log(error);
  }
});

// Displays form to add new bag to database
app.get('/coffees/add/', requiresAuthentication, (req, res) => {
  let coffee = {};
  res.render('add-coffee', { coffee });
});

// Add a new bag to database
app.post('/coffees/add/', requiresAuthentication, async (req, res) => {
  try {
    let coffee = req.body;
    console.log(coffee);
    if (missingCoffeeNames(coffee)) {
      req.flash('error', "Name and Roaster's name are required.");
      res.render('add-coffee', { coffee, flash: req.flash() });
    } else {
      await res.locals.store.addCoffee(coffee);
      req.flash('info', `${coffee.coffeeName} added.`);
      res.redirect('/coffees');
    }
  } catch (error) {
    console.log(error)
  }
});

// Deletes a bag from the database
app.post('/coffees/:coffeeId/destroy', requiresAuthentication, async (req, res) => {
  try {
    let coffeeId = req.params.coffeeId;
    let deleted = await res.locals.store.deleteCoffee(coffeeId);

    if (!deleted) {
      next(new Error("Not found."));
    } else {
      req.flash('info', 'Coffee deleted');
      res.redirect('/coffees');
    }
  } catch (error) {
    console.log(error)
  }
});


// Displays specifc bag of coffee along with associated brews
app.get('/coffees/:coffeeId', requiresAuthentication, async (req, res, next) => {
  try {
    let coffeeId = req.params.coffeeId;
    let coffee = await res.locals.store.getCoffee(coffeeId);
    let brews = await res.locals.store.getBrews(coffeeId);
    if (!coffee || !brews) {
      next(new Error("Not found."));
    } else {
      res.render('coffee', { coffeeId: coffeeId, coffee, brews });
    }
  } catch (error) {
    console.log(error);
  }
});

// Renders page to add brew. 
app.get('/coffees/:coffeeId/add-brew', requiresAuthentication, (req, res) => {
  let coffeeId = req.params.coffeeId;
  res.render("add-brew", { coffeeId });
});

// Adds a brew to a specific coffee based on its ID
app.post('/coffees/:coffeeId/add-brew', requiresAuthentication, async (req, res, next) => {
  try {
    let coffeeId = req.params.coffeeId;
    let brew = req.body;
    let brewAdded = await res.locals.store.addBrew(coffeeId, brew);

    if (!brewAdded) {
      next(new Error("Not Found."));
    } else {
      let coffee = await res.locals.store.getCoffee(coffeeId);
      let brews = await res.locals.store.getBrews(coffeeId);
      res.render('coffee', { coffeeId: coffeeId, coffee, brews });
    }
  } catch (error) {
    console.log(error);
  }
});

// Renders page to edit coffee details
app.get("/coffees/:coffeeId/edit", requiresAuthentication, async (req, res) => {
  try {
    let coffeeId = req.params.coffeeId;
    let coffee = await res.locals.store.getCoffee(coffeeId);
    res.render('edit-coffee', { coffeeId: coffeeId, coffee });
  } catch (error) {
    console.log(error);
  }
});

// Pushes entered changes to coffee to database and redirects to all coffees.
app.post("/coffees/:coffeeId/edit", requiresAuthentication, async (req, res, next) => {
  try {
    let coffeeId = req.params.coffeeId;
    let coffee = req.body;
    let edited = await res.locals.store.editCoffee(coffeeId, coffee);

    if (!edited) {
      next(new Error("Coffee couldn't be edited."));
    } else {
      res.redirect(`/coffees/${coffeeId}`);
    }
  } catch (error) {
    console.log(error);
  }
});

// Renders page for specified brew
app.get("/coffees/:coffeeId/:brewId", requiresAuthentication,)

// Renders edit-brew page for specified brew
app.get("/coffees/:coffeeId/:brewId/edit-brew", requiresAuthentication, async (req, res) => {
  try {
    let coffeeId = req.params.coffeeId;
    let brewId = req.params.brewId;
    let brew = await res.locals.store.getBrew(coffeeId, brewId);
    res.render('edit-brew', { coffeeId: coffeeId, brew });
  } catch (error) {
    console.log(error);
  }
});

// Edits aspect of specified brew and then redirects to coffee's page
app.post("/coffees/:coffeeId/:brewId/edit-brew", requiresAuthentication, async (req, res, next) => {
  try {
    let coffeeId = req.params.coffeeId;
    let brewId = req.params.brewId;
    let brew = req.body;
    let edited = await res.locals.store.editBrew(coffeeId, brewId, brew);

    if (!edited) {
      next(new Error("Brew couldn't be edited."));
    } else {
      res.redirect(`/coffees/${coffeeId}/`);
    }
  } catch (error) {
    console.log(error);
  }
});

// Deletes a selected brew for a specific coffee. 
app.post("/coffees/:coffeeId/:brewId/delete-brew", requiresAuthentication, async (req, res, next) => {
  try {
    let coffeeId = req.params.coffeeId;
    let brewId = req.params.brewId;

    let deleted = await res.locals.store.deleteBrew(coffeeId, brewId);

    if (!deleted) {
      next(new Error("Brew couldn't be deleted."));
    } else {
      req.flash('info', 'Brew deleted');
      res.redirect(`/coffees/${coffeeId}`);
    }
  } catch (error) {
    console.log(error);
  }

});

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
