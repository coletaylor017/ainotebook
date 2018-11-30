//Make a mongoose model for a quote. Add some to the dataase via command line or in the code here.
//Then, make code in here that selects a random one each day and then attaches a number to it
//The number increases by one each day, and the lower a quote's number, the more likely it is 
//to be chosen. A new quote is assigned a number 1. 

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
    {body: "Gratitude breeds happiness."}
];