// AUTO-EXTRACTED from the original Sun Princess Cocktail Passport (data verbatim).
// 28 venues, 166 cocktails + 21 wines + 27 beers = 214 drinks. Do not hand-edit values.

export const START = "2026-10-03";
export const END = "2026-10-17";
export const PLUS = 15;   // Plus package: drinks up to $15
export const PREM = 20;   // Premier package: up to $20, pay the difference above

export interface VenueRaw {
  name: string; deck: number; type: string; hours: string; blurb: string;
  shares?: string; sharesNote?: string;
}
export const VENUES: Record<string, VenueRaw> = {
  "goodspirits": {
    "name": "Good Spirits at Sea",
    "deck": 7,
    "type": "Bar",
    "hours": "4pm – late",
    "blurb": "Rob Floyd's globe-trotting cocktail room, tucked round the corner from the forward lifts. Nightly show-bar demos: times are in the Patter."
  },
  "omalleys": {
    "name": "O'Malley's Irish Pub",
    "deck": 7,
    "type": "Pub",
    "hours": "1pm (sea) / 4pm (port) – late",
    "blurb": "Proper Dublin-pub energy with live music. Grace O'Malley and Sláinte Irish whiskey, Pantalones tequila, and cocktails on tap by the pitcher."
  },
  "princesslive": {
    "name": "Princess Live!",
    "deck": 7,
    "type": "Lounge",
    "hours": "4pm – late",
    "blurb": "Game shows, trivia, comedy and live music, with a bar running classic cocktails alongside the Love Line."
  },
  "bellinis": {
    "name": "Bellini's Cocktail Bar",
    "deck": 7,
    "type": "Bar",
    "hours": "7am – late",
    "blurb": "The main Piazza bar, built around Italian spirits: spritzes, prosecco cocktails and the Tiramisu Collection."
  },
  "coffeecurrents": {
    "name": "Coffee Currents",
    "deck": 7,
    "type": "Café",
    "hours": "6am – late",
    "blurb": "Second Piazza coffee shop. Same espresso menu as the International Café but with more seating and ocean views."
  },
  "wheelhouse": {
    "name": "Wheelhouse Bar",
    "deck": 7,
    "type": "Bar",
    "hours": "4pm – late",
    "blurb": "Nautical, quiet, out of the way of the Piazza. Board games behind the bar and two absurd shared 'experiential' pours."
  },
  "catch": {
    "name": "The Catch by Rudi",
    "deck": 7,
    "type": "Restaurant",
    "hours": "Dinner",
    "blurb": "Rudi Sodamin's seafood restaurant, with its own short list of cocktails built for the food."
  },
  "crowngrill": {
    "name": "Crown Grill",
    "deck": 7,
    "type": "Restaurant",
    "hours": "Dinner",
    "blurb": "The steakhouse. Wine-led rather than cocktail-led: a deep Caymus and Wagner Family list.",
    "shares": "crooners",
    "sharesNote": "No signature cocktails on the published menu. Wines by the glass as listed here."
  },
  "butchers": {
    "name": "The Butcher's Block by Dario",
    "deck": 7,
    "type": "Restaurant",
    "hours": "Dinner",
    "blurb": "Dario Cecchini's Tuscan family-style meat feast, with a matched Italian beverage list.",
    "shares": "sabatinis",
    "sharesNote": "Italian beverage list. Expect the Sabatini's set until you see otherwise."
  },
  "spellbound": {
    "name": "Spellbound by Magic Castle",
    "deck": 8,
    "type": "Experience",
    "hours": "From 6pm, ticketed",
    "blurb": "Victorian rooms behind an unmarked door, close-up magic at the Parlor Bar, and the most theatrical drinks on the ship. Cover charge applies."
  },
  "crooners": {
    "name": "Crooners",
    "deck": 8,
    "type": "Bar",
    "hours": "11am – late",
    "blurb": "Martini and piano bar under the Sphere window. The deepest cocktail list on board and the best sunset seat."
  },
  "makoto": {
    "name": "Makoto Ocean",
    "deck": 8,
    "type": "Restaurant",
    "hours": "Lunch & dinner",
    "blurb": "Sushi with a Japanese-spirit bar: Roku, Haku, sake, shochu and Japanese whisky."
  },
  "umai": {
    "name": "Umai Teppanyaki",
    "deck": 8,
    "type": "Restaurant",
    "hours": "Dinner",
    "blurb": "Teppanyaki and hot pot, with five cocktails made only here."
  },
  "sabatinis": {
    "name": "Sabatini's Italian Trattoria",
    "deck": 8,
    "type": "Restaurant",
    "hours": "Dinner",
    "blurb": "Frescobaldi partnership: iconic Italian cocktails, prosecco spritzes and five wine-inspired signatures."
  },
  "wakeview": {
    "name": "Wake View Bar",
    "deck": 8,
    "type": "Pool bar",
    "hours": "10am – 8pm",
    "blurb": "Aft infinity pool with the wake behind it. Yacht-club drinks list. Get there around 4pm for the seat you want."
  },
  "alfredos": {
    "name": "Alfredo's Pizzeria",
    "deck": 9,
    "type": "Restaurant",
    "hours": "Lunch & dinner",
    "blurb": "Sit-down pizza with an Italian-leaning drinks list.",
    "shares": "sabatinis",
    "sharesNote": "Italian-leaning list. The exact Alfredo's menu was not published."
  },
  "intlcafe": {
    "name": "International Café",
    "deck": 9,
    "type": "Café",
    "hours": "24 hours",
    "blurb": "Open all night. Espresso, premium teas, spirited coffees and the standard bar menu.",
    "shares": "coffeecurrents",
    "sharesNote": "Same espresso menu as Coffee Currents, plus the standard bar list."
  },
  "promenade": {
    "name": "Promenade Bar",
    "deck": 9,
    "type": "Pool bar",
    "hours": "11am – 6pm",
    "blurb": "Port and starboard bars on the new outdoor promenade, running the standard menu.",
    "shares": "themix",
    "sharesNote": "Pours the standard bar menu."
  },
  "americana": {
    "name": "Americana Diner",
    "deck": 9,
    "type": "Restaurant",
    "hours": "All day",
    "blurb": "Diner shakes and floats, included in the fare."
  },
  "suitelounge": {
    "name": "Signature Suite Lounge",
    "deck": 15,
    "type": "Lounge",
    "hours": "All day",
    "blurb": "Two-storey lounge for Signature and Sanctuary Collection guests.",
    "shares": "themix",
    "sharesNote": "Standard list, poured for Signature and Sanctuary Collection guests."
  },
  "seaview": {
    "name": "Sea View Bar",
    "deck": 17,
    "type": "Pool bar",
    "hours": "10am – 6pm",
    "blurb": "Forward of the Dome, over the bow. Maritime cocktails and the Carajillo coffee collection. Free to all guests."
  },
  "cascade": {
    "name": "Cascade Bar",
    "deck": 17,
    "type": "Bar",
    "hours": "Limited evenings",
    "blurb": "Inside the Dome beside the indoor waterfall. Short, odd, good list. Often shut for show rehearsals."
  },
  "lido": {
    "name": "Lido Bar",
    "deck": 17,
    "type": "Pool bar",
    "hours": "11am – 10:30pm",
    "blurb": "Walk-up bar serving Lido Eats. Standard menu, no dedicated seating.",
    "shares": "themix",
    "sharesNote": "Pours the standard bar menu."
  },
  "themix": {
    "name": "THE MIX",
    "deck": 17,
    "type": "Pool bar",
    "hours": "11am – 6pm",
    "blurb": "Aft end of the main pool deck, starboard. Standard menu with the mixologists who actually enjoy it."
  },
  "coffeecones": {
    "name": "Coffee and Cones",
    "deck": 17,
    "type": "Café",
    "hours": "Daytime",
    "blurb": "Espresso, granitas and free soft serve aft on Deck 17, portside. Premium desserts cost extra.",
    "shares": "coffeecurrents",
    "sharesNote": "Same espresso menu, plus granitas and soft serve."
  },
  "britto": {
    "name": "Love by Britto",
    "deck": 17,
    "type": "Experience",
    "hours": "Dinner, ticketed",
    "blurb": "Romero Britto dining experience with its own sparkling wine and a love-themed cocktail list."
  },
  "sunbar": {
    "name": "Sun Bar",
    "deck": 18,
    "type": "Pool bar",
    "hours": "9am – 10pm",
    "blurb": "Deck 18 sundeck and whirlpools. Starboard side is the outdoor smoking section.",
    "shares": "themix",
    "sharesNote": "Pours the standard bar menu, including the 24k Margarita."
  },
  "sanctuary": {
    "name": "Sanctuary Club Bar",
    "deck": 18,
    "type": "Pool bar",
    "hours": "8am – 5pm",
    "blurb": "Aft adults-only retreat for Sanctuary Collection guests. Own pool, own bar."
  }
};

// Cocktail rows: [name, venueKey, category, spirits[], ingredients, flavors[], sweet(1-5), strength(0-5), frozen, price|null, desc, verified]
export type CocktailRow = [string,string,string,string[],string,string[],number,number,boolean,number|null,string,boolean];
export const COCKTAILS: CocktailRow[] = [["Gin & Tonic Ultima","goodspirits","Signature",["Gin"],"Hendrick's gin, lime wheel, lemon peel, juniper, tonic",["Refreshing","Bitter"],1,3,false,null,"Barcelona. A deconstructed G and T built on fresh herbs and market flavours.",true],["Azul Blanco","goodspirits","Signature",["Tequila"],"Silver tequila, lime, blue curaçao, pineapple, elderflower foam",["Tropical","Sweet"],4,3,false,null,"Curaçao. Blue body under a white elderflower foam: clouds meeting the sea.",true],["Grappa Peach","goodspirits","Signature",["Brandy","Liqueur"],"Grappa, lemon, honey, peach schnapps, prosecco",["Fruity","Sweet"],4,3,false,null,"Uruguay. Grappa with honey, then peach and prosecco on top.",true],["Bangkok Mule","goodspirits","Signature",["Whiskey"],"Whiskey, basil, lemongrass and ginger syrup, lime, ginger beer",["Refreshing","Sour"],3,3,false,null,"Thailand. Herbs and fresh ginger against whiskey.",true],["Apples Delight","goodspirits","Signature",["Brandy","Wine"],"Calvados, lemon, honey syrup, St Germain, apples, port",["Fruity","Sweet"],4,3,false,null,"Madeira. Calvados and fresh Madeiran apples, for courage before the toboggan run.",true],["Sandia en Fuego","goodspirits","Signature",["Tequila"],"Don Julio Reposado, serrano pepper, watermelon, lime, agave",["Fruity","Strong"],3,4,false,null,"Yucatán. Chilli heat over watermelon: you will smile at the first sip.",true],["The Great Pumpkin","goodspirits","Signature",["Rum"],"Bacardi 8, aquafaba, pumpkin syrup, cinnamon, nutmeg, lemon",["Sweet","Dessert"],4,3,false,null,"St Lucia. Castries market in a glass: rum, pumpkin, cinnamon, nutmeg.",true],["Vanilla Sky","goodspirits","Signature",["Vodka"],"Vanilla vodka, triple sec, fresh pineapple, orgeat, lime, agave",["Tropical","Sweet"],4,3,false,null,"Tahiti. Pineapple for hospitality, vanilla for the myth.",true],["The Cartagena Cool","goodspirits","Signature",["Rum"],"Appleton rum, cinnamon, orange and chocolate bitters, orange peel",["Bitter","Strong"],2,4,false,null,"Cartagena. Chocolate, nutmeg and cinnamon wound through a serious rum.",true],["Coco-Cafe","goodspirits","Coffee",["Rum"],"Gosling rum, Lavazza espresso, coconut cream, kosher salt, grated nutmeg and chocolate",["Coffee","Sweet"],3,3,false,null,"Dominican Republic. Arabica arrived in 1715 and never left.",true],["Aperitivo Roma","goodspirits","Signature",["Liqueur","Whiskey"],"Limoncello, Aperol, Canadian whiskey, bitters, mint",["Bitter","Refreshing"],3,3,false,null,"Rome. Limoncello zing against Aperol sweetness.",true],["Barbados Swizzler","goodspirits","Signature",["Rum"],"Bacardi light rum, Bacardi dark rum, grapefruit, agave, velvet falernum, bitters",["Sour","Tropical"],3,4,false,null,"Barbados. Rum and grapefruit, both native to the island.",true],["Key Lime Martini","goodspirits","Martini",["Whiskey"],"Whiskey, agave, lime, Cointreau, vanilla, condensed milk, pineapple, graham cracker and cinnamon rim, elderflower foam",["Dessert","Sweet"],5,3,false,null,"Key West. Dessert in a glass, with bourbon depth underneath.",true],["Mykonos Press","goodspirits","Signature",["Liqueur","Gin"],"Ouzo, Hendrick's gin, lemon, simple syrup, soda, lime, grenadine",["Refreshing","Sour"],3,3,false,null,"Mykonos. Liquorice notes folded into fresh lemon.",true],["Pastis Pearl","goodspirits","Signature",["Gin","Liqueur"],"Hendrick's gin, pastis, lemon, simple syrup, aquafaba",["Refreshing","Sour"],2,3,false,null,"Marseille. Mediterranean anise and Provençal herbs with citrus.",true],["Saint Petersburg Mule","goodspirits","Signature",["Vodka"],"Vodka, lemon, honey syrup, apple juice, ginger beer",["Refreshing","Fruity"],3,3,false,null,"Ginger warmth over apple and honey. The spirit came out of Mendeleev's chemistry.",true],["Starry Night in Oslo","goodspirits","Signature",["Liqueur"],"Aquavit, black charcoal tea, lemon, agave, fresh ginger",["Strong","Refreshing"],2,4,false,null,"Black with a gold shimmer, for the long Norwegian winter nights.",true],["Butterfly","goodspirits","Cocktail Magic",["Gin"],"Gin, lemon, Cointreau, simple syrup, butterfly tea",["Refreshing","Sour"],3,3,false,null,"Changes colour and flavour in front of you. Science or myth, take your pick.",true],["Loch Ness Martini","goodspirits","Cocktail Magic",["Gin","Scotch"],"Hendrick's gin, lime, agave, Cointreau, cucumber, salt",["Refreshing","Strong"],2,4,false,null,"A hint of Scotch, but flavoured gin is the real star. Medieval and New Town in one glass.",true],["Classic Cosmo","crooners","Martini",["Vodka","Liqueur"],"Vodka, orange liqueur, cranberry, lime",["Sour","Fruity"],3,3,false,11,"The standard, done properly.",true],["French Martini","crooners","Martini",["Vodka","Liqueur"],"Vodka, black raspberry liqueur, pineapple",["Fruity","Sweet"],4,3,false,11,"Chambord and pineapple, foamed on top.",true],["Blackberry Thicket","crooners","Signature",["Gin"],"Gin, lemon, basil, blackberry",["Fruity","Sour"],3,3,false,12,"Bramble territory, with basil instead of mint.",true],["Crooners Signature 007","crooners","Martini",["Vodka","Gin"],"Vodka or gin, olive brine",["Strong"],1,5,false,14,"The dirty martini. Shaken, not stirred, if you insist.",true],["Figs & Honey","crooners","Signature",["Vodka"],"Vodka, lemon, honey thyme syrup, fig jam",["Sweet","Fruity"],4,3,false,14,"Jam-forward and herbal.",true],["Clover Club","crooners","Classic",["Gin","Liqueur"],"Gin, Chambord, lemon, raspberry, agave",["Fruity","Sour"],3,3,false,14,"Pre-Prohibition Philadelphia, still holding up.",true],["Rum Brulee","crooners","Dessert",["Rum"],"Jamaican rum, crème de cacao, banana, Angostura bitters",["Dessert","Sweet"],4,3,false,14,"Banana and cacao over funky Jamaican rum.",true],["Cask and Coco","crooners","Dessert",["Whiskey","Liqueur"],"Irish whiskey, Licor 43, crème de cacao",["Dessert","Sweet"],4,3,false,14,"Vanilla, chocolate, Irish whiskey.",true],["Ferrero","crooners","Dessert",["Vodka","Liqueur"],"Vanilla vodka, chocolate liqueur, Irish cream, Frangelico",["Dessert","Sweet"],5,3,false,15,"Named after exactly what you think.",true],["Chairman of the Board","crooners","Martini",["Vodka","Gin"],"Grey Goose vodka, Tanqueray gin, Cointreau, orange bitters",["Strong"],1,5,false,16,"Vodka and gin together. Sinatra's title, and a serious drink.",true],["Negroni Bianco","crooners","Classic",["Gin","Liqueur"],"Tanqueray, Italicus, dry vermouth, grapefruit bitters",["Bitter","Strong"],2,4,false,16,"The white Negroni: bergamot instead of Campari.",true],["Lavender Smoke","crooners","Signature",["Mezcal","Gin"],"Ilegal Mezcal Reposado, Empress gin, lime, lavender, orgeat",["Strong","Sour"],3,4,false,17,"Smoke, florals and almond. One of the best on board.",true],["Vintage Sidecar","crooners","Classic",["Cognac","Liqueur"],"Hennessy VS, Cointreau, lemon, demerara syrup",["Sour","Strong"],2,4,false,17,"The classic, with demerara rounding the edges.",true],["The White Lady","crooners","Classic",["Gin","Liqueur"],"Chamomile-infused gin, Grand Marnier, lemon, orange, thyme",["Sour","Refreshing"],2,4,false,18,"Chamomile infusion turns a stiff classic gentle.",true],["Carajillo Old Fashioned","crooners","Coffee",["Rum","Bourbon"],"Bacardi 8, Jack Daniel's, Harvey's Bristol Cream, coffee tincture",["Coffee","Strong"],3,4,false,18,"Old fashioned architecture, carajillo soul.",true],["Elixir of the Night","crooners","Classic",["Whiskey"],"Woodford Reserve Rye, sweet vermouth, Averna, Angostura bitters, Pernod",["Bitter","Strong"],2,5,false,18,"A stirred, brooding rye drink. Very little sugar.",true],["Brooklyn Nights","crooners","Classic",["Whiskey"],"Woodford Reserve Rye, sweet vermouth, maraschino, orange bitters",["Bitter","Strong"],2,5,false,18,"The Brooklyn: Manhattan's less famous, sharper cousin.",true],["Irish Tails","crooners","Coffee",["Vodka","Liqueur"],"Absolut Vanilla, Amarula coffee liqueur, cold brew, Guinness reduction",["Coffee","Dessert"],3,3,false,18,"Cold brew with a Guinness reduction float.",true],["Sailing Through the Orchids","crooners","Signature",["Vodka","Gin"],"Grey Goose La Poire, elderflower, Empress gin, Cointreau, lemon, yuzu bitters",["Fruity","Refreshing"],3,4,false,19,"Pear, elderflower and yuzu. Colour-shifting from the Empress gin.",true],["Violette Haze","crooners","Signature",["Gin"],"Hendrick's, crème de violette, lemon, cucumber",["Refreshing","Sour"],3,4,false,19,"Violet and cucumber. Looks like the sky at dusk.",true],["Whispers of Lapsang","crooners","Signature",["Bourbon","Rum"],"Chamomile-infused bourbon, Bacardi 8, lemon, lapsang, honey, Angostura bitters",["Strong","Bitter"],3,4,false,19,"Smoked tea and honey against bourbon.",true],["The Rose","crooners","Signature",["Vodka"],"Absolut Elyx, lemon, strawberry",["Fruity","Sour"],3,4,false,20,"Simple, expensive and very good. Right at the Premier ceiling.",true],["The Lux Classic","crooners","Beyond",["Gin"],"Tanqueray 10, dry vermouth, orange bitters, caviar",["Strong"],1,5,false,35,"A martini served with caviar. Above both package caps.",true],["Clover Breeze","omalleys","Signature",["Vodka"],"Absolut vodka shaken with lavender, lemon and melon",["Fruity","Refreshing"],3,3,false,13,"Light and floral, the outlier on a whiskey-heavy list.",true],["Passion of the Irish","omalleys","Signature",["Whiskey"],"Sláinte Irish whiskey, Galliano, passionfruit, orange, vanilla, soda",["Fruity","Sweet"],4,3,false,15,"Sláinte whiskey given a tropical turn.",true],["Tropical Alibi","omalleys","Signature",["Whiskey"],"Sláinte Irish whiskey, banana liqueur, coconut milk, pineapple, lime, Angostura bitters",["Tropical","Sweet"],4,3,false,15,"Irish whiskey doing a piña colada impression, and getting away with it.",true],["Filthy Molly","omalleys","Signature",["Whiskey"],"Sláinte Irish whiskey, Filthy Bloody Mary mix, Filthy olives, celery salt",["Bitter","Strong"],1,4,false,17,"A whiskey Bloody Mary. Order it at lunch.",true],["Fiery High Ball","omalleys","Signature",["Whiskey"],"Sláinte Irish whiskey, spiced pineapple syrup, fresh ginger, lemon, soda",["Refreshing","Fruity"],3,3,false,18,"Ginger heat and spiced pineapple, long and cold.",true],["Kenmare's Kiss","omalleys","Signature",["Vodka"],"Absolut Elyx shaken with lychee, guava, mint and lemon",["Fruity","Refreshing"],4,3,false,18,"Lychee and guava. Nothing Irish about it, and nobody minds.",true],["The Golden Gorse","omalleys","Signature",["Gin"],"Beefeater gin shaken with St Germain, lemon and lavender, topped with seltzer",["Refreshing","Sour"],3,3,false,13,"Elderflower and lavender, long over ice.",true],["Pair of Queens","omalleys","Signature",["Gin"],"Beefeater gin shaken with velvet falernum, pineapple, lime and orgeat",["Tropical","Sour"],3,3,false,13,"Falernum and orgeat: tiki construction on a gin base.",true],["Howth Castle","omalleys","Coffee",["Whiskey"],"Jameson Irish whiskey, black coffee and cream",["Coffee"],2,3,false,13,"Stripped-back Irish coffee, no sugar hiding anything.",true],["Under the Mango Tree","omalleys","Signature",["Whiskey"],"Jameson Irish whiskey shaken with mango, lemon and mint",["Fruity","Refreshing"],3,3,false,13,"Mango and mint over Jameson.",true],["Flanna's Elixir","omalleys","Signature",["Whiskey"],"Jameson Black Barrel shaken with ginger, lemongrass, Drambuie and lemon",["Refreshing","Strong"],3,4,false,15,"Drambuie and lemongrass. More complex than it sounds.",true],["Irish Time","omalleys","Signature",["Whiskey"],"Redbreast 15 gently stirred with salted caramel and bitters",["Sweet","Strong"],4,5,false,19,"Redbreast 15 with salted caramel. Stirred, no citrus.",true],["Black Oak","omalleys","Coffee",["Whiskey","Liqueur"],"Jameson Cold Brew stirred with Kahlúa, chocolate essence and bitters",["Coffee","Strong"],3,4,false,19,"Cold brew whiskey, stirred like an old fashioned.",true],["Wicklow Pipes","omalleys","Beyond",["Whiskey"],"Jameson 18 gently stirred with sweet vermouth and bitters",["Strong","Bitter"],2,5,false,25,"A Jameson 18 Manhattan. Above both caps.",true],["Sea Legs","omalleys","Signature",["Tequila"],"Pantalones Reposado, maraschino liqueur, lime, grapefruit, agave, soda",["Sour","Refreshing"],3,4,false,20,"Hemingway daiquiri logic on a reposado base.",true],["Pants On Fire","omalleys","Signature",["Tequila"],"Pantalones Reposado, Campari, lime, smoked paprika agave",["Bitter","Strong"],2,4,false,20,"Smoked paprika and Campari. The most interesting of the Pantalones set.",true],["Fancy Pants Paloma","omalleys","Signature",["Tequila"],"Pantalones Reposado, Betty Buzz grapefruit, lime",["Refreshing","Sour"],2,3,false,20,"A clean paloma. Nothing hidden.",true],["Hot Pants","omalleys","Signature",["Tequila"],"Pantalones Blanco, lime, pineapple, agave",["Tropical","Sour"],3,3,false,19,"Pineapple and blanco tequila, short and sharp.",true],["24k Margarita","omalleys","Margarita",["Tequila","Liqueur"],"Pantalones tequila, Cointreau, Grand Marnier, lemon, lime",["Sour"],3,4,false,14,"The Princess house margarita, poured fleet-wide. Worth calibrating against early.",true],["Pantalones Tequila Sunrise","omalleys","Signature",["Tequila"],"Pantalones Blanco, passionfruit, orange, grenadine",["Fruity","Sweet"],4,3,false,14,"The sunrise, upgraded with passionfruit.",true],["Classic Irish Coffee","omalleys","Coffee",["Whiskey"],"Jameson, coffee, whipped cream",["Coffee"],3,3,false,13,"The benchmark.",true],["Grace O'Malley's Irish Coffee","omalleys","Coffee",["Whiskey"],"Grace O'Malley's whiskey, coffee, whipped cream",["Coffee","Strong"],3,4,false,26,"The house whiskey version. Well above both caps.",true],["Sláinte Irish Coffee","omalleys","Coffee",["Whiskey"],"Sláinte Irish whiskey, coffee, whipped cream",["Coffee"],3,3,false,14,"Sláinte in place of Jameson.",true],["Sláinte Frozen Irish","omalleys","Coffee",["Whiskey","Liqueur"],"Sláinte Irish whiskey, coffee liqueur, fresh espresso, vanilla, cream, blended",["Coffee","Dessert"],4,3,true,15,"Frozen Irish coffee. Exactly at the Plus cap.",true],["Eye of the Storm","wheelhouse","Signature",["Rum"],"Dark rum, lime, demerara syrup, raspberries, ginger beer",["Fruity","Refreshing"],3,3,false,14,"Dark and stormy with raspberries in the weather.",true],["Sea Bottom","wheelhouse","Signature",["Rum"],"White rum, spiced rum, lime, orgeat, triple sec, blackberries",["Fruity","Sour"],3,4,false,14,"Two rums and blackberries. Looks like the deep.",true],["Over the Horizon","wheelhouse","Signature",["Tequila","Liqueur"],"Tequila, Aperol, lemon, pineapple, orgeat",["Bitter","Tropical"],3,3,false,15,"Aperol against pineapple and almond.",true],["Anchors Away","wheelhouse","Signature",["Bourbon","Liqueur"],"Bourbon, lemon, Licor 43, demerara syrup, walnut bitters",["Strong","Sweet"],3,4,false,15,"Vanilla and walnut over bourbon. The house drink here.",true],["Anne Bonny's Pearls","wheelhouse","Signature",["Rum"],"Bacardi 8, Fernet, lime, orgeat, lychee",["Bitter","Fruity"],3,4,false,17,"Fernet and lychee. Genuinely strange and it works.",true],["The Captain","wheelhouse","Signature",["Rum"],"Bacardi 8, butterscotch, salt, Angostura, orange bitters",["Sweet","Strong"],4,4,false,17,"Salted butterscotch rum, stirred.",true],["Fool's Gold","wheelhouse","Signature",["Gin","Liqueur"],"Empress gin, pamplemousse liqueur, lemon",["Sour","Refreshing"],2,4,false,20,"Three ingredients, colour-shifting gin, at the Premier ceiling.",true],["Dead Men Tell No Tales","wheelhouse","Signature",["Rum"],"Appleton rum, cherry heering, lime, coconut",["Fruity","Tropical"],4,4,false,16,"Cherry Heering and coconut over Jamaican rum.",true],["Ship In A Bottle","wheelhouse","Beyond",["Whiskey","Wine"],"Jack Daniel's Rye, port wine, coconut syrup, lemon, Angostura bitters, Earl Grey tea",["Strong","Sweet"],3,5,false,60,"Serves two, in a ship-shaped vessel. Not covered by either package.",true],["Revenge of the Kraken","wheelhouse","Beyond",["Tequila"],"Three tequila-based cocktails served in an octopus display",["Strong"],3,5,false,45,"Serves two. Theatre first, drink second. Not covered by either package.",true],["Dragon Fruit Refresher","wakeview","Signature",["Tequila","Liqueur"],"Reposado tequila, blue curaçao, lime, agave, dragon fruit",["Fruity","Refreshing"],3,3,false,12,"Bright and easy. A good first drink of the day.",true],["Seabreeze Spritz","wakeview","Spritz",["Vodka","Wine"],"Vodka, blue curaçao, soda, prosecco",["Refreshing"],3,2,false,12,"Low effort, low ABV, does the job on a hot deck.",true],["Blue Pineapple Margarita","wakeview","Margarita",["Tequila","Liqueur"],"Blanco tequila, pineapple, blue curaçao, lime",["Tropical","Sour"],3,3,false,12,"A margarita in an unreasonable colour.",true],["Sand Meets the Sea","wakeview","Signature",["Vodka","Liqueur"],"Vodka, lime, blue curaçao, ginger",["Refreshing","Sour"],3,3,false,14,"Layered so the blue sits under the pale top.",true],["Sunsets on the Ocean","wakeview","Signature",["Tequila"],"Blanco tequila, triple sec, peach schnapps, butterfly tea, orange, cranberry, lime",["Fruity","Sweet"],4,3,false,14,"Butterfly tea shifts the colour as it settles.",true],["Aperol Frosé","wakeview","Frozen",["Liqueur","Wine"],"Aperol, rosé wine, orange, strawberries",["Fruity","Refreshing"],4,2,true,15,"Frozen rosé with Aperol. The aft deck drink.",true],["Ocean Dreams","wakeview","Signature",["Rum","Liqueur"],"Malibu, triple sec, pineapple, lemon, lime",["Tropical","Sweet"],4,3,false,15,"Coconut rum and pineapple, shaken not blended.",true],["Driftwood","wakeview","Signature",["Rum","Liqueur"],"Zacapa, falernum, banana liqueur, passion fruit, pineapple, lime",["Tropical","Fruity"],4,4,false,17,"Zacapa gives it real depth under the fruit.",true],["Baileys Colada","wakeview","Frozen",["Liqueur"],"Baileys Colada, pineapple",["Dessert","Sweet"],5,2,true,17,"Fleet-wide frozen favourite. Available at most pool bars.",true],["Ocean Fog","wakeview","Signature",["Tequila","Liqueur"],"Patrón Silver, apricot liqueur, blue curaçao, lemon",["Sour","Fruity"],3,4,false,18,"Apricot and blue curaçao over Patrón.",true],["Blowfish","wakeview","Beyond",["Rum"],"Matusalem, passion fruit, lime, dragon fruit syrup",["Tropical","Strong"],4,4,false,22,"Listed as daring. Above both package caps.",true],["Dragon Fruit Mojito","seaview","Signature",["Rum"],"White rum, dragon fruit, agave, lime, mint, soda",["Refreshing","Fruity"],3,3,false,12,"Mojito with dragon fruit. Long and cold over the bow.",true],["Aperol Coconut Margarita","seaview","Margarita",["Tequila","Liqueur"],"Blanco tequila, Aperol, orange liqueur, lime, coconut, agave",["Bitter","Tropical"],3,3,false,14,"Aperol and coconut in a margarita. Odd combination, good drink.",true],["Spicy Mango Margarita","seaview","Margarita",["Tequila","Liqueur"],"Blanco tequila, orange liqueur, mango, serrano pepper",["Fruity","Strong"],3,4,false,14,"Genuinely hot. Ask them to go light if you would rather taste the mango.",true],["Under the Sea","seaview","Signature",["Gin"],"Gin, cherries, grenadine, pineapple, lime, Angostura bitters, soda",["Fruity","Refreshing"],4,3,false,14,"The house drink here. Tall, red, easy.",true],["Strawberries & Cream","seaview","Signature",["Tequila","Rum"],"Blanco tequila, Malibu rum, strawberries, coconut, agave",["Sweet","Dessert"],5,3,false,14,"Reads like a pudding, drinks lighter than expected.",true],["Carajillo","seaview","Coffee",["Liqueur"],"Licor 43, coffee liqueur, espresso, agave",["Coffee","Sweet"],4,3,false,15,"The Spanish original. Anchor of the Carajillo Collection.",true],["Peach Fresca","seaview","Signature",["Vodka"],"Grey Goose White Peach and Rosemary, lemon, honey, peach, ginger ale",["Fruity","Refreshing"],4,3,false,17,"Rosemary keeps the peach from going syrupy.",true],["Strawberry Fresca","seaview","Signature",["Vodka","Liqueur"],"Grey Goose Strawberry and Lemongrass, strawberry, limoncello, lemon, honey, soda",["Fruity","Sour"],4,3,false,17,"Limoncello sharpens the strawberry.",true],["Watermelon Fresca","seaview","Signature",["Vodka","Liqueur"],"Grey Goose Watermelon and Basil, elderflower, lemon, watermelon, mint",["Refreshing","Fruity"],3,3,false,17,"The most refreshing of the three Frescas.",true],["Empress Rose","seaview","Signature",["Gin","Wine"],"Empress gin, rosé wine, elderflower, lemon",["Fruity","Refreshing"],3,3,false,20,"Colour-shifting gin in a wine spritz. At the Premier ceiling.",true],["Truly Caliente Fresca","themix","Signature",["Tequila"],"Truly Strawberry Lemonade, blanco tequila, lime, jalapeños, mint",["Refreshing","Strong"],3,3,false,12,"Hard seltzer base with a chilli kick.",true],["Truly Pineapple & Coconut Daiquiri","themix","Signature",["Rum"],"Truly Hard Seltzer Pineapple, Malibu rum, coconut, orgeat",["Tropical","Sweet"],4,2,false,12,"Light, fizzy, low effort.",true],["Jungle Bird","themix","Classic",["Rum","Liqueur"],"White rum, dark rum, Campari, lime, pineapple",["Bitter","Tropical"],3,4,false,12,"The 1970s Kuala Lumpur classic. Best value on the standard menu.",true],["Land Ahoy","themix","Coffee",["Rum","Liqueur"],"Coconut rum, coffee liqueur, espresso, pineapple, coconut",["Coffee","Tropical"],4,3,false,14,"Espresso and pineapple. Better than it reads.",true],["Lychee Vodka Mojito","themix","Signature",["Vodka"],"Vodka, lychee, fresh mint, lime",["Refreshing","Fruity"],3,3,false,15,"Mojito structure, vodka base, lychee sweetness.",true],["Peanut Jungle Ball","themix","Signature",["Whiskey","Rum"],"Skrewball Peanut Butter whisky, Campari, falernum, orgeat, lemon, lime, dark rum float",["Bitter","Sweet"],4,4,false,15,"Peanut butter whisky and Campari. Order it once, for research.",true],["State Fair","themix","Signature",["Vodka","Gin"],"Absolut Citron, Hendrick's, peach schnapps, lime, cranberry",["Fruity","Sour"],3,4,false,16,"Vodka and gin together, peach and cranberry over the top.",true],["I Can't Feel the Rain","themix","Signature",["Vodka"],"Vodka, peach, pineapple, lemon, honey",["Fruity","Sweet"],4,3,false,15,"Soft, honeyed, uncomplicated.",true],["Aperol-Colada","themix","Signature",["Rum","Liqueur"],"Malibu, Aperol, pineapple, coconut, lime, orgeat",["Bitter","Tropical"],4,3,false,17,"A piña colada with Aperol bitterness cutting through.",true],["Passion Tree","themix","Signature",["Vodka","Wine"],"Absolut Vanilla, Passoã liqueur, passion fruit, lemon, prosecco",["Fruity","Sweet"],4,3,false,18,"Pornstar martini architecture with prosecco on top.",true],["Frosé","themix","Frozen",["Vodka","Wine"],"Vodka, rosé wine, strawberry, pear, grenadine",["Fruity","Refreshing"],4,2,true,15,"Frozen rosé. On the Star this is made with Hampton Water.",true],["Twisted Dirty Banana","themix","Frozen",["Liqueur"],"Chocolate liqueur, Frangelico, Disaronno amaretto, banana",["Dessert","Sweet"],5,3,true,18,"The blended one Princess advertises. Pure pudding.",true],["Guava Margarita","themix","Margarita",["Tequila","Liqueur"],"Blanco tequila, orange liqueur, lime, guava",["Fruity","Sour"],3,3,false,14,"Guava does the sweetening.",true],["Coconut Margarita","themix","Margarita",["Tequila","Liqueur"],"Blanco tequila, triple sec, lime, coconut",["Tropical","Sour"],3,3,false,15,"Coconut cream over a standard margarita build.",true],["Grilled Pineapple Margarita","themix","Margarita",["Tequila","Liqueur"],"Patrón Silver, Cointreau, lime, pineapple, agave",["Tropical","Sour"],3,4,false,17,"Grilled pineapple gives it smoke. The best margarita on the standard list.",true],["Gina Colada","themix","Mocktail",[],"Tanqueray Sevilla 0.0, lemon, pineapple, coconut, orgeat",["Tropical","Sweet"],4,0,false,15,"Non-alcoholic piña colada using zero-proof gin.",true],["The Levant","themix","Mocktail",[],"Tanqueray Sevilla 0.0, lemon, orange marmalade, honey, ginger ale",["Refreshing","Sweet"],4,0,false,15,"Marmalade and ginger. The better of the two mocktails.",true],["Murasaki Margarita","makoto","Margarita",["Tequila"],"Pantalones Blanco tequila, lime, Japanese plum syrup, umeboshi",["Sour","Fruity"],3,3,false,14,"Umeboshi brings salt and sourness. Sharp.",true],["Nagoya Negroni","makoto","Classic",["Gin"],"Sencha and matcha infused Roku gin, Campari, Bermutto sweet sake vermouth",["Bitter","Strong"],2,4,false,15,"A Negroni rebuilt entirely with Japanese components.",true],["Dansu","makoto","Signature",["Tequila"],"Pantalones Reposado, junmai sake, fresh citrus, spicy togarashi syrup",["Strong","Sour"],2,4,false,18,"Togarashi heat against sake. The most interesting drink here.",true],["Makoto Gin & Tonic","makoto","Signature",["Gin"],"Roku gin, Indian tonic, yuzu bitters, shiso, cucumber, watermelon radish",["Refreshing","Bitter"],1,3,false,20,"Reported as one of the best gin and tonics at sea. At the Premier ceiling.",true],["Kodai No Hana","makoto","Signature",["Vodka"],"Haku vodka, junmai ginjo sake, fresh citrus, coconut",["Refreshing","Sweet"],3,3,false,20,"Rice vodka and ginjo sake, softened with coconut.",true],["Coffee Nichibotsu","makoto","Coffee",["Whiskey","Liqueur"],"Akashi White Oak, Jameson Stout Edition, amaro, Mr Black cold brew",["Coffee","Strong"],3,5,false,22,"Japanese whisky and cold brew. Above both caps.",true],["Full of Seoul","umai","Signature",["Liqueur"],"Soju, coconut, lemon, peach, angostura bitters",["Fruity","Sweet"],4,2,false,14,"Soju base, easy drinking, disappears fast.",true],["Umai Pink","umai","Signature",["Rum"],"Bacardi white rum, lime, agave, strawberries",["Fruity","Sweet"],4,3,false,14,"On the sweet side. Works better with dessert than with the meal.",true],["Biiru","umai","Signature",["Beer"],"Asahi beer, tomato juice, soy, lime, yuzu ponzu, togarashi spice",["Bitter","Refreshing"],1,2,false,15,"A Japanese michelada. Savoury and unusual.",true],["Green Pea Soup","umai","Signature",["Tequila","Mezcal"],"Patrón Silver, Ilegal aged mezcal, green pea juice, ginger, lemon",["Strong","Refreshing"],2,4,false,15,"Yes, green pea juice. Order it and find out.",true],["Singapore Fling","umai","Signature",["Gin"],"Roku gin, cherry, Cointreau, lychee, pineapple, basil",["Fruity","Tropical"],4,4,false,19,"A Singapore Sling with lychee and basil.",true],["Negroni","sabatinis","Classic",["Gin","Liqueur"],"Gin, Campari, sweet vermouth",["Bitter","Strong"],2,5,false,11,"The classic, and the cheapest serious drink on the ship.",true],["Americano","sabatinis","Classic",["Liqueur"],"Campari, sweet vermouth, club soda",["Bitter","Refreshing"],2,2,false,11,"The Negroni's lower-ABV ancestor.",true],["Aperol Spritz","sabatinis","Spritz",["Liqueur","Wine"],"Aperol, prosecco, soda",["Bitter","Refreshing"],3,2,false,11,"Available across the ship. This is the reference price.",true],["Hugo Spritz","sabatinis","Spritz",["Liqueur","Wine"],"St Germain elderflower liqueur, lime, prosecco, soda",["Refreshing","Sweet"],3,2,false,11,"Elderflower instead of Aperol. Lighter and less bitter.",true],["Limoncello Spritz","sabatinis","Spritz",["Liqueur","Wine"],"Villa Massa limoncello, prosecco, mint, Betty Buzz Meyer lemon",["Sour","Refreshing"],3,2,false,14,"The sharpest of the spritz set.",true],["Toscana","sabatinis","Signature",["Liqueur","Wine"],"Limoncello, cantaloupe melon, orange blossom, Frescobaldi Classico Brut",["Fruity","Refreshing"],4,2,false,14,"Melon and orange blossom. Very Tuscan summer.",true],["Sienna","sabatinis","Signature",["Liqueur","Wine"],"Aperol, Frescobaldi Classico Rosé Brut, Nipozzano syrup, lemon, sparkling grapefruit",["Bitter","Sour"],3,2,false,14,"Grapefruit and Aperol on a rosé sparkling base.",true],["Perano","sabatinis","Signature",["Vodka","Liqueur"],"Meili vodka, limoncello, peach, honey, yogurt",["Sweet","Dessert"],4,3,false,18,"Yogurt gives it body. Closer to a dessert than an aperitivo.",true],["Chianti Sangria","sabatinis","Signature",["Wine","Liqueur"],"Frescobaldi Chianti Classico, Campari, limoncello, fruits, sparkling lemon lime",["Fruity","Bitter"],3,3,false,18,"Sangria with a real Chianti and Campari underneath.",true],["Bolgheri","sabatinis","Coffee",["Brandy","Liqueur"],"Alexander grappa, coffee liqueur, hazelnut, brown sugar, fresh espresso",["Coffee","Dessert"],4,4,false,16,"Grappa and espresso. The proper end to the meal.",true],["Strawberry Love Potion","britto","Signature",["Tequila","Liqueur"],"Pantalones Blanco, Tequila Rose, Disaronno amaretto, Chambord, strawberries",["Sweet","Dessert"],5,3,false,12,"Very sweet, very pink. Good with dessert.",true],["Chocolate Royale","britto","Dessert",["Rum","Liqueur"],"Bacardi 8 rum, dark crème de cacao, Licor 43, coconut, espresso",["Dessert","Coffee"],5,3,false,14,"Chocolate, coconut and espresso over aged rum.",true],["Espresso My Love","britto","Coffee",["Whiskey","Liqueur"],"Sláinte Irish whiskey, OM chocolate liqueur, Disaronno amaretto, demerara, chocolate bitters, espresso",["Coffee","Dessert"],4,4,false,15,"The espresso martini of the room. Exactly at the Plus cap.",true],["Britto Coupe","britto","Signature",["Vodka","Liqueur"],"Grey Goose Strawberry and Lemongrass, Aperol, Cointreau, lime, strawberries",["Fruity","Bitter"],3,3,false,15,"Aperol keeps the strawberry honest.",true],["Heart of Glass","britto","Signature",["Vodka","Wine"],"Rosemary-infused Meili vodka, peach schnapps, raspberry, gold dust, Romero Britto prosecco",["Fruity","Sweet"],4,3,false,19,"Actual gold dust. Entirely the point of the room.",true],["Britto Watermelon","britto","Signature",["Vodka","Wine"],"Grey Goose Watermelon, Muyu Jasmine Verte, watermelon, lemon, Hampton Water rosé",["Refreshing","Fruity"],3,3,false,20,"At the Premier ceiling. The most drinkable of the list.",true],["Bubble Bath of Love","britto","Beyond",["Tequila","Liqueur"],"Don Julio 1942, Grand Marnier, lime, strawberry, jalapeños",["Strong","Fruity"],3,5,false,55,"Don Julio 1942 in a cocktail. Not covered by either package.",true],["Signature Tiramisu","bellinis","Dessert",["Liqueur"],"Menu not published. Part of the Tiramisu Collection.",["Dessert","Coffee"],4,3,false,null,"Repeatedly called the standout at Bellini's. Confirm the exact build onboard.",false],["Aperol Spritz (Bellini's)","bellinis","Spritz",["Liqueur","Wine"],"Aperol, prosecco, soda",["Bitter","Refreshing"],3,2,false,11,"Same build as Sabatini's. Listed here as a Bellini's staple.",false],["Limoncello Spritz (Bellini's)","bellinis","Spritz",["Liqueur","Wine"],"Limoncello, prosecco, mint",["Sour","Refreshing"],3,2,false,14,"Listed as a Bellini's staple on the Sphere-class menu.",false],["Peach Bellini","bellinis","Spritz",["Wine"],"Peach purée, prosecco",["Fruity","Sweet"],4,2,false,null,"The drink the bar is named after. Price not published.",false],["Escape from Houdini's Chest","spellbound","Signature",["Unknown"],"Menu not machine-readable. Photographed onboard, ingredients not legible.",["Strong"],3,4,false,null,"The signature theatrical serve. Named in multiple trip reports.",false],["Artemis","spellbound","Signature",["Unknown"],"Menu not machine-readable. Served in an owl glass.",["Strong"],3,4,false,null,"Served in a ceramic owl. Confirm the build at the Parlor Bar.",false],["Houdini's Escape","spellbound","Signature",["Unknown"],"Menu not machine-readable.",["Strong"],3,4,false,null,"Named separately in one review. May be the same drink as Escape from Houdini's Chest.",false],["Lilypad","cascade","Signature",["Gin"],"Olive oil washed gin, remaining build not published",["Refreshing"],2,4,false,null,"Fat-washed gin. The reason to make the trip up to the Dome.",false],["Flowers in Bloom","cascade","Signature",["Unknown"],"Menu not machine-readable.",["Refreshing"],3,3,false,null,"Named on the Sphere-class Cascade menu.",false],["Indigo Oasis","princesslive","Signature",["Unknown"],"Menu not machine-readable.",["Fruity"],3,3,false,null,"Photographed at Princess Live!. Confirm the build.",false],["Spiced Negroni","princesslive","Classic",["Gin","Liqueur"],"Gin, Campari, sweet vermouth, spice. Exact build not published.",["Bitter","Strong"],2,5,false,null,"Called out as a Princess Live! favourite.",false],["Sunset on Ice","sanctuary","Spritz",["Wine"],"Prosecco-based. Full build not published.",["Refreshing","Fruity"],3,2,false,null,"Sanctuary Club only. Requires Sanctuary Collection access.",false],["Caribbean Punch","sanctuary","Signature",["Rum"],"Rum punch. Full build not published.",["Tropical","Sweet"],4,3,false,null,"Sanctuary Club only. Requires Sanctuary Collection access.",false],["Fresh Ginger Mojito","catch","Signature",["Rum"],"White rum, fresh ginger, lime, mint, soda. Exact build not published.",["Refreshing","Fruity"],3,3,false,null,"Photographed at The Catch. The rest of the list is not published.",false],["Coffee and Donuts Milkshake","americana","Mocktail",[],"Tiramisu ice cream, espresso, milk, sugar donut on top",["Coffee","Dessert"],5,0,false,0,"Included in the fare. Alcohol-free. A liquid breakfast.",false],["Painkiller","wheelhouse","Signature",["Rum"],"Dark rum, pineapple, orange, coconut cream, nutmeg",["Tropical","Sweet"],4,4,false,null,"On the Star Princess Wheelhouse menu. May have rotated onto Sun by October.",false],["Mango Mai Tai","wheelhouse","Signature",["Rum"],"Rum, mango, orgeat, lime, orange liqueur",["Tropical","Sour"],4,4,false,null,"On the Star Princess Wheelhouse menu. May have rotated onto Sun by October.",false],["Peanut Butter and Jelly Carajillo","seaview","Coffee",["Liqueur"],"Part of the Carajillo Collection. Full build not published.",["Coffee","Dessert"],4,3,false,null,"Named on the Sphere-class Sea View menu.",false],["Espresso","coffeecurrents","Coffee",[],"Lavazza espresso",["Coffee","Bitter"],1,0,false,3,"Included in both packages. Also at the International Café and Coffee and Cones.",true],["Cappuccino","coffeecurrents","Coffee",[],"Lavazza espresso, steamed milk",["Coffee"],2,0,false,4,"Included in both packages.",true],["Caffè Latte","coffeecurrents","Coffee",[],"Lavazza espresso, milk",["Coffee"],2,0,false,4,"Included in both packages.",true],["Mocha","coffeecurrents","Coffee",[],"Lavazza espresso, chocolate, milk",["Coffee","Sweet"],4,0,false,4,"Included in both packages.",true],["Macchiato","coffeecurrents","Coffee",[],"Lavazza espresso, milk foam",["Coffee","Bitter"],1,0,false,4,"Included in both packages.",true],["Orange Granita","coffeecones","Mocktail",[],"Frozen orange",["Sweet","Fruity"],5,0,true,null,"Extra charge. One reviewer found it too sweet.",false]];

// Wine rows: [name, colour, price]
export type WineRow = [string,string,number];
export const WINES: WineRow[] = [["Prosecco","Sparkling",11],["Villa Sandi 'Romero Britto Princess Love' Prosecco","Sparkling",11],["Piper Heidsieck Champagne","Champagne",15],["Moscato","White",10],["Sauvignon Blanc","White",11],["Chardonnay","White",10],["Pinot Grigio","White",12],["Riesling","White",12],["Rosé","Rosé",11],["Pinot Noir","Red",11],["Merlot","Red",11],["Cabernet Sauvignon","Red",11],["Red Blend","Red",13],["Emmolo Sauvignon Blanc","White",17],["Flowers Chardonnay","White",18],["Chateau d'Esclans 'Whispering Angel' Rosé","Rosé",16],["Sea Sun Pinot Noir","Red",17],["Bonanza Cabernet Sauvignon by Caymus","Red",17],["Melorosa Red Blend by Jason Aldean","Red",18],["M. Haslinger & Fils Champagne","Champagne",20],["Beau Joie Brut Champagne","Champagne",20]];

// Beer rows: [name, price]
export type BeerRow = [string,number];
export const BEERS: BeerRow[] = [["Budweiser",7],["Bud Light",7],["Coors Light",7],["Miller Lite",7],["Michelob Ultra",7.5],["Heineken",7],["Heineken Light",7],["Heineken Silver",7],["Heineken 0.0",7],["Stella Artois",7],["Corona Extra",7.5],["Dos Equis",7],["Red Stripe",7.5],["Peroni Nastro Azzurro",7.5],["Lagunitas IPA",7.5],["Blue Moon Belgian White",7],["Guinness Stout",7.5],["Samuel Adams Boston Lager",8],["Asahi",8],["Sapporo",8],["Foster's Oil Can",10],["Angry Orchard Cider",7.5],["Strongbow Cider",7.5],["Truly Hard Seltzer",7.5],["Heineken (draft)",9],["Affligem (draft)",9],["Strongbow Cider (draft)",9]];
