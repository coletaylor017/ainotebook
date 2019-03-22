// Make a mongoose model for a quote. Add some to the dataase via command line or in the code here. A new quote is assigned a number 1. Maybe have these numbers reset yearly or something just to avoid them getting insanely huge. Probably doesn't matter.
// Put all quotes with the lowest number into an array and then take a random one from that, increase its number by one, and make it the quote of the day. Either run a script every time /entries is loaded that checks if it's been a day and if so executes the function, or find a way to have some code on the server run once every 24 hours. The latter would be more elegant and avoid increasing load times. 


//This should be a database, not an array. 
var quotes = [
    {
        body: "Alternating peiods of activity and rest is necessary to survive [and] thrive.",
        author: "Tim Ferris",
        source: "The 4-Hour Workweek"
    },
    {
        body: "Remember, boredom is the enemy, not some abstract failure.",
        author: "Tim Ferris",
        source: "The 4-Hour Workweek"
    },
    {body: "What is next on your bucket list?"},
    {body: "When was the last time you read a book?"},
    {body: "Get rid of one thing you don't need today."},
    {body: "Gratitude is happiness."}
];