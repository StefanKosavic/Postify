# Postify

If you don't have time, I posted a short video that briefly presents the task:
https://www.youtube.com/watch?v=nHV4P2ulmYE

App Details:
Users can register. Also create a login & logout module.
User can create a post.
Post contains title, date, author & description.
Users can see all posts but only be able to edit their own posts, not others.
Users can edit & delete only their own posts. 
They can not delete others posts and deletion can only occur if there are no comments after it.
On the listing page (which will be the Home page) there should be only post title, date, author name, & comment counts, upon clicking on that description, it should be visible (in a new page).
Each page has a maximum of 2 posts available per page for other post users to click on the next page using standard pagination.
Any User can comment on the post.
If a guest tries to comment, they will be prompted to login or register.
Users can edit & delete only their own posts. They can not delete others posts and deletion can only occur if there are no comments after it.

Deployment instructions:
My idea was to place my aplication on the heroku. In order to do that, it is necessary to create an account on the heroku.
After that, let's assume that we already have our project on github, connect the project from github to heroku and deploy the branch where the application is located.
In the end we get a link where we can look at our page: https://hulkappspostify.herokuapp.com/

Front-end technologies include:
HTML/HTML5;
CSS;
JavaScript;
EJS (Embedded JavaScript)
Libraries: Node.js

Back-end technologies include:
Various frameworks build over programming languages: Node.js
Databases: PostgreSQL
Cloud infrastructures and services: Heroku

Before making the project, I made a plan of the base so that I could more easily approach the development of the project. 
After planning the database, I made a couple of basic tables and started making a login / register module for the application.
I had no major difficulties with making this module. After that, I allowed the user who logged in to create a new post and that only he can edit that post. 
I had a little trouble commenting and not allowing a guest who is not logged in to comment. I managed to solve this with the help of ajax. 
All in all, making this app was interesting to me and I learned a lot of new things in the process.

Estimated time to complete: 25 h
