
require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');



const port = process.env.PORT || 3000;

const app = express();

const Joi = require("joi");


const expireTime = 1 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)












app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));



app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

app.use(express.static('public'));


function checkLoggedIn(req, res, next) {
    if (req.session.user) {
        next(); // User is logged in, proceed to the next middleware
    } else {
        res.redirect('/'); // Redirect to the home page for login
    }
}


function isValidSession(req) {
  if(!req.session.user) {
    return false;
  }
  if (req.session.user.authenticated) {
      return true;
  }
  return false;
}

function sessionValidation(req,res,next) {
  if (isValidSession(req)) {
      next();
  }
  else {
      res.redirect('/login');
  }
}


async function  isAdmin(req) {

  console.log(req.session.user.type)
  if (req.session.user.type === 'admin') {
      console.log("is true");
      return true;
  } else {
      console.log("is false");
      return false;
  }
  
}

async function adminAuthorization(req, res, next) {
  
  const result = await isAdmin(req);

  if (!result) {
    console.log("not admin");
   
    res.render('errorMessage', {error: '403, not authorized to view this page'});
    console.log("not admin");
      return;
  }
  else {
    console.log("admin");
      next();
  }
}

// Route to handle the main page
app.get('/', (req, res) => {
  if(req.session.user){
   const name = req.session.user.name;
   const type = req.session.user.type;
   res.render('index', {name: name, type: type});
  } else {
    const name = null;
    res.render('index', {name: name});
  }

 
  
  // if (req.session.user) {
  //     // If user is logged in, display their name
  //     res.send(`<h1>Welcome, ${req.session.user.name}!</h1><a href="/logout">Logout</a> <a href="/members"> Members </a>`);
  // } else {
  //     // If user is not logged in, display login and signup buttons
  //     const buttonsHtml = `
  //         <html>
  //         <head>
  //             <title>Login or Sign Up</title>
  //         </head>
  //         <body>
  //             <h1>Welcome!</h1> 
  //             <form action="/login" method="get">
  //                 <button type="submit">Log In</button>
  //             </form>
  //             <form action="/signup" method="get">
  //                 <button type="submit">Sign Up</button>
  //             </form>
  //         </body>
  //         </html>
  //     `;
  //     res.send(buttonsHtml);
  
  //   }
});

app.get('/login', (req,res) => {
  res.render('login')
  // var html = `
  // <form action='/loggingin' method='post'>
  // <input name='email' type='email' placeholder='email'>
  // <input name='password' type='password' placeholder='password'>
  // <button>Submit</button>
  // </form>
  // `;
  // res.send(html);
});
// Route to handle login

app.post('/loggingin', async (req, res) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });
  
    const validation = schema.validate(req.body);
    if (validation.error) {
      return res.status(400).send(validation.error.details[0].message);
    }
  
    const { email, password } = req.body;
  
    try {
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).send('Invalid email or password');
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).send('Invalid email or password');
      }
  
      req.session.user = {
        name: user.name,
        email: user.email,
        type: user.type,
        authenticated: true
      };
  
      res.redirect('/members');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

// app.get('/admin', adminAuthorization, (req, res) => {
//   res.render('admin');


// });

app.get('/admin', sessionValidation, adminAuthorization, async (req, res) => {

  const result = await userCollection.find().project({ name: 1, _id: 1, email: 1, type: 1 }).toArray();

 
  if (result && result.length > 0) {
      res.render("admin", { users: result });
  } else {
      res.render("admin", { users: [] }); // Render with an empty array
  }
});
app.post('/makeAdmin', adminAuthorization, async (req, res) => {
  // Make user an admin
  const { email } = req.body; // Corrected: Extract userId from req.body
  console.log(email);
  const user = await userCollection.findOne({ email}); // Use userId to find the user

  console.log(user);
  if (!user) {
      res.status(404);
      res.render("errorMessage", { error: "User not found" });
      return;
  }
  if (user.type === 'admin') {
      res.status(400);
      res.render("errorMessage", { error: "User is already an user" });
      return;
  }
  await userCollection.updateOne({ email: email }, { $set: { type: 'admin' } }); // Corrected: Update user in the collection
  console.log(user);
  res.redirect('/admin');
});

app.post('/makeUser', adminAuthorization, async (req, res) => {
  // Make user an admin
  const { email } = req.body; // Corrected: Extract userId from req.body
  console.log(email);
  const user = await userCollection.findOne({ email}); // Use userId to find the user

  console.log(user);
  if (!user) {
      res.status(404);
      res.render("errorMessage", { error: "User not found" });
      return;
  }
  if (user.type === 'user') {
      res.status(400);
      res.render("errorMessage", { error: "User is already an admin" });
      return;
  }
  await userCollection.updateOne({ email: email }, { $set: { type: 'user' } }); // Corrected: Update user in the collection
  console.log(user);
  res.redirect('/admin');
});

// Route to handle sign up
app.get('/signup', (req, res) => {
    // var html = `
    // create user
    // <form action='/signingup' method='post'>
    // <input name='name' type='text' placeholder='username'>
    // <input name='email' type='email' placeholder='email'>
    // <input name='password' type='password' placeholder='password'>
    // <button>Submit</button>
    // </form>
    // `;
    // res.send(html);
    res.render('createUser');
  })

app.post('/signingup', async (req, res) => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });
  
    const validation = schema.validate(req.body);
    if (validation.error) {
      return res.status(400).send(validation.error.details[0].message);
    }
  
    const { name, email, password } = req.body;
    const type = 'user';
  
    const hashedPassword = await bcrypt.hash(password, saltRounds);
  
    try {
      await userCollection.insertOne({
        name: name,
        email,
        password: hashedPassword,
        type: 'user'
      });
  
      req.session.user = {
        name,
        email,
        type
      };
  
      res.redirect('/members');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
      return;
    }

   

  });
  


app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(() => {
        res.redirect('/'); // Redirect to the home page after logout
    });
});

app.get('/members', checkLoggedIn, (req, res) => {
    // If user is logged in, allow access to Members Area
    // let x =Math.floor((Math.random() * 3) + 1);

    // var MembersHtml = `<h1>Members Area</h1><a href="/">Home</a>
    // <br>
    // hello ${req.session.user.name} !
    // <img src='${x}.png'>
    // `;



    // res.send(MembersHtml);
  res.render('members', {name: req.session.user});

    
});
app.get("*", (req,res) => {
	res.status(404);
	res.render('errorMessage', {error: '404, page not found'});
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 