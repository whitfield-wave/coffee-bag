const { dbQuery } = require("./db-query");

module.exports = class {
  constructor() {

  }

  async getAllCoffees() {
    const ALL_COFFEES = "SELECT * FROM coffees";
    let coffees = await dbQuery(ALL_COFFEES);

    return coffees.rows;
  }

  async getCoffee(coffeeId) {
    const COFFEE_BAG = 'SELECT * FROM coffees WHERE id = $1';

    let coffee = await dbQuery(COFFEE_BAG, coffeeId);
    console.log(coffee.rows);
    if (coffee.rows[0] === undefined) return undefined;

    return coffee.rows[0];
  }

  async getBrews(coffee_id) {
    const ALL_BREWS = 'SELECT * FROM brews WHERE coffee_id = $1';
    let brews = await dbQuery(ALL_BREWS, coffee_id);

    if (brews === undefined) return undefined;

    return brews.rows;

  }

  async addCoffee(coffee) {
    const ADD_COFFEE = 'INSERT INTO coffees'
      + '(name, roaster_name, country_of_origin, region_of_origin, process, bag_price, description)'
      + 'VALUES ($1, $2, $3, $4, $5, $6, $7 )';

    let { coffeeName, roasterName, countryOfOrigin, regionOfOrigin, process } = coffee;
    let bagPrice = coffee.bagPrice ? coffee.bagPrice : null;
    let description = coffee.description ? coffee.description : null;


    let result = await dbQuery(ADD_COFFEE, coffeeName, roasterName, countryOfOrigin, regionOfOrigin, process, bagPrice, description);

    return result.rowCount === 1;

  }

  async addBrew(coffeeId, brew) {
  const ADD_BREW = 'INSERT INTO brews (method, description, coffee_id) VALUES ($1, $2, $3)';

    let { method, description } = brew;

    let result = await dbQuery(ADD_BREW, method, description, coffeeId);

    return result.rowCount === 1;

  }

  async deleteCoffee(coffeeId) {
    const DELETE_COFFEE = 'DELETE FROM coffees WHERE id = $1';

    let result = await dbQuery(DELETE_COFFEE, coffeeId);

    return result.rowCount === 1;
  }
}