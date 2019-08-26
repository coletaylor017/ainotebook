**ADD TIMEZONE ON USER DOCUMENT AND MAKE DROPDOWN ON SETTINGS PAGE**
*Remember, sudo mongod service start

TODO!

-In general: Focus on DB optimization and CSS simplicity. Fewer IDs especially. Start messing around with Semantic settings more. 

-change 'green button' to 'primary button'

General
    -Display metadata relative to averages on show page
    -GET EMAILS WORKING!
    -B A D G E S !!!
    -Make mobile friendly!
    -Account page
        -password recovery
        -double check that they want to delete before deleting
    -Forgot password link
    -'Update streak' middleware
    -Maybe in the future we could have a way for users to submit quotes and have them added to the quote DB following admin approval.

UI:
    -Make trash hover red
    -Light/dark themes
    -show line breaks on entry view page

Database/security:
    -Check ownership before ediing or deleting
    -Investigate how to get https so Chrome will say the site is secure.
    -ENCRYPT EMAILS
    
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
    -Display ridict analysis on entry view page.
    -Find out what those strange qualities are that Ridict spits out
    -Daily quotes