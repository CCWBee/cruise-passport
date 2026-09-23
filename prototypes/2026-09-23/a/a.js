// ---- data (generated from src/data/raw.ts, glassByDrink.ts, emblems-data.ts and the ?seed block; do not hand-edit) ----
const DATA = {
  days: ["2026-10-03","2026-10-04","2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-10","2026-10-11","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-17"],
  deckLabels: {"15":"15/16"},
  // [key, name, deck, type, hours, blurb, shares]
  venues: [
    ["goodspirits","Good Spirits at Sea",7,"Bar","4pm to late","Rob Floyd's globe-trotting cocktail room, tucked round the corner from the forward lifts. Nightly show-bar demos: times are in the Patter.",""],
    ["omalleys","O'Malley's Irish Pub",7,"Pub","1pm (sea) / 4pm (port) to late","Proper Dublin-pub energy with live music. Grace O'Malley and Sláinte Irish whiskey, Pantalones tequila, and cocktails on tap by the pitcher.",""],
    ["princesslive","Princess Live!",7,"Lounge","4pm to late","Game shows, trivia, comedy and live music, with a bar running classic cocktails alongside the Love Line.",""],
    ["bellinis","Bellini's Cocktail Bar",7,"Bar","7am to late","The main Piazza bar, built around Italian spirits: spritzes, prosecco cocktails and the Tiramisu Collection.",""],
    ["coffeecurrents","Coffee Currents",7,"Café","6am to late","Second Piazza coffee shop. Same espresso menu as the International Café but with more seating and ocean views.",""],
    ["wheelhouse","Wheelhouse Bar",7,"Bar","4pm to late","Nautical, quiet, out of the way of the Piazza. Board games behind the bar and two absurd shared 'experiential' pours.",""],
    ["catch","The Catch by Rudi",7,"Restaurant","Dinner","Rudi Sodamin's seafood restaurant, with its own short list of cocktails built for the food.",""],
    ["crowngrill","Crown Grill",7,"Restaurant","Dinner","The steakhouse. Wine-led rather than cocktail-led: a deep Caymus and Wagner Family list.","crooners"],
    ["butchers","The Butcher's Block by Dario",7,"Restaurant","Dinner","Dario Cecchini's Tuscan family-style meat feast, with a matched Italian beverage list.","sabatinis"],
    ["spellbound","Spellbound by Magic Castle",8,"Experience","From 6pm, ticketed","Victorian rooms behind an unmarked door, close-up magic at the Parlor Bar, and the most theatrical drinks on the ship. Cover charge applies.",""],
    ["crooners","Crooners",8,"Bar","11am to late","Martini and piano bar under the Sphere window. The deepest cocktail list on board and the best sunset seat.",""],
    ["makoto","Makoto Ocean",8,"Restaurant","Lunch & dinner","Sushi with a Japanese-spirit bar: Roku, Haku, sake, shochu and Japanese whisky.",""],
    ["umai","Umai Teppanyaki",8,"Restaurant","Dinner","Teppanyaki and hot pot, with five cocktails made only here.",""],
    ["sabatinis","Sabatini's Italian Trattoria",8,"Restaurant","Dinner","Frescobaldi partnership: iconic Italian cocktails, prosecco spritzes and five wine-inspired signatures.",""],
    ["wakeview","Wake View Bar",8,"Pool bar","10am to 8pm","Aft infinity pool with the wake behind it. Yacht-club drinks list. Get there around 4pm for the seat you want.",""],
    ["alfredos","Alfredo's Pizzeria",9,"Restaurant","Lunch & dinner","Sit-down pizza with an Italian-leaning drinks list.","sabatinis"],
    ["intlcafe","International Café",9,"Café","24 hours","Open all night. Espresso, premium teas, spirited coffees and the standard bar menu.","coffeecurrents"],
    ["promenade","Promenade Bar",9,"Pool bar","11am to 6pm","Port and starboard bars on the new outdoor promenade, running the standard menu.","themix"],
    ["americana","Americana Diner",9,"Restaurant","All day","Diner shakes and floats, included in the fare.",""],
    ["suitelounge","Signature Suite Lounge",15,"Lounge","All day","Two-storey lounge for Signature and Sanctuary Collection guests.","themix"],
    ["seaview","Sea View Bar",17,"Pool bar","10am to 6pm","Forward of the Dome, over the bow. Maritime cocktails and the Carajillo coffee collection. Free to all guests.",""],
    ["cascade","Cascade Bar",17,"Bar","Limited evenings","Inside the Dome beside the indoor waterfall. Short, odd, good list. Often shut for show rehearsals.",""],
    ["lido","Lido Bar",17,"Pool bar","11am to 10:30pm","Walk-up bar serving Lido Eats. Standard menu, no dedicated seating.","themix"],
    ["themix","THE MIX",17,"Pool bar","11am to 6pm","Aft end of the main pool deck, starboard. Standard menu with the mixologists who actually enjoy it.",""],
    ["coffeecones","Coffee and Cones",17,"Café","Daytime","Espresso, granitas and free soft serve aft on Deck 17, portside. Premium desserts cost extra.","coffeecurrents"],
    ["britto","Love by Britto",17,"Experience","Dinner, ticketed","Romero Britto dining experience with its own sparkling wine and a love-themed cocktail list.",""],
    ["sunbar","Sun Bar",18,"Pool bar","9am to 10pm","Deck 18 sundeck and whirlpools. Starboard side is the outdoor smoking section.","themix"],
    ["sanctuary","Sanctuary Club Bar",18,"Pool bar","8am to 5pm","Aft adults-only retreat for Sanctuary Collection guests. Own pool, own bar.",""]
  ],
  // [id, name, venue, category, spirits, ingredients, flavours, sweet, strength, frozen, price, desc, verified, glass]
  drinks: [
    ["d0","Gin & Tonic Ultima","goodspirits","Signature","Gin","Hendrick's gin, lime wheel, lemon peel, juniper, tonic","Refreshing|Bitter",1,3,0,null,"Barcelona. A deconstructed G and T built on fresh herbs and market flavours.",1,"highball"],
    ["d1","Azul Blanco","goodspirits","Signature","Tequila","Silver tequila, lime, blue curaçao, pineapple, elderflower foam","Tropical|Sweet",4,3,0,null,"Curaçao. Blue body under a white elderflower foam: clouds meeting the sea.",1,"margarita"],
    ["d2","Grappa Peach","goodspirits","Signature","Brandy|Liqueur","Grappa, lemon, honey, peach schnapps, prosecco","Fruity|Sweet",4,3,0,null,"Uruguay. Grappa with honey, then peach and prosecco on top.",1,"flute"],
    ["d3","Bangkok Mule","goodspirits","Signature","Whiskey","Whiskey, basil, lemongrass and ginger syrup, lime, ginger beer","Refreshing|Sour",3,3,0,null,"Thailand. Herbs and fresh ginger against whiskey.",1,"highball"],
    ["d4","Apples Delight","goodspirits","Signature","Brandy|Wine","Calvados, lemon, honey syrup, St Germain, apples, port","Fruity|Sweet",4,3,0,null,"Madeira. Calvados and fresh Madeiran apples, for courage before the toboggan run.",1,"cocktail"],
    ["d5","Sandia en Fuego","goodspirits","Signature","Tequila","Don Julio Reposado, serrano pepper, watermelon, lime, agave","Fruity|Strong",3,4,0,null,"Yucatán. Chilli heat over watermelon: you will smile at the first sip.",1,"margarita"],
    ["d6","The Great Pumpkin","goodspirits","Signature","Rum","Bacardi 8, aquafaba, pumpkin syrup, cinnamon, nutmeg, lemon","Sweet|Dessert",4,3,0,null,"St Lucia. Castries market in a glass: rum, pumpkin, cinnamon, nutmeg.",1,"rocks"],
    ["d7","Vanilla Sky","goodspirits","Signature","Vodka","Vanilla vodka, triple sec, fresh pineapple, orgeat, lime, agave","Tropical|Sweet",4,3,0,null,"Tahiti. Pineapple for hospitality, vanilla for the myth.",1,"cocktail"],
    ["d8","The Cartagena Cool","goodspirits","Signature","Rum","Appleton rum, cinnamon, orange and chocolate bitters, orange peel","Bitter|Strong",2,4,0,null,"Cartagena. Chocolate, nutmeg and cinnamon wound through a serious rum.",1,"rocks"],
    ["d9","Coco-Cafe","goodspirits","Coffee","Rum","Gosling rum, Lavazza espresso, coconut cream, kosher salt, grated nutmeg and chocolate","Coffee|Sweet",3,3,0,null,"Dominican Republic. Arabica arrived in 1715 and never left.",1,"cup"],
    ["d10","Aperitivo Roma","goodspirits","Signature","Liqueur|Whiskey","Limoncello, Aperol, Canadian whiskey, bitters, mint","Bitter|Refreshing",3,3,0,null,"Rome. Limoncello zing against Aperol sweetness.",1,"rocks"],
    ["d11","Barbados Swizzler","goodspirits","Signature","Rum","Bacardi light rum, Bacardi dark rum, grapefruit, agave, velvet falernum, bitters","Sour|Tropical",3,4,0,null,"Barbados. Rum and grapefruit, both native to the island.",1,"highball"],
    ["d12","Key Lime Martini","goodspirits","Martini","Whiskey","Whiskey, agave, lime, Cointreau, vanilla, condensed milk, pineapple, graham cracker and cinnamon rim, elderflower foam","Dessert|Sweet",5,3,0,null,"Key West. Dessert in a glass, with bourbon depth underneath.",1,"cocktail"],
    ["d13","Mykonos Press","goodspirits","Signature","Liqueur|Gin","Ouzo, Hendrick's gin, lemon, simple syrup, soda, lime, grenadine","Refreshing|Sour",3,3,0,null,"Mykonos. Liquorice notes folded into fresh lemon.",1,"highball"],
    ["d14","Pastis Pearl","goodspirits","Signature","Gin|Liqueur","Hendrick's gin, pastis, lemon, simple syrup, aquafaba","Refreshing|Sour",2,3,0,null,"Marseille. Mediterranean anise and Provençal herbs with citrus.",1,"cocktail"],
    ["d15","Saint Petersburg Mule","goodspirits","Signature","Vodka","Vodka, lemon, honey syrup, apple juice, ginger beer","Refreshing|Fruity",3,3,0,null,"Ginger warmth over apple and honey. The spirit came out of Mendeleev's chemistry.",1,"highball"],
    ["d16","Starry Night in Oslo","goodspirits","Signature","Liqueur","Aquavit, black charcoal tea, lemon, agave, fresh ginger","Strong|Refreshing",2,4,0,null,"Black with a gold shimmer, for the long Norwegian winter nights.",1,"cocktail"],
    ["d17","Butterfly","goodspirits","Cocktail Magic","Gin","Gin, lemon, Cointreau, simple syrup, butterfly tea","Refreshing|Sour",3,3,0,null,"Changes colour and flavour in front of you. Science or myth, take your pick.",1,"cocktail"],
    ["d18","Loch Ness Martini","goodspirits","Cocktail Magic","Gin|Scotch","Hendrick's gin, lime, agave, Cointreau, cucumber, salt","Refreshing|Strong",2,4,0,null,"A hint of Scotch, but flavoured gin is the real star. Medieval and New Town in one glass.",1,"cocktail"],
    ["d19","Classic Cosmo","crooners","Martini","Vodka|Liqueur","Vodka, orange liqueur, cranberry, lime","Sour|Fruity",3,3,0,11,"The standard, done properly.",1,"cocktail"],
    ["d20","French Martini","crooners","Martini","Vodka|Liqueur","Vodka, black raspberry liqueur, pineapple","Fruity|Sweet",4,3,0,11,"Chambord and pineapple, foamed on top.",1,"cocktail"],
    ["d21","Blackberry Thicket","crooners","Signature","Gin","Gin, lemon, basil, blackberry","Fruity|Sour",3,3,0,12,"Bramble territory, with basil instead of mint.",1,"cocktail"],
    ["d22","Crooners Signature 007","crooners","Martini","Vodka|Gin","Vodka or gin, olive brine","Strong",1,5,0,14,"The dirty martini. Shaken, not stirred, if you insist.",1,"cocktail"],
    ["d23","Figs & Honey","crooners","Signature","Vodka","Vodka, lemon, honey thyme syrup, fig jam","Sweet|Fruity",4,3,0,14,"Jam-forward and herbal.",1,"cocktail"],
    ["d24","Clover Club","crooners","Classic","Gin|Liqueur","Gin, Chambord, lemon, raspberry, agave","Fruity|Sour",3,3,0,14,"Pre-Prohibition Philadelphia, still holding up.",1,"cocktail"],
    ["d25","Rum Brulee","crooners","Dessert","Rum","Jamaican rum, crème de cacao, banana, Angostura bitters","Dessert|Sweet",4,3,0,14,"Banana and cacao over funky Jamaican rum.",1,"rocks"],
    ["d26","Cask and Coco","crooners","Dessert","Whiskey|Liqueur","Irish whiskey, Licor 43, crème de cacao","Dessert|Sweet",4,3,0,14,"Vanilla, chocolate, Irish whiskey.",1,"rocks"],
    ["d27","Ferrero","crooners","Dessert","Vodka|Liqueur","Vanilla vodka, chocolate liqueur, Irish cream, Frangelico","Dessert|Sweet",5,3,0,15,"Named after exactly what you think.",1,"rocks"],
    ["d28","Chairman of the Board","crooners","Martini","Vodka|Gin","Grey Goose vodka, Tanqueray gin, Cointreau, orange bitters","Strong",1,5,0,16,"Vodka and gin together. Sinatra's title, and a serious drink.",1,"cocktail"],
    ["d29","Negroni Bianco","crooners","Classic","Gin|Liqueur","Tanqueray, Italicus, dry vermouth, grapefruit bitters","Bitter|Strong",2,4,0,16,"The white Negroni: bergamot instead of Campari.",1,"rocks"],
    ["d30","Lavender Smoke","crooners","Signature","Mezcal|Gin","Ilegal Mezcal Reposado, Empress gin, lime, lavender, orgeat","Strong|Sour",3,4,0,17,"Smoke, florals and almond. One of the best on board.",1,"cocktail"],
    ["d31","Vintage Sidecar","crooners","Classic","Cognac|Liqueur","Hennessy VS, Cointreau, lemon, demerara syrup","Sour|Strong",2,4,0,17,"The classic, with demerara rounding the edges.",1,"cocktail"],
    ["d32","The White Lady","crooners","Classic","Gin|Liqueur","Chamomile-infused gin, Grand Marnier, lemon, orange, thyme","Sour|Refreshing",2,4,0,18,"Chamomile infusion turns a stiff classic gentle.",1,"cocktail"],
    ["d33","Carajillo Old Fashioned","crooners","Coffee","Rum|Bourbon","Bacardi 8, Jack Daniel's, Harvey's Bristol Cream, coffee tincture","Coffee|Strong",3,4,0,18,"Old fashioned architecture, carajillo soul.",1,"rocks"],
    ["d34","Elixir of the Night","crooners","Classic","Whiskey","Woodford Reserve Rye, sweet vermouth, Averna, Angostura bitters, Pernod","Bitter|Strong",2,5,0,18,"A stirred, brooding rye drink. Very little sugar.",1,"rocks"],
    ["d35","Brooklyn Nights","crooners","Classic","Whiskey","Woodford Reserve Rye, sweet vermouth, maraschino, orange bitters","Bitter|Strong",2,5,0,18,"The Brooklyn: Manhattan's less famous, sharper cousin.",1,"cocktail"],
    ["d36","Irish Tails","crooners","Coffee","Vodka|Liqueur","Absolut Vanilla, Amarula coffee liqueur, cold brew, Guinness reduction","Coffee|Dessert",3,3,0,18,"Cold brew with a Guinness reduction float.",1,"highball"],
    ["d37","Sailing Through the Orchids","crooners","Signature","Vodka|Gin","Grey Goose La Poire, elderflower, Empress gin, Cointreau, lemon, yuzu bitters","Fruity|Refreshing",3,4,0,19,"Pear, elderflower and yuzu. Colour-shifting from the Empress gin.",1,"cocktail"],
    ["d38","Violette Haze","crooners","Signature","Gin","Hendrick's, crème de violette, lemon, cucumber","Refreshing|Sour",3,4,0,19,"Violet and cucumber. Looks like the sky at dusk.",1,"cocktail"],
    ["d39","Whispers of Lapsang","crooners","Signature","Bourbon|Rum","Chamomile-infused bourbon, Bacardi 8, lemon, lapsang, honey, Angostura bitters","Strong|Bitter",3,4,0,19,"Smoked tea and honey against bourbon.",1,"rocks"],
    ["d40","The Rose","crooners","Signature","Vodka","Absolut Elyx, lemon, strawberry","Fruity|Sour",3,4,0,20,"Simple, expensive and very good. Right at the Premier ceiling.",1,"cocktail"],
    ["d41","The Lux Classic","crooners","Beyond","Gin","Tanqueray 10, dry vermouth, orange bitters, caviar","Strong",1,5,0,35,"A martini served with caviar. Above both package caps.",1,"cocktail"],
    ["d42","Clover Breeze","omalleys","Signature","Vodka","Absolut vodka shaken with lavender, lemon and melon","Fruity|Refreshing",3,3,0,13,"Light and floral, the outlier on a whiskey-heavy list.",1,"cocktail"],
    ["d43","Passion of the Irish","omalleys","Signature","Whiskey","Sláinte Irish whiskey, Galliano, passionfruit, orange, vanilla, soda","Fruity|Sweet",4,3,0,15,"Sláinte whiskey given a tropical turn.",1,"highball"],
    ["d44","Tropical Alibi","omalleys","Signature","Whiskey","Sláinte Irish whiskey, banana liqueur, coconut milk, pineapple, lime, Angostura bitters","Tropical|Sweet",4,3,0,15,"Irish whiskey doing a piña colada impression, and getting away with it.",1,"hurricane"],
    ["d45","Filthy Molly","omalleys","Signature","Whiskey","Sláinte Irish whiskey, Filthy Bloody Mary mix, Filthy olives, celery salt","Bitter|Strong",1,4,0,17,"A whiskey Bloody Mary. Order it at lunch.",1,"highball"],
    ["d46","Fiery High Ball","omalleys","Signature","Whiskey","Sláinte Irish whiskey, spiced pineapple syrup, fresh ginger, lemon, soda","Refreshing|Fruity",3,3,0,18,"Ginger heat and spiced pineapple, long and cold.",1,"highball"],
    ["d47","Kenmare's Kiss","omalleys","Signature","Vodka","Absolut Elyx shaken with lychee, guava, mint and lemon","Fruity|Refreshing",4,3,0,18,"Lychee and guava. Nothing Irish about it, and nobody minds.",1,"cocktail"],
    ["d48","The Golden Gorse","omalleys","Signature","Gin","Beefeater gin shaken with St Germain, lemon and lavender, topped with seltzer","Refreshing|Sour",3,3,0,13,"Elderflower and lavender, long over ice.",1,"highball"],
    ["d49","Pair of Queens","omalleys","Signature","Gin","Beefeater gin shaken with velvet falernum, pineapple, lime and orgeat","Tropical|Sour",3,3,0,13,"Falernum and orgeat: tiki construction on a gin base.",1,"cocktail"],
    ["d50","Howth Castle","omalleys","Coffee","Whiskey","Jameson Irish whiskey, black coffee and cream","Coffee",2,3,0,13,"Stripped-back Irish coffee, no sugar hiding anything.",1,"cup"],
    ["d51","Under the Mango Tree","omalleys","Signature","Whiskey","Jameson Irish whiskey shaken with mango, lemon and mint","Fruity|Refreshing",3,3,0,13,"Mango and mint over Jameson.",1,"rocks"],
    ["d52","Flanna's Elixir","omalleys","Signature","Whiskey","Jameson Black Barrel shaken with ginger, lemongrass, Drambuie and lemon","Refreshing|Strong",3,4,0,15,"Drambuie and lemongrass. More complex than it sounds.",1,"cocktail"],
    ["d53","Irish Time","omalleys","Signature","Whiskey","Redbreast 15 gently stirred with salted caramel and bitters","Sweet|Strong",4,5,0,19,"Redbreast 15 with salted caramel. Stirred, no citrus.",1,"rocks"],
    ["d54","Black Oak","omalleys","Coffee","Whiskey|Liqueur","Jameson Cold Brew stirred with Kahlúa, chocolate essence and bitters","Coffee|Strong",3,4,0,19,"Cold brew whiskey, stirred like an old fashioned.",1,"rocks"],
    ["d55","Wicklow Pipes","omalleys","Beyond","Whiskey","Jameson 18 gently stirred with sweet vermouth and bitters","Strong|Bitter",2,5,0,25,"A Jameson 18 Manhattan. Above both caps.",1,"cocktail"],
    ["d56","Sea Legs","omalleys","Signature","Tequila","Pantalones Reposado, maraschino liqueur, lime, grapefruit, agave, soda","Sour|Refreshing",3,4,0,20,"Hemingway daiquiri logic on a reposado base.",1,"highball"],
    ["d57","Pants On Fire","omalleys","Signature","Tequila","Pantalones Reposado, Campari, lime, smoked paprika agave","Bitter|Strong",2,4,0,20,"Smoked paprika and Campari. The most interesting of the Pantalones set.",1,"rocks"],
    ["d58","Fancy Pants Paloma","omalleys","Signature","Tequila","Pantalones Reposado, Betty Buzz grapefruit, lime","Refreshing|Sour",2,3,0,20,"A clean paloma. Nothing hidden.",1,"highball"],
    ["d59","Hot Pants","omalleys","Signature","Tequila","Pantalones Blanco, lime, pineapple, agave","Tropical|Sour",3,3,0,19,"Pineapple and blanco tequila, short and sharp.",1,"margarita"],
    ["d60","24k Margarita","omalleys","Margarita","Tequila|Liqueur","Pantalones tequila, Cointreau, Grand Marnier, lemon, lime","Sour",3,4,0,14,"The Princess house margarita, poured fleet-wide. Worth calibrating against early.",1,"margarita"],
    ["d61","Pantalones Tequila Sunrise","omalleys","Signature","Tequila","Pantalones Blanco, passionfruit, orange, grenadine","Fruity|Sweet",4,3,0,14,"The sunrise, upgraded with passionfruit.",1,"highball"],
    ["d62","Classic Irish Coffee","omalleys","Coffee","Whiskey","Jameson, coffee, whipped cream","Coffee",3,3,0,13,"The benchmark.",1,"cup"],
    ["d63","Grace O'Malley's Irish Coffee","omalleys","Coffee","Whiskey","Grace O'Malley's whiskey, coffee, whipped cream","Coffee|Strong",3,4,0,26,"The house whiskey version. Well above both caps.",1,"cup"],
    ["d64","Sláinte Irish Coffee","omalleys","Coffee","Whiskey","Sláinte Irish whiskey, coffee, whipped cream","Coffee",3,3,0,14,"Sláinte in place of Jameson.",1,"cup"],
    ["d65","Sláinte Frozen Irish","omalleys","Coffee","Whiskey|Liqueur","Sláinte Irish whiskey, coffee liqueur, fresh espresso, vanilla, cream, blended","Coffee|Dessert",4,3,1,15,"Frozen Irish coffee. Exactly at the Plus cap.",1,"hurricane"],
    ["d66","Eye of the Storm","wheelhouse","Signature","Rum","Dark rum, lime, demerara syrup, raspberries, ginger beer","Fruity|Refreshing",3,3,0,14,"Dark and stormy with raspberries in the weather.",1,"highball"],
    ["d67","Sea Bottom","wheelhouse","Signature","Rum","White rum, spiced rum, lime, orgeat, triple sec, blackberries","Fruity|Sour",3,4,0,14,"Two rums and blackberries. Looks like the deep.",1,"cocktail"],
    ["d68","Over the Horizon","wheelhouse","Signature","Tequila|Liqueur","Tequila, Aperol, lemon, pineapple, orgeat","Bitter|Tropical",3,3,0,15,"Aperol against pineapple and almond.",1,"cocktail"],
    ["d69","Anchors Away","wheelhouse","Signature","Bourbon|Liqueur","Bourbon, lemon, Licor 43, demerara syrup, walnut bitters","Strong|Sweet",3,4,0,15,"Vanilla and walnut over bourbon. The house drink here.",1,"rocks"],
    ["d70","Anne Bonny's Pearls","wheelhouse","Signature","Rum","Bacardi 8, Fernet, lime, orgeat, lychee","Bitter|Fruity",3,4,0,17,"Fernet and lychee. Genuinely strange and it works.",1,"cocktail"],
    ["d71","The Captain","wheelhouse","Signature","Rum","Bacardi 8, butterscotch, salt, Angostura, orange bitters","Sweet|Strong",4,4,0,17,"Salted butterscotch rum, stirred.",1,"rocks"],
    ["d72","Fool's Gold","wheelhouse","Signature","Gin|Liqueur","Empress gin, pamplemousse liqueur, lemon","Sour|Refreshing",2,4,0,20,"Three ingredients, colour-shifting gin, at the Premier ceiling.",1,"cocktail"],
    ["d73","Dead Men Tell No Tales","wheelhouse","Signature","Rum","Appleton rum, cherry heering, lime, coconut","Fruity|Tropical",4,4,0,16,"Cherry Heering and coconut over Jamaican rum.",1,"rocks"],
    ["d74","Ship In A Bottle","wheelhouse","Beyond","Whiskey|Wine","Jack Daniel's Rye, port wine, coconut syrup, lemon, Angostura bitters, Earl Grey tea","Strong|Sweet",3,5,0,60,"Serves two, in a ship-shaped vessel. Not covered by either package.",1,"rocks"],
    ["d75","Revenge of the Kraken","wheelhouse","Beyond","Tequila","Three tequila-based cocktails served in an octopus display","Strong",3,5,0,45,"Serves two. Theatre first, drink second. Not covered by either package.",1,"cocktail"],
    ["d76","Dragon Fruit Refresher","wakeview","Signature","Tequila|Liqueur","Reposado tequila, blue curaçao, lime, agave, dragon fruit","Fruity|Refreshing",3,3,0,12,"Bright and easy. A good first drink of the day.",1,"margarita"],
    ["d77","Seabreeze Spritz","wakeview","Spritz","Vodka|Wine","Vodka, blue curaçao, soda, prosecco","Refreshing",3,2,0,12,"Low effort, low ABV, does the job on a hot deck.",1,"wine"],
    ["d78","Blue Pineapple Margarita","wakeview","Margarita","Tequila|Liqueur","Blanco tequila, pineapple, blue curaçao, lime","Tropical|Sour",3,3,0,12,"A margarita in an unreasonable colour.",1,"margarita"],
    ["d79","Sand Meets the Sea","wakeview","Signature","Vodka|Liqueur","Vodka, lime, blue curaçao, ginger","Refreshing|Sour",3,3,0,14,"Layered so the blue sits under the pale top.",1,"highball"],
    ["d80","Sunsets on the Ocean","wakeview","Signature","Tequila","Blanco tequila, triple sec, peach schnapps, butterfly tea, orange, cranberry, lime","Fruity|Sweet",4,3,0,14,"Butterfly tea shifts the colour as it settles.",1,"highball"],
    ["d81","Aperol Frosé","wakeview","Frozen","Liqueur|Wine","Aperol, rosé wine, orange, strawberries","Fruity|Refreshing",4,2,1,15,"Frozen rosé with Aperol. The aft deck drink.",1,"hurricane"],
    ["d82","Ocean Dreams","wakeview","Signature","Rum|Liqueur","Malibu, triple sec, pineapple, lemon, lime","Tropical|Sweet",4,3,0,15,"Coconut rum and pineapple, shaken not blended.",1,"cocktail"],
    ["d83","Driftwood","wakeview","Signature","Rum|Liqueur","Zacapa, falernum, banana liqueur, passion fruit, pineapple, lime","Tropical|Fruity",4,4,0,17,"Zacapa gives it real depth under the fruit.",1,"hurricane"],
    ["d84","Baileys Colada","wakeview","Frozen","Liqueur","Baileys Colada, pineapple","Dessert|Sweet",5,2,1,17,"Fleet-wide frozen favourite. Available at most pool bars.",1,"hurricane"],
    ["d85","Ocean Fog","wakeview","Signature","Tequila|Liqueur","Patrón Silver, apricot liqueur, blue curaçao, lemon","Sour|Fruity",3,4,0,18,"Apricot and blue curaçao over Patrón.",1,"cocktail"],
    ["d86","Blowfish","wakeview","Beyond","Rum","Matusalem, passion fruit, lime, dragon fruit syrup","Tropical|Strong",4,4,0,22,"Listed as daring. Above both package caps.",1,"cocktail"],
    ["d87","Dragon Fruit Mojito","seaview","Signature","Rum","White rum, dragon fruit, agave, lime, mint, soda","Refreshing|Fruity",3,3,0,12,"Mojito with dragon fruit. Long and cold over the bow.",1,"highball"],
    ["d88","Aperol Coconut Margarita","seaview","Margarita","Tequila|Liqueur","Blanco tequila, Aperol, orange liqueur, lime, coconut, agave","Bitter|Tropical",3,3,0,14,"Aperol and coconut in a margarita. Odd combination, good drink.",1,"margarita"],
    ["d89","Spicy Mango Margarita","seaview","Margarita","Tequila|Liqueur","Blanco tequila, orange liqueur, mango, serrano pepper","Fruity|Strong",3,4,0,14,"Genuinely hot. Ask them to go light if you would rather taste the mango.",1,"margarita"],
    ["d90","Under the Sea","seaview","Signature","Gin","Gin, cherries, grenadine, pineapple, lime, Angostura bitters, soda","Fruity|Refreshing",4,3,0,14,"The house drink here. Tall, red, easy.",1,"highball"],
    ["d91","Strawberries & Cream","seaview","Signature","Tequila|Rum","Blanco tequila, Malibu rum, strawberries, coconut, agave","Sweet|Dessert",5,3,0,14,"Reads like a pudding, drinks lighter than expected.",1,"cocktail"],
    ["d92","Carajillo","seaview","Coffee","Liqueur","Licor 43, coffee liqueur, espresso, agave","Coffee|Sweet",4,3,0,15,"The Spanish original. Anchor of the Carajillo Collection.",1,"rocks"],
    ["d93","Peach Fresca","seaview","Signature","Vodka","Grey Goose White Peach and Rosemary, lemon, honey, peach, ginger ale","Fruity|Refreshing",4,3,0,17,"Rosemary keeps the peach from going syrupy.",1,"highball"],
    ["d94","Strawberry Fresca","seaview","Signature","Vodka|Liqueur","Grey Goose Strawberry and Lemongrass, strawberry, limoncello, lemon, honey, soda","Fruity|Sour",4,3,0,17,"Limoncello sharpens the strawberry.",1,"highball"],
    ["d95","Watermelon Fresca","seaview","Signature","Vodka|Liqueur","Grey Goose Watermelon and Basil, elderflower, lemon, watermelon, mint","Refreshing|Fruity",3,3,0,17,"The most refreshing of the three Frescas.",1,"highball"],
    ["d96","Empress Rose","seaview","Signature","Gin|Wine","Empress gin, rosé wine, elderflower, lemon","Fruity|Refreshing",3,3,0,20,"Colour-shifting gin in a wine spritz. At the Premier ceiling.",1,"wine"],
    ["d97","Truly Caliente Fresca","themix","Signature","Tequila","Truly Strawberry Lemonade, blanco tequila, lime, jalapeños, mint","Refreshing|Strong",3,3,0,12,"Hard seltzer base with a chilli kick.",1,"highball"],
    ["d98","Truly Pineapple & Coconut Daiquiri","themix","Signature","Rum","Truly Hard Seltzer Pineapple, Malibu rum, coconut, orgeat","Tropical|Sweet",4,2,0,12,"Light, fizzy, low effort.",1,"highball"],
    ["d99","Jungle Bird","themix","Classic","Rum|Liqueur","White rum, dark rum, Campari, lime, pineapple","Bitter|Tropical",3,4,0,12,"The 1970s Kuala Lumpur classic. Best value on the standard menu.",1,"highball"],
    ["d100","Land Ahoy","themix","Coffee","Rum|Liqueur","Coconut rum, coffee liqueur, espresso, pineapple, coconut","Coffee|Tropical",4,3,0,14,"Espresso and pineapple. Better than it reads.",1,"rocks"],
    ["d101","Lychee Vodka Mojito","themix","Signature","Vodka","Vodka, lychee, fresh mint, lime","Refreshing|Fruity",3,3,0,15,"Mojito structure, vodka base, lychee sweetness.",1,"highball"],
    ["d102","Peanut Jungle Ball","themix","Signature","Whiskey|Rum","Skrewball Peanut Butter whisky, Campari, falernum, orgeat, lemon, lime, dark rum float","Bitter|Sweet",4,4,0,15,"Peanut butter whisky and Campari. Order it once, for research.",1,"rocks"],
    ["d103","State Fair","themix","Signature","Vodka|Gin","Absolut Citron, Hendrick's, peach schnapps, lime, cranberry","Fruity|Sour",3,4,0,16,"Vodka and gin together, peach and cranberry over the top.",1,"cocktail"],
    ["d104","I Can't Feel the Rain","themix","Signature","Vodka","Vodka, peach, pineapple, lemon, honey","Fruity|Sweet",4,3,0,15,"Soft, honeyed, uncomplicated.",1,"cocktail"],
    ["d105","Aperol-Colada","themix","Signature","Rum|Liqueur","Malibu, Aperol, pineapple, coconut, lime, orgeat","Bitter|Tropical",4,3,0,17,"A piña colada with Aperol bitterness cutting through.",1,"hurricane"],
    ["d106","Passion Tree","themix","Signature","Vodka|Wine","Absolut Vanilla, Passoã liqueur, passion fruit, lemon, prosecco","Fruity|Sweet",4,3,0,18,"Pornstar martini architecture with prosecco on top.",1,"cocktail"],
    ["d107","Frosé","themix","Frozen","Vodka|Wine","Vodka, rosé wine, strawberry, pear, grenadine","Fruity|Refreshing",4,2,1,15,"Frozen rosé. On the Star this is made with Hampton Water.",1,"hurricane"],
    ["d108","Twisted Dirty Banana","themix","Frozen","Liqueur","Chocolate liqueur, Frangelico, Disaronno amaretto, banana","Dessert|Sweet",5,3,1,18,"The blended one Princess advertises. Pure pudding.",1,"hurricane"],
    ["d109","Guava Margarita","themix","Margarita","Tequila|Liqueur","Blanco tequila, orange liqueur, lime, guava","Fruity|Sour",3,3,0,14,"Guava does the sweetening.",1,"margarita"],
    ["d110","Coconut Margarita","themix","Margarita","Tequila|Liqueur","Blanco tequila, triple sec, lime, coconut","Tropical|Sour",3,3,0,15,"Coconut cream over a standard margarita build.",1,"margarita"],
    ["d111","Grilled Pineapple Margarita","themix","Margarita","Tequila|Liqueur","Patrón Silver, Cointreau, lime, pineapple, agave","Tropical|Sour",3,4,0,17,"Grilled pineapple gives it smoke. The best margarita on the standard list.",1,"margarita"],
    ["d112","Gina Colada","themix","Mocktail","","Tanqueray Sevilla 0.0, lemon, pineapple, coconut, orgeat","Tropical|Sweet",4,0,0,15,"Non-alcoholic piña colada using zero-proof gin.",1,"hurricane"],
    ["d113","The Levant","themix","Mocktail","","Tanqueray Sevilla 0.0, lemon, orange marmalade, honey, ginger ale","Refreshing|Sweet",4,0,0,15,"Marmalade and ginger. The better of the two mocktails.",1,"highball"],
    ["d114","Murasaki Margarita","makoto","Margarita","Tequila","Pantalones Blanco tequila, lime, Japanese plum syrup, umeboshi","Sour|Fruity",3,3,0,14,"Umeboshi brings salt and sourness. Sharp.",1,"margarita"],
    ["d115","Nagoya Negroni","makoto","Classic","Gin","Sencha and matcha infused Roku gin, Campari, Bermutto sweet sake vermouth","Bitter|Strong",2,4,0,15,"A Negroni rebuilt entirely with Japanese components.",1,"rocks"],
    ["d116","Dansu","makoto","Signature","Tequila","Pantalones Reposado, junmai sake, fresh citrus, spicy togarashi syrup","Strong|Sour",2,4,0,18,"Togarashi heat against sake. The most interesting drink here.",1,"cocktail"],
    ["d117","Makoto Gin & Tonic","makoto","Signature","Gin","Roku gin, Indian tonic, yuzu bitters, shiso, cucumber, watermelon radish","Refreshing|Bitter",1,3,0,20,"Reported as one of the best gin and tonics at sea. At the Premier ceiling.",1,"highball"],
    ["d118","Kodai No Hana","makoto","Signature","Vodka","Haku vodka, junmai ginjo sake, fresh citrus, coconut","Refreshing|Sweet",3,3,0,20,"Rice vodka and ginjo sake, softened with coconut.",1,"cocktail"],
    ["d119","Coffee Nichibotsu","makoto","Coffee","Whiskey|Liqueur","Akashi White Oak, Jameson Stout Edition, amaro, Mr Black cold brew","Coffee|Strong",3,5,0,22,"Japanese whisky and cold brew. Above both caps.",1,"rocks"],
    ["d120","Full of Seoul","umai","Signature","Liqueur","Soju, coconut, lemon, peach, angostura bitters","Fruity|Sweet",4,2,0,14,"Soju base, easy drinking, disappears fast.",1,"highball"],
    ["d121","Umai Pink","umai","Signature","Rum","Bacardi white rum, lime, agave, strawberries","Fruity|Sweet",4,3,0,14,"On the sweet side. Works better with dessert than with the meal.",1,"cocktail"],
    ["d122","Biiru","umai","Signature","Beer","Asahi beer, tomato juice, soy, lime, yuzu ponzu, togarashi spice","Bitter|Refreshing",1,2,0,15,"A Japanese michelada. Savoury and unusual.",1,"pint"],
    ["d123","Green Pea Soup","umai","Signature","Tequila|Mezcal","Patrón Silver, Ilegal aged mezcal, green pea juice, ginger, lemon","Strong|Refreshing",2,4,0,15,"Yes, green pea juice. Order it and find out.",1,"cocktail"],
    ["d124","Singapore Fling","umai","Signature","Gin","Roku gin, cherry, Cointreau, lychee, pineapple, basil","Fruity|Tropical",4,4,0,19,"A Singapore Sling with lychee and basil.",1,"highball"],
    ["d125","Negroni","sabatinis","Classic","Gin|Liqueur","Gin, Campari, sweet vermouth","Bitter|Strong",2,5,0,11,"The classic, and the cheapest serious drink on the ship.",1,"rocks"],
    ["d126","Americano","sabatinis","Classic","Liqueur","Campari, sweet vermouth, club soda","Bitter|Refreshing",2,2,0,11,"The Negroni's lower-ABV ancestor.",1,"highball"],
    ["d127","Aperol Spritz","sabatinis","Spritz","Liqueur|Wine","Aperol, prosecco, soda","Bitter|Refreshing",3,2,0,11,"Available across the ship. This is the reference price.",1,"wine"],
    ["d128","Hugo Spritz","sabatinis","Spritz","Liqueur|Wine","St Germain elderflower liqueur, lime, prosecco, soda","Refreshing|Sweet",3,2,0,11,"Elderflower instead of Aperol. Lighter and less bitter.",1,"wine"],
    ["d129","Limoncello Spritz","sabatinis","Spritz","Liqueur|Wine","Villa Massa limoncello, prosecco, mint, Betty Buzz Meyer lemon","Sour|Refreshing",3,2,0,14,"The sharpest of the spritz set.",1,"wine"],
    ["d130","Toscana","sabatinis","Signature","Liqueur|Wine","Limoncello, cantaloupe melon, orange blossom, Frescobaldi Classico Brut","Fruity|Refreshing",4,2,0,14,"Melon and orange blossom. Very Tuscan summer.",1,"flute"],
    ["d131","Sienna","sabatinis","Signature","Liqueur|Wine","Aperol, Frescobaldi Classico Rosé Brut, Nipozzano syrup, lemon, sparkling grapefruit","Bitter|Sour",3,2,0,14,"Grapefruit and Aperol on a rosé sparkling base.",1,"flute"],
    ["d132","Perano","sabatinis","Signature","Vodka|Liqueur","Meili vodka, limoncello, peach, honey, yogurt","Sweet|Dessert",4,3,0,18,"Yogurt gives it body. Closer to a dessert than an aperitivo.",1,"cocktail"],
    ["d133","Chianti Sangria","sabatinis","Signature","Wine|Liqueur","Frescobaldi Chianti Classico, Campari, limoncello, fruits, sparkling lemon lime","Fruity|Bitter",3,3,0,18,"Sangria with a real Chianti and Campari underneath.",1,"wine"],
    ["d134","Bolgheri","sabatinis","Coffee","Brandy|Liqueur","Alexander grappa, coffee liqueur, hazelnut, brown sugar, fresh espresso","Coffee|Dessert",4,4,0,16,"Grappa and espresso. The proper end to the meal.",1,"cocktail"],
    ["d135","Strawberry Love Potion","britto","Signature","Tequila|Liqueur","Pantalones Blanco, Tequila Rose, Disaronno amaretto, Chambord, strawberries","Sweet|Dessert",5,3,0,12,"Very sweet, very pink. Good with dessert.",1,"cocktail"],
    ["d136","Chocolate Royale","britto","Dessert","Rum|Liqueur","Bacardi 8 rum, dark crème de cacao, Licor 43, coconut, espresso","Dessert|Coffee",5,3,0,14,"Chocolate, coconut and espresso over aged rum.",1,"rocks"],
    ["d137","Espresso My Love","britto","Coffee","Whiskey|Liqueur","Sláinte Irish whiskey, OM chocolate liqueur, Disaronno amaretto, demerara, chocolate bitters, espresso","Coffee|Dessert",4,4,0,15,"The espresso martini of the room. Exactly at the Plus cap.",1,"cocktail"],
    ["d138","Britto Coupe","britto","Signature","Vodka|Liqueur","Grey Goose Strawberry and Lemongrass, Aperol, Cointreau, lime, strawberries","Fruity|Bitter",3,3,0,15,"Aperol keeps the strawberry honest.",1,"cocktail"],
    ["d139","Heart of Glass","britto","Signature","Vodka|Wine","Rosemary-infused Meili vodka, peach schnapps, raspberry, gold dust, Romero Britto prosecco","Fruity|Sweet",4,3,0,19,"Actual gold dust. Entirely the point of the room.",1,"flute"],
    ["d140","Britto Watermelon","britto","Signature","Vodka|Wine","Grey Goose Watermelon, Muyu Jasmine Verte, watermelon, lemon, Hampton Water rosé","Refreshing|Fruity",3,3,0,20,"At the Premier ceiling. The most drinkable of the list.",1,"wine"],
    ["d141","Bubble Bath of Love","britto","Beyond","Tequila|Liqueur","Don Julio 1942, Grand Marnier, lime, strawberry, jalapeños","Strong|Fruity",3,5,0,55,"Don Julio 1942 in a cocktail. Not covered by either package.",1,"margarita"],
    ["d142","Signature Tiramisu","bellinis","Dessert","Liqueur","Menu not published. Part of the Tiramisu Collection.","Dessert|Coffee",4,3,0,null,"Repeatedly called the standout at Bellini's. Confirm the exact build onboard.",0,"cocktail"],
    ["d143","Aperol Spritz (Bellini's)","bellinis","Spritz","Liqueur|Wine","Aperol, prosecco, soda","Bitter|Refreshing",3,2,0,11,"Same build as Sabatini's. Listed here as a Bellini's staple.",0,"wine"],
    ["d144","Limoncello Spritz (Bellini's)","bellinis","Spritz","Liqueur|Wine","Limoncello, prosecco, mint","Sour|Refreshing",3,2,0,14,"Listed as a Bellini's staple on the Sphere-class menu.",0,"wine"],
    ["d145","Peach Bellini","bellinis","Spritz","Wine","Peach purée, prosecco","Fruity|Sweet",4,2,0,null,"The drink the bar is named after. Price not published.",0,"flute"],
    ["d146","Escape from Houdini's Chest","spellbound","Signature","Unknown","Menu not machine-readable. Photographed onboard, ingredients not legible.","Strong",3,4,0,null,"The signature theatrical serve. Named in multiple trip reports.",0,"cocktail"],
    ["d147","Artemis","spellbound","Signature","Unknown","Menu not machine-readable. Served in an owl glass.","Strong",3,4,0,null,"Served in a ceramic owl. Confirm the build at the Parlor Bar.",0,"rocks"],
    ["d148","Houdini's Escape","spellbound","Signature","Unknown","Menu not machine-readable.","Strong",3,4,0,null,"Named separately in one review. May be the same drink as Escape from Houdini's Chest.",0,"rocks"],
    ["d149","Lilypad","cascade","Signature","Gin","Olive oil washed gin, remaining build not published","Refreshing",2,4,0,null,"Fat-washed gin. The reason to make the trip up to the Dome.",0,"cocktail"],
    ["d150","Flowers in Bloom","cascade","Signature","Unknown","Menu not machine-readable.","Refreshing",3,3,0,null,"Named on the Sphere-class Cascade menu.",0,"highball"],
    ["d151","Indigo Oasis","princesslive","Signature","Unknown","Menu not machine-readable.","Fruity",3,3,0,null,"Photographed at Princess Live!. Confirm the build.",0,"highball"],
    ["d152","Spiced Negroni","princesslive","Classic","Gin|Liqueur","Gin, Campari, sweet vermouth, spice. Exact build not published.","Bitter|Strong",2,5,0,null,"Called out as a Princess Live! favourite.",0,"rocks"],
    ["d153","Sunset on Ice","sanctuary","Spritz","Wine","Prosecco-based. Full build not published.","Refreshing|Fruity",3,2,0,null,"Sanctuary Club only. Requires Sanctuary Collection access.",0,"wine"],
    ["d154","Caribbean Punch","sanctuary","Signature","Rum","Rum punch. Full build not published.","Tropical|Sweet",4,3,0,null,"Sanctuary Club only. Requires Sanctuary Collection access.",0,"highball"],
    ["d155","Fresh Ginger Mojito","catch","Signature","Rum","White rum, fresh ginger, lime, mint, soda. Exact build not published.","Refreshing|Fruity",3,3,0,null,"Photographed at The Catch. The rest of the list is not published.",0,"highball"],
    ["d156","Coffee and Donuts Milkshake","americana","Mocktail","","Tiramisu ice cream, espresso, milk, sugar donut on top","Coffee|Dessert",5,0,0,0,"Included in the fare. Alcohol-free. A liquid breakfast.",0,"hurricane"],
    ["d157","Painkiller","wheelhouse","Signature","Rum","Dark rum, pineapple, orange, coconut cream, nutmeg","Tropical|Sweet",4,4,0,null,"On the Star Princess Wheelhouse menu. May have rotated onto Sun by October.",0,"highball"],
    ["d158","Mango Mai Tai","wheelhouse","Signature","Rum","Rum, mango, orgeat, lime, orange liqueur","Tropical|Sour",4,4,0,null,"On the Star Princess Wheelhouse menu. May have rotated onto Sun by October.",0,"highball"],
    ["d159","Peanut Butter and Jelly Carajillo","seaview","Coffee","Liqueur","Part of the Carajillo Collection. Full build not published.","Coffee|Dessert",4,3,0,null,"Named on the Sphere-class Sea View menu.",0,"rocks"],
    ["d160","Espresso","coffeecurrents","Coffee","","Lavazza espresso","Coffee|Bitter",1,0,0,3,"Included in both packages. Also at the International Café and Coffee and Cones.",1,"cup"],
    ["d161","Cappuccino","coffeecurrents","Coffee","","Lavazza espresso, steamed milk","Coffee",2,0,0,4,"Included in both packages.",1,"cup"],
    ["d162","Caffè Latte","coffeecurrents","Coffee","","Lavazza espresso, milk","Coffee",2,0,0,4,"Included in both packages.",1,"cup"],
    ["d163","Mocha","coffeecurrents","Coffee","","Lavazza espresso, chocolate, milk","Coffee|Sweet",4,0,0,4,"Included in both packages.",1,"cup"],
    ["d164","Macchiato","coffeecurrents","Coffee","","Lavazza espresso, milk foam","Coffee|Bitter",1,0,0,4,"Included in both packages.",1,"cup"],
    ["d165","Orange Granita","coffeecones","Mocktail","","Frozen orange","Sweet|Fruity",5,0,1,null,"Extra charge. One reviewer found it too sweet.",0,"hurricane"],
    ["w0","Prosecco","crooners","Wine","Wine","Sparkling by the glass","Refreshing",2,2,0,11,"Poured across the ship.",1,"flute"],
    ["w1","Villa Sandi 'Romero Britto Princess Love' Prosecco","crooners","Wine","Wine","Sparkling by the glass","Refreshing",2,2,0,11,"Poured across the ship.",1,"flute"],
    ["w2","Piper Heidsieck Champagne","crooners","Wine","Wine","Champagne by the glass","Refreshing",2,2,0,15,"Poured across the ship.",1,"flute"],
    ["w3","Moscato","crooners","Wine","Wine","White by the glass","Refreshing",5,2,0,10,"Poured across the ship.",1,"wine"],
    ["w4","Sauvignon Blanc","crooners","Wine","Wine","White by the glass","Refreshing",2,2,0,11,"Poured across the ship.",1,"wine"],
    ["w5","Chardonnay","crooners","Wine","Wine","White by the glass","Refreshing",2,2,0,10,"Poured across the ship.",1,"wine"],
    ["w6","Pinot Grigio","crooners","Wine","Wine","White by the glass","Refreshing",2,2,0,12,"Poured across the ship.",1,"wine"],
    ["w7","Riesling","crooners","Wine","Wine","White by the glass","Refreshing",2,2,0,12,"Poured across the ship.",1,"wine"],
    ["w8","Rosé","crooners","Wine","Wine","Rosé by the glass","Refreshing",2,2,0,11,"Poured across the ship.",1,"wine"],
    ["w9","Pinot Noir","crooners","Wine","Wine","Red by the glass","Bitter",2,2,0,11,"Poured across the ship.",1,"wine"],
    ["w10","Merlot","crooners","Wine","Wine","Red by the glass","Bitter",2,2,0,11,"Poured across the ship.",1,"wine"],
    ["w11","Cabernet Sauvignon","crooners","Wine","Wine","Red by the glass","Bitter",2,2,0,11,"Poured across the ship.",1,"wine"],
    ["w12","Red Blend","crooners","Wine","Wine","Red by the glass","Bitter",2,2,0,13,"Poured across the ship.",1,"wine"],
    ["w13","Emmolo Sauvignon Blanc","crooners","Wine","Wine","White by the glass","Refreshing",2,2,0,17,"Poured across the ship.",1,"wine"],
    ["w14","Flowers Chardonnay","crooners","Wine","Wine","White by the glass","Refreshing",2,2,0,18,"Poured across the ship.",1,"wine"],
    ["w15","Chateau d'Esclans 'Whispering Angel' Rosé","crooners","Wine","Wine","Rosé by the glass","Refreshing",2,2,0,16,"Poured across the ship.",1,"wine"],
    ["w16","Sea Sun Pinot Noir","crooners","Wine","Wine","Red by the glass","Bitter",2,2,0,17,"Poured across the ship.",1,"wine"],
    ["w17","Bonanza Cabernet Sauvignon by Caymus","crooners","Wine","Wine","Red by the glass","Bitter",2,2,0,17,"Poured across the ship.",1,"wine"],
    ["w18","Melorosa Red Blend by Jason Aldean","crooners","Wine","Wine","Red by the glass","Bitter",2,2,0,18,"Poured across the ship.",1,"wine"],
    ["w19","M. Haslinger & Fils Champagne","crooners","Wine","Wine","Champagne by the glass","Refreshing",2,2,0,20,"Poured across the ship.",1,"flute"],
    ["w20","Beau Joie Brut Champagne","crooners","Wine","Wine","Champagne by the glass","Refreshing",2,2,0,20,"Poured across the ship.",1,"flute"],
    ["b0","Budweiser","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b1","Bud Light","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b2","Coors Light","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b3","Miller Lite","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b4","Michelob Ultra","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b5","Heineken","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b6","Heineken Light","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b7","Heineken Silver","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b8","Heineken 0.0","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,0,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b9","Stella Artois","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b10","Corona Extra","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b11","Dos Equis","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b12","Red Stripe","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b13","Peroni Nastro Azzurro","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b14","Lagunitas IPA","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b15","Blue Moon Belgian White","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b16","Guinness Stout","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b17","Samuel Adams Boston Lager","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,8,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b18","Asahi","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,8,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b19","Sapporo","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,8,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b20","Foster's Oil Can","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,10,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b21","Angry Orchard Cider","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b22","Strongbow Cider","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b23","Truly Hard Seltzer","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,7.5,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b24","Heineken (draft)","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,9,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b25","Affligem (draft)","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,9,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"],
    ["b26","Strongbow Cider (draft)","themix","Beer","Beer","Bottle or can unless marked draft","Refreshing",1,2,0,9,"Available fleet wide. Add $2 at pool bars to make it a michelada.",1,"pint"]
  ],
  entries: {"d0":{"tried":true,"date":"2026-10-03","rating":1,"fav":true,"wish":true},"d1":{"tried":true,"date":"2026-10-04","rating":2},"d2":{"tried":true,"date":"2026-10-05","rating":3},"d3":{"tried":true,"date":"2026-10-06","rating":4},"d4":{"tried":true,"date":"2026-10-07","rating":5,"fav":true},"d5":{"tried":true,"date":"2026-10-08","rating":1},"d6":{"tried":true,"date":"2026-10-09","rating":2,"wish":true},"d7":{"tried":true,"date":"2026-10-03","rating":3},"d8":{"tried":true,"date":"2026-10-04","rating":4,"fav":true},"d9":{"tried":true,"date":"2026-10-05","rating":5},"d10":{"tried":true,"date":"2026-10-06","rating":1},"d11":{"tried":true,"date":"2026-10-07","rating":2},"d12":{"tried":true,"date":"2026-10-08","rating":3,"fav":true,"wish":true},"d13":{"tried":true,"date":"2026-10-09","rating":4},"d14":{"tried":true,"date":"2026-10-03","rating":5},"d15":{"tried":true,"date":"2026-10-04","rating":1},"d16":{"tried":true,"date":"2026-10-05","rating":2,"fav":true},"d17":{"tried":true,"date":"2026-10-06","rating":3},"d18":{"tried":true,"date":"2026-10-07","rating":4,"wish":true},"d19":{"tried":true,"date":"2026-10-08","rating":5},"d20":{"tried":true,"date":"2026-10-09","rating":1,"fav":true},"d21":{"tried":true,"date":"2026-10-03","rating":2},"d22":{"tried":true,"date":"2026-10-04","rating":3},"d23":{"tried":true,"date":"2026-10-05","rating":4},"d24":{"tried":true,"date":"2026-10-06","rating":5,"fav":true,"wish":true},"d25":{"tried":true,"date":"2026-10-07","rating":1},"d26":{"tried":true,"date":"2026-10-08","rating":2},"d27":{"tried":true,"date":"2026-10-09","rating":3},"d28":{"tried":true,"date":"2026-10-03","rating":4,"fav":true},"d29":{"tried":true,"date":"2026-10-04","rating":5},"d30":{"tried":true,"date":"2026-10-05","rating":1,"wish":true},"d31":{"tried":true,"date":"2026-10-06","rating":2},"d32":{"tried":true,"date":"2026-10-07","rating":3,"fav":true},"d33":{"tried":true,"date":"2026-10-08","rating":4},"d34":{"tried":true,"date":"2026-10-09","rating":5},"d35":{"tried":true,"date":"2026-10-03","rating":1},"d36":{"tried":true,"date":"2026-10-04","rating":2,"fav":true,"wish":true},"d37":{"tried":true,"date":"2026-10-05","rating":3},"d38":{"tried":true,"date":"2026-10-06","rating":4},"d39":{"tried":true,"date":"2026-10-07","rating":5},"d40":{"tried":true,"date":"2026-10-08","rating":1,"fav":true},"d41":{"tried":true,"date":"2026-10-09","rating":2},"d42":{"tried":true,"date":"2026-10-03","rating":3,"wish":true},"d43":{"tried":true,"date":"2026-10-04","rating":4},"w0":{"tried":true,"date":"2026-10-03","rating":1,"fav":true},"w1":{"tried":true,"date":"2026-10-04","rating":2},"w2":{"tried":true,"date":"2026-10-05","rating":3},"w3":{"tried":true,"date":"2026-10-06","rating":4,"fav":true},"w4":{"tried":true,"date":"2026-10-07","rating":5},"w5":{"tried":true,"date":"2026-10-08","rating":1},"w6":{"tried":true,"date":"2026-10-09","rating":2,"fav":true},"w7":{"tried":true,"date":"2026-10-03","rating":3},"b0":{"tried":true,"date":"2026-10-03","rating":1,"wish":true},"b1":{"tried":true,"date":"2026-10-04","rating":2},"b2":{"tried":true,"date":"2026-10-05","rating":3,"wish":true},"b3":{"tried":true,"date":"2026-10-06","rating":4},"b4":{"tried":true,"date":"2026-10-07","rating":1,"wish":true},"b5":{"tried":true,"date":"2026-10-08","rating":2},"d80":{"wish":true},"d81":{"wish":true},"d90":{"wish":true},"w15":{"wish":true},"b20":{"wish":true}},
  visits: ["goodspirits","omalleys","princesslive","bellinis","coffeecurrents","wheelhouse","catch","crowngrill","butchers","spellbound","crooners","makoto","umai","sabatinis"],
  friends: [{"id":"f-sam","name":"Sam","colour":"#E0663A","entries":{"d4":{"tried":true,"rating":5,"rec":true,"comment":"The blue one is unreal, get it first"},"d9":{"tried":true,"rating":5},"d14":{"tried":true,"rating":5,"rec":true},"d3":{"tried":true,"rating":4},"d8":{"tried":true,"rating":4},"d55":{"tried":true,"rating":5,"rec":true,"comment":"Worth the walk to deck 16"},"d60":{"tried":true,"rating":5,"rec":true},"d72":{"tried":true,"rating":4,"rec":true}}},{"id":"f-ravi","name":"Ravi","colour":"#5E8C2E","entries":{"d4":{"tried":true,"rating":3},"d9":{"tried":true,"rating":4},"d20":{"tried":true,"rating":4},"d30":{"tried":true,"rating":5,"rec":true,"comment":"Order two, you will want a second"},"d101":{"tried":true,"rating":5,"rec":true},"d66":{"tried":true,"rating":4,"rec":true}}}],
  badges: [
    {"id":"first","name":"First Sip","hint":"Log one drink","tier":"bronze","state":"earned","cur":58,"need":1,"percent":false},
    {"id":"ten","name":"Ten Down","hint":"Log ten","tier":"bronze","state":"earned","cur":58,"need":10,"percent":false},
    {"id":"twentyfive","name":"Twenty Five","hint":"Log twenty five","tier":"silver","state":"earned","cur":58,"need":25,"percent":false},
    {"id":"fifty","name":"Fifty","hint":"Log fifty","tier":"silver","state":"earned","cur":58,"need":50,"percent":false},
    {"id":"hundred","name":"One Hundred","hint":"Log one hundred","tier":"gold","state":"close","cur":58,"need":100,"percent":false},
    {"id":"onefifty","name":"One Fifty","hint":"Log one hundred and fifty","tier":"gold","state":"close","cur":58,"need":150,"percent":false},
    {"id":"twohundred","name":"Two Hundred","hint":"Log two hundred","tier":"gold","state":"close","cur":58,"need":200,"percent":false},
    {"id":"everybar","name":"Every Bar","hint":"Check in at every venue","tier":"gold","state":"close","cur":15,"need":28,"percent":false},
    {"id":"martini","name":"Martini Club","hint":"Every martini on board","tier":"silver","state":"earned","cur":0,"need":0,"percent":false},
    {"id":"margarita","name":"Margarita Queen","hint":"Every margarita","tier":"silver","state":"locked","cur":0,"need":0,"percent":false},
    {"id":"frozen","name":"Brain Freeze","hint":"Every frozen drink","tier":"silver","state":"locked","cur":0,"need":0,"percent":false},
    {"id":"coffee","name":"Coffee Expert","hint":"Eight coffee cocktails","tier":"bronze","state":"close","cur":3,"need":8,"percent":false},
    {"id":"whiskey","name":"Whiskey Lover","hint":"Ten whiskey or bourbon","tier":"silver","state":"close","cur":9,"need":10,"percent":false},
    {"id":"gin","name":"Gin Explorer","hint":"Ten gin drinks","tier":"silver","state":"earned","cur":15,"need":10,"percent":false},
    {"id":"rum","name":"Rum Captain","hint":"Twelve rum drinks","tier":"silver","state":"close","cur":7,"need":12,"percent":false},
    {"id":"wine","name":"Wine Connoisseur","hint":"Twelve wines by the glass","tier":"silver","state":"close","cur":8,"need":12,"percent":false},
    {"id":"master","name":"Cocktail Master","hint":"Half of everything","tier":"gold","state":"close","cur":27,"need":50,"percent":true},
    {"id":"champion","name":"Sun Princess Champion","hint":"Ninety per cent","tier":"special","state":"close","cur":27,"need":90,"percent":true}
  ],
  earnedBy: {"gin":["d0","d13","d14","d17","d18","d21","d22","d24","d28","d29","d30","d32","d37","d38","d41"],"martini":["d12","d19","d20","d22","d28"]},
  topSpirit: "Gin",
  emblems: {
    first: "<circle cx=\"50\" cy=\"64\" r=\"14\"/><path d=\"M18 68 Q34 60 50 68 Q66 60 82 68 L82 80 L18 80 Z\"/>",
    ten: "<path d=\"M18 67 Q34 61 50 67 Q66 61 82 67 L82 80 L18 80 Z\"/> <circle cx=\"50\" cy=\"60\" r=\"14\"/> <polygon points=\"46.5,46 53.5,46 50,35\"/> <polygon points=\"60.9,50.54 55.16,46.52 64.34,39.52\"/> <polygon points=\"44.84,46.52 39.1,50.54 35.66,39.52\"/>",
    twentyfive: "<path d=\"M18 66 Q34 62 50 66 Q66 62 82 66 L82 80 L18 80 Z\"/><circle cx=\"50\" cy=\"54\" r=\"13\"/><path d=\"M50 30 L53.5 41 L46.5 41 Z M62 33.22 L59.53 44.49 L53.47 40.99 Z M38 33.22 L46.53 40.99 L40.47 44.49 Z M70.78 42 L63.01 50.53 L59.51 44.47 Z M29.22 42 L40.49 44.47 L36.99 50.53 Z\"/>",
    fifty: "<path d=\"M20 64 Q27.5 58 35 64 T50 64 T65 64 T80 64 L80 80 L20 80 Z\"/><circle cx=\"50\" cy=\"46\" r=\"13\"/><path d=\"M26.82 39.79 L37.02 46.15 L38.83 39.38 Z M31.61 30.57 L38.17 40.65 L42.67 35.28 Z M39.86 24.25 L41.54 36.15 L47.89 33.19 Z M50 22 L53.5 33.5 L46.5 33.5 Z M60.14 24.25 L58.46 36.15 L52.11 33.19 Z M68.39 30.57 L61.83 40.65 L57.33 35.28 Z M73.18 39.79 L62.98 46.15 L61.17 39.38 Z\"/>",
    hundred: "<path d=\"M20 64 Q35 58 50 64 T80 64 L80 80 L20 80 Z\"/><path d=\"M50 20 L53.5 32 L46.5 32 Z M62 23.22 L59.03 35.36 L52.97 31.86 Z M70.78 32 L62.14 41.03 L58.64 34.97 Z M74 44 L62 47.5 L62 40.5 Z M70.78 56 L58.64 53.03 L62.14 46.97 Z M62 64.78 L52.97 56.14 L59.03 52.64 Z M50 68 L46.5 56 L53.5 56 Z M38 64.78 L40.97 52.64 L47.03 56.14 Z M29.22 56 L37.86 46.97 L41.36 53.03 Z M26 44 L38 40.5 L38 47.5 Z M29.22 32 L41.36 34.97 L37.86 41.03 Z M38 23.22 L47.03 31.86 L40.97 35.36 Z\"/><circle cx=\"50\" cy=\"44\" r=\"13\"/>",
    onefifty: "<polygon points=\"50.00,19.50 52.34,32.23 57.46,25.98 56.67,34.02 67.32,26.68 59.98,37.33 68.02,36.54 61.77,41.66 74.50,44.00 61.77,46.34 68.02,51.46 59.98,50.67 67.32,61.32 56.67,53.98 57.46,62.02 52.34,55.77 50.00,68.50 47.66,55.77 42.54,62.02 43.33,53.98 32.68,61.32 40.02,50.67 31.98,51.46 38.23,46.34 25.50,44.00 38.23,41.66 31.98,36.54 40.02,37.33 32.68,26.68 43.33,34.02 42.54,25.98 47.66,32.23\"/><circle cx=\"50\" cy=\"44\" r=\"13\"/><path d=\"M20 64 Q35 58 50 64 T80 64 L80 80 L20 80 Z\"/>",
    twohundred: "<circle cx=\"50\" cy=\"44\" r=\"14\"/> <path d=\"M53.5 31 L50 16 L46.5 31 Z M58.21 33.33 L60.72 18.13 L51.74 30.65 Z M61.67 37.28 L69.8 24.2 L56.72 32.33 Z M63.35 42.26 L75.87 33.28 L60.67 35.79 Z M63 47.5 L78 44 L63 40.5 Z M60.67 52.21 L75.87 54.72 L63.35 45.74 Z M56.72 55.67 L69.8 63.8 L61.67 50.72 Z M51.74 57.35 L60.72 69.87 L58.21 54.67 Z M46.5 57 L50 72 L53.5 57 Z M41.79 54.67 L39.28 69.87 L48.26 57.35 Z M38.33 50.72 L30.2 63.8 L43.28 55.67 Z M36.65 45.74 L24.13 54.72 L39.33 52.21 Z M37 40.5 L22 44 L37 47.5 Z M39.33 35.79 L24.13 33.28 L36.65 42.26 Z M43.28 32.33 L30.2 24.2 L38.33 37.28 Z M48.26 30.65 L39.28 18.13 L41.79 33.33 Z\"/> <path d=\"M20 64 Q35 58 50 64 T80 64 L80 80 L20 80 Z\"/>",
    everybar: "<polygon points=\"50,21 54,38 53.18,46.82 62,46 79,50 62,54 53.18,53.18 54,62 50,79 46,62 46.82,53.18 38,54 21,50 38,46 46.82,46.82 46,38\"/><polygon points=\"50,46.5 53.18,41.87 62.73,37.27 58.13,46.82 53.5,50 58.13,53.18 62.73,62.73 53.18,58.13 50,53.5 46.82,58.13 37.27,62.73 41.87,53.18 46.5,50 41.87,46.82 37.27,37.27 46.82,41.87\"/><circle cx=\"50\" cy=\"50\" r=\"5\"/><path fill-rule=\"evenodd\" d=\"M14,50 A36,36 0 1,1 86,50 A36,36 0 1,1 14,50 Z M18.5,50 A31.5,31.5 0 1,0 81.5,50 A31.5,31.5 0 1,0 18.5,50 Z\"/>",
    martini: "<polygon points=\"22,32 78,32 50,56\"/><rect x=\"47.5\" y=\"54\" width=\"5\" height=\"19\"/><polygon points=\"40,73 60,73 64,79 36,79\"/><polygon points=\"29.25,30.88 30.75,35.12 64.75,23.12 63.25,18.88\"/><circle cx=\"66\" cy=\"20\" r=\"6\"/>",
    margarita: "<path d=\"M23,40 Q26,32 29,40 Q32,32 35,40 Q38,32 41,40 Q44,32 47,40 Q50,32 53,40 Q56,32 59,40 Q62,32 65,40 Q68,32 71,40 Q74,32 77,40 Q77,57 53,60 L53,64 Q61,66 53,68 L53,80 L66,84 L34,84 L47,80 L47,68 Q39,66 47,64 L47,60 Q23,57 23,40 Z\"/> <path fill-rule=\"evenodd\" d=\"M62,18 A12,12 0 1 1 62,42 A12,12 0 1 1 62,18 Z M63.5,30 L69.878,28.611 L69.878,31.389 Z M62.75,31.299 L67.142,36.128 L64.736,37.518 Z M61.25,31.299 L59.264,37.518 L56.858,36.128 Z M60.5,30 L54.122,31.389 L54.122,28.611 Z M61.25,28.701 L56.858,23.872 L59.264,22.482 Z M62.75,28.701 L64.736,22.482 L67.142,23.872 Z\"/>",
    frozen: "<path d=\"M54 42L54 37L61 27L54 32L54 25L58 16L50 22L42 16L46 25L46 32L39 27L46 37L46 42ZM58.93 49.46L63.26 46.96L75.42 48.03L67.59 44.46L73.65 40.96L83.44 39.93L74.25 36L75.44 26.07L69.65 34.04L63.59 37.54L64.42 28.97L59.26 40.04L54.93 42.54ZM54.93 57.46L59.26 59.96L64.42 71.03L63.59 62.46L69.65 65.96L75.44 73.93L74.25 64L83.44 60.07L73.65 59.04L67.59 55.54L75.42 51.97L63.26 53.04L58.93 50.54ZM46 58L46 63L39 73L46 68L46 75L42 84L50 78L58 84L54 75L54 68L61 73L54 63L54 58ZM41.07 50.54L36.74 53.04L24.58 51.97L32.41 55.54L26.35 59.04L16.56 60.07L25.75 64L24.56 73.93L30.35 65.96L36.41 62.46L35.58 71.03L40.74 59.96L45.07 57.46ZM45.07 42.54L40.74 40.04L35.58 28.97L36.41 37.54L30.35 34.04L24.56 26.07L25.75 36L16.56 39.93L26.35 40.96L32.41 44.46L24.58 48.03L36.74 46.96L41.07 49.46Z\"/><polygon points=\"50,41 57.79,45.5 57.79,54.5 50,59 42.21,54.5 42.21,45.5\"/>",
    coffee: "<ellipse cx=\"50\" cy=\"75\" rx=\"30\" ry=\"6.5\"/> <path d=\"M33 45 L67 45 L64 63 Q63 70 57 70 L43 70 Q37 70 36 63 Z\"/> <path fill-rule=\"evenodd\" d=\"M80 54 C80 49.86 76.19 46.5 71.5 46.5 C66.81 46.5 63 49.86 63 54 C63 58.14 66.81 61.5 71.5 61.5 C76.19 61.5 80 58.14 80 54 Z M75.5 54 C75.5 52.07 73.71 50.5 71.5 50.5 C69.29 50.5 67.5 52.07 67.5 54 C67.5 55.93 69.29 57.5 71.5 57.5 C73.71 57.5 75.5 55.93 75.5 54 Z\"/> <path d=\"M47.5 45 C42.5 40 42.5 35 47.5 30 C52.5 26 52.5 21 47.5 16 L52.5 16 C57.5 21 57.5 26 52.5 30 C47.5 35 47.5 40 52.5 45 Z\"/>",
    whiskey: "<path fill-rule=\"evenodd\" d=\"M34 21 Q50 18 66 21 C82 33 82 67 66 79 Q50 82 34 79 C18 67 18 33 34 21 Z M31 33 L69 33 L71 38 L29 38 Z M29 62 L71 62 L69 67 L31 67 Z M36 42 L40 42 L40 58 L36 58 Z M48 42 L52 42 L52 58 L48 58 Z M60 42 L64 42 L64 58 L60 58 Z\"/>",
    gin: "<path d=\"M50 20 L53 32 L53 80 Q53 83 50 83 Q47 83 47 80 L47 32 Z\"/><path d=\"M52 46 Q65.13 48.99 68 39 Q58.71 34.33 52 46 Z\"/><path d=\"M48 46 Q34.87 48.99 32 39 Q41.29 34.33 48 46 Z\"/><path d=\"M52 58 Q71.99 57.87 79 46 Q65.49 43.25 52 58 Z\"/><path d=\"M48 58 Q28.01 57.87 21 46 Q34.51 43.25 48 58 Z\"/><path d=\"M52 70 Q68.73 70.27 73 59 Q61.31 56.09 52 70 Z\"/><path d=\"M48 70 Q31.27 70.27 27 59 Q38.69 56.09 48 70 Z\"/><circle cx=\"50\" cy=\"22\" r=\"5\"/><circle cx=\"43\" cy=\"31\" r=\"5\"/><circle cx=\"57\" cy=\"31\" r=\"5\"/>",
    rum: "<path fill-rule=\"evenodd\" d=\"M17,50 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0 Z M26,50 a24,24 0 1,1 48,0 a24,24 0 1,1 -48,0 Z\"/><path d=\"M24,47.5 L76,47.5 L76,52.5 L24,52.5 Z M47.5,24 L52.5,24 L52.5,76 L47.5,76 Z M33.383,29.847 L70.153,66.617 L66.617,70.153 L29.847,33.383 Z M70.153,33.383 L33.383,70.153 L29.847,66.617 L66.617,29.847 Z\"/><circle cx=\"50\" cy=\"50\" r=\"7\"/><path d=\"M81,50 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z M70.602,75.102 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z M45.5,85.5 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z M20.398,75.102 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z M10,50 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z M20.398,24.898 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z M45.5,14.5 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z M70.602,24.898 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0 Z\"/>",
    wine: "<circle cx=\"50\" cy=\"33\" r=\"18\"/><rect x=\"47.5\" y=\"50\" width=\"5\" height=\"22\"/><ellipse cx=\"50\" cy=\"76\" rx=\"13\" ry=\"4\"/><path d=\"M29 57 a3.9 3.9 0 1 0 7.8 0 a3.9 3.9 0 1 0 -7.8 0 Z M35.8 57 a3.9 3.9 0 1 0 7.8 0 a3.9 3.9 0 1 0 -7.8 0 Z M42.6 57 a3.9 3.9 0 1 0 7.8 0 a3.9 3.9 0 1 0 -7.8 0 Z M32.4 63 a3.9 3.9 0 1 0 7.8 0 a3.9 3.9 0 1 0 -7.8 0 Z M39.2 63 a3.9 3.9 0 1 0 7.8 0 a3.9 3.9 0 1 0 -7.8 0 Z M35.8 69 a3.9 3.9 0 1 0 7.8 0 a3.9 3.9 0 1 0 -7.8 0 Z\"/>",
    master: "<path fill-rule=\"evenodd\" d=\"M 50,19 C 55,19 59,23 59,31 L 63,31 L 63,43 L 68,43 L 62,84 L 38,84 L 32,43 L 37,43 L 37,31 L 41,31 C 41,23 45,19 50,19 Z M 41,35 L 59,35 L 59,39 L 41,39 Z\"/><circle cx=\"50\" cy=\"17\" r=\"3.2\"/>",
    champion: "<path d=\"M50.0 16.0L47.7 33.7L52.3 33.7ZM60.5 17.7L52.9 33.8L57.2 35.2ZM70.0 22.5L57.7 35.4L61.5 38.1ZM77.5 30.0L61.9 38.5L64.6 42.3ZM82.3 39.5L64.8 42.8L66.2 47.1ZM84.0 50.0L66.3 47.7L66.3 52.3ZM82.3 60.5L66.2 52.9L64.8 57.2ZM77.5 70.0L64.6 57.7L61.9 61.5ZM70.0 77.5L61.5 61.9L57.7 64.6ZM60.5 82.3L57.2 64.8L52.9 66.2ZM50.0 84.0L52.3 66.3L47.7 66.3ZM39.5 82.3L47.1 66.2L42.8 64.8ZM30.0 77.5L42.3 64.6L38.5 61.9ZM22.5 70.0L38.1 61.5L35.4 57.7ZM17.7 60.5L35.2 57.2L33.8 52.9ZM16.0 50.0L33.7 52.3L33.7 47.7ZM17.7 39.5L33.8 47.1L35.2 42.8ZM22.5 30.0L35.4 42.3L38.1 38.5ZM30.0 22.5L38.5 38.1L42.3 35.4ZM39.5 17.7L42.8 35.2L47.1 33.8Z\"/><path fill-rule=\"evenodd\" d=\"M32 50 A18 18 0 1 0 68 50 A18 18 0 1 0 32 50 ZM39 58L39 53L43 44L46 51L50 42L54 51L57 44L61 53L61 58Z\"/>"
  },
}
// ---- end data ----

/* Prototype A · Harbour by day. No framework, no build, no network.
   Deep links: ?screen=home|drinks|sheet|sheet-large|search|medals|medal|ship|crew|you and ?hour=0..23.
   A deep link lands on a still state: the coin's turn, the blue wave and the droplet's slide run only
   on a guest's own tap. */
'use strict'

// ══ helpers ═══════════════════════════════════════════════════════════════════════════════════════
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s))
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
const Q = new URLSearchParams(location.search)
const money = (n) => (n === null || n === undefined ? '' : '$' + (Number(n) % 1 ? Number(n).toFixed(2) : n))
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
let uidN = 0
const uid = () => 'u' + (++uidN)

// ══ icons: the app's drawn set (src/ui/Icon.tsx), paths reused ════════════════════════════════════
const svg = (paths, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`
const I = {
  home: '<path d="M4 11.2 12 4.5l8 6.7"/><path d="M6 10.4V18a1.2 1.2 0 0 0 1.2 1.2h9.6A1.2 1.2 0 0 0 18 18v-7.6"/>',
  drinks: '<path d="M4.5 6h15L12 14v4.6"/><path d="M8 19.4h8"/>',
  ship: '<path d="M4 13.5h16l-1.6 4.2a2 2 0 0 1-1.9 1.3H7.5a2 2 0 0 1-1.9-1.3L4 13.5z"/><path d="M12 13.3V5"/><path d="M12 5.4 17 8l-5 1.8"/>',
  crew: '<circle cx="9" cy="8" r="3.1"/><path d="M3.6 19.2c.5-3 2.7-4.7 5.4-4.7s4.9 1.7 5.4 4.7"/><path d="M15.4 6.3a2.7 2.7 0 0 1 0 5.2"/><path d="M16.4 14.7c2 .3 3.4 1.7 4 3.6"/>',
  you: '<path d="M6 19v-4.6"/><path d="M12 19V7"/><path d="M18 19v-8.6"/>',
  check: '<circle cx="12" cy="12" r="8.4"/><path d="M8.3 12.3l2.4 2.4 4.8-5"/>',
  heart: '<path d="M12 20.3c-.5-.4-7.8-5.3-7.8-11C4.2 6.4 6.1 4.5 8.6 4.5c1.5 0 2.8.8 3.4 2 .6-1.2 1.9-2 3.4-2 2.5 0 4.4 1.9 4.4 4.8 0 5.7-7.3 10.6-7.8 11z"/>',
  bookmark: '<path d="M7 5.6h10a1 1 0 0 1 1 1V19l-6-3.2L6 19V6.6a1 1 0 0 1 1-1z"/>',
  search: '<circle cx="11" cy="11" r="6.2"/><path d="M20 20l-4.5-4.5"/>',
  chevron: '<path d="m10 6.8 5.2 5.2-5.2 5.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shaker: '<path d="M10.2 2.8h3.6v2.4h-3.6z"/><path d="M10.2 5.2C8.2 5.9 7.3 7.7 7.2 9.8h9.6c-.1-2.1-1-3.9-3-4.6"/><path d="M6.4 9.8h11.2v2H6.4z"/><path d="M7.1 11.8l1 8.3a1.3 1.3 0 0 0 1.3 1.1h5.2a1.3 1.3 0 0 0 1.3-1.1l1-8.3"/>',
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.6l2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.9l-5 2.75.96-5.6L3.9 9.5l5.6-.8L12 3.6z"/></svg>'
const CHECK_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="currentColor"/><path d="M8.2 12.2l2.5 2.5 5-5.2" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const GLASS = {
  cocktail: '<path d="M4.5 5.5h15L12 13.5z"/><path d="M12 13.5v6M8.5 19.5h7"/>',
  margarita: '<path d="M3.5 7h15c0 3-2.8 4.3-5.2 4.6 0 2.9-1 4.2-2.3 4.2s-2.3-1.3-2.3-4.2C6.3 11.3 3.5 10 3.5 7z"/><path d="M11 15.8v3.7M7.8 19.5h6.4"/><path d="M15.5 7a3 3 0 0 1 6 0z"/>',
  wine: '<path d="M8 4.5c-1.8 3.5-2 7 .4 8.7 1.8 1.2 5.4 1.2 7.2 0 2.4-1.7 2.2-5.2.4-8.7z"/><path d="M12 14.1v5.4M8.5 19.5h7"/>',
  flute: '<path d="M9.8 3.5h4.4c.4 4.5 0 8.7-2.2 10.7-2.2-2-2.6-6.2-2.2-10.7z"/><path d="M12 14.2v5.3M9 19.5h6"/>',
  pint: '<path d="M6.5 4.5h11l-1.2 14.7a1.2 1.2 0 0 1-1.2 1.1H8.9a1.2 1.2 0 0 1-1.2-1.1z"/><path d="M6.9 8.5h10.2"/>',
  cup: '<path d="M5.5 9.5H16V14a4.5 4.5 0 0 1-4.5 4.5H10A4.5 4.5 0 0 1 5.5 14z"/><path d="M16 11h1.2a2.2 2.2 0 0 1 0 4.4H16M4 20.5h14.5"/><path d="M9 4.8c-.8 1 .8 1.8 0 2.8M12.5 4.8c-.8 1 .8 1.8 0 2.8"/>',
  hurricane: '<path d="M13.4 9 16.2 2.2"/><path d="M8 4c.3 2.5 2 3.5 1.8 5.5-.2 2-2.5 3.5-2.2 6.3.3 2.2 2.2 3.2 4.4 3.2s4.1-1 4.4-3.2c.3-2.8-2-4.3-2.2-6.3-.2-2 1.5-3 1.8-5.5z"/><path d="M9.5 21h5"/>',
  highball: '<path d="M13.2 11.5 16.6 2"/><path d="M7 4.5h10V19a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19z"/>',
  rocks: '<path d="M5.5 8.5h13l-.9 10.3a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z"/><rect x="9.3" y="11.6" width="5.4" height="5.4" rx="1" transform="rotate(-8 12 14.3)"/>',
}
const glassIcon = (fam, cls = '') => svg(GLASS[fam] || GLASS.cocktail, cls ? `class="${cls}"` : '')

// ══ the model: the app's data, the seed passport ══════════════════════════════════════════════════
const VENUES = {}
DATA.venues.forEach(([key, name, deck, type, hours, blurb, shares]) => { VENUES[key] = { key, name, deck, type, hours, blurb, shares } })
const DRINKS = DATA.drinks.map(([id, name, venue, category, spirits, ing, flav, sweet, strength, frozen, price, desc, verified, glass]) => ({
  id, name, venue, category, spirits: spirits ? spirits.split('|') : [], ing, flav: flav ? flav.split('|') : [],
  sweet, strength, frozen: !!frozen, price, desc, verified: !!verified, glass,
}))
const BY = Object.fromEntries(DRINKS.map((d) => [d.id, d]))
const ME = JSON.parse(JSON.stringify(DATA.entries))
const E = (id) => ME[id] || (ME[id] = {})
const FRIENDS = DATA.friends
const BADGES = DATA.badges
const BADGE = Object.fromEntries(BADGES.map((b) => [b.id, b]))
const deckLabel = (n) => DATA.deckLabels[n] || String(n)
const venueName = (k) => (VENUES[k] ? VENUES[k].name : k)
const menuOf = (k) => { const own = DRINKS.filter((d) => d.venue === k); if (own.length) return own; const s = VENUES[k] && VENUES[k].shares; return s ? DRINKS.filter((d) => d.venue === s) : [] }
const triedCount = () => DRINKS.filter((d) => ME[d.id] && ME[d.id].tried).length
const TIER_RANK = { special: 0, gold: 1, silver: 2, bronze: 3 }
const TIER_WORD = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', special: 'Special' }
const byTier = (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || BADGES.indexOf(a) - BADGES.indexOf(b)
const EARNED = BADGES.filter((b) => b.state === 'earned').sort(byTier)
const CLOSE = BADGES.filter((b) => b.state === 'close').sort((a, b) => b.cur / b.need - a.cur / a.need || BADGES.indexOf(a) - BADGES.indexOf(b))
const LOCKED = BADGES.filter((b) => b.state === 'locked')
const NEWEST = BADGE.gin   // the new-medal moment: the one medal Home announces
const badgeCount = (b) => (b.percent ? `${b.cur}% of ${b.need}%` : `${b.cur} of ${b.need}`)
const UNIT = { first: ['drink', 'drinks'], ten: ['drink', 'drinks'], twentyfive: ['drink', 'drinks'], fifty: ['drink', 'drinks'], hundred: ['drink', 'drinks'], onefifty: ['drink', 'drinks'], twohundred: ['drink', 'drinks'], everybar: ['venue', 'venues'], coffee: ['coffee cocktail', 'coffee cocktails'], whiskey: ['whiskey', 'whiskeys'], gin: ['gin', 'gins'], rum: ['rum', 'rums'], wine: ['wine', 'wines'] }
function remainder(b) {
  const left = Math.max(1, b.need - b.cur)
  if (b.percent) return `${left}% more of the list`
  const u = UNIT[b.id]
  return u ? `${left} more ${left === 1 ? u[0] : u[1]}` : `${left} more`
}

// For you: Sam's taste matches yours, so his loved drinks lead; then the spirit you rate highest
function picks() {
  const twin = FRIENDS[0]
  const crew = []
  FRIENDS.forEach((f) => Object.entries(f.entries).forEach(([id, e]) => {
    if (!e.rec || (ME[id] && ME[id].tried) || crew.some((p) => p.d.id === id)) return
    crew.push({ d: BY[id], reason: f === twin ? `${f.name} matches your taste` : `${f.name} loved it` })
  }))
  const top = DATA.topSpirit
  const taste = !top ? [] : DRINKS
    .filter((d) => !(ME[d.id] && (ME[d.id].tried || ME[d.id].rating)) && d.spirits.includes(top) && !crew.some((p) => p.d.id === d.id))
    .sort((a, b) => Number(b.category === 'Signature') - Number(a.category === 'Signature') || Number(b.verified) - Number(a.verified) || a.id.localeCompare(b.id))
    .slice(0, 3).map((d) => ({ d, reason: `Because you love ${top.toLowerCase()}` }))
  const out = []
  for (let i = 0; i < Math.max(crew.length, taste.length) && out.length < 6; i++) {
    if (crew[i]) out.push(crew[i])
    if (taste[i] && out.length < 6) out.push(taste[i])
  }
  return out
}
const PICKS = picks()

// ══ the clock: the sky follows the hour (SeaHero.tsx SKY and skyAt, verbatim) ═════════════════════
function dayPart(h) { if (h < 5) return 'night'; if (h < 7) return 'dawn'; if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; if (h < 19) return 'golden'; if (h < 21) return 'dusk'; return 'night' }
const greetingWord = (p) => (p === 'dawn' || p === 'morning' ? 'Morning' : p === 'afternoon' ? 'Afternoon' : 'Evening')
const pinned = /^\d{1,2}$/.test(Q.get('hour') || '') && +Q.get('hour') <= 23 ? +Q.get('hour') : null
const nowHour = () => { if (pinned !== null) return pinned; const d = new Date(); return d.getHours() + d.getMinutes() / 60 }
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const hexOf = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
const SKY = {
  dawn: { top: rgb('#B49CC0'), hor: rgb('#F6C9A2'), hi: rgb('#3E8FA0'), lo: rgb('#123A52'), sun: rgb('#FFD9A8'), band: rgb('#F3B98C'), hull: rgb('#123A52'), sunY: 0.83, sunR: 0.14, sunI: 0.50, core: 0, glow: 0.09, bandI: 0.26, glint: 0.35 },
  morning: { top: rgb('#609CCF'), hor: rgb('#BDD9DA'), hi: rgb('#28AAA3'), lo: rgb('#093755'), sun: rgb('#F6CE79'), band: rgb('#D8E6DE'), hull: rgb('#093755'), sunY: 0.82, sunR: 0.17, sunI: 0.58, core: 0, glow: 0.07, bandI: 0.00, glint: 0.40 },
  afternoon: { top: rgb('#3D7CC4'), hor: rgb('#A8CDE6'), hi: rgb('#1E9FB4'), lo: rgb('#0A3A62'), sun: rgb('#FFF2CC'), band: rgb('#C7DDEC'), hull: rgb('#0A3A62'), sunY: 0.81, sunR: 0.13, sunI: 0.46, core: 0, glow: 0.05, bandI: 0.00, glint: 0.34 },
  golden: { top: rgb('#7F97C6'), hor: rgb('#F3C078'), hi: rgb('#2E9A96'), lo: rgb('#0C3550'), sun: rgb('#FFD48C'), band: rgb('#F6B45E'), hull: rgb('#0C3550'), sunY: 0.83, sunR: 0.17, sunI: 0.62, core: 0, glow: 0.11, bandI: 0.34, glint: 0.46 },
  dusk: { top: rgb('#565578'), hor: rgb('#9A7E96'), hi: rgb('#1D6E80'), lo: rgb('#0A2A42'), sun: rgb('#F2A05E'), band: rgb('#E8834B'), hull: rgb('#3B5B78'), sunY: 0.83, sunR: 0.15, sunI: 0.22, core: 0, glow: 0.07, bandI: 0.44, glint: 0.22 },
  night: { top: rgb('#0E1E38'), hor: rgb('#40587A'), hi: rgb('#10465A'), lo: rgb('#041D2E'), sun: rgb('#E9EFF7'), band: rgb('#4A6183'), hull: rgb('#3B5B78'), sunY: 0.83, sunR: 0.05, sunI: 0.95, core: 0.66, glow: 0.07, bandI: 0.20, glint: 0.16 },
}
const EDGES = [5, 7, 12, 17, 19, 21]
const mixN = (a, b, t) => a + (b - a) * t
function mixSky(a, b, t) {
  const o = {}
  for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => mixN(v, b[k][i], t)) : mixN(a[k], b[k], t)
  return o
}
function skyAt(hour) {
  const h = ((hour % 24) + 24) % 24
  for (const e of EDGES) {
    const d = h - e
    if (d > -0.5 && d < 0.5) { const t = d + 0.5; return mixSky(SKY[dayPart(e - 1)], SKY[dayPart(e)], t * t * (3 - 2 * t)) }
  }
  return SKY[dayPart(h)]
}

// the voyage: 3 to 17 October 2026. ?day=YYYY-MM-DD pins today, as the app's QA override does
const today = () => (/^\d{4}-\d\d-\d\d$/.test(Q.get('day') || '') ? Q.get('day') : new Date().toISOString().slice(0, 10))
function countdown() {
  const t = today(), i = DATA.days.indexOf(t)
  if (i > -1) return `<span class="lg-c">Day <b>${i + 1}</b> of ${DATA.days.length}</span>`
  const d = Math.ceil((+new Date(DATA.days[0] + 'T00:00:00') - +new Date(t + 'T00:00:00')) / 86400000)
  if (d > 0) return `<span class="lg-c">Sails in <b>${d}</b> day${d === 1 ? '' : 's'}</span>`
  return '<span class="lg-c">Voyage complete</span>'
}
const longDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

// ══ the medals: struck metal ══════════════════════════════════════════════════════════════════════
// One light, from the top left, as on the glass: the rim's outer face is lit there and its inner wall
// is in shade; the field sits below the rim; the emblem is raised, so it carries a highlight on its
// upper left and a shadow on its lower right. The Champion's field is enamel, the fourth finish.
const METAL = {
  bronze: { light: '#F6CFA4', mid: '#C8834E', dark: '#8A5028', deep: '#4A2A12', fHi: '#E8B387', f: '#C27C47', fLo: '#95592F', eL: '#FFE6CC', eM: '#E3A574', band: ['#F3C79D', '#CC8A55', '#8C522A', '#B97444', '#DCA273'] },
  silver: { light: '#FFFFFF', mid: '#C9D1DA', dark: '#76828F', deep: '#2F3A46', fHi: '#F6F8FA', f: '#C8CFD7', fLo: '#A1ABB7', eL: '#FFFFFF', eM: '#E3E8EE', band: ['#EDF1F5', '#B4BECA', '#7D8996', '#A3AEBA', '#D3D9E0'] },
  gold: { light: '#FFF4C8', mid: '#E6B444', dark: '#A77416', deep: '#5B3C05', fHi: '#FBE089', f: '#DBA737', fLo: '#AE7C1C', eL: '#FFF8DC', eM: '#F1CD68', band: ['#FFEDB0', '#E7B94A', '#B27F1D', '#D9A638', '#F3D273'] },
  special: { light: '#FFF4C8', mid: '#E6B444', dark: '#A77416', deep: '#082C44', fHi: '#3C93B3', f: '#16607F', fLo: '#0A3752', eL: '#FFF4C8', eM: '#E3B24A' },
}
const SHIP_SIL = '<path d="M6 33 H144 L133 47 Q131 49 126 49 H24 Q19 49 17 47 Z"/><path d="M31 33 V24 H119 V33 Z M45 24 V17 H105 V24 Z M74 17 V12 H102 V17 Z"/><path d="M53 17 L56 5 H67 L70 17 Z"/><path d="M87.3 12V3h1.4v9z"/>'
function struck(art, box, m, k = 1) {
  // three passes of the same art: shadow (lower right), highlight (upper left), face. k scales the
  // offsets so the relief is about a pixel deep at any size (a 52px coin needs twice the units of a 112)
  return `<g transform="translate(${k} ${1.2 * k})"><g transform="${box}" fill="${m.deep}" fill-opacity=".6">${art}</g></g>` +
    `<g transform="translate(${-.7 * k} ${-.8 * k})"><g transform="${box}" fill="${m.eL}" fill-opacity=".95">${art}</g></g>` +
    `<g transform="${box}" fill="url(#FACE)">${art}</g>`
}
function coinSVG(b, opts = {}) {
  const u = uid()
  const m = METAL[b.tier] || METAL.silver
  const back = !!opts.back
  const k = Math.max(.8, Math.min(2.6, 110 / (opts.px || 112)))
  const art = back
    ? struck(SHIP_SIL, 'translate(-30 -14) scale(.4)', m, k) +
      `<path d="M-26 14q6.5-3.4 13 0t13 0 13 0 13 0" fill="none" stroke="${m.deep}" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round" transform="translate(.6 .8)"/>` +
      `<path d="M-26 14q6.5-3.4 13 0t13 0 13 0 13 0" fill="none" stroke="${m.eL}" stroke-width="1.6" stroke-linecap="round"/>`
    : struck(DATA.emblems[b.id] || '', 'translate(-30 -30) scale(.6)', m, k)
  return `<svg class="coin" viewBox="-50 -50 100 100" aria-hidden="true">
<defs>
<linearGradient id="${u}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.light}"/><stop offset=".48" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.dark}"/></linearGradient>
<linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.dark}"/><stop offset=".5" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.light}"/></linearGradient>
${m.band
    // a polished field: lit at the top left, a darker mirror band past the middle, a second light low right
    ? `<linearGradient id="${u}f" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${m.band[0]}"/><stop offset=".34" stop-color="${m.band[1]}"/><stop offset=".56" stop-color="${m.band[2]}"/><stop offset=".78" stop-color="${m.band[3]}"/><stop offset="1" stop-color="${m.band[4]}"/></linearGradient>`
    : `<radialGradient id="${u}f" cx=".4" cy=".34" r=".78"><stop offset="0" stop-color="${m.fHi}"/><stop offset=".62" stop-color="${m.f}"/><stop offset="1" stop-color="${m.fLo}"/></radialGradient>`}
<linearGradient id="${u}e" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${m.eL}"/><stop offset="1" stop-color="${m.eM}"/></linearGradient>
<radialGradient id="${u}s"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="${u}c"><circle r="49"/></clipPath>
</defs>
<circle r="49" fill="url(#${u}r)"/>
<circle r="47.6" fill="none" stroke="${m.deep}" stroke-opacity=".34" stroke-width="2" stroke-dasharray="1.1 1.1"/>
<circle r="44.2" fill="url(#${u}b)"/>
<circle r="40.6" fill="url(#${u}f)"/>
<path d="M-40.2 5.5A40.6 40.6 0 0 1-5.5-40.2" fill="none" stroke="${m.deep}" stroke-opacity=".28" stroke-width="2.4"/>
<circle r="40.6" fill="none" stroke="${m.deep}" stroke-opacity=".3" stroke-width=".7"/>
${art.replace(/url\(#FACE\)/g, `url(#${u}e)`)}
<g clip-path="url(#${u}c)"><g class="coin-spec"><ellipse cx="-14" cy="-24" rx="36" ry="17" transform="rotate(-30 -14 -24)" fill="url(#${u}s)" opacity=".5"/></g></g>
<path d="M-46.6 6A47 47 0 0 1-6-46.6" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.3" stroke-linecap="round"/>
<path d="M46.6-6A47 47 0 0 1 6 46.6" fill="none" stroke="${m.deep}" stroke-opacity=".38" stroke-width="1.3" stroke-linecap="round"/>
</svg>`
}
// a medal not yet struck: the blank the die has not met. Close ones carry their progress round them
// in the metal they will be struck in; locked ones are the blank alone, quiet
function blankSVG(b, withArc) {
  const u = uid(), m = METAL[b.tier] || METAL.silver
  const r = withArc ? 41 : 47
  const p = withArc ? Math.max(0.03, Math.min(1, b.cur / b.need)) : 0
  const C = 2 * Math.PI * 47
  return `<svg class="coin" viewBox="-50 -50 100 100" aria-hidden="true">
<defs>
<linearGradient id="${u}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FCF9F3"/><stop offset="1" stop-color="#E2D9CA"/></linearGradient>
<linearGradient id="${u}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.dark}"/></linearGradient>
</defs>
${withArc ? `<circle r="47" fill="none" stroke="rgba(28,60,86,.12)" stroke-width="5.2"/><circle r="47" fill="none" stroke="url(#${u}a)" stroke-width="5.2" stroke-linecap="round" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90)"/>` : ''}
<circle r="${r}" fill="url(#${u}p)"/>
<circle r="${r - .5}" fill="none" stroke="rgba(28,60,86,.14)" stroke-width="1"/>
<path d="M${-(r - 2)} 4A${r - 2} ${r - 2} 0 0 1 -4 ${-(r - 2)}" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
</svg>`
}
const coin = (b, px) => `<span class="coin-holder${b.state === 'earned' ? ' coin-cast' : ''}">${b.state === 'earned' ? coinSVG(b, { px }) : blankSVG(b, b.state === 'close')}</span>`
// the 3D coin: two faces back to back. Its shadow is drawn by the wrapper, not a filter, so nothing
// flattens the turn
function coin3d(b, turn, px) {
  return `<span class="coin3d${turn ? ' turn' : ''}"><span class="coin-face front">${coinSVG(b, { px })}</span><span class="coin-face back">${coinSVG(b, { back: true, px })}</span></span>`
}

// ══ rows ══════════════════════════════════════════════════════════════════════════════════════════
function stars(n) { return n ? `<span class="d-stars" aria-label="${n} out of 5">${STAR.repeat(n)}</span>` : '' }
function drinkRow(d) {
  const e = ME[d.id] || {}
  const price = money(d.price)
  return `<div class="drow" data-fam="${d.glass}">
<button class="d-open" type="button" data-open="${d.id}">
<span class="gdisc">${glassIcon(d.glass)}</span>
<span class="row-copy"><span class="d-line1"><span class="d-name">${esc(d.name)}</span>${stars(e.rating)}</span>
${d.ing || price ? `<span class="d-meta"><span class="d-ing">${esc(d.ing)}</span>${price ? `<span class="d-price tnum">${price}</span>` : ''}</span>` : ''}</span>
</button>
<button class="d-try${e.tried ? ' on' : ''}" type="button" data-try="${d.id}" aria-pressed="${!!e.tried}" aria-label="Tried ${esc(d.name)}">${e.tried ? CHECK_ON : svg(I.check)}</button>
</div>`
}

// ══ screens ═══════════════════════════════════════════════════════════════════════════════════════
function renderHome(turn) {
  const n = triedCount(), pct = Math.round((n / DRINKS.length) * 100)
  const part = dayPart(Math.floor(nowHour()))
  const others = EARNED.filter((b) => b !== NEWEST)
  const next = CLOSE[0]
  // where to start: the longest list on the ship, and the first drink there you have not had
  const counts = {}
  DRINKS.forEach((d) => { counts[d.venue] = (counts[d.venue] || 0) + 1 })
  const big = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
  const bigList = menuOf(big), bigDone = bigList.filter((d) => ME[d.id] && ME[d.id].tried).length
  const bigNext = bigList.find((d) => !(ME[d.id] && ME[d.id].tried))
  $('#s-home').innerHTML = `
<header class="hero" id="hero">
  <div class="sea" id="sea">
    <div class="sea-floor" id="sea-floor"></div>
    <canvas class="sea-canvas" id="sea-canvas" aria-hidden="true"></canvas>
    <svg class="sea-ship" id="sea-ship" viewBox="0 0 150 52" aria-hidden="true">
      <path class="ship-hull" d="M6 33 H144 L133 47 Q131 49 126 49 H24 Q19 49 17 47 Z"/>
      <path class="ship-deck" d="M31 33 V24 H119 V33 Z M45 24 V17 H105 V24 Z M74 17 V12 H102 V17 Z"/>
      <path class="ship-window" d="M39 27h4v3h-4z M49 27h4v3h-4z M59 27h4v3h-4z M69 27h4v3h-4z M79 27h4v3h-4z M89 27h4v3h-4z M99 27h4v3h-4z"/>
      <path class="ship-funnel" d="M53 17 L56 5 H67 L70 17 Z"/>
      <line class="ship-mast" x1="88" y1="12" x2="88" y2="3"/>
    </svg>
  </div>
  <div class="hero-scrim" aria-hidden="true"></div>
  <div class="hero-top">
    <h1 class="greet">${greetingWord(part)}, Alex</h1>
    <p class="greet-date">${longDate(today())}</p>
    <p class="chip-day lg lg-dark">${countdown()}</p>
  </div>
  <button class="readout lg lg-dark press" type="button" data-go="you" aria-label="${pct}% tried, ${n} of ${DRINKS.length}. Open your stats">
    <span class="lg-c pct tnum" id="hero-pct">${pct}<small>%</small></span>
    <span class="lg-c ro-sub"><span class="tnum" id="hero-n">${n} of ${DRINKS.length}</span><br>tried</span>
  </button>
</header>

<div class="home-body">
  <section class="case" aria-labelledby="case-h">
    <div class="sec-head"><h2 id="case-h">Medals</h2><button class="case-all tnum" type="button" data-push="medals" aria-label="All medals, ${EARNED.length} of ${BADGES.length} earned">${EARNED.length} of ${BADGES.length}${svg(I.chevron, 'class="chev"')}</button></div>
    <button class="case-feature" type="button" data-medal="${NEWEST.id}" aria-label="New medal, ${esc(NEWEST.name)}. ${TIER_WORD[NEWEST.tier]}, ${esc(NEWEST.hint.toLowerCase())}">
      <span class="coin3d-wrap">${coin3d(NEWEST, turn)}</span>
      <span class="cf-copy">
        <span class="cf-kicker">New medal</span>
        <span class="cf-name">${esc(NEWEST.name)}</span>
        <span class="cf-meta">${TIER_WORD[NEWEST.tier]} · ${esc(NEWEST.hint)}</span>
      </span>
    </button>
    <div class="case-strip">
      ${others.map((b) => `<button class="coin-btn" type="button" data-medal="${b.id}" aria-label="${esc(b.name)}, ${TIER_WORD[b.tier]}">${coin(b, 52)}</button>`).join('')}
    </div>
    ${next ? `<button class="row tap case-next tier-${next.tier}" type="button" data-medal="${next.id}" aria-label="Next: ${esc(next.name)}, ${badgeCount(next)}">
      ${blankSVG(next, true)}
      <span class="row-copy">
        <span class="row-title">${esc(next.name)}</span>
        <span class="row-sub">${remainder(next)}</span>
        <span class="meter metal" aria-hidden="true"><span style="width:${Math.round(next.cur / next.need * 100)}%"></span></span>
      </span>
    </button>` : ''}
  </section>

  <section class="sec" aria-labelledby="foryou-h">
    <div class="sec-head"><h2 id="foryou-h">For you</h2></div>
    <ul class="shelf" role="list">
      ${PICKS.map((p) => `<li><button class="rec" type="button" data-fam="${p.d.glass}" data-open="${p.d.id}" aria-label="${esc(p.d.name)}, ${esc(venueName(p.d.venue))}. ${esc(p.reason)}">
        ${glassIcon(p.d.glass, 'gbig')}
        <span class="rec-reason">${esc(p.reason)}</span>
        <span class="rec-name">${esc(p.d.name)}</span>
        <span class="rec-meta">${esc(venueName(p.d.venue))}</span>
      </button></li>`).join('')}
    </ul>
    <button class="row tap no-lead" type="button" id="shake-row" aria-haspopup="dialog">
      <span class="shake-ico">${svg(I.shaker)}</span>
      <span class="row-copy"><span class="row-title">Shake for a drink</span></span>
    </button>
  </section>

  ${big ? `<section class="sec" aria-labelledby="start-h">
    <div class="sec-head"><h2 id="start-h">Where to start</h2></div>
    <button class="row tap no-lead" type="button" data-venue="${big}">
      <span class="row-copy">
        <span class="row-title">${esc(venueName(big))}</span>
        <span class="row-sub tnum">${bigDone} of ${bigList.length} tried here${bigNext ? ` · ${esc(bigNext.name)} next` : ''}</span>
      </span>
      ${svg(I.chevron, 'class="chev"')}
    </button>
  </section>` : ''}
</div>`
}

function drinkGroups(list) {
  const groups = {}
  list.forEach((d) => { (groups[d.venue] = groups[d.venue] || []).push(d) })
  const keys = Object.keys(groups).sort((a, b) => (VENUES[a].deck - VENUES[b].deck) || venueName(a).localeCompare(venueName(b)))
  return keys.map((k) => `<section class="vgroup" id="v-${k}" aria-label="${esc(venueName(k))}">
<h2>${esc(venueName(k))} <span>· Deck ${deckLabel(VENUES[k].deck)}</span></h2>
${groups[k].map(drinkRow).join('')}
</section>`).join('')
}
function renderDrinks() {
  $('#s-drinks').innerHTML = `<div class="page">
<h1 class="large">Drinks</h1>
<label class="field">${svg(I.search)}<input id="dq" type="search" placeholder="Drink, bar or spirit" aria-label="Search drinks" autocomplete="off" spellcheck="false"></label>
<p class="meta count tnum" id="d-count">${DRINKS.length} drinks</p>
<div id="d-list">${drinkGroups(DRINKS)}</div>
</div>`
}
const matches = (d, q) => fold(d.name + ' ' + d.ing + ' ' + venueName(d.venue) + ' ' + d.spirits.join(' ')).includes(q)
function filterDrinks(q) {
  const f = fold(q.trim())
  const list = f ? DRINKS.filter((d) => matches(d, f)) : DRINKS
  $('#d-count').textContent = `${list.length} ${list.length === 1 ? 'drink' : 'drinks'}`
  $('#d-list').innerHTML = list.length ? drinkGroups(list) : `<p class="empty">No drink matches that search.</p>`
}

function renderShip() {
  const decks = {}
  Object.values(VENUES).forEach((v) => { (decks[v.deck] = decks[v.deck] || []).push(v) })
  $('#s-ship').innerHTML = `<div class="page"><h1 class="large">Ship</h1>
${Object.keys(decks).sort((a, b) => a - b).map((deck) => `<section class="sec" style="margin-top:24px" aria-label="Deck ${deckLabel(deck)}">
<div class="sec-head"><h2>Deck ${deckLabel(deck)}</h2></div>
${decks[deck].map((v) => {
  const list = menuOf(v.key), done = list.filter((d) => ME[d.id] && ME[d.id].tried).length
  const visited = DATA.visits.includes(v.key) || done > 0
  return `<button class="row tap no-lead vrow" type="button" ${list.length ? `data-venue="${v.key}"` : 'disabled'}>
<span class="row-copy"><span class="row-title">${esc(v.name)}</span>
${list.length ? `<span class="row-sub tnum">${done} of ${list.length}</span>${done ? `<span class="meter"><span style="width:${Math.round(done / list.length * 100)}%"></span></span>` : ''}` : `<span class="row-sub">${esc(v.type)}</span>`}</span>
${visited ? `<span class="visited" aria-label="Visited">${CHECK_ON}</span>` : ''}
</button>`
}).join('')}</section>`).join('')}
</div>`
}

function renderCrew() {
  const tried = (f) => Object.values(f.entries).filter((e) => e.tried).length
  $('#s-crew').innerHTML = `<div class="page"><h1 class="large">Crew</h1>
<div class="row no-lead"><span class="dot" style="background:#12716F">A</span><span class="row-copy"><span class="row-title">Alex</span><span class="row-sub">How your crew sees you</span></span></div>
<button class="btn-line" type="button">${svg(I.plus)}Add to your crew</button>
<section class="sec"><div class="sec-head"><h2>Sailing with</h2></div>
${FRIENDS.map((f, i) => `<div class="row"><span class="dot" style="background:${f.colour}">${esc(f.name[0])}</span><span class="row-copy"><span class="row-title">${esc(f.name)}</span><span class="row-sub">${tried(f)} tried${i === 0 ? ' · matches your taste' : ''}</span></span></div>`).join('')}
</section></div>`
}

function renderYou() {
  const n = triedCount()
  const bySp = {}
  DRINKS.forEach((d) => { if (ME[d.id] && ME[d.id].tried) d.spirits.forEach((s) => { bySp[s] = (bySp[s] || 0) + 1 }) })
  const top = Object.entries(bySp).sort((a, b) => b[1] - a[1]).slice(0, 5)
  $('#s-you').innerHTML = `<div class="page"><h1 class="large">You</h1>
<button class="row tap" type="button" data-push="medals" style="min-height:72px">
  <span style="display:flex;flex:none">${EARNED.slice(0, 3).map((b, i) => `<span style="display:block;width:40px;height:40px;margin-left:${i ? -12 : 0}px">${coin(b, 40)}</span>`).join('')}</span>
  <span class="row-copy"><span class="row-title">Medals</span><span class="row-sub tnum">${EARNED.length} of ${BADGES.length} earned</span></span>
  ${svg(I.chevron, 'class="chev"')}
</button>
<section class="sec"><div class="sec-head"><h2>What you drink</h2><span class="aside tnum">${n} tried</span></div>
<div class="bars">${top.map(([s, c]) => `<div class="row no-lead"><span class="row-copy"><span class="row-title" style="font-weight:400">${esc(s)}</span></span><span class="bar-n tnum">${c}</span></div>`).join('')}</div>
</section></div>`
}

function renderMedals() {
  $('#s-medals').innerHTML = `<div class="page"><h1 class="large">Medals</h1>
<p class="case-lead tnum">${EARNED.length} of ${BADGES.length} earned</p>
<section class="sec" style="margin-top:24px" aria-labelledby="earned-h"><div class="sec-head"><h2 id="earned-h">Earned</h2></div>
<div class="earned">${EARNED.map((b) => `<div class="medal"><button class="coin-btn" type="button" data-medal="${b.id}" aria-label="${esc(b.name)}, ${TIER_WORD[b.tier]}">${coin(b, b === EARNED[0] ? 136 : 92)}</button>
<span><span class="medal-name" style="display:block">${esc(b.name)}</span><span class="medal-tier">${TIER_WORD[b.tier]}</span></span></div>`).join('')}</div>
</section>
<section class="sec near" aria-labelledby="close-h"><div class="sec-head"><h2 id="close-h">Close</h2></div>
${CLOSE.map((b) => `<button class="row tap tier-${b.tier}" type="button" data-medal="${b.id}">${blankSVG(b, true)}
<span class="row-copy"><span class="row-title">${esc(b.name)}</span><span class="row-sub">${remainder(b)}</span></span>
<span class="near-count tnum">${badgeCount(b)}</span></button>`).join('')}
</section>
<section class="sec locked" aria-labelledby="locked-h"><div class="sec-head"><h2 id="locked-h">Locked</h2></div>
${LOCKED.map((b) => `<button class="row tap" type="button" data-medal="${b.id}">${blankSVG(b, false)}
<span class="row-copy"><span class="row-title">${esc(b.name)}</span><span class="row-sub">${esc(b.hint)}</span></span></button>`).join('')}
</section></div>`
}

function renderSearch(q) {
  const f = fold((q || '').trim())
  let body
  if (!f) {
    body = `<section class="sec" style="margin-top:8px"><div class="sec-head"><h2>Suggestions</h2></div>${PICKS.map((p) => drinkRow(p.d)).join('')}</section>`
  } else {
    const list = DRINKS.filter((d) => matches(d, f))
    body = `<p class="meta count tnum">${list.length} ${list.length === 1 ? 'drink' : 'drinks'}</p>` +
      (list.length ? `<div style="margin-top:8px">${list.slice(0, 60).map(drinkRow).join('')}</div>` : `<p class="empty">No drink matches that search.</p>`)
  }
  $('#s-search').innerHTML = `<div class="page"><h1 class="large">Log a drink</h1>${body}</div>`
}

// ══ sheets' content ═══════════════════════════════════════════════════════════════════════════════
function factsLine(d) {
  const p = d.price
  const price = p === null ? '' : p <= 15 ? `Plus ${money(p)}` : p <= 20 ? `Premier ${money(p)}` : `${money(p)}, ${money(p - 20)} over Premier`
  const notes = [...d.flav, ...(d.frozen ? ['Frozen'] : [])].join(', ')
  return [price, notes].filter(Boolean).join(' · ')
}
function dots(label, n) {
  return `<div class="ds-meter"><span class="meta">${label}</span><span class="ds-dots" role="img" aria-label="${label}, ${n} out of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span></div>`
}
function drinkSheet(id) {
  const d = BY[id], e = E(id), v = VENUES[d.venue]
  const rs = FRIENDS.filter((f) => f.entries[id] && f.entries[id].rating).map((f) => f.entries[id].rating)
  if (e.rating) rs.push(e.rating)
  const recs = FRIENDS.filter((f) => f.entries[id] && f.entries[id].rec)
  const said = FRIENDS.filter((f) => f.entries[id] && f.entries[id].comment)
  return `<div class="ds-head" data-fam="${d.glass}"><span class="gdisc">${glassIcon(d.glass)}</span>
<div><h2 class="ds-title" id="sheet-title">${esc(d.name)}</h2><p class="meta">${v ? `${esc(v.name)} · Deck ${deckLabel(v.deck)} · ` : ''}${esc(d.category)}</p></div></div>
<div class="ds-acts">
  <button class="ds-act tried${e.tried ? ' on' : ''}" type="button" data-try="${id}" aria-pressed="${!!e.tried}">${e.tried ? CHECK_ON : svg(I.check)}<span>Tried</span></button>
  <button class="ds-act${e.fav ? ' on' : ''}" type="button" data-flag="fav" data-id="${id}" aria-pressed="${!!e.fav}">${svg(I.heart)}<span>Favourite</span></button>
  <button class="ds-act${e.wish ? ' on' : ''}" type="button" data-flag="wish" data-id="${id}" aria-pressed="${!!e.wish}">${svg(I.bookmark)}<span>Wishlist</span></button>
</div>
<div class="ds-rate">
  <span><span class="meta" style="display:block;font-weight:600">Your rating</span>${rs.length > 1 ? `<span class="meta tnum">${(rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1)} from ${rs.length} aboard</span>` : ''}</span>
  <span class="ds-stars">${[1, 2, 3, 4, 5].map((n) => `<button class="ds-star${n <= (e.rating || 0) ? ' on' : ''}" type="button" data-rate="${n}" data-id="${id}" aria-label="${n} star${n > 1 ? 's' : ''}">${STAR}</button>`).join('')}</span>
</div>
${d.ing ? `<p class="ds-body">${esc(d.ing)}</p>` : ''}
${d.desc ? `<p class="meta ds-desc">${esc(d.desc)}</p>` : ''}
${factsLine(d) ? `<p class="meta ds-facts">${esc(factsLine(d))}</p>` : ''}
${!d.verified ? '<p class="meta ds-facts">Not on a published menu. Check at the bar.</p>' : ''}
<div class="ds-meters">${dots('Sweetness', d.sweet)}${dots('Strength', d.strength)}</div>
${d.strength === 0 ? '<p class="meta">Alcohol free</p>' : ''}
${recs.length ? `<p class="ds-recby meta">${recs.map((f) => `<span class="dot" style="background:${f.colour}">${esc(f.name[0])}</span>`).join('')}<span>Recommended by ${recs.map((f) => esc(f.name)).join(' and ')}</span></p>` : ''}
<div class="ds-field"><label for="notes">Private notes</label><textarea id="notes" rows="3"></textarea></div>
<div class="ds-field"><label for="comment">Comment for your crew</label><textarea id="comment" rows="2" maxlength="140"></textarea></div>
${said.length ? `<section class="ds-crew"><h3>What the crew said</h3>${said.map((f) => `<div class="row"><span class="dot" style="background:${f.colour}">${esc(f.name[0])}</span><span class="row-copy"><span class="row-title">${esc(f.name)}</span><span class="meta" style="white-space:normal">${esc(f.entries[id].comment)}</span></span></div>`).join('')}</section>` : ''}`
}
function medalSheet(id, turn) {
  const b = BADGE[id]
  let big, what = ''
  if (b.state === 'earned') {
    big = `<span class="coin3d-wrap" id="ms-coin">${coin3d(b, turn, 224)}</span>`
    const ids = (DATA.earnedBy[id] || []).filter((x) => b.id !== 'gin' || (ME[x] && ME[x].tried))
    if (ids.length) {
      what = `<section class="ms-list"><h3>${b.id === 'gin' ? `Your ${ids.length} gins` : 'Every martini on board'}</h3>${ids.map((x) => drinkRow(BY[x])).join('')}</section>`
    }
  } else {
    big = `<span class="coin3d-wrap tier-${b.tier}" style="cursor:default">${blankSVG(b, b.state === 'close')}</span>`
  }
  const tierLine = b.state === 'earned' ? `${TIER_WORD[b.tier]} · earned` : b.state === 'close' ? `${TIER_WORD[b.tier]} · ${badgeCount(b)}` : `${TIER_WORD[b.tier]} · not started`
  return `<div class="ms">${big}
<h2 class="ms-name" id="sheet-title">${esc(b.name)}</h2>
<p class="ms-tier tnum">${tierLine}</p>
<p class="ms-hint">${b.state === 'close' ? `${esc(b.hint)}. ${remainder(b)}.` : esc(b.hint)}</p>
${what}</div>`
}

// ══ the sea: WebGL, one live effect (SeaHero.tsx's shader, without the chip lens: the chips are CSS glass here) ══
const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uLevel;
uniform vec3 uSkyTop, uSkyHor, uSeaHi, uSeaLo, uSunC, uBandC; uniform vec4 uSunP; uniform vec4 uSunQ;
float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float swell(float x, float t){ return 0.034*sin(x*9.0 - t*0.90) + 0.010*sin(x*17.0 + t*1.30 + 1.3) + 0.004*sin(x*41.0 - t*2.10); }
void main(){
  vec2 px = gl_FragCoord.xy; vec2 uv = px / uRes; float asp = uRes.x / uRes.y; float t = uTime;
  float horizon = mix(0.14, 0.80, uLevel);
  vec2 sunP = vec2(uSunP.x, uSunP.y); float ds = length((uv - sunP) * vec2(asp, 1.0));
  vec3 col = mix(uSkyHor, uSkyTop, smoothstep(horizon, 1.0, uv.y));
  col = mix(col, uBandC, uSunQ.z * smoothstep(horizon + 0.30, horizon, uv.y));
  col += uSunC * smoothstep(uSunP.z, uSunP.z * uSunQ.x, ds) * uSunP.w;
  col += uSunC * smoothstep(uSunP.z * 2.5, 0.0, ds) * uSunQ.y;
  float surf = horizon + swell(uv.x, t);
  if(uv.y < surf){
    vec3 water = mix(uSeaLo, uSeaHi, clamp((uv.y-(horizon-0.42))/0.42, 0.0, 1.0));
    water = mix(water, uSeaHi, smoothstep(0.05, 0.0, surf-uv.y));
    float glint = smoothstep(0.12,0.0,abs(uv.x-sunP.x)) * smoothstep(0.10,0.0,surf-uv.y) * (0.35 + 0.65*noise(vec2(uv.x*70.0, t*2.2)));
    water += uSunC * glint * uSunQ.w;
    col = water;
  }
  col += vec3(1.0) * smoothstep(0.004, 0.0, abs(uv.y - surf)) * 0.3;
  gl_FragColor = vec4(col, 1.0);
}`
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }'
const swellJS = (x, t) => 0.034 * Math.sin(x * 9.0 - t * 0.90) + 0.010 * Math.sin(x * 17.0 + t * 1.30 + 1.3) + 0.004 * Math.sin(x * 41.0 - t * 2.10)
function glProgram(gl, vsrc, fsrc) {
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null }
  const vs = mk(gl.VERTEX_SHADER, vsrc), fs = mk(gl.FRAGMENT_SHADER, fsrc)
  if (!vs || !fs) return null
  const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null
  gl.useProgram(p)
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(p, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  return p
}
const sea = {
  gl: null, prog: null, U: {}, raf: 0, t0: performance.now(), wanted: false, level: 0.27,
  mount() {
    const cv = $('#sea-canvas'), hero = $('#hero'), ship = $('#sea-ship')
    this.cv = cv; this.hero = hero; this.ship = ship
    this.level = triedCount() / DRINKS.length
    this.paintFloor()
    const gl = cv.getContext('webgl', { alpha: false, antialias: true, depth: false, stencil: false, powerPreference: 'low-power' })
    const prog = gl && glProgram(gl, VERT, FRAG)
    if (!prog) { cv.classList.add('is-off'); this.gl = null; this.placeShip(8); return }
    this.gl = gl; this.prog = prog
    for (const n of ['uRes', 'uTime', 'uLevel', 'uSkyTop', 'uSkyHor', 'uSeaHi', 'uSeaLo', 'uSunC', 'uBandC', 'uSunP', 'uSunQ']) this.U[n] = gl.getUniformLocation(prog, n)
    this.draw(performance.now())
    new IntersectionObserver((e) => { this.onScreen = e[0].isIntersecting; this.update() }, { threshold: 0.01 }).observe(cv)
    document.addEventListener('visibilitychange', () => this.update())
    addEventListener('resize', () => this.draw(performance.now()))
  },
  // the CSS floor under the canvas: the same sky, so a phone without WebGL, and a still render, are right
  paintFloor() {
    const s = skyAt(nowHour())
    const horizon = 0.14 + 0.66 * this.level, waterTop = (1 - horizon) * 100
    $('#sea-floor').style.background = `linear-gradient(180deg, ${hexOf(s.top)} 0%, ${hexOf(s.hor)} ${waterTop - 2}%, ${hexOf(s.hi)} ${waterTop}%, ${hexOf(s.lo)} 100%)`
    $('#sea').style.setProperty('--sea-hull', hexOf(s.hull))
    this.ship.style.top = waterTop + '%'
  },
  // the liner rides the water: lift and pitch from the swell at its stern and bow (a third of the slope)
  placeShip(t) {
    const w = this.hero.clientWidth, h = this.hero.clientHeight
    const stern = 0.56 + 0.34 * 0.04, bow = 0.56 + 0.34 * 0.96
    const ys = swellJS(stern, t), yb = swellJS(bow, t)
    const lift = ((ys + yb) / 2) * h
    const pitch = 0.3 * Math.atan2((yb - ys) * h, (bow - stern) * w) * 180 / Math.PI
    this.ship.style.transform = `translateY(-86%) translateY(${(-lift).toFixed(2)}px) rotate(${(-pitch).toFixed(2)}deg)`
  },
  draw(now) {
    const gl = this.gl; if (!gl) return
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const w = Math.round(this.hero.clientWidth * dpr), h = Math.round(this.hero.clientHeight * dpr)
    if (!w || !h) return
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; gl.viewport(0, 0, w, h) }
    const s = skyAt(nowHour()), U = this.U
    const c = (u, v) => gl.uniform3f(u, v[0] / 255, v[1] / 255, v[2] / 255)
    gl.uniform2f(U.uRes, w, h)
    c(U.uSkyTop, s.top); c(U.uSkyHor, s.hor); c(U.uSeaHi, s.hi); c(U.uSeaLo, s.lo); c(U.uSunC, s.sun); c(U.uBandC, s.band)
    gl.uniform4f(U.uSunP, 0.74, s.sunY, s.sunR, s.sunI)
    gl.uniform4f(U.uSunQ, s.core, s.glow, s.bandI, s.glint)
    const t = REDUCED ? 8 : (now - this.t0) / 1000
    gl.uniform1f(U.uTime, t)
    gl.uniform1f(U.uLevel, this.level)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    this.placeShip(t)
  },
  // one live effect, and only while it is seen: Home showing, no sheet over it, the hero on screen
  update() {
    const run = !!this.gl && !REDUCED && this.onScreen !== false && !document.hidden && state.tab === 'home' && !state.pushed && !state.search && !sheet.open
    if (run && !this.raf) { const loop = (now) => { this.draw(now); this.raf = requestAnimationFrame(loop) }; this.raf = requestAnimationFrame(loop) }
    if (!run && this.raf) { cancelAnimationFrame(this.raf); this.raf = 0 }
  },
}

// ══ the blue wave: the sheet's signature opening (SheetWave.tsx), handing over to the glass ═══════
const WAVE_FRAG = `precision highp float;
uniform vec2 iRes; uniform float iP; uniform float iTime;
const vec3 SEA = vec3(0.157, 0.667, 0.639); const vec3 SEA_DEEP = vec3(0.035, 0.216, 0.333);
const vec3 PANE = vec3(1.0, 0.992, 0.980);
void main(){
  vec2 uv = gl_FragCoord.xy / iRes; float t = iTime;
  float up = smoothstep(0.0, 0.44, iP); float down = 1.0 - smoothstep(0.56, 1.0, iP); float tri = min(up, down);
  float waves = 0.082*sin(uv.x*4.2 + t*1.6) + 0.030*sin(uv.x*7.5 - t*1.2) + 0.026*sin(uv.x*2.2 + t*0.7);
  float depositY = mix(-0.26, 1.26, up) + waves; float crestY = mix(-0.26, 1.26, tri) + waves;
  // the pane before the water reaches it is itself translucent, so the sheet is glass from the first frame
  if (uv.y > depositY) { gl_FragColor = vec4(PANE, 0.78); return; }
  if (uv.y > crestY) { gl_FragColor = vec4(0.0); return; }
  float depth = crestY - uv.y;
  float tint = 0.42 * smoothstep(0.0, 0.09, depth) * (1.0 - 0.4*smoothstep(0.10, 0.55, depth));
  vec3 seaCol = mix(SEA, SEA_DEEP, clamp(depth*1.5, 0.0, 1.0));
  float foam = smoothstep(0.016, 0.0, depth); float edge = smoothstep(0.026, 0.008, depth) * (1.0 - foam);
  vec3 col = mix(seaCol, vec3(1.0), foam); col += vec3(1.0) * edge * 0.2;
  gl_FragColor = vec4(col, clamp(tint + foam*0.95 + edge*0.25, 0.0, 1.0));
}`
function playWave(el) {
  if (REDUCED) return
  const cv = document.createElement('canvas')
  cv.className = 'sheet-wave'; cv.setAttribute('aria-hidden', 'true')
  el.appendChild(cv)
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false })
  const prog = gl && glProgram(gl, VERT, WAVE_FRAG)
  if (!prog) { cv.remove(); return }
  const uRes = gl.getUniformLocation(prog, 'iRes'), uP = gl.getUniformLocation(prog, 'iP'), uT = gl.getUniformLocation(prog, 'iTime')
  const DUR = 2400, t0 = performance.now()
  const draw = (now) => {
    const t = (now - t0) / 1000, p = Math.min(t / (DUR / 1000), 1)
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const w = Math.max(1, Math.round(el.clientWidth * dpr)), h = Math.max(1, Math.round(el.clientHeight * dpr))
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
    gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h); gl.uniform1f(uP, p); gl.uniform1f(uT, t)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    return p
  }
  draw(performance.now())
  const loop = (now) => { if (!cv.isConnected) return; if (draw(now) >= 1) { cv.remove(); return } requestAnimationFrame(loop) }
  requestAnimationFrame(loop)
  setTimeout(() => cv.remove(), DUR + 600)
}

// ══ state and navigation ══════════════════════════════════════════════════════════════════════════
const TABS = [['home', 'Home'], ['drinks', 'Drinks'], ['ship', 'Ship'], ['crew', 'Crew'], ['you', 'You']]
const state = { tab: 'home', pushed: null, search: false, prevTab: 'home' }
const phone = $('#phone')

function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, label]) => `<button class="tab" type="button" data-tab="${k}"${state.tab === k ? ' aria-current="page"' : ''}>${svg(I[k])}<span>${label}</span></button>`).join('')
  $('#tab-current').innerHTML = svg(I[state.tab])
}
function slotX(i) { const t = $$('.tab')[i]; return t ? t.offsetLeft : 0 }
function slotW() { const t = $$('.tab')[0]; return t ? t.offsetWidth : 56 }
let dropX = 0
function placeDroplet(i, animate) {
  const d = $('#droplet'), to = slotX(i), from = dropX
  d.style.setProperty('--slot', slotW() + 'px')
  dropX = to
  if (!animate || from === to) { d.style.transform = `translateX(${to}px)`; return }
  if (REDUCED) {
    d.style.transform = `translateX(${to}px)`
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' })
    return
  }
  // the liquid morph: the droplet stretches towards the tab it is going to, swells, and settles
  const mid = (from + to) / 2
  // eased per segment, not as a whole: one easing over the whole run would squeeze the swell into the
  // first 60ms, where no thumb sees it; this way it peaks at 45% of the run
  const a = d.animate([
    { transform: `translateX(${from}px) scale(1, 1)`, easing: 'cubic-bezier(.3, .5, .5, 1)' },
    { transform: `translateX(${mid}px) scale(1.22, 1.08)`, offset: 0.45, easing: 'cubic-bezier(.2, .7, .3, 1)' },
    { transform: `translateX(${to - (to - from) * -0.04}px) scale(.97, 1.02)`, offset: 0.8, easing: 'ease-out' },
    { transform: `translateX(${to}px) scale(1, 1)` },
  ], { duration: 480, easing: 'linear' })
  d.style.transform = `translateX(${to}px)`
  return a
}

function applyChrome() {
  phone.classList.toggle('not-home', state.tab !== 'home' || !!state.pushed || state.search)
  phone.classList.toggle('can-back', !!state.pushed && !state.search)
  phone.classList.toggle('is-search', state.search)
  $$('.screen').forEach((s) => s.classList.remove('is-on'))
  const cur = state.search ? $('#s-search') : state.pushed ? $('#s-' + state.pushed) : $('#s-' + state.tab)
  if (state.pushed && !state.search) $('#s-' + state.tab).classList.add('is-on') // under the pushed page as it slides
  cur.classList.add('is-on')
  const titles = { home: 'Home', drinks: 'Drinks', ship: 'Ship', crew: 'Crew', you: 'You', medals: 'Medals', search: 'Log a drink' }
  $('#topbar-title').textContent = titles[state.search ? 'search' : state.pushed || state.tab]
  onScroll()
  sea.update()
}
function activeScroller() { return state.search ? $('#s-search') : state.pushed ? $('#s-' + state.pushed) : $('#s-' + state.tab) }
function onScroll() {
  const sc = activeScroller()
  const home = sc.id === 's-home'
  const hero = home && $('#hero')
  const limit = home ? hero.offsetHeight - $('.topbar').offsetHeight : 40
  phone.classList.toggle('is-scrolled', sc.scrollTop > limit)
  // the chips give up their filters as the top bar comes in, and whenever Home is not the screen in
  // front (a pushed page covers it but it stays on for the slide), so the four-surface budget holds
  phone.classList.toggle('hero-off', home ? sc.scrollTop > limit : true)
}
$$('.screen').forEach((s) => s.addEventListener('scroll', onScroll, { passive: true }))

function goTab(k, animate = true) {
  if (sheet.open) sheet.close(false)
  const was = state.tab
  state.search = false; state.pushed = null
  if (k === was) { activeScroller().scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }) }
  state.tab = k
  renderTabs()
  placeDroplet(TABS.findIndex((t) => t[0] === k), animate)
  $('#q').tabIndex = -1; $('#sb-clear').tabIndex = -1
  applyChrome()
}
function push(screen) {
  if (screen === 'medals') renderMedals()
  $('#s-medals').scrollTop = 0
  state.pushed = screen
  applyChrome()
}
function pop() { state.pushed = null; applyChrome() }
$('#back').addEventListener('click', pop)

// search: the Log button runs out into a search field; the capsule folds to the tab you came from
function openSearch(focus = true) {
  if (sheet.open) sheet.close(false)
  state.search = true
  renderSearch($('#q').value)
  $('#s-search').scrollTop = 0
  $('#q').tabIndex = 0; $('#sb-clear').tabIndex = 0
  applyChrome()
  if (focus) setTimeout(() => $('#q').focus({ preventScroll: true }), REDUCED ? 0 : 160)
}
function closeSearch() {
  state.search = false
  $('#q').value = ''; $('#q').blur()
  $('#q').tabIndex = -1; $('#sb-clear').tabIndex = -1
  $('#dock').style.transform = ''
  applyChrome()
}
$('#logbtn').addEventListener('click', () => openSearch(true))
$('#tab-current').addEventListener('click', closeSearch)
$('#sb-clear').addEventListener('click', () => {
  if ($('#q').value) { $('#q').value = ''; renderSearch(''); $('#q').focus() } else closeSearch()
})
$('#q').addEventListener('input', (e) => {
  renderSearch(e.target.value)
  $('#sb-clear').setAttribute('aria-label', e.target.value ? 'Clear search' : 'Close search')
})
// the dock rides above the keyboard while the field has it
if (window.visualViewport) {
  const vv = window.visualViewport
  const lift = () => {
    if (!state.search) return
    const kb = window.innerHeight - vv.height - vv.offsetTop
    $('#dock').style.transform = kb > 80 ? `translateY(${-(kb - 8)}px)` : ''
  }
  vv.addEventListener('resize', lift); vv.addEventListener('scroll', lift)
}

// ── the tab bar: tap a tab, or put a thumb on the capsule and slide the droplet along it ─────────
;(() => {
  const bar = $('#tabbar'), d = $('#droplet')
  let down = null, scrub = false, suppressUntil = 0
  bar.addEventListener('pointerdown', (e) => {
    if (state.search || e.button > 0) return
    down = { x: e.clientX, id: e.pointerId, left: bar.getBoundingClientRect().left + 4 }
    scrub = false
    try { bar.setPointerCapture(e.pointerId) } catch (_) {}
  })
  bar.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return
    const dx = e.clientX - down.x
    if (!scrub && Math.abs(dx) > 8) { scrub = true; bar.classList.add('is-scrub') }
    if (scrub) {
      const w = slotW(), max = slotX(TABS.length - 1)
      const x = Math.max(-4, Math.min(max + 4, e.clientX - down.left - w / 2))
      d.getAnimations().forEach((a) => a.cancel())
      d.style.transform = `translateX(${x}px) scale(1.12, 1.06)`
      dropX = x
    }
  })
  const end = (e) => {
    if (!down || e.pointerId !== down.id) return
    bar.classList.remove('is-scrub')
    suppressUntil = performance.now() + 600
    if (scrub) {
      const i = Math.max(0, Math.min(TABS.length - 1, Math.round(dropX / slotW())))
      goTab(TABS[i][0], true)
    } else if (e.type === 'pointerup') {
      const hit = document.elementFromPoint(e.clientX, e.clientY)
      const t = hit && hit.closest('.tab')
      if (t) goTab(t.dataset.tab, true)
    }
    down = null
  }
  bar.addEventListener('pointerup', end)
  bar.addEventListener('pointercancel', end)
  // keyboard: Enter and Space arrive as a click with no pointer before it
  bar.addEventListener('click', (e) => {
    if (performance.now() < suppressUntil) return
    const t = e.target.closest('.tab'); if (t) goTab(t.dataset.tab, true)
  })
})()

// ── a pressed glass control swells and its specular brightens, then settles ────────────────────
$$('.press').forEach((el) => {
  const off = () => el.classList.remove('is-down')
  el.addEventListener('pointerdown', () => el.classList.add('is-down'))
  el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off)
})

// ══ the sheet: glass, two heights, dragged or tapped between them ═════════════════════════════════
const sheet = {
  el: $('#sheet'), layer: $('#sheet-layer'), scroll: $('#sheet-scroll'),
  open: false, detent: 'medium', y: 0, H: 0,
  med() { return Math.max(0, this.H - Math.round(phone.clientHeight * 0.52)) },
  target(det) { return det === 'large' ? 0 : det === 'medium' ? this.med() : this.H + 40 },
  set(y, animate) {
    this.y = y
    this.el.classList.toggle('is-animating', !!animate)
    this.el.style.transform = `translateY(${y}px)`
  },
  show(html, { detent = 'medium', wave = false, animate = true, kind = 'drink' } = {}) {
    this.scroll.innerHTML = html
    this.scroll.scrollTop = 0
    this.kind = kind
    this.el.hidden = false
    this.layer.classList.add('is-open')
    phone.classList.add('has-sheet')
    this.H = this.el.offsetHeight
    const was = this.open
    this.open = true
    this.setDetent(detent, false, true)
    if (animate && !was) {
      if (REDUCED) { this.set(this.target(detent), false); this.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 }) }
      else { this.set(this.H + 40, false); void this.el.offsetHeight; this.set(this.target(detent), true) }
    } else this.set(this.target(detent), false)
    if (wave) playWave(this.el)
    sea.update()
    // focus moves into the sheet when a guest opened it; a deep link lands with nothing focused
    if (animate) $('#sheet-x').focus({ preventScroll: true })
    wireSheet()
  },
  setDetent(det, animate = true, silent) {
    this.detent = det
    this.el.classList.toggle('is-large', det === 'large')
    this.layer.classList.toggle('is-large', det === 'large')
    $('#grabber').setAttribute('aria-label', det === 'large' ? 'Make smaller' : 'Expand')
    if (det === 'medium') this.scroll.scrollTop = 0
    if (!silent) this.set(this.target(det), animate)
  },
  close(animate = true) {
    if (!this.open) return
    this.open = false
    const done = () => {
      if (this.open) return
      this.layer.classList.remove('is-open', 'is-large'); this.el.classList.remove('is-large')
      this.el.hidden = true; this.scroll.innerHTML = ''
      phone.classList.remove('has-sheet')
      $$('.sheet-wave').forEach((c) => c.remove())
      sea.update()
    }
    if (animate && !REDUCED) { this.set(this.H + 40, true); setTimeout(done, 460) } else done()
  },
}
$('#scrim').addEventListener('click', () => sheet.close())
$('#sheet-x').addEventListener('click', () => sheet.close())
$('#grabber').addEventListener('click', () => { if (!dragMoved) sheet.setDetent(sheet.detent === 'large' ? 'medium' : 'large') })
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (sheet.open) sheet.close(); else if (state.search) closeSearch(); else if (state.pushed) pop() } })

// drag: from the grab bar, or from the content at medium, or from the content at large when it is
// scrolled to its top and the thumb moves down. It follows the finger; past the top it resists; on
// release a flick decides, otherwise the nearest height does
let drag = null, dragMoved = false
function dragStart(y, fromScroll) {
  drag = { y0: y, pos0: sheet.y, fromScroll, on: false, lastY: y, lastT: performance.now(), v: 0 }
  dragMoved = false
}
function dragMove(y, e) {
  if (!drag) return
  const dy = y - drag.y0
  if (!drag.on) {
    if (Math.abs(dy) < 6) return
    if (drag.fromScroll && sheet.detent === 'large' && (dy < 0 || sheet.scroll.scrollTop > 0)) { drag = null; return }
    drag.on = true; dragMoved = true
    drag.y0 = y; drag.pos0 = sheet.y
  }
  if (e && e.cancelable) e.preventDefault()
  let pos = drag.pos0 + (y - drag.y0)
  if (pos < 0) pos = -Math.sqrt(-pos) * 3        // resist past the top
  const now = performance.now(), dt = now - drag.lastT
  if (dt > 0) drag.v = 0.7 * ((y - drag.lastY) / dt) + 0.3 * drag.v
  drag.lastY = y; drag.lastT = now
  sheet.set(pos, false)
  const large = pos < sheet.med() * 0.5
  sheet.el.classList.toggle('is-large', large); sheet.layer.classList.toggle('is-large', large)
}
function dragEnd() {
  if (!drag) return
  const d = drag; drag = null
  if (!d.on) return
  const pos = sheet.y, med = sheet.med(), v = d.v
  let to
  if (v < -0.5) to = 'large'
  else if (v > 0.5) to = pos < med ? 'medium' : 'closed'
  else {
    const closeAt = med + (sheet.H - med) * 0.35
    to = pos > closeAt ? 'closed' : pos > med / 2 ? 'medium' : 'large'
  }
  if (to === 'closed') sheet.close(); else sheet.setDetent(to, true)
  setTimeout(() => { dragMoved = false }, 0)
}
;(() => {
  const s = sheet.el
  s.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) { drag = null; return }
    if (e.target.closest('textarea, input, .ds-stars, #ms-coin')) return
    dragStart(e.touches[0].clientY, !!e.target.closest('.sheet-scroll'))
  }, { passive: true })
  s.addEventListener('touchmove', (e) => { if (drag) dragMove(e.touches[0].clientY, e) }, { passive: false })
  s.addEventListener('touchend', dragEnd)
  s.addEventListener('touchcancel', dragEnd)
  // a mouse drags the same way
  s.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if (e.target.closest('textarea, input, .ds-stars, #ms-coin')) return
    dragStart(e.clientY, !!e.target.closest('.sheet-scroll'))
    const mv = (ev) => dragMove(ev.clientY, null)
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); dragEnd() }
    addEventListener('pointermove', mv); addEventListener('pointerup', up)
  })
  // a drag is never also a tap on what it started on
  s.addEventListener('click', (e) => { if (dragMoved) { e.stopPropagation(); e.preventDefault() } }, true)
})()

function openDrink(id, opts = {}) { sheet.show(drinkSheet(id), { detent: 'medium', wave: opts.wave !== false, animate: opts.animate !== false, kind: 'drink' }) }
function openMedal(id, opts = {}) {
  sheet.show(medalSheet(id, opts.turn !== false), { detent: 'large', wave: false, animate: opts.animate !== false, kind: 'medal' })
}

// the coin in the medal sheet tilts towards a finger, its light moves with it, and a flick spins it
function wireSheet() {
  const wrap = $('#ms-coin'); if (!wrap) return
  const c = $('.coin3d', wrap), spec = $$('.coin-spec', wrap)
  c.addEventListener('animationend', () => c.classList.remove('turn'))
  let held = null, rotY = 0
  const apply = (rx, ry, sx, sy) => {
    c.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
    spec.forEach((g) => { g.style.transform = `translate(${sx}px, ${sy}px)` })
  }
  wrap.addEventListener('pointerdown', (e) => {
    c.classList.remove('turn'); c.classList.add('is-held')
    held = { id: e.pointerId, lastX: e.clientX, lastT: performance.now(), vx: 0 }
    try { wrap.setPointerCapture(e.pointerId) } catch (_) {}
    move(e)
  })
  const move = (e) => {
    if (!held || e.pointerId !== held.id) return
    const r = wrap.getBoundingClientRect()
    const nx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1))
    const ny = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1))
    const now = performance.now(), dt = now - held.lastT
    if (dt > 0) held.vx = 0.7 * ((e.clientX - held.lastX) / dt) + 0.3 * held.vx
    held.lastX = e.clientX; held.lastT = now
    rotY = nx * 24
    apply(-ny * 20, rotY, -nx * 12, -ny * 12)
  }
  wrap.addEventListener('pointermove', move)
  const up = (e) => {
    if (!held || e.pointerId !== held.id) return
    const vx = held.vx; held = null
    c.classList.remove('is-held')
    if (!REDUCED && Math.abs(vx) > 0.6) {
      // a flick: once round, the way it was thrown, then rest
      const a = c.animate([{ transform: `rotateY(${rotY}deg)` }, { transform: `rotateY(${vx > 0 ? 360 : -360}deg)` }], { duration: 900, easing: 'cubic-bezier(.2,.75,.25,1)' })
      c.style.transform = 'rotateY(0deg)'
      a.onfinish = () => { c.style.transform = '' }
      spec.forEach((g) => { g.style.transform = '' })
    } else apply(0, 0, 0, 0)
  }
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up)
}

// ══ taps anywhere ═════════════════════════════════════════════════════════════════════════════════
function setTried(id, on) {
  const e = E(id)
  e.tried = on
  if (on && !e.date) e.date = today()
  $$(`[data-try="${id}"]`).forEach((b) => {
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on))
    if (b.classList.contains('ds-act')) b.innerHTML = `${on ? CHECK_ON : svg(I.check)}<span>Tried</span>`
    else b.innerHTML = on ? CHECK_ON : svg(I.check)
    if (on && !REDUCED) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop') }
  })
  const n = triedCount()
  const pn = $('#hero-pct'), nn = $('#hero-n')
  if (pn) pn.innerHTML = `${Math.round(n / DRINKS.length * 100)}<small>%</small>`
  if (nn) nn.textContent = `${n} of ${DRINKS.length}`
  sea.level = n / DRINKS.length
  if (sea.hero) { sea.paintFloor(); if (!sea.raf) sea.draw(performance.now()) }
  $('#live').textContent = on ? `${BY[id].name} logged` : `${BY[id].name} unticked`
}
phone.addEventListener('click', (e) => {
  const t = e.target
  const tr = t.closest('[data-try]')
  if (tr) { setTried(tr.dataset.try, !(ME[tr.dataset.try] && ME[tr.dataset.try].tried)); return }
  const fl = t.closest('[data-flag]')
  if (fl) {
    const en = E(fl.dataset.id); en[fl.dataset.flag] = !en[fl.dataset.flag]
    fl.classList.toggle('on', en[fl.dataset.flag]); fl.setAttribute('aria-pressed', String(en[fl.dataset.flag])); return
  }
  const st = t.closest('[data-rate]')
  if (st) {
    const en = E(st.dataset.id), n = +st.dataset.rate
    en.rating = en.rating === n ? 0 : n
    $$('.ds-star', sheet.scroll).forEach((b, i) => b.classList.toggle('on', i < en.rating))
    return
  }
  const op = t.closest('[data-open]')
  if (op) { openDrink(op.dataset.open); return }
  const md = t.closest('[data-medal]')
  if (md) { openMedal(md.dataset.medal); return }
  const pu = t.closest('[data-push]')
  if (pu) { push(pu.dataset.push); return }
  const go = t.closest('[data-go]')
  if (go) { goTab(go.dataset.go); return }
  const ve = t.closest('[data-venue]')
  if (ve) {
    goTab('drinks')
    const g = $('#v-' + ve.dataset.venue)
    if (g) $('#s-drinks').scrollTop = g.offsetTop - 64
    return
  }
  if (t.closest('#shake-row')) {
    // the shaker's pick, in miniature: untried, and a crew or taste pick first
    const row = t.closest('#shake-row')
    const pool = DRINKS.filter((d) => !(ME[d.id] && ME[d.id].tried))
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (REDUCED) { openDrink(pick.id); return }
    row.classList.remove('shaking'); void row.offsetWidth; row.classList.add('shaking')
    setTimeout(() => { row.classList.remove('shaking'); openDrink(pick.id) }, 720)
  }
})
document.addEventListener('input', (e) => { if (e.target.id === 'dq') filterDrinks(e.target.value) })

// ══ start ═════════════════════════════════════════════════════════════════════════════════════════
$$('.lg').forEach((el) => { const s = document.createElement('i'); s.className = 'lg-spec'; s.setAttribute('aria-hidden', 'true'); el.appendChild(s) })
const deep = Q.get('screen')
renderHome(!deep && !REDUCED)
$$('#s-home .lg').forEach((el) => { const s = document.createElement('i'); s.className = 'lg-spec'; s.setAttribute('aria-hidden', 'true'); el.appendChild(s) })
$$('#s-home .press').forEach((el) => {
  const off = () => el.classList.remove('is-down')
  el.addEventListener('pointerdown', () => el.classList.add('is-down'))
  el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off)
})
$$('#s-home .coin3d.turn').forEach((c) => c.addEventListener('animationend', () => c.classList.remove('turn')))
renderDrinks(); renderShip(); renderCrew(); renderYou(); renderMedals(); renderSearch('')
renderTabs()
sea.mount()
const DRINK_SHOWN = 'd72'   // Fool's Gold at the Wheelhouse Bar: Sam recommends it, you have not tried it
const land = {
  home: () => goTab('home', false),
  drinks: () => goTab('drinks', false),
  ship: () => goTab('ship', false),
  crew: () => goTab('crew', false),
  you: () => goTab('you', false),
  sheet: () => { goTab('drinks', false); openDrink(DRINK_SHOWN, { wave: false, animate: false }) },
  'sheet-large': () => { goTab('drinks', false); openDrink(DRINK_SHOWN, { wave: false, animate: false }); sheet.setDetent('large', false) },
  search: () => { goTab('home', false); openSearch(false) },
  medals: () => { goTab('home', false); push('medals') },
  medal: () => { goTab('home', false); push('medals'); openMedal('gin', { turn: false, animate: false }) },
}
phone.classList.add('no-anim')
;(land[deep] || land.home)()
requestAnimationFrame(() => {
  placeDroplet(TABS.findIndex((t) => t[0] === state.tab), false)
  requestAnimationFrame(() => phone.classList.remove('no-anim'))
})
addEventListener('resize', () => { placeDroplet(TABS.findIndex((t) => t[0] === state.tab), false); if (sheet.open) { sheet.H = sheet.el.offsetHeight; sheet.set(sheet.target(sheet.detent), false) } })
