// Validates that a coffee has all required pieces of information.
const missingCoffeeNames = (coffee) => {
  return coffee.coffeeName === undefined || coffee.roasterName === undefined;
}

module.exports = missingCoffeeNames;