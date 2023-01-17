// Validates that a coffee has all required pieces of information.
const missingCoffeeNames = (coffee) => {
  return coffee.coffeeName === '' || coffee.roasterName === '';
}

module.exports = missingCoffeeNames;