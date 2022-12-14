if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const passport = require('passport');
const flash =  require('connect-flash');
const session =  require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose')
const LocalStrategy = require('passport-local').Strategy


//App Setup

const port = process.env.PORT || 3000;



app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(morgan('tiny'));

app.use(express.static(path.join(__dirname, '/public'))); 
app.use(express.static(path.join(__dirname, '/src'))); 
app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/jquery/dist')));

app.get('/', (req, res) => {
    res.render('Home', {
    
            nav: [
                {link: '/', title: 'Home'},
                {link: '/portfolio', title: 'Portfolio'},
                {link: '/profileAccess', title: 'Profile'}
            ],

            title: 'Home'
        }
    );
})





app.get('/',function(req, res){
    res.sendFile(path.join(__dirname, '/views/Home'));
})

const portfolioRoute = require('./src/routes/portfolioRoute');
const homeRoute = require('./src/routes/homeRoute');

app.use(flash());

app.use('/portfolio', portfolioRoute);
app.use('/home', homeRoute);

//Database Setup

mongoose.connect('mongodb://localhost:27017/UserData', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
})

const uploadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  file: {
    type: Object,
    required: true
    
  }
})

const bugSchema = new mongoose.Schema({
  bug: {
    type: String,
    required: true
  },

})

const User = mongoose.model('User', UserSchema)
const Upload = mongoose.model('Upload', uploadSchema)
const Bug = mongoose.model('Bug', bugSchema)

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false}));
app.use(express.json());


//Passport Config

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id)
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })

});

passport.use(new LocalStrategy(function (username, password, done) {
  User.findOne({ username: username}, function(err, user) {
    if(err) {return done(err); }
    if(!user) {
      return done(null, false, {message: 'This username does not exist'});
    }

    bcrypt.compare(password, user.password, function(err, res) {
      if(err) {return done(err);}
      if (res === false) {return done(null, false, {message: 'Incorrect password'})};
      return done(null, user);
    });
  });
}));

// Post Methods

app.post('/register', async (req, res) => {

  const exists = await User.exists({ username: req.body.usr})
  

  if (exists) {
    res.redirect('/profileRegister?error=true');
    return;
  };

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(req.body.password, salt, function(err, hash) {
      if (err) return next(err);

      const newUser = new User({
        username: req.body.usr,
        password: hash
      });

      newUser.save();

      res.redirect('/profileAccess')
    })
  })
})

app.post('/login', passport.authenticate('local',{
  successRedirect: '/userProfile',
  failureRedirect: '/profileAccess?error=true',
  failureFlash: true
})
)

app.post('/submit', async (req, res) => {

  const newUpload = new Upload({
    name: req.body.name,
    file: req.body.file
  });

  await newUpload.save();

  res.redirect('/userProfile?success=true')

})

app.post('/submitBug', async (req, res) => {

  const newBug = new Bug({
    bug: req.body.bug,
   
  });

  await newBug.save();

  res.redirect('/bugReports?report=true')

})


// Checking Functions

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) return next();
  res.redirect('/profileAccess')
}

function isLoggedOut(req, res, next) {
  if(!req.isAuthenticated()) return next();
  res.redirect('/userProfile')
}


// App Routes

app.get('/userProfile', isLoggedIn, (req, res) => {

  const success = req.query.success

  res.render('userProfile', {
    nav: [
      {link: '/', title: 'Home'},
      {link: '/portfolio', title: 'Portfolio'},
      {link: '/profileAccess', title: 'Profile'}
    ],
    title:'Your Profile',
    success
  });
})


app.get('/profileAccess', isLoggedOut, (req, res) => {

  const error = req.query.error
  
  res.render('profileAccess', 
    {
        nav: [
            {link: '/', title: 'Home'},
            {link: '/portfolio', title: 'Portfolio'},
            {link: '/profileAccess', title: 'Profile'}
        ],
        title: 'profileAccess',
        error
    });
    
})


app.get('/profileRegister', (req, res) => {
    
    const error = req.query.error
    res.render('profileRegister',
    {
        nav: [
            {link: '/', title: 'Home'},
            {link: '/portfolio', title: 'Portfolio'},
            {link: '/profileAccess', title: 'Profile'}
        ],
        title: 'Register',
        error
    });
    
});

app.get('/bugReports', (req, res) => {
    
  const report = req.query.report
  res.render('bugReports',
  {
      nav: [
          {link: '/', title: 'Home'},
          {link: '/portfolio', title: 'Portfolio'},
          {link: '/profileAccess', title: 'Profile'}
      ],
      title: 'Bug Reports',
      report
  });
  
});

// logout function

app.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/profileAccess');
  });
});


// App Execution


app.listen(port, ()=>(console.log("Listening to the server on port http://localhost:3000")));