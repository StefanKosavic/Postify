var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const {userAuthorization}=require("./authorization");
var pg =require('pg');

/* I used the postgres database and made a free instance via https://www.elephantsql.com/ which I linked here */
var config = {
    user: 'xgnvqxmu',
    database: 'xgnvqxmu',
    password: 'qhwrA4fdZ48Q19tb4UiOR1txUgA0QM67',
    host: 'kandula.db.elephantsql.com',
    port: 5432,
    max: 100,
    idleTimeoutMillis: 30000,
};
var pool = new pg.Pool(config);


router.get('/login', function(req, res, next) {
    res.render('user/login');
});

router.get('/register', function(req, res, next) {
    res.render('user/register');
});

/* When registering a new user, I take the password that the user entered when filling out the form.
   Using bcrypt, I convert this password into a hashed string and, together with other data from the form, save it to the database as a new user.
   When making this application, I decided not to focus so much on login / register validation, because I think it is not so necessary for this task,
   but I left the options open, that is, for example, the ability to put a password of only 4 letters, etc. */
router.post('/register', async function(req, res, next) {

    const hashedPassword = await bcrypt.hash(req.body.password,10);

    var  postifyUser =  {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        password: hashedPassword,
    };
    pool.connect(function(err,client,done){
        if(!postifyUser.firstname || !postifyUser.lastname || !postifyUser.username){
            res.sendStatus(500).send("Can t be empty");
        } else{
            client.query(`insert into postifyuser (firstname,lastname,username,password)
                          values ($1,$2,$3,$4)`,
                [postifyUser.firstname,postifyUser.lastname,postifyUser.username, postifyUser.password],
                function (err,result){
                    done();
                    if(err){
                        res.render("user/register")
                    }else{
                        res.render("user/login")
                    }
                })
        }
    })
});

/* When logging in to the system, I take information about the user's username and password from the form.
   I then send a request to the database to pick up data on that user, if one exists. If the combination of username and password is correct,
   the user gets access to the system, and I save his data in a session so I can access them later when I need them.
   Package I used: https://www.npmjs.com/package/express-session */
router.post('/login', async function(req, res, next) {
    var postifyUser = {
        username: req.body.username,
        password: req.body.password,
    };
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`SELECT * FROM postifyuser where username=$1`,[postifyUser.username],async function (err,result){
            done();
            if(err){
                console.info(err);
                res.sendStatus(500);
            }else{
                if(result.rows.length === 0){
                    return res.sendStatus(404);
                }else{
                    let kriptoPassword = result.rows[0].password;
                    if(await bcrypt.compare(postifyUser.password,kriptoPassword)){
                        res.postifyUser = {
                            id: result.rows[0].id_postifyuser,
                            firstname: result.rows[0].firstname,
                            lastname: result.rows[0].lastname,
                            username: result.rows[0].username
                        }
                        req.session.id_user = res.postifyUser.id;
                        req.session.user_username = res.postifyUser.username;
                        res.redirect('/postify/home');
                    }
                    else{
                        return res.sendStatus(401);
                    }
                }
            }
        })
    })
});

router.get('/newPost', userAuthorization, function(req, res, next) {
    res.render('user/newPost');
});

/* When creating a new post, I first call the "userAuthorization" function which checks if the user has access and can create a new post.
   If there is, I pick up the data from the form and use the insert to save it to the database,
   and send the user to the home page where he can see his newly created post. */
router.post('/newPost', async function(req, res, next) {
    let id_user = req.session.id_user;
    console.log(id_user);
    var post = {
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
    };
    pool.connect(function(err,client,done){
            client.query(`insert into post (title,author,description,id_postifyuser)
                          values ($1,$2,$3,$4)`,
                [post.title,post.author,post.description,id_user],
                function (err,result){
                    done();
                    if(err){
                        console.log("ovdje je greska")
                        res.sendStatus(401)
                    }else{
                        res.redirect("/postify/home")
                    }
                })
    })
});

/* In the home route, I use select query to pick up all the basic information about a post and display it on the home page.
   (I "shorten" the Date with TO_CHAR, so I can only display it on the page in 'DD/MM/YYYY' format) */
router.get('/home', function(req, res, next) {
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`SELECT TO_CHAR(date, 'DD/MM/YYYY') as submission_date,id_post,
         title,author,description,comment_count FROM post`,[],function (err,result){
            done();
            if(err){
                console.info(err);
                res.sendStatus(500);
            }else{
                req.posts = result.rows;
                res.render('user/home', {
                    posts:req.posts
                });
            }
        })
    })
});

/* On the listing page (which will be the Home page) there should be only post title, date, author name, & comment counts.
   Upon clicking on that description, it should be visible (in a new page).
   In this section, after the user clicks on a post, the new page displays all the information about that post along with all the comments for that post.
   The "next()" function in the end means that we go to the next function which is again this same route,
   but which has the role of picking up other data needed for the post and finally displaying them all together on the "detailPost" page */
router.get('/postDetail/:id', function(req, res, next) {
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`select * from comments c,post p,postifyuser po where p.id_post=c.id_post
                                                 and po.id_postifyuser = c.id_postifyuser
                                                 and p.id_post = $1 `,
            [req.params.id],function (err,result){
            done();
            if(err){
                console.info(err);
                res.sendStatus(500);
            }else{
                req.comments = result.rows;
                next();
            }
        })
    })
});

router.get('/postDetail/:id', function(req, res, next) {
    let id_user = req.session.id_user;
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`SELECT TO_CHAR(date, 'DD/MM/YYYY') as submission_date,id_post,
         title,author,description FROM post where id_post=$1`,[req.params.id],function (err,result){
            done();
            if(err){
                console.info(err);
                res.sendStatus(500);
            }else{
                req.posts = result.rows;
                res.render('user/detailPost', {
                    posts:req.posts,
                    comments:req.comments,
                    idPost:req.params.id,
                    idUser:id_user
                });
            }
        })
    })
});

/* When user is checking his posts, I first call the "userAuthorization" function which checks if the user has access and can create a new post.
   If there is, I collect all posts belonging to that user. I collect only those posts created by the currently logged in and active user,
   and I can do that because I saved the data about the currently active user in the session during his login. */
router.get('/myPosts',userAuthorization, function(req, res, next) {
    let thisUser = req.session.user_username;
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`select * from post p,postifyuser pu where
         p.id_postifyuser=pu.id_postifyuser and 
         username= $1`,[thisUser],function (err,result){
            done();
            if(err){
                console.info(err);
                res.sendStatus(500);
            }else{
                req.myPost = result.rows;
                res.render('user/myPost', {
                    myPost:req.myPost,
                });
            }
        })
    })
});

/* The log out route simply destroys the current session and in that way the user without the session must log in again to gain access */
router.get('/logout', function(req, res, next) {
    req.session.destroy();
    res.render('user/login');
});

/* UpdatePost route takes all data about the post from the form and on a click, the "Update" button calls a query that updates all changes in the database */
router.post('/updatePost/:title/:author/:description/:id', function(req, res, next) {
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`update post 
        set title=$1,
            author=$2,
            description=$3
        where id_post=$4;`,
            [
                req.params.title,
                req.params.author,
                req.params.description,
                req.params.id
            ],
            function (err,result){
                done();
                if(err){
                    console.info(err);
                    res.sendStatus(500);
                }
                else{
                    res.sendStatus(200);
                }
            })
    })
});
/* The deletePost route simply deletes the post with the forwarded id from the database.
   They can not delete others posts and deletion can only occur if there are no comments after it
   I did this last part on the frontend by checking if that post has at least one comment, if so, there is no delete button and the user is not able to delete that post.*/
router.delete('/deletePost/:id', function(req, res, next) {
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`delete from post where id_post=$1`,
            [
                req.params.id,
            ],
            function (err,result){
                done();
                if(err){
                    console.info(err);
                    res.sendStatus(500);
                }
                else{
                    res.sendStatus(200);
                }

            })
    })
});
/*  Any User can comment on the post.
    If a guest tries to comment, they will be prompted to login or register.
    We take information about the currently active user from the session, because that is the person who leaves the comment.
    If we do not have a session, it means that the guest has entered the page and is trying to leave a comment.
    In that case, after trying to leave a comment, the guest is sent to the log in page.
    If there is a session and we know which user is leaving a comment, the text of the comment, together with the username of the user, is printed below the post */
router.post('/newComment/:idPost/:text',userAuthorization, function(req, res, next) {
    let idUser = req.session.id_user;
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
            client.query(`insert into comments (id_post,text,id_postifyuser)
                      values ($1,$2,$3)`,
                [
                    req.params.idPost,
                    req.params.text,
                    idUser
                ],
                function (err,result){
                    done();
                    if(err){
                        console.info(err);
                        res.sendStatus(500);
                    }
                    else{
                       res.sendStatus(200)
                    }
                })
    })

});
/* A simple route that only increases the number of comments on a post after someone left a new comment */
router.post('/comment_count/:idPost',userAuthorization, function(req, res, next) {
    pool.connect(function(err,client,done){
        if(err){
            res.end('{"error" : "Error", "status" : 500');
        }
        client.query(`update post set comment_count = comment_count + 1 where id_post=$1`,
            [
                req.params.idPost
            ],
            function (err,result){
                done();
                if(err){
                    console.info(err);
                    res.sendStatus(500);
                }
                else{
                    res.sendStatus(200)
                }
            })
    })

});



module.exports = router;
