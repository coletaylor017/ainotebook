TODO!

New name ideas: Freely

General
    -Timer
    -Home page redesign: more images, showcase the product's features
    -Slider
    -Account page
        -password recovery
        -double check that they want to delete before deleting
    
    -Metadata. Create a new collection called "metadata" and have each document be an object with a data name, value, date created, owner (referencing "users"), and entry id (referencing "entries"). When metadata is analyzed, find() bits of data based on their date, name, and/or entry and ALWAYS their user. Then the returned array of data can have its information pulled out and displayed. 
        -Consider displaying metadata semi-graphically on the entry "show" page.
    -Daily quotes, for more deets on this see /models/quotes.js. Maybe in the future we could have a way for users to submit quotes and have them added to the quote DB following admin approval.

UI:
    -Actually install Semantic, then do these:
        -Make trash hover red
        -Light/dark themes
        -"..." and "read more"(?) at end of truncated entries
        -show line breaks on entry view page

Database/security:
    -Check ownership before ediing or deleting
    
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
