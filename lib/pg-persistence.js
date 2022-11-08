const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username
  }

  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users" +
      "  WHERE username = $1";

    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  async getAllCoffees() {
    const ALL_COFFEES = "SELECT * FROM coffees WHERE username = $1";
    let coffees = await dbQuery(ALL_COFFEES, this.username);

    return coffees.rows;
  }

  async getCoffee(coffeeId) {
    const COFFEE_BAG = 'SELECT * FROM coffees WHERE id = $1 AND username = $2';

    let coffee = await dbQuery(COFFEE_BAG, coffeeId, this.username);
    if (coffee.rows[0] === undefined) return undefined;

    return coffee.rows[0];
  }

  async getBrews(coffee_id) {
    const ALL_BREWS = 'SELECT * FROM brews WHERE coffee_id = $1 AND username = $2';
    let brews = await dbQuery(ALL_BREWS, coffee_id, this.username);

    if (brews === undefined) return undefined;

    return brews.rows;

  }

  async addCoffee(coffee) {
    console.log(coffee);
    const ADD_COFFEE = 'INSERT INTO coffees'
      + '(name, roaster_name, country_of_origin, region_of_origin, process, bag_price, description, username)'
      + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8 )';

    let { coffeeName, roasterName, countryOfOrigin, regionOfOrigin, process } = coffee;
    let bagPrice = coffee.bagPrice ? coffee.bagPrice : null;
    let description = coffee.description ? coffee.description : null;


    let result = await dbQuery(ADD_COFFEE, coffeeName, roasterName, countryOfOrigin, regionOfOrigin, process, bagPrice, description, this.username);
    return result.rowCount === 1;

  }

  async addBrew(coffeeId, brew) {
    const ADD_BREW = 'INSERT INTO brews (method, description, coffee_id, username) VALUES ($1, $2, $3, $4)';

    let { method, description } = brew;

    let result = await dbQuery(ADD_BREW, method, description, coffeeId, this.username);

    return result.rowCount === 1;
  }

  async editCoffee(coffeeId, coffee) {

    let queries = [];
    const UPDATE = 'UPDATE coffees SET ';

    for (let item in coffee) {
      if (coffee[item] !== '') {
        let EDIT_COFFEE = UPDATE + `${item} = $1 WHERE id = $2 AND username = $3; `;
        queries.push(await dbQuery(EDIT_COFFEE, coffee[item], coffeeId, this.username));
      }
    }
    let results = await Promise.all(queries);

    for (let i = 0; i < results.length; i++) {
      if (results[i].rowCount !== 1) {
        return undefined;
      }
    }

    return true;
  }

  async getBrew(coffeeId, brewId) {
    const GET_BREW = 'SELECT * FROM brews WHERE coffee_id = $1 AND id = $2 AND username = $3';

    let result = await dbQuery(GET_BREW, coffeeId, brewId, this.username);

    return result.rows[0];
  }

  async editBrew(coffeeId, brewId, brew) {
    let queries = [];
    const UPDATE = 'UPDATE brews SET ';

    for (let item in brew) {
      if (brew[item] !== '') {
        let EDIT_BREW = UPDATE + `${item} = $1 WHERE id = $2 AND coffee_id = $3 AND username = $4;`;
        queries.push(await dbQuery(EDIT_BREW, brew[item], brewId, coffeeId, this.username));
      }
    }

    let results = await Promise.all(queries);

    for (let i = 0; i < results.length; i++) {
      if (results[i].rowCount !== 1) {
        return undefined;
      }
    }
    return true;
  }

  async deleteBrew(coffeeId, brewId) {
    const DELETE_BREW = 'DELETE FROM brews WHERE id = $2 AND coffee_id = $1 AND username = $3';

    let result = await dbQuery(DELETE_BREW, coffeeId, brewId, this.username);

    return result.rowCount === 1;
  }

  async deleteCoffee(coffeeId) {
    const DELETE_COFFEE = 'DELETE FROM coffees WHERE id = $1 AND username = $2';

    let result = await dbQuery(DELETE_COFFEE, ...coffeeId, this.username);

    return result.rowCount === 1;
  }

}