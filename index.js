
require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');



const port = process.env.PORT || 3000;

const app = express();




const expireTime = 1 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)












app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));






app.use(express.static('public'));





// Route to handle the main page
app.get('/', (req, res) => {


   res.render('index');

});

app.get('/ourTeam', (req, res) => {
	res.render('ourTeam');
});

app.get('/contact', (req, res) => {
	res.render('contact');
});

app.get("*", (req,res) => {
	res.status(404);
	res.render('errorMessage', {error: '404, page not found'});
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 