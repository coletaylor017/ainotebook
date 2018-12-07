TODO!

General
    -User intro prompts (priority)
    -Tags side bar, like a blog. Make a "tags" collection with each document being a particular tag with an array of the entries that reference it. Every time an entry is created or updated, the tag line is parsed and the entry is added to the appropriate tag objects in the "tags" collection is it's not already there.
        -Or just have a collection with each tag a single word with no references. Add a new tag upon entry creation or update if it's not already there. Display the tags in the sidebar and when one is clicked, search the "entries" collection for that tag in the tag bar. 
        -The first method may be faster and easier. Slightly slower on entry create/update, but probably much faster on tag click.
    -Metadata. Create a new collection called "metadata" and have each document be an object with a data name, value, date created, owner (referencing "users"), and entry id (referencing "entries"). When metadata is analyzed, find() bits of data based on their date, name, and/or entry and ALWAYS their user. Then the returned array of data can have its information pulled out and displayed. 
        -Consider displaying metadata semi-graphically on the entry "show" page.
    -Daily quotes, for more deets on this see /models/quotes.js. Maybe in the future we could have a way for users to submit quotes and have them added to the quote DB following admin approval.
    -More powerful search- pick between tag and body search or both, filter by date range or metadata
    -Make middleware to check entry owner before updating
    -Flash error messages for invalid login, etc.

UI:
    -Actually install Semantic, then do these:
        -Make trash hover red
        -Light/dark themes
        -Make "New Block" button stay put while entries scroll
        -"..." and "read more"(?) at end of truncated entries
        -show line breaks on entry view page

Database/security:
    -Issue: users still reference post IDs after the posts are deleted
    
Done!
    -Associate users and entries, restrict acces to the owner
    -Show tooltip hints when user hovers on icons
    -Search