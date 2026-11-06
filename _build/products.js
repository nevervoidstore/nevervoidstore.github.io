const PRODUCTS = [
  {id:"mug-sleigh", type:"mug", cat:"christmas", name:"Sleigh All Day Mug", price:449, desc:"11oz ceramic mug. Bold red type with drifting snowflakes.", art:mug(D.sleigh()), isNew:true},
  {id:"mug-tree", type:"mug", cat:"christmas", name:"Merry & Bright Mug", price:449, desc:"A little Christmas tree on a cream mug. Perfect for gifting.", art:mug(D.tree(),"#f3ead8")},
  {id:"mug-cocoa", type:"mug", cat:"christmas", name:"Hot Cocoa Club Mug", price:449, desc:"Festive red mug with a vintage-style badge.", art:mug(D.cocoa(),"#b3262e")},
  {id:"mug-ginger", type:"mug", cat:"christmas", name:"Oh Snap! Gingerbread Mug", price:449, desc:"A cheeky gingerbread friend for cookie-dunking season.", art:mug(D.ginger())},
  {id:"mug-dogmom", type:"mug", cat:"pets", name:"Dog Mom Mug", price:449, desc:"For the human who's fuelled by coffee and fur.", art:mug(D.dogmom())},
  {id:"mug-cat", type:"mug", cat:"pets", name:"Purrsonal Space Mug", price:449, desc:"Black mug with a calm, judgemental cat.", art:mug(D.cat(),"#2b2b2b")},
  {id:"mug-paws", type:"mug", cat:"pets", name:"Paws & Coffee Mug", price:449, desc:"Muddy-paw prints, morning coffee. Sounds about right.", art:mug(D.paws())},
  {id:"mug-custom", type:"mug", cat:"pets", name:"Custom Pet Portrait Mug", price:649, desc:"Your pet as a custom portrait in the style you pick. Preview sent before printing.", art:mug(D.custom()), isNew:true},
  {id:"case-plaid", type:"case", cat:"christmas", name:"Holiday Plaid Glass Case", price:699, desc:"Classic red-and-green tartan on a glass phone case.", art:phone(D.plaid())},
  {id:"case-pines", type:"case", cat:"christmas", name:"Snowy Pines Glass Case", price:699, desc:"A quiet winter night under the moon.", art:phone(D.pines()), isNew:true},
  {id:"case-cats", type:"case", cat:"pets", name:"Cat Crowd Glass Case", price:699, desc:"A whole crowd of cats on blush pink.", art:phone(D.cats())},
  {id:"case-paws", type:"case", cat:"pets", name:"Paw Party Glass Case", price:699, desc:"Scattered paw prints on soft sage.", art:phone(D.pawcase())},
  {id:"case-custom", type:"case", cat:"pets", name:"Custom Pet Glass Case", price:799, desc:"Your pet and their name on a glass phone case. Preview sent before printing.", art:phone(D.customcase()), isNew:true}
];
