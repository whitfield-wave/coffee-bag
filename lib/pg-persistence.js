const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
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

  async editCoffee(coffeeId, coffee) {

    let queries = [];
    const UPDATE = 'UPDATE coffees SET ';

    for (let item in coffee) {
      if (coffee[item] !== '') {
        let EDIT_COFFEE = UPDATE + `${item} = $1 WHERE id = $2; `;
        queries.push(await dbQuery(EDIT_COFFEE, coffee[item], coffeeId));
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
    const GET_BREW = 'SELECT * FROM brews WHERE coffee_id = $1 AND id = $2';

    let result = await dbQuery(GET_BREW, coffeeId, brewId);

    return result.rows[0];
  }

  async editBrew(coffeeId, brewId, brew) {
    let queries = [];
    const UPDATE = 'UPDATE brews SET ';

    for (let item in brew) {
      if (brew[item] !== '') {
        let EDIT_BREW = UPDATE + `${item} = $1 WHERE id = $2 AND coffee_id = $3;`;
        queries.push(await dbQuery(EDIT_BREW, brew[item], brewId, coffeeId));
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
    const DELETE_BREW = 'DELETE FROM brews WHERE id = $2 AND coffee_id = $1';

    let result = await dbQuery(DELETE_BREW, coffeeId, brewId);

    return result.rowCount === 1;
  }

  async deleteCoffee(coffeeId) {
    const DELETE_COFFEE = 'DELETE FROM coffees WHERE id = $1';

    let result = await dbQuery(DELETE_COFFEE, ...coffeeId);

    return result.rowCount === 1;
  }

  static removeBlankParameters(coffee) {

  }

  static getParameters(coffeeObject) {
    let count = Object.keys(coffeeObject).length;

    let parameterVariables = '';
    for (let i = 1; i <= count; i += 2) {
      parameterVariables += `$${i} = $${i + 1}`
      if (i + 1 !== count) {
        parameterVariables += ', '
      }
    }

    return parameterVariables;
  }
}