// Real products with Printrove mock-ups (one image per phone model).
// Images live in src/real/<folder>/<model-slug>.webp, model list in src/real/<folder>.json
module.exports = [
  {
    id: "case-knitted-puppies",
    slug: "knitted-christmas-puppies-glass-phone-case",
    name: "Knitted Christmas Puppies Glass Case",
    cat: "christmas", cats: ["christmas", "pets"], type: "case",
    price: 699, isNew: true,
    folder: "knitted-christmas-puppies", defaultModel: "iphone-16-pro",
    desc: "Cosy knitted puppies among pine, berries and poinsettias.",
    long: "A whole litter of knitted puppies tucked into Christmas greenery, red berries, pine cones and poinsettias. It's a warm, festive glass phone case for dog lovers, made to order for your exact phone model."
  }
];
