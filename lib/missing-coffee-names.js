// Validates that a coffee has all required pieces of information.
const missingCoffeeNames = (coffee) => {
  return coffee.name === '' || coffee.roasterName === '';
}

module.exports = missingCoffeeNames;