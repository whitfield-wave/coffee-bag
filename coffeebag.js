const express = require("express");
const morgan = require("morgan");
const PgPersistence = require("./lib/pg-persistence");

const app = express();
const host = '0.0.0.0';
const port = 3000;
app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// Create new datastore 
app.use((req, res, next) => {
  res.locals.store = new PgPersistence();
  next();
});

// Redirect start page
app.get('/', (req, res) => res.redirect('/coffees'));

// Displays all coffees
app.get('/coffees', async (req, res) => {
  try {
    let coffees = await res.locals.store.getAllCoffees();
    res.render('all-coffees', { coffees });

  } catch (error) {
    console.log(error);
  }
});

// Displays form to add new bag to database
app.get('/coffees/add/', (req, res) => {
  res.render('add-coffee');
});

// Add a new bag to database
app.post('/coffees/add/', async (req, res) => {
  try {
    let coffee = req.body;
    await res.locals.store.addCoffee(coffee);
    res.redirect('/coffees');
  } catch (error) {
    console.log(error)
  }
});

// Deletes a bag from the database
app.post('/coffees/:coffeeId/destroy', async (req, res) => {
  try {
    let coffeeId = req.params.coffeeId;
    let deleted = await res.locals.store.deleteCoffee(coffeeId);

    if (!deleted) {
      next(new Error("Not found."));
    } else {
      res.redirect('/coffees');
    }
  } catch (error) {
    console.log(error)
  }
});


// Displays specifc bag of coffee along with associated brews
app.get('/coffees/:coffeeId', async (req, res, next) => {
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
app.get('/coffees/:coffeeId/add-brew', (req, res) => {
  let coffeeId = req.params.coffeeId;
  res.render("add-brew", { coffeeId });
});

// Adds a brew to a specific coffee based on its ID
app.post('/coffees/:coffeeId/add-brew', async (req, res, next) => {
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

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});


// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
