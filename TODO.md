TODO!

-In general: Focus on DB optimization and CSS simplicity. Fewer IDs especially. Start messing around with Semantic setting more. 
    
*note: start using git branches
*Text index has disappeared on dev DB (not deployed DB)

New name ideas: Freely
-Come up with a better name


General
    -Compare metadata values to averages. Maybe bar graphs rather than pie charts would be more informative.
    -Account page
        -password recovery
        -double check that they want to delete before deleting
    -Forgot password link
    -Update streak on sign-in
    
    -Metadata. Create a new collection called "metadata" and have each document be an object with a data name, value, date created, owner (referencing "users"), and entry id (referencing "entries"). When metadata is analyzed, find() bits of data based on their date, name, and/or entry and ALWAYS their user. Then the returned array of data can have its information pulled out and displayed. 
        -Consider displaying metadata semi-graphically on the entry "show" page.
    -Daily quotes, for more deets on this see /models/quotes.js. Maybe in the future we could have a way for users to submit quotes and have them added to the quote DB following admin approval.

UI:
    -Make trash hover red
    -Light/dark themes
    -"..." and "read more"(?) at end of truncated entries
    -show line breaks on entry view page

Database/security:
    -Check ownership before ediing or deleting
    -Investigate how to get https so Chrome will say the site is secure.
    
Done!
    -Associate users and entries
    -Show tooltip hints when user hovers on icons
    -Search
    -Should be easy: Upon loading log in page, if user is logged in, redirect to /entries
    -Tags side bar, like a blog. Make a "tags" collection with each document being a particular tag with a reference to the user it belongs to and an array of the entries that reference it. Every time an entry is created or updated, the tag line is parsed and the entry is added to the appropriate tag objects in the "tags" collection is it's not already there.
    -Issue: users still reference post IDs after the posts are deleted
    -User page word count
    -Make "New Block" button stay put while entries scroll
    -Question marks
    -Refactor routes
    -Flash error messages for invalid login, etc.
    -Sign up validation
    -Slider
    -Slider question mark
    -Timer
    -Home page redesign: more images, showcase the product's features
    -Display re-dict analysis on entry view page.
    -Find out what those strange qualities are that Ridict spits out
